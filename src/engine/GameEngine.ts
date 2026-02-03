import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Scenario,
  Room,
  Challenge,
  Direction,
  ActionResult,
} from '../types';

export class GameEngine {
  private games: Map<string, GameState> = new Map();
  private scenarios: Map<string, Scenario> = new Map();

  constructor() {}

  /**
   * Load a scenario into the engine
   */
  loadScenario(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Create a new game session
   */
  createGame(agentId: string, scenarioId: string): GameState {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const gameId = uuidv4();
    const gameState: GameState = {
      gameId,
      scenarioId,
      agentId,
      status: 'in_progress',
      currentRoom: scenario.startingRoom,
      inventory: [],
      challengesCompleted: [],
      turnCount: 0,
      startTime: Date.now(),
      endTime: null,
      score: 1000,
      hintsUsed: 0,
      roomsVisited: [scenario.startingRoom],
    };

    this.games.set(gameId, gameState);
    return gameState;
  }

  /**
   * Get game state
   */
  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get scenario
   */
  getScenario(scenarioId: string): Scenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * Get room from scenario
   */
  private getRoom(scenarioId: string, roomId: string): Room | undefined {
    const scenario = this.scenarios.get(scenarioId);
    return scenario?.rooms.find((r) => r.id === roomId);
  }

  /**
   * Get challenge from scenario
   */
  private getChallenge(scenarioId: string, challengeId: string): Challenge | undefined {
    const scenario = this.scenarios.get(scenarioId);
    return scenario?.challenges.find((c) => c.id === challengeId);
  }

  /**
   * Calculate destination room based on current position and direction
   */
  private getDestinationRoom(scenarioId: string, currentRoom: Room, direction: Direction): Room | undefined {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) return undefined;

    // Check if direction is in available exits
    if (!currentRoom.exits.includes(direction)) {
      return undefined;
    }

    // Calculate target position based on direction
    const { x, y } = currentRoom.position;
    let targetX = x;
    let targetY = y;

    switch (direction) {
      case 'north':
        targetY = y - 1;
        break;
      case 'south':
        targetY = y + 1;
        break;
      case 'east':
        targetX = x + 1;
        break;
      case 'west':
        targetX = x - 1;
        break;
    }

    // Find room at target position
    return scenario.rooms.find((r) => r.position.x === targetX && r.position.y === targetY);
  }

  /**
   * Check if game is still active
   */
  private validateGameActive(gameState: GameState): void {
    if (gameState.status !== 'in_progress') {
      throw new Error(`Game ${gameState.gameId} has already ended with status: ${gameState.status}`);
    }
  }

  /**
   * Increment turn counter and check time limit
   */
  private incrementTurn(gameState: GameState): void {
    gameState.turnCount++;

    const scenario = this.scenarios.get(gameState.scenarioId);
    if (scenario?.timeLimitMs) {
      const elapsed = Date.now() - gameState.startTime;
      if (elapsed > scenario.timeLimitMs) {
        gameState.status = 'failed';
        gameState.endTime = Date.now();
      }
    }
  }

  /**
   * Check win conditions
   */
  private checkWinCondition(gameState: GameState): void {
    const scenario = this.scenarios.get(gameState.scenarioId);
    if (!scenario) return;

    const currentRoom = this.getRoom(gameState.scenarioId, gameState.currentRoom);

    // Check if player reached exit room
    if (currentRoom?.isExit) {
      gameState.status = 'completed';
      gameState.endTime = Date.now();
      this.calculateFinalScore(gameState);
    }
  }

  /**
   * Calculate final score
   */
  private calculateFinalScore(gameState: GameState): void {
    const scenario = this.scenarios.get(gameState.scenarioId);
    if (!scenario) return;

    let score = 1000;

    // Turn penalty
    const extraTurns = Math.max(0, gameState.turnCount - scenario.optimalTurns);
    score -= extraTurns * 5;

    // Time penalty
    const elapsedSeconds = (Date.now() - gameState.startTime) / 1000;
    const optimalSeconds = (scenario.optimalTurns * 10); // Assume 10 seconds per optimal turn
    const extraSeconds = Math.max(0, elapsedSeconds - optimalSeconds);
    score -= Math.floor(extraSeconds / 10);

    // Hint penalty
    score -= gameState.hintsUsed * 50;

    // Exploration bonus
    score += gameState.roomsVisited.length * 10;

    // Challenge bonus
    score += gameState.challengesCompleted.length * 100;

    gameState.score = Math.max(0, score);
  }

  /**
   * Move to another room
   */
  move(gameId: string, direction: Direction): ActionResult {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.validateGameActive(gameState);

    const currentRoom = this.getRoom(gameState.scenarioId, gameState.currentRoom);
    if (!currentRoom) {
      throw new Error(`Current room ${gameState.currentRoom} not found`);
    }

    const nextRoom = this.getDestinationRoom(gameState.scenarioId, currentRoom, direction);
    if (!nextRoom) {
      this.incrementTurn(gameState);
      return {
        success: false,
        message: `No exit to the ${direction} from this room.`,
        turnCount: gameState.turnCount,
      };
    }

    // Check if room is locked
    if (nextRoom.locked && nextRoom.unlockRequires) {
      const hasRequirement =
        gameState.inventory.includes(nextRoom.unlockRequires) ||
        gameState.challengesCompleted.includes(nextRoom.unlockRequires);

      if (!hasRequirement) {
        this.incrementTurn(gameState);
        return {
          success: false,
          message: `The door to the ${direction} is locked. You need to find a way to unlock it.`,
          turnCount: gameState.turnCount,
        };
      }

      // Unlock the room
      nextRoom.locked = false;
    }

    // Move to the next room
    gameState.currentRoom = nextRoom.id;
    if (!gameState.roomsVisited.includes(nextRoom.id)) {
      gameState.roomsVisited.push(nextRoom.id);
    }

    this.incrementTurn(gameState);
    this.checkWinCondition(gameState);

    return {
      success: true,
      message: `You enter the ${nextRoom.name}.`,
      turnCount: gameState.turnCount,
      gameStatus: gameState.status,
    };
  }

  /**
   * Examine a room or object
   */
  examine(gameId: string, target?: string): ActionResult {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.validateGameActive(gameState);

    const currentRoom = this.getRoom(gameState.scenarioId, gameState.currentRoom);
    if (!currentRoom) {
      throw new Error(`Current room ${gameState.currentRoom} not found`);
    }

    this.incrementTurn(gameState);

    // If no target, examine the room
    if (!target) {
      const exits = currentRoom.exits.join(', ');
      const objects = currentRoom.objects.map((o) => o.name).join(', ');
      const challenges = currentRoom.challenges
        .map((cId) => {
          const challenge = this.getChallenge(gameState.scenarioId, cId);
          const status = gameState.challengesCompleted.includes(cId) ? '✓' : '⚡';
          return `${status} ${challenge?.title} [${cId}]`;
        })
        .join(', ');

      let description = currentRoom.description;
      if (exits.length > 0) description += `\n\nExits: ${exits}`;
      if (objects) description += `\n\nObjects: ${objects}`;
      if (challenges) description += `\n\nChallenges: ${challenges}`;

      return {
        success: true,
        message: description,
        turnCount: gameState.turnCount,
      };
    }

    // Check if examining a challenge
    const challenge = currentRoom.challenges
      .map((cId) => this.getChallenge(gameState.scenarioId, cId))
      .find((c) => c && (c.id === target || c.title.toLowerCase().includes(target.toLowerCase())));

    if (challenge) {
      const completed = gameState.challengesCompleted.includes(challenge.id);
      let message = `${challenge.title} [${challenge.id}]\n\n${challenge.description}`;

      if (completed) {
        message = `✓ ${message}\n\nThis challenge is already completed!`;
      } else if (challenge.requiredItems && challenge.requiredItems.length > 0) {
        const hasAllItems = challenge.requiredItems.every((item) => gameState.inventory.includes(item));
        if (!hasAllItems) {
          const missing = challenge.requiredItems.filter((item) => !gameState.inventory.includes(item));
          message += `\n\nRequired items: ${challenge.requiredItems.join(', ')}`;
          message += `\nYou are missing: ${missing.join(', ')}`;
        }
      }

      return {
        success: true,
        message,
        turnCount: gameState.turnCount,
      };
    }

    // Examine specific object in current room
    let object = currentRoom.objects.find(
      (o) => o.id === target || o.name.toLowerCase() === target.toLowerCase()
    );

    // If not in room, check inventory
    if (!object) {
      // Search through all rooms to find the object by ID in inventory
      const scenario = this.scenarios.get(gameState.scenarioId);
      if (scenario && gameState.inventory.includes(target)) {
        // Find the object definition from any room (it's been picked up)
        for (const room of scenario.rooms) {
          // Check if this object was originally in this room (by ID match)
          const foundInOriginal = room.objects.find(o => o.id === target);
          if (foundInOriginal) {
            object = foundInOriginal;
            break;
          }
        }

        // Also check by name in inventory
        if (!object) {
          for (const room of scenario.rooms) {
            const foundByName = room.objects.find(o =>
              gameState.inventory.includes(o.id) &&
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
        turnCount: gameState.turnCount,
      };
    }

    const inInventory = gameState.inventory.includes(object.id);
    const location = inInventory ? ' (in your inventory)' : '';

    return {
      success: true,
      message: `${object.description}${location}`,
      turnCount: gameState.turnCount,
    };
  }

  /**
   * Interact with an object (take or use)
   */
  interact(gameId: string, objectId: string, action: 'take' | 'use', _useWith?: string): ActionResult {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.validateGameActive(gameState);

    const currentRoom = this.getRoom(gameState.scenarioId, gameState.currentRoom);
    if (!currentRoom) {
      throw new Error(`Current room ${gameState.currentRoom} not found`);
    }

    const objectIndex = currentRoom.objects.findIndex(
      (o) => o.id === objectId || o.name.toLowerCase() === objectId.toLowerCase()
    );

    if (objectIndex === -1) {
      // Check if object is in inventory
      const inInventory = gameState.inventory.some(
        (invId) => invId === objectId || invId.toLowerCase() === objectId.toLowerCase()
      );

      if (!inInventory) {
        this.incrementTurn(gameState);
        return {
          success: false,
          message: `You don't see "${objectId}" here.`,
          turnCount: gameState.turnCount,
        };
      }

      // Object is in inventory - can only use it
      if (action === 'take') {
        this.incrementTurn(gameState);
        return {
          success: false,
          message: `You already have the ${objectId}.`,
          turnCount: gameState.turnCount,
        };
      }

      // Handle use from inventory (simplified for now)
      this.incrementTurn(gameState);
      return {
        success: true,
        message: `You use the ${objectId}.`,
        turnCount: gameState.turnCount,
      };
    }

    const object = currentRoom.objects[objectIndex];

    if (action === 'take') {
      if (!object.takeable) {
        this.incrementTurn(gameState);
        return {
          success: false,
          message: `You can't take the ${object.name}.`,
          turnCount: gameState.turnCount,
        };
      }

      // Add to inventory and remove from room
      gameState.inventory.push(object.id);
      currentRoom.objects.splice(objectIndex, 1);

      this.incrementTurn(gameState);
      return {
        success: true,
        message: `You picked up the ${object.name}.`,
        turnCount: gameState.turnCount,
      };
    }

    // Use action
    this.incrementTurn(gameState);
    return {
      success: true,
      message: `You use the ${object.name}.`,
      turnCount: gameState.turnCount,
    };
  }

  /**
   * Solve a challenge
   */
  solve(gameId: string, challengeId: string, solution: string): ActionResult {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.validateGameActive(gameState);

    const challenge = this.getChallenge(gameState.scenarioId, challengeId);
    if (!challenge) {
      this.incrementTurn(gameState);
      return {
        success: false,
        message: `Challenge ${challengeId} not found.`,
        turnCount: gameState.turnCount,
      };
    }

    // Check if already completed
    if (gameState.challengesCompleted.includes(challengeId)) {
      this.incrementTurn(gameState);
      return {
        success: false,
        message: `You have already completed this challenge.`,
        turnCount: gameState.turnCount,
      };
    }

    // Check required items
    if (challenge.requiredItems) {
      const missingItems = challenge.requiredItems.filter((item) => !gameState.inventory.includes(item));
      if (missingItems.length > 0) {
        this.incrementTurn(gameState);
        return {
          success: false,
          message: `You need specific items to attempt this challenge.`,
          turnCount: gameState.turnCount,
        };
      }
    }

    // Check solution
    const correct = solution.toLowerCase().trim() === challenge.solution.toLowerCase().trim();

    this.incrementTurn(gameState);

    if (!correct) {
      return {
        success: false,
        message: `Incorrect solution. Try again.`,
        turnCount: gameState.turnCount,
      };
    }

    // Mark as completed
    gameState.challengesCompleted.push(challengeId);

    // Handle unlocks
    if (challenge.unlocks) {
      const roomToUnlock = this.getRoom(gameState.scenarioId, challenge.unlocks);
      if (roomToUnlock) {
        roomToUnlock.locked = false;
      }
    }

    return {
      success: true,
      message: challenge.reward || `Challenge completed! You hear a click as something unlocks.`,
      turnCount: gameState.turnCount,
    };
  }

  /**
   * Get a hint for a challenge
   */
  getHint(gameId: string, challengeId: string): ActionResult {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    this.validateGameActive(gameState);

    const challenge = this.getChallenge(gameState.scenarioId, challengeId);
    if (!challenge) {
      this.incrementTurn(gameState);
      return {
        success: false,
        message: `Challenge ${challengeId} not found.`,
        turnCount: gameState.turnCount,
      };
    }

    gameState.hintsUsed++;
    this.incrementTurn(gameState);

    const hint = challenge.hints[Math.min(gameState.hintsUsed - 1, challenge.hints.length - 1)];

    return {
      success: true,
      message: `💡 Hint: ${hint} (-50 points)`,
      turnCount: gameState.turnCount,
    };
  }

  /**
   * Get current room details
   */
  getCurrentRoom(gameId: string): Room | undefined {
    const gameState = this.games.get(gameId);
    if (!gameState) return undefined;
    return this.getRoom(gameState.scenarioId, gameState.currentRoom);
  }

  /**
   * Get all rooms (for visualization)
   */
  getAllRooms(gameId: string): Room[] {
    const gameState = this.games.get(gameId);
    if (!gameState) return [];
    const scenario = this.scenarios.get(gameState.scenarioId);
    return scenario?.rooms || [];
  }
}
