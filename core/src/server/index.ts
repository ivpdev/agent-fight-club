import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'js-yaml';
import { GameEngine } from '../engine/GameEngine';
import { MapRenderer } from '../visualization/MapRenderer';
import { CLISessionManager } from './CLISessionManager';
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

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize game engine and load scenarios
const gameEngine = new GameEngine();
scenarios.forEach((scenario) => gameEngine.loadScenario(scenario));

const renderer = new MapRenderer();
const cliSessionManager = new CLISessionManager(gameEngine);

// Load OpenAPI specification
const openapiPath = path.join(__dirname, '../../openapi.yml');
const openapiDocument = YAML.load(fs.readFileSync(openapiPath, 'utf8')) as swaggerUi.JsonObject;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);

  socket.on('subscribe', (gameId: string) => {
    socket.join(`game:${gameId}`);
    console.log(`Client ${socket.id} subscribed to game ${gameId}`);

    // Send current game state immediately upon subscription
    const gameState = gameEngine.getGame(gameId);
    const scenario = gameEngine.getScenario(gameState?.scenarioId || '');
    const currentRoom = gameEngine.getCurrentRoom(gameId);
    const allRooms = gameEngine.getAllRooms(gameId);

    if (gameState && scenario && currentRoom) {
      socket.emit('gameStateUpdate', {
        gameState,
        scenario,
        currentRoom,
        allRooms,
      });
      console.log(`Sent initial game state to client ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Helper function to emit game state updates
const emitGameStateUpdate = (gameId: string) => {
  const gameState = gameEngine.getGame(gameId);
  const scenario = gameEngine.getScenario(gameState?.scenarioId || '');
  const currentRoom = gameEngine.getCurrentRoom(gameId);
  const allRooms = gameEngine.getAllRooms(gameId);

  if (gameState && scenario && currentRoom) {
    io.to(`game:${gameId}`).emit('gameStateUpdate', {
      gameState,
      scenario,
      currentRoom,
      allRooms,
    });
  }
};

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Serve static files for Socket.IO client
app.use(express.static(path.join(__dirname, '../visualization/public')));

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
 * Welcome page
 */
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Agents Game Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          background: white;
          padding: 3rem;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 500px;
        }
        h1 {
          margin: 0 0 2rem 0;
          color: #333;
          font-size: 2.5rem;
        }
        a {
          display: inline-block;
          padding: 1rem 2rem;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 0.5rem;
          font-weight: 600;
          transition: background 0.3s ease;
        }
        a:hover {
          background: #764ba2;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Agents Game Server</h1>
        <a href="/api-docs">API Documentation</a>
      </div>
    </body>
    </html>
  `);
});

/**
 * Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Serve interactive API documentation with Swagger UI
 */
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(openapiDocument, {
  customSiteTitle: 'AI Agent Competition API',
  customCss: '.swagger-ui .topbar { display: none }',
}));

/**
 * Serve raw OpenAPI YAML specification
 */
app.get('/api-docs/openapi.yml', (_req: Request, res: Response) => {
  res.sendFile(openapiPath);
});

/**
 * Serve visualization page
 */
app.get('/visualize/:gameId', (_req: Request, res: Response) => {
  const visualizationPath = path.join(__dirname, '../visualization/public/index.html');
  res.sendFile(visualizationPath);
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

    // Emit initial game state to WebSocket clients
    emitGameStateUpdate(gameState.gameId);

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
          exits: currentRoom.exits,
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
        exits: currentRoom.exits,
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

    // Emit game state update to WebSocket clients
    emitGameStateUpdate(gameId);

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

    // Emit game state update to WebSocket clients
    emitGameStateUpdate(gameId);

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

    // Emit game state update to WebSocket clients
    emitGameStateUpdate(gameId);

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

/**
 * Create CLI session
 */
app.post('/cli/sessions', (_req: Request, res: Response) => {
  try {
    const sessionId = cliSessionManager.createSession();
    res.status(201).json({
      sessionId,
      output: 'CLI session created. Type "help" for available commands.',
    });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Execute CLI command
 */
app.post('/cli/sessions/:sessionId/execute', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({
        error: 'bad_request',
        message: 'command is required',
      });
    }

    const output = await cliSessionManager.executeCommand(sessionId, command);
    res.json({ output });
  } catch (error) {
    handleError(res, error);
  }
});

/**
 * Delete CLI session
 */
app.delete('/cli/sessions/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const deleted = cliSessionManager.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        error: 'session_not_found',
        message: 'Session not found or already expired',
      });
    }

    res.json({ output: 'Session deleted' });
  } catch (error) {
    handleError(res, error);
  }
});

// Start server
httpServer.listen(port, () => {
  console.log(`\n🚀 AI Agent Competition Platform`);
  console.log(`📡 Server running on http://localhost:${port}`);
  console.log(`🔌 WebSocket server ready on ws://localhost:${port}`);
  console.log(`\n Available scenarios:`);
  scenarios.forEach((s) => {
    console.log(`  - ${s.id}: ${s.name} (${s.difficulty})`);
  });
  console.log(`\n Ready to accept game requests!\n`);
});

export default app;
