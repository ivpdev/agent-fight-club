// Core types for the AI Agent Competition Platform

export type Direction = 'north' | 'south' | 'east' | 'west';
export type GameStatus = 'in_progress' | 'completed' | 'failed';
export type ChallengeType = 'logic' | 'code' | 'riddle' | 'sequence';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Object in a room
export interface GameObject {
  id: string;
  name: string;
  description: string;
  takeable: boolean;
  useable?: boolean;
  usesWith?: string; // ID of object this can be used with
}

// Room definition
export interface RoomDefinition {
  id: string;
  name: string;
  description: string;
  exits: Direction[];
  objects: GameObject[];
  challenges: string[]; // challenge IDs
  isExit: boolean;
  locked?: boolean;
  unlockRequires?: string; // item or challenge ID
  position: { x: number; y: number }; // for map visualization
}

// Aliases for backwards compatibility
export type Room = RoomDefinition;

// Challenge definition
export interface ChallengeDefinition {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  solution: string;
  hints: string[];
  requiredItems?: string[];
  reward?: string; // item ID or effect description
  unlocks?: string; // room or object ID
}

// Aliases for backwards compatibility
export type Challenge = ChallengeDefinition;

// --- Scenario Handler interface ---

export interface WinConditionResult {
  won: boolean;
  message?: string;
}

export interface ScenarioHandler {
  getInitialMessage(): string;
  getHelp(): string;
  executeCommand(command: string, args: string[]): Promise<ActionResult>;
  checkWinCondition(): WinConditionResult;
  getState(): Record<string, unknown>;
  getScoreAdjustment(): number;
}

// --- Scenario types ---

export interface ScenarioBase {
  id: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  optimalTurns: number;
  timeLimitMs?: number;
  createHandler(): ScenarioHandler;
}

export interface EscapeRoomScenarioData {
  startingRoom: string;
  exitRoom: string;
  rooms: RoomDefinition[];
  challenges: ChallengeDefinition[];
}

export type EscapeRoomScenario = ScenarioBase & EscapeRoomScenarioData;

// Generic alias used by the engine
export type Scenario = ScenarioBase;

// --- Game state (generic - scenario-specific state lives in handler) ---

export interface GameState {
  gameId: string;
  scenarioId: string;
  agentId: string;
  status: GameStatus;
  turnCount: number;
  startTime: number; // timestamp
  endTime: number | null;
  score: number;
}

// Command request for generic command endpoint
export interface CommandRequest {
  command: string;
  args?: string[];
}

// Action log entry
export interface ActionLog {
  gameId: string;
  turnNumber: number; //TODO remove (number is based on position in array)
  timestamp: number;
  action: string;
  parameters: Record<string, unknown>;
  success: boolean;
  result: string;
}

// Action result
export interface ActionResult {
  success: boolean;
  message: string;
  turnCount: number;
  gameStatus?: GameStatus;
  data?: unknown;
}

// API request/response types
export interface CreateGameRequest {
  agentId: string;
  scenarioId: string;
}

export interface CreateGameResponse {
  gameId: string;
  initialState: GameStateResponse;
}

export interface GameStateResponse {
  gameId: string;
  status: GameStatus;
  turnCount: number;
  elapsedTimeMs: number;
  score: number;
  scenarioState: Record<string, unknown>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  turnCount?: number;
}
