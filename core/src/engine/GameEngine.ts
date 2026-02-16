import { v4 as uuidv4 } from 'uuid';
import {
  GameState,
  Scenario,
  ActionResult,
  ScenarioHandler,
} from '../types';

export class GameEngine {
  private games: Map<string, GameState> = new Map();
  private scenarios: Map<string, Scenario> = new Map();
  private handlers: Map<string, ScenarioHandler> = new Map();

  constructor() {}

  /**
   * Load a scenario into the engine
   */
  loadScenario(scenario: Scenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Create a new game session
   * Returns the game state and the initial message from the handler
   */
  createGame(agentId: string, scenarioId: string): { gameState: GameState; initialMessage: string } {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const gameId = uuidv4();
    const handler = scenario.createHandler();

    const gameState: GameState = {
      gameId,
      scenarioId,
      agentId,
      status: 'in_progress',
      turnCount: 0,
      startTime: Date.now(),
      endTime: null,
      score: 1000,
    };

    this.games.set(gameId, gameState);
    this.handlers.set(gameId, handler);

    return { gameState, initialMessage: handler.getInitialMessage() };
  }

  /**
   * Single entry point for all in-game commands
   */
  async executeCommand(gameId: string, command: string, args: string[]): Promise<ActionResult> {
    const gameState = this.games.get(gameId);
    if (!gameState) {
      throw new Error(`Game ${gameId} not found`);
    }

    if (gameState.status !== 'in_progress') {
      throw new Error(`Game ${gameId} has already ended with status: ${gameState.status}`);
    }

    const handler = this.handlers.get(gameId);
    if (!handler) {
      throw new Error(`Handler for game ${gameId} not found`);
    }

    // Delegate to handler
    const result = await handler.executeCommand(command, args);

    // Increment turn
    gameState.turnCount++;
    result.turnCount = gameState.turnCount;

    // Check time limit
    const scenario = this.scenarios.get(gameState.scenarioId);
    if (scenario?.timeLimitMs) {
      const elapsed = Date.now() - gameState.startTime;
      if (elapsed > scenario.timeLimitMs) {
        gameState.status = 'failed';
        gameState.endTime = Date.now();
        result.gameStatus = 'failed';
        return result;
      }
    }

    // Check win condition
    const winResult = handler.checkWinCondition();
    if (winResult.won) {
      gameState.status = 'completed';
      gameState.endTime = Date.now();
      this.calculateFinalScore(gameState);
      result.gameStatus = 'completed';
    } else {
      result.gameStatus = gameState.status;
    }

    return result;
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
   * Get handler for a game
   */
  getHandler(gameId: string): ScenarioHandler | undefined {
    return this.handlers.get(gameId);
  }

  /**
   * Get scenario-specific help text
   */
  getHelp(gameId: string): string | undefined {
    return this.handlers.get(gameId)?.getHelp();
  }

  /**
   * Get scenario-specific state from handler
   */
  getScenarioState(gameId: string): Record<string, unknown> | undefined {
    return this.handlers.get(gameId)?.getState();
  }

  /**
   * Calculate final score
   */
  private calculateFinalScore(gameState: GameState): void {
    const scenario = this.scenarios.get(gameState.scenarioId);
    if (!scenario) return;

    const handler = this.handlers.get(gameState.gameId);
    if (!handler) return;

    let score = 1000;

    // Turn penalty
    const extraTurns = Math.max(0, gameState.turnCount - scenario.optimalTurns);
    score -= extraTurns * 5;

    // Time penalty
    const elapsedSeconds = (Date.now() - gameState.startTime) / 1000;
    const optimalSeconds = scenario.optimalTurns * 10;
    const extraSeconds = Math.max(0, elapsedSeconds - optimalSeconds);
    score -= Math.floor(extraSeconds / 10);

    // Scenario-specific adjustments
    score += handler.getScoreAdjustment();

    gameState.score = Math.max(0, score);
  }
}
