import express, { Request, Response, NextFunction } from 'express';
import { GameEngine } from '../engine/GameEngine';
import { MapRenderer } from '../visualization/MapRenderer';
import { scenarios } from '../scenarios';
import {
  CreateGameRequest,
  MoveRequest,
  ExamineRequest,
  InteractRequest,
  SolveRequest,
  ErrorResponse,
} from '../types';

const app = express();
const port = process.env.PORT || 3000;

// Initialize game engine and load scenarios
const gameEngine = new GameEngine();
scenarios.forEach((scenario) => gameEngine.loadScenario(scenario));

const renderer = new MapRenderer();

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handler
const handleError = (res: Response, error: unknown, statusCode: number = 500) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('Error:', message);

  const errorResponse: ErrorResponse = {
    error: 'error',
    message,
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * List available scenarios
 */
app.get('/scenarios', (_req: Request, res: Response) => {
  try {
    const scenarioList = scenarios.map((s) => ({
      id: s.id,
      name: s.name,
      difficulty: s.difficulty,
      description: s.description,
    }));
    res.json(scenarioList);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Create a new game
 */
app.post('/games', (req: Request, res: Response) => {
  try {
    const { agentId, scenarioId }: CreateGameRequest = req.body;

    if (!agentId || !scenarioId) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'agentId and scenarioId are required',
      });
    }

    const gameState = gameEngine.createGame(agentId, scenarioId);
    const scenario = gameEngine.getScenario(scenarioId);
    const currentRoom = gameEngine.getCurrentRoom(gameState.gameId);

    if (!scenario || !currentRoom) {
      return res.status(500).json({
        error: 'internal_error',
        message: 'Failed to initialize game',
      });
    }

    // Render initial visualization
    const allRooms = gameEngine.getAllRooms(gameState.gameId);
    const visualization = renderer.render(gameState, scenario, currentRoom, allRooms);
    console.log('\n' + visualization + '\n');

    res.status(201).json({
      gameId: gameState.gameId,
      initialState: {
        gameId: gameState.gameId,
        status: gameState.status,
        currentRoom: {
          id: currentRoom.id,
          name: currentRoom.name,
          description: currentRoom.description,
          visibleObjects: currentRoom.objects.map((o) => o.name),
          exits: Object.keys(currentRoom.exits) as any[],
        },
        inventory: gameState.inventory,
        turnCount: gameState.turnCount,
        elapsedTimeMs: 0,
        score: gameState.score,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Get game state
 */
app.get('/games/:gameId', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const gameState = gameEngine.getGame(gameId);

    if (!gameState) {
      return res.status(404).json({
        error: 'game_not_found',
        message: `Game ${gameId} does not exist`,
      });
    }

    const currentRoom = gameEngine.getCurrentRoom(gameId);
    if (!currentRoom) {
      return res.status(500).json({
        error: 'internal_error',
        message: 'Current room not found',
      });
    }

    res.json({
      gameId: gameState.gameId,
      status: gameState.status,
      currentRoom: {
        id: currentRoom.id,
        name: currentRoom.name,
        description: currentRoom.description,
        visibleObjects: currentRoom.objects.map((o) => o.name),
        exits: Object.keys(currentRoom.exits),
      },
      inventory: gameState.inventory,
      turnCount: gameState.turnCount,
      elapsedTimeMs: Date.now() - gameState.startTime,
      score: gameState.score,
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Move action
 */
app.post('/games/:gameId/move', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { direction }: MoveRequest = req.body;

    if (!direction) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'direction is required',
      });
    }

    const result = gameEngine.move(gameId, direction);

    // Render visualization
    const gameState = gameEngine.getGame(gameId);
    const scenario = gameEngine.getScenario(gameState!.scenarioId);
    const currentRoom = gameEngine.getCurrentRoom(gameId);

    if (gameState && scenario && currentRoom) {
      const allRooms = gameEngine.getAllRooms(gameId);
      const visualization = renderer.render(gameState, scenario, currentRoom, allRooms);
      const actionResult = renderer.renderActionResult(result.success, result.message);
      console.log('\n' + visualization);
      console.log('\n' + actionResult + '\n');
    }

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Examine action
 */
app.post('/games/:gameId/examine', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { target }: ExamineRequest = req.body;

    const result = gameEngine.examine(gameId, target);

    // Render result
    console.log('\n' + renderer.renderActionResult(result.success, result.message) + '\n');

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Interact action (take or use object)
 */
app.post('/games/:gameId/interact', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { objectId, action, useWith }: InteractRequest = req.body;

    if (!objectId || !action) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'objectId and action are required',
      });
    }

    const result = gameEngine.interact(gameId, objectId, action, useWith);

    // Render visualization if successful
    if (result.success) {
      const gameState = gameEngine.getGame(gameId);
      const scenario = gameEngine.getScenario(gameState!.scenarioId);
      const currentRoom = gameEngine.getCurrentRoom(gameId);

      if (gameState && scenario && currentRoom) {
        const allRooms = gameEngine.getAllRooms(gameId);
        const visualization = renderer.render(gameState, scenario, currentRoom, allRooms);
        const actionResult = renderer.renderActionResult(result.success, result.message);
        console.log('\n' + visualization);
        console.log('\n' + actionResult + '\n');
      }
    } else {
      console.log('\n' + renderer.renderActionResult(result.success, result.message) + '\n');
    }

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Solve challenge
 */
app.post('/games/:gameId/solve', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { challengeId, solution }: SolveRequest = req.body;

    if (!challengeId || !solution) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'challengeId and solution are required',
      });
    }

    const result = gameEngine.solve(gameId, challengeId, solution);

    // Render visualization
    const gameState = gameEngine.getGame(gameId);
    const scenario = gameEngine.getScenario(gameState!.scenarioId);
    const currentRoom = gameEngine.getCurrentRoom(gameId);

    if (gameState && scenario && currentRoom) {
      const allRooms = gameEngine.getAllRooms(gameId);
      const visualization = renderer.render(gameState, scenario, currentRoom, allRooms);
      const actionResult = renderer.renderActionResult(result.success, result.message);
      console.log('\n' + visualization);
      console.log('\n' + actionResult + '\n');
    }

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Get hint for challenge
 */
app.post('/games/:gameId/hint', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'challengeId is required',
      });
    }

    const result = gameEngine.getHint(gameId, challengeId);

    console.log('\n' + renderer.renderActionResult(result.success, result.message) + '\n');

    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Get inventory
 */
app.get('/games/:gameId/inventory', (req: Request, res: Response) => {
  try {
    const { gameId } = req.params;
    const gameState = gameEngine.getGame(gameId);

    if (!gameState) {
      return res.status(404).json({
        error: 'game_not_found',
        message: `Game ${gameId} does not exist`,
      });
    }

    res.json({
      inventory: gameState.inventory,
    });
  } catch (error) {
    handleError(res, error);
  }
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 AI Agent Competition Platform`);
  console.log(`📡 Server running on http://localhost:${port}`);
  console.log(`\n Available scenarios:`);
  scenarios.forEach((s) => {
    console.log(`  - ${s.id}: ${s.name} (${s.difficulty})`);
  });
  console.log(`\n Ready to accept game requests!\n`);
});

export default app;
