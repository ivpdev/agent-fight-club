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
export interface Room {
  id: string;
  name: string;
  description: string;
  exits: Partial<Record<Direction, string>>; // direction -> room_id
  objects: GameObject[];
  challenges: string[]; // challenge IDs
  isExit: boolean;
  locked?: boolean;
  unlockRequires?: string; // item or challenge ID
  position: { x: number; y: number }; // for map visualization
}

// Challenge definition
export interface Challenge {
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

// Scenario (escape room map)
export interface Scenario {
  id: string;
  name: string;
  difficulty: Difficulty;
  description: string;
  startingRoom: string;
  exitRoom: string;
  rooms: Room[];
  challenges: Challenge[];
  optimalTurns: number;
  timeLimitMs?: number;
}

// Game state
export interface GameState {
  gameId: string;
  scenarioId: string;
  agentId: string;
  status: GameStatus;
  currentRoom: string;
  inventory: string[]; // object IDs
  challengesCompleted: string[];
  turnCount: number;
  startTime: number; // timestamp
  endTime: number | null;
  score: number;
  hintsUsed: number;
  roomsVisited: string[];
}

// Action log entry
export interface ActionLog {
  gameId: string;
  turnNumber: number;
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
  currentRoom: {
    id: string;
    name: string;
    description: string;
    visibleObjects: string[];
    exits: Direction[];
  };
  inventory: string[];
  turnCount: number;
  elapsedTimeMs: number;
  score: number;
}

export interface MoveRequest {
  direction: Direction;
}

export interface ExamineRequest {
  target: string;
}

export interface InteractRequest {
  objectId: string;
  action: 'take' | 'use';
  useWith?: string;
}

export interface SolveRequest {
  challengeId: string;
  solution: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  turnCount?: number;
}
