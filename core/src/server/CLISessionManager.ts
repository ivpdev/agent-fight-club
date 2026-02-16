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
      // Meta-commands handled by session manager
      switch (cmd) {
        case 'help':
        case 'h':
        case '?':
          return this.getHelp(session);

        case 'start':
          return await this.startGame(session, args[0]);

        case 'scenarios':
        case 'list':
          return this.listScenarios();

        case 'status':
          return this.status(session);

        case 'quit':
        case 'exit':
        case 'q':
          this.deleteSession(sessionId);
          return 'Goodbye!';
      }

      // All other commands go to the game engine
      if (!session.gameId) {
        return `Unknown command: ${cmd}\nType "help" for available commands`;
      }

      const result = await this.gameEngine.executeCommand(session.gameId, cmd, args);

      let output = result.success ? `\u2713 ${result.message}` : `\u2717 ${result.message}`;

      if (result.gameStatus === 'completed') {
        output += '\n\n\uD83C\uDF89 Congratulations! You won!';
        output += '\n' + this.status(session);
      } else if (result.gameStatus === 'failed') {
        output += '\n\nGame over! Time ran out.';
        output += '\n' + this.status(session);
      }

      return output;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  private getHelp(session: CLISession): string {
    const lines = [
      'Available Commands:',
      '',
      '  start <scenario>          Start a new game with the specified scenario',
      '  scenarios, list           List available scenarios',
      '  status                    Show current game status',
      '  help, h, ?                Show this help message',
      '  quit, exit, q             End the session',
    ];

    // Add scenario-specific help if a game is active
    if (session.gameId) {
      const scenarioHelp = this.gameEngine.getHelp(session.gameId);
      if (scenarioHelp) {
        lines.push('');
        lines.push('Game Commands:');
        lines.push(scenarioHelp);
      }
    }

    lines.push('');
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

  private startGame(session: CLISession, scenarioId: string): string {
    if (!scenarioId) {
      return 'Error: Please specify a scenario ID\nUsage: start <scenario_id>';
    }

    const { gameState, initialMessage } = this.gameEngine.createGame('cli-player', scenarioId);
    session.gameId = gameState.gameId;
    session.scenarioId = scenarioId;

    const lines = [
      `\u2713 Game started! Game ID: ${gameState.gameId}`,
      '',
      initialMessage,
      '',
    ];

    return lines.join('\n');
  }

  private status(session: CLISession): string {
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
