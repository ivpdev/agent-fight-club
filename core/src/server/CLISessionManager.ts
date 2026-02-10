import { GameEngine } from '../engine/GameEngine';
import { scenarios } from '../scenarios';
import { v4 as uuidv4 } from 'uuid';

interface CLISession {
  sessionId: string;
  gameId: string | null;
  scenarioId: string | null;
  lastActivity: number;
}

export class CLISessionManager {
  private sessions: Map<string, CLISession> = new Map();
  private gameEngine: GameEngine;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;

    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  createSession(): string {
    const sessionId = uuidv4();
    this.sessions.set(sessionId, {
      sessionId,
      gameId: null,
      scenarioId: null,
      lastActivity: Date.now(),
    });
    return sessionId;
  }

  getSession(sessionId: string): CLISession | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      return session;
    }
    return null;
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  async executeCommand(sessionId: string, command: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      return 'Error: Session not found or expired';
    }

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (cmd) {
        case 'help':
        case 'h':
        case '?':
          return this.getHelp();

        case 'start':
          return await this.startGame(session, args[0]);

        case 'scenarios':
        case 'list':
          return this.listScenarios();

        case 'move':
        case 'go':
        case 'n':
        case 'north':
        case 's':
        case 'south':
        case 'e':
        case 'east':
        case 'w':
        case 'west':
          return await this.move(session, cmd === 'move' || cmd === 'go' ? args[0] : cmd);

        case 'look':
        case 'l':
          return await this.look(session);

        case 'examine':
        case 'x':
          return await this.examine(session, args.join(' '));

        case 'take':
        case 'get':
        case 'pickup':
          return await this.take(session, args.join(' '));

        case 'use':
          return await this.use(session, args.join(' '));

        case 'inventory':
        case 'i':
        case 'inv':
          return await this.inventory(session);

        case 'solve':
          return await this.solve(session, args[0], args.slice(1).join(' '));

        case 'hint':
          return await this.hint(session, args[0]);

        case 'status':
          return await this.status(session);

        case 'quit':
        case 'exit':
        case 'q':
          this.deleteSession(sessionId);
          return 'Goodbye!';

        default:
          return `Unknown command: ${cmd}\nType "help" for available commands`;
      }
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getHelp(): string {
    const lines = [
      'Available Commands:',
      '',
      '  start <scenario>          Start a new game with the specified scenario',
      '  scenarios, list           List available scenarios',
      '',
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
      '',
      '  status                    Show current game status',
      '  help, h, ?                Show this help message',
      '  quit, exit, q             End the session',
      '',
    ];
    return lines.join('\n');
  }

  private listScenarios(): string {
    const lines = ['Available Scenarios:', ''];

    scenarios.forEach((s) => {
      lines.push(`  ${s.id.padEnd(20)} [${s.difficulty.padEnd(6)}] ${s.name}`);
      lines.push(`    ${s.description}`);
      lines.push('');
    });

    return lines.join('\n');
  }

  private async startGame(session: CLISession, scenarioId: string): Promise<string> {
    if (!scenarioId) {
      return 'Error: Please specify a scenario ID\nUsage: start <scenario_id>';
    }

    const gameState = this.gameEngine.createGame('cli-player', scenarioId);
    session.gameId = gameState.gameId;
    session.scenarioId = scenarioId;

    const currentRoom = this.gameEngine.getCurrentRoom(gameState.gameId);
    if (!currentRoom) {
      return 'Error: Failed to initialize game';
    }

    const lines = [
      `✓ Game started! Game ID: ${gameState.gameId}`,
      '',
      currentRoom.name,
      currentRoom.description,
    ];

    if (currentRoom.exits.length > 0) {
      lines.push('');
      lines.push(`Exits: ${currentRoom.exits.join(', ')}`);
    }

    if (currentRoom.objects.length > 0) {
      lines.push(`Objects: ${currentRoom.objects.map(o => o.name).join(', ')}`);
    }

    lines.push('');
    return lines.join('\n');
  }

  private async move(session: CLISession, direction: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game. Start a game first with "start <scenario>"';
    }

    const directionMap: Record<string, string> = {
      n: 'north',
      s: 'south',
      e: 'east',
      w: 'west',
    };

    const fullDirection = directionMap[direction] || direction;

    if (!['north', 'south', 'east', 'west'].includes(fullDirection)) {
      return 'Error: Invalid direction. Use: north, south, east, or west';
    }

    const result = this.gameEngine.move(session.gameId, fullDirection as any);

    if (!result.success) {
      return `✗ ${result.message}`;
    }

    const lines = [`✓ ${result.message}`, ''];
    const roomDesc = await this.look(session);
    lines.push(roomDesc);

    if (result.gameStatus === 'completed') {
      lines.push('');
      lines.push('🎉 Congratulations! You escaped!');
      const statusDesc = await this.status(session);
      lines.push('');
      lines.push(statusDesc);
    }

    return lines.join('\n');
  }

  private async look(session: CLISession): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    const currentRoom = this.gameEngine.getCurrentRoom(session.gameId);
    if (!currentRoom) {
      return 'Error: Current room not found';
    }

    const lines = [
      currentRoom.name,
      currentRoom.description,
    ];

    if (currentRoom.exits.length > 0) {
      lines.push('');
      lines.push(`Exits: ${currentRoom.exits.join(', ')}`);
    }

    if (currentRoom.objects.length > 0) {
      lines.push(`Objects: ${currentRoom.objects.map(o => o.name).join(', ')}`);
    }

    return lines.join('\n');
  }

  private async examine(session: CLISession, target: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    if (!target) {
      return await this.look(session);
    }

    const result = this.gameEngine.examine(session.gameId, target);
    return result.message;
  }

  private async take(session: CLISession, objectId: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    if (!objectId) {
      return 'Error: What do you want to take?';
    }

    const result = this.gameEngine.interact(session.gameId, objectId, 'take');
    return result.success ? `✓ ${result.message}` : `✗ ${result.message}`;
  }

  private async use(session: CLISession, objectId: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    if (!objectId) {
      return 'Error: What do you want to use?';
    }

    const result = this.gameEngine.interact(session.gameId, objectId, 'use');
    return result.success ? `✓ ${result.message}` : `✗ ${result.message}`;
  }

  private async inventory(session: CLISession): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    const gameState = this.gameEngine.getGame(session.gameId);
    if (!gameState) {
      return 'Error: Game not found';
    }

    const lines = ['Inventory:'];
    if (gameState.inventory.length === 0) {
      lines.push('  (empty)');
    } else {
      gameState.inventory.forEach((item) => {
        lines.push(`  • ${item}`);
      });
      lines.push('');
      lines.push('Tip: Use "examine <item>" to read items in your inventory');
    }

    return lines.join('\n');
  }

  private async solve(session: CLISession, challengeId: string, solution: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    if (!challengeId || !solution) {
      return 'Error: Usage: solve <challenge_id> <solution>';
    }

    const result = this.gameEngine.solve(session.gameId, challengeId, solution);
    return result.success ? `✓ ${result.message}` : `✗ ${result.message}`;
  }

  private async hint(session: CLISession, challengeId: string): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    if (!challengeId) {
      return 'Error: Usage: hint <challenge_id>';
    }

    const result = this.gameEngine.getHint(session.gameId, challengeId);
    return result.message;
  }

  private async status(session: CLISession): Promise<string> {
    if (!session.gameId) {
      return 'Error: No active game.';
    }

    const gameState = this.gameEngine.getGame(session.gameId);
    if (!gameState) {
      return 'Error: Game not found';
    }

    const lines = [
      'Game Status:',
      `  Game ID: ${gameState.gameId}`,
      `  Status: ${gameState.status}`,
      `  Turn: ${gameState.turnCount}`,
      `  Score: ${gameState.score}`,
      `  Time: ${Math.floor((Date.now() - gameState.startTime) / 1000)}s`,
    ];

    return lines.join('\n');
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up expired CLI session: ${sessionId}`);
      }
    }
  }
}
