import {
  ScenarioHandler,
  WinConditionResult,
  ActionResult,
  EscapeRoomScenario,
  Room,
  Challenge,
  Direction,
} from '../types';

export class EscapeRoomHandler implements ScenarioHandler {
  private scenario: EscapeRoomScenario;
  private rooms: Room[]; // deep-copied, mutated during play
  private currentRoom: string;
  private inventory: string[] = [];
  private challengesCompleted: string[] = [];
  private roomsVisited: string[];
  private hintsUsed: number = 0;

  constructor(scenario: EscapeRoomScenario) {
    this.scenario = scenario;
    // Deep-copy rooms since they get mutated (locked, objects splice)
    this.rooms = JSON.parse(JSON.stringify(scenario.rooms));
    this.currentRoom = scenario.startingRoom;
    this.roomsVisited = [scenario.startingRoom];
  }

  getInitialMessage(): string {
    const room = this.getRoom(this.currentRoom);
    if (!room) return 'Error: starting room not found';

    const lines = [
      room.name,
      room.description,
    ];

    if (room.exits.length > 0) {
      lines.push('');
      lines.push(`Exits: ${room.exits.join(', ')}`);
    }

    if (room.objects.length > 0) {
      lines.push(`Objects: ${room.objects.map(o => o.name).join(', ')}`);
    }

    return lines.join('\n');
  }

  getHelp(): string {
    const lines = [
      '  move <dir>, go <dir>      Move in a direction (north/south/east/west)',
      '  n, s, e, w                Shorthand for move north/south/east/west',
      '  look, l                   Look around the current room',
      '  examine <target>, x       Examine object, challenge, or inventory item',
      '  take <object>, get        Pick up an object',
      '  use <object>              Use an object',
      '  inventory, i              Check your inventory',
      '',
      '  solve <challenge_id> <answer>  Submit solution (use examine to see ID)',
      '  hint <challenge_id>       Get a hint for a challenge (penalty)',
    ];
    return lines.join('\n');
  }

  async executeCommand(command: string, args: string[]): Promise<ActionResult> {
    switch (command) {
      case 'move':
      case 'go':
        return this.move(args[0] as Direction);

      case 'n':
      case 'north':
        return this.move('north');

      case 's':
      case 'south':
        return this.move('south');

      case 'e':
      case 'east':
        return this.move('east');

      case 'w':
      case 'west':
        return this.move('west');

      case 'look':
      case 'l':
        return this.examine(undefined);

      case 'examine':
      case 'x':
        return this.examine(args.join(' ') || undefined);

      case 'take':
      case 'get':
      case 'pickup':
        return this.interact(args.join(' '), 'take');

      case 'use':
        return this.interact(args.join(' '), 'use');

      case 'help':
      case 'h':
      case '?':
        return { success: true, message: this.getHelp(), turnCount: 0 };

      case 'inventory':
      case 'i':
      case 'inv':
        return this.getInventory();

      case 'solve':
        return this.solve(args[0], args.slice(1).join(' '));

      case 'hint':
        return this.getHint(args[0]);

      default:
        return {
          success: false,
          message: `Unknown command: ${command}`,
          turnCount: 0, // engine sets final turnCount
        };
    }
  }

  checkWinCondition(): WinConditionResult {
    const room = this.getRoom(this.currentRoom);
    if (room?.isExit) {
      return { won: true, message: 'You escaped!' };
    }
    return { won: false };
  }

  getState(): Record<string, unknown> {
    const room = this.getRoom(this.currentRoom);
    return {
      currentRoom: this.currentRoom,
      currentRoomData: room,
      allRooms: this.rooms,
      inventory: this.inventory,
      challengesCompleted: this.challengesCompleted,
      roomsVisited: this.roomsVisited,
      hintsUsed: this.hintsUsed,
    };
  }

  getScoreAdjustment(): number {
    let adjustment = 0;
    // Exploration bonus
    adjustment += this.roomsVisited.length * 10;
    // Challenge bonus
    adjustment += this.challengesCompleted.length * 100;
    // Hint penalty
    adjustment -= this.hintsUsed * 50;
    return adjustment;
  }

  // --- Private methods (moved from GameEngine) ---

  private getRoom(roomId: string): Room | undefined {
    return this.rooms.find((r) => r.id === roomId);
  }

  private getChallenge(challengeId: string): Challenge | undefined {
    return this.scenario.challenges.find((c) => c.id === challengeId);
  }

  private getDestinationRoom(currentRoom: Room, direction: Direction): Room | undefined {
    if (!currentRoom.exits.includes(direction)) {
      return undefined;
    }

    const { x, y } = currentRoom.position;
    let targetX = x;
    let targetY = y;

    switch (direction) {
      case 'north': targetY = y - 1; break;
      case 'south': targetY = y + 1; break;
      case 'east': targetX = x + 1; break;
      case 'west': targetX = x - 1; break;
    }

    return this.rooms.find((r) => r.position.x === targetX && r.position.y === targetY);
  }

  private move(direction: Direction): ActionResult {
    const currentRoom = this.getRoom(this.currentRoom);
    if (!currentRoom) {
      return { success: false, message: 'Current room not found.', turnCount: 0 };
    }

    const nextRoom = this.getDestinationRoom(currentRoom, direction);
    if (!nextRoom) {
      return {
        success: false,
        message: `No exit to the ${direction} from this room.`,
        turnCount: 0,
      };
    }

    // Check if room is locked
    if (nextRoom.locked && nextRoom.unlockRequires) {
      const hasRequirement =
        this.inventory.includes(nextRoom.unlockRequires) ||
        this.challengesCompleted.includes(nextRoom.unlockRequires);

      if (!hasRequirement) {
        return {
          success: false,
          message: `The door to the ${direction} is locked. You need to find a way to unlock it.`,
          turnCount: 0,
        };
      }

      nextRoom.locked = false;
    }

    this.currentRoom = nextRoom.id;
    if (!this.roomsVisited.includes(nextRoom.id)) {
      this.roomsVisited.push(nextRoom.id);
    }

    return {
      success: true,
      message: `You enter the ${nextRoom.name}.`,
      turnCount: 0,
    };
  }

  private examine(target?: string): ActionResult {
    const currentRoom = this.getRoom(this.currentRoom);
    if (!currentRoom) {
      return { success: false, message: 'Current room not found.', turnCount: 0 };
    }

    // If no target, examine the room
    if (!target) {
      const exits = currentRoom.exits.join(', ');
      const objects = currentRoom.objects.map((o) => o.name).join(', ');
      const challenges = currentRoom.challenges
        .map((cId) => {
          const challenge = this.getChallenge(cId);
          const status = this.challengesCompleted.includes(cId) ? '\u2713' : '\u26A1';
          return `${status} ${challenge?.title} [${cId}]`;
        })
        .join(', ');

      let description = currentRoom.description;
      if (exits.length > 0) description += `\n\nExits: ${exits}`;
      if (objects) description += `\n\nObjects: ${objects}`;
      if (challenges) description += `\n\nChallenges: ${challenges}`;

      return { success: true, message: description, turnCount: 0 };
    }

    // Check if examining a challenge
    const challenge = currentRoom.challenges
      .map((cId) => this.getChallenge(cId))
      .find((c) => c && (c.id === target || c.title.toLowerCase().includes(target.toLowerCase())));

    if (challenge) {
      const completed = this.challengesCompleted.includes(challenge.id);
      let message = `${challenge.title} [${challenge.id}]\n\n${challenge.description}`;

      if (completed) {
        message = `\u2713 ${message}\n\nThis challenge is already completed!`;
      } else if (challenge.requiredItems && challenge.requiredItems.length > 0) {
        const hasAllItems = challenge.requiredItems.every((item) => this.inventory.includes(item));
        if (!hasAllItems) {
          const missing = challenge.requiredItems.filter((item) => !this.inventory.includes(item));
          message += `\n\nRequired items: ${challenge.requiredItems.join(', ')}`;
          message += `\nYou are missing: ${missing.join(', ')}`;
        }
      }

      return { success: true, message, turnCount: 0 };
    }

    // Examine specific object in current room
    let object = currentRoom.objects.find(
      (o) => o.id === target || o.name.toLowerCase() === target.toLowerCase()
    );

    // If not in room, check inventory
    if (!object) {
      if (this.inventory.includes(target)) {
        for (const room of this.rooms) {
          const foundInOriginal = room.objects.find(o => o.id === target);
          if (foundInOriginal) {
            object = foundInOriginal;
            break;
          }
        }

        if (!object) {
          for (const room of this.rooms) {
            const foundByName = room.objects.find(o =>
              this.inventory.includes(o.id) &&
              o.name.toLowerCase() === target.toLowerCase()
            );
            if (foundByName) {
              object = foundByName;
              break;
            }
          }
        }
      }
    }

    if (!object) {
      return {
        success: false,
        message: `You don't see "${target}" here or in your inventory.`,
        turnCount: 0,
      };
    }

    const inInventory = this.inventory.includes(object.id);
    const location = inInventory ? ' (in your inventory)' : '';

    return { success: true, message: `${object.description}${location}`, turnCount: 0 };
  }

  private interact(objectId: string, action: 'take' | 'use'): ActionResult {
    if (!objectId) {
      return {
        success: false,
        message: action === 'take' ? 'What do you want to take?' : 'What do you want to use?',
        turnCount: 0,
      };
    }

    const currentRoom = this.getRoom(this.currentRoom);
    if (!currentRoom) {
      return { success: false, message: 'Current room not found.', turnCount: 0 };
    }

    const objectIndex = currentRoom.objects.findIndex(
      (o) => o.id === objectId || o.name.toLowerCase() === objectId.toLowerCase()
    );

    if (objectIndex === -1) {
      const inInventory = this.inventory.some(
        (invId) => invId === objectId || invId.toLowerCase() === objectId.toLowerCase()
      );

      if (!inInventory) {
        return { success: false, message: `You don't see "${objectId}" here.`, turnCount: 0 };
      }

      if (action === 'take') {
        return { success: false, message: `You already have the ${objectId}.`, turnCount: 0 };
      }

      return { success: true, message: `You use the ${objectId}.`, turnCount: 0 };
    }

    const object = currentRoom.objects[objectIndex];

    if (action === 'take') {
      if (!object.takeable) {
        return { success: false, message: `You can't take the ${object.name}.`, turnCount: 0 };
      }

      this.inventory.push(object.id);
      currentRoom.objects.splice(objectIndex, 1);

      return { success: true, message: `You picked up the ${object.name}.`, turnCount: 0 };
    }

    return { success: true, message: `You use the ${object.name}.`, turnCount: 0 };
  }

  private getInventory(): ActionResult {
    const lines = ['Inventory:'];
    if (this.inventory.length === 0) {
      lines.push('  (empty)');
    } else {
      this.inventory.forEach((item) => {
        lines.push(`  \u2022 ${item}`);
      });
      lines.push('');
      lines.push('Tip: Use "examine <item>" to read items in your inventory');
    }

    return { success: true, message: lines.join('\n'), turnCount: 0 };
  }

  private solve(challengeId: string, solution: string): ActionResult {
    if (!challengeId || !solution) {
      return { success: false, message: 'Usage: solve <challenge_id> <solution>', turnCount: 0 };
    }

    const challenge = this.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, message: `Challenge ${challengeId} not found.`, turnCount: 0 };
    }

    if (this.challengesCompleted.includes(challengeId)) {
      return { success: false, message: 'You have already completed this challenge.', turnCount: 0 };
    }

    if (challenge.requiredItems) {
      const missingItems = challenge.requiredItems.filter((item) => !this.inventory.includes(item));
      if (missingItems.length > 0) {
        return {
          success: false,
          message: 'You need specific items to attempt this challenge.',
          turnCount: 0,
        };
      }
    }

    const correct = solution.toLowerCase().trim() === challenge.solution.toLowerCase().trim();

    if (!correct) {
      return { success: false, message: 'Incorrect solution. Try again.', turnCount: 0 };
    }

    this.challengesCompleted.push(challengeId);

    // Handle unlocks
    if (challenge.unlocks) {
      const roomToUnlock = this.getRoom(challenge.unlocks);
      if (roomToUnlock) {
        roomToUnlock.locked = false;
      }
    }

    return {
      success: true,
      message: challenge.reward || 'Challenge completed! You hear a click as something unlocks.',
      turnCount: 0,
    };
  }

  private getHint(challengeId: string): ActionResult {
    if (!challengeId) {
      return { success: false, message: 'Usage: hint <challenge_id>', turnCount: 0 };
    }

    const challenge = this.getChallenge(challengeId);
    if (!challenge) {
      return { success: false, message: `Challenge ${challengeId} not found.`, turnCount: 0 };
    }

    this.hintsUsed++;
    const hint = challenge.hints[Math.min(this.hintsUsed - 1, challenge.hints.length - 1)];

    return {
      success: true,
      message: `\uD83D\uDCA1 Hint: ${hint} (-50 points)`,
      turnCount: 0,
    };
  }
}
