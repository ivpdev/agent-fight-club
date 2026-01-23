# AI Agent Competition Platform - Specification & Architecture

## 1. Overview

An AI agent competition platform designed to evaluate agent performance in escape room scenarios. Agents interact with the environment through a REST API, navigating a map, solving challenges, and attempting to escape in the minimum number of turns and time.

Built with TypeScript, Node.js, and Express for type safety and rapid development.

### Key Characteristics
- **Competition Type**: Single-agent escape room challenges
- **Interaction Model**: Turn-based via REST API
- **Deployment**: Single machine with extensible agent support
- **Security Model**: Basic isolation for trusted participants
- **Implementation**: TypeScript with strict type checking

## 2. Goals and Requirements

### Functional Requirements
- **FR1**: Support map-based navigation with various room types and obstacles
- **FR2**: Present challenges/puzzles that agents must solve to progress
- **FR3**: Track agent performance metrics (turns taken, time elapsed, success rate)
- **FR4**: Provide RESTful API for agent-environment interaction
- **FR5**: Support multiple escape room scenarios with varying difficulty
- **FR6**: Enable easy integration of custom agents in any programming language
- **FR7**: Persist game state and allow game resume/replay
- **FR8**: Render ASCII visualization of map and agent position after each action
- **FR9**: Provide interactive CLI client for human players to play the escape room

### Non-Functional Requirements
- **NFR1**: API response time < 100ms for typical operations
- **NFR2**: Support concurrent evaluation of different agents (sequential games)
- **NFR3**: Comprehensive logging of agent actions for analysis
- **NFR4**: Clear error messages and validation for invalid agent actions
- **NFR5**: Extensible architecture for adding new challenge types

## 3. System Architecture

### High-Level Architecture

```
┌──────────────────────┐          ┌──────────────────────┐
│   Agent Clients      │          │  Interactive CLI     │
│  (Any Language via   │          │  (Human Player)      │
│   REST API)          │          │                      │
└──────────┬───────────┘          └──────────┬───────────┘
           │                                  │
           │          HTTP/REST               │
           └──────────────┬───────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────┐
        │            REST API Layer                      │
        │  - Authentication                              │
        │  - Request Validation                          │
        │  - Response Formatting                         │
        └─────────────────┬─────────────────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────┐
        │          Game Engine Core                      │
        │  ┌───────────────────────────────────┐        │
        │  │  State Manager                     │        │
        │  │  - Game state                      │        │
        │  │  - Agent position                  │        │
        │  │  - Challenge status                │        │
        │  └───────────────────────────────────┘        │
        │                                                │
        │  ┌───────────────────────────────────┐        │
        │  │  Map System                        │        │
        │  │  - Room definitions                │        │
        │  │  - Connections/transitions         │        │
        │  │  - Obstacles & items               │        │
        │  └───────────────────────────────────┘        │
        │                                                │
        │  ┌───────────────────────────────────┐        │
        │  │  Challenge System                  │        │
        │  │  - Challenge types                 │        │
        │  │  - Validation logic                │        │
        │  │  - Hint mechanism                  │        │
        │  └───────────────────────────────────┘        │
        │                                                │
        │  ┌───────────────────────────────────┐        │
        │  │  Evaluation System                 │        │
        │  │  - Turn counter                    │        │
        │  │  - Time tracking                   │        │
        │  │  - Score calculation               │        │
        │  └───────────────────────────────────┘        │
        │                                                │
        │  ┌───────────────────────────────────┐        │
        │  │  Visualization System              │        │
        │  │  - ASCII map renderer              │        │
        │  │  - Console output                  │        │
        │  │  - Game state display              │        │
        │  └───────────────────────────────────┘        │
        └─────────────────┬─────────────────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────┐
        │          Persistence Layer                     │
        │  - Game state storage                          │
        │  - Action logs                                 │
        │  - Leaderboard data                            │
        └───────────────────────────────────────────────┘
```

## 4. Core Components

### 4.1 Game Engine

The central component that manages game logic and state.

**Responsibilities:**
- Initialize escape room scenarios
- Validate and execute agent actions
- Update game state
- Check win/lose conditions
- Manage challenge lifecycle

### 4.2 REST API Server

HTTP server exposing endpoints for agent interaction.

**Responsibilities:**
- Session management (create, resume, end games)
- Action processing (move, examine, interact, solve)
- State queries (get current state, available actions)
- Result reporting

### 4.3 Map System

Manages the spatial layout of the escape room.

**Components:**
- **Rooms**: Discrete locations with descriptions and properties
- **Connections**: Valid transitions between rooms (doors, passages)
- **Objects**: Interactive items (keys, tools, clues)
- **Obstacles**: Blockages requiring specific actions to overcome

### 4.4 Challenge System

Manages puzzles and obstacles agents must solve.

**Challenge Types:**
- **Logic Puzzles**: Pattern recognition, deduction problems
- **Code Challenges**: Simple programming tasks
- **Riddles**: Natural language understanding
- **Resource Management**: Inventory-based puzzles
- **Sequence Puzzles**: Multi-step solution requirements

### 4.5 Evaluation System

Tracks and scores agent performance.

**Metrics:**
- **Primary**: Turn count to escape
- **Secondary**: Wall-clock time, hint usage, optimal path deviation
- **Bonus**: Challenge completion rate, exploration thoroughness

### 4.6 Visualization System

Renders ASCII art representation of game state to console.

**Responsibilities:**
- Generate 2D map layout from room definitions
- Display agent's current position on the map
- Show room connections and locked/unlocked doors
- Indicate discovered vs undiscovered rooms
- Display inventory and challenge status
- Update visualization after each agent action

**Visualization Features:**
- ASCII art map with box-drawing characters
- Agent represented by `@` symbol
- Rooms: explored (light), current (highlighted), unexplored (dark/hidden)
- Doors: open `─`, locked `▓`, one-way `→`
- Objects and challenges indicated with symbols
- Color coding (if terminal supports): current room (cyan), exit (green), locked (red)

### 4.7 Interactive CLI Client

Interactive command-line interface for human players to experience the game.

**Purpose:**
- Allow developers/testers to play the game manually
- Test game mechanics and scenarios
- Understand the agent experience firsthand
- Debug and validate game logic

**Features:**
- REPL-style command interface
- Natural language commands (e.g., "move north", "examine key", "take flashlight")
- Auto-complete for available actions and objects
- Help system showing available commands
- Game state visualization after each action
- Command history (arrow keys to navigate)
- Save/load game sessions
- Shorthand commands (e.g., "n" for north, "i" for inventory)

**Command Examples:**
```
> start scenario_1
Game started! You are in the Entry Hall.

> look
A dimly lit hallway with ancient paintings.
Exits: north, east
Objects: key, painting

> take key
✓ You picked up the rusty key.

> move north
✓ You enter the Library.

> inventory
You are carrying: flashlight, key

> examine painting
An old portrait with a hidden panel behind it.

> solve puzzle_1 answer
✗ Incorrect solution. Try again.

> hint
💡 Hint: Caesar cipher family (-50 points)

> quit
Game saved. Goodbye!
```

**Implementation:**
- Built with Commander.js or similar CLI framework
- Readline for interactive input
- Connects to REST API (same as agent SDKs)
- Separate npm script: `npm run play`

**Usage:**
```bash
# Start the server
npm run dev

# In another terminal, start the interactive CLI
npm run play

# Or specify a scenario
npm run play -- --scenario scenario_1

# Or connect to remote server
npm run play -- --server http://remote-host:3000
```

## 5. Game Mechanics

### 5.1 Agent Actions

| Action | Description | API Endpoint |
|--------|-------------|--------------|
| **Move** | Navigate to connected room | `POST /game/{id}/move` |
| **Examine** | Inspect room/object details | `GET /game/{id}/examine` |
| **Interact** | Use/pickup/manipulate object | `POST /game/{id}/interact` |
| **Solve** | Submit solution to challenge | `POST /game/{id}/solve` |
| **Inventory** | Check carried items | `GET /game/{id}/inventory` |
| **Think** | Request hint (penalty) | `POST /game/{id}/hint` |

### 5.2 Game State

Each game maintains:
```json
{
  "game_id": "uuid",
  "status": "in_progress | completed | failed",
  "current_room": "room_id",
  "agent_inventory": ["item_id", ...],
  "challenges_completed": ["challenge_id", ...],
  "turn_count": 0,
  "start_time": "timestamp",
  "end_time": "timestamp | null",
  "score": 0
}
```

### 5.3 Win Conditions

Game completes successfully when:
1. Agent reaches the designated exit room
2. All required challenges are solved
3. Any special scenario-specific conditions are met

## 6. API Specification

### 6.1 Game Management

#### Create New Game
```http
POST /games
Content-Type: application/json

{
  "agent_id": "string",
  "scenario_id": "string"
}

Response 201:
{
  "game_id": "uuid",
  "initial_state": { ... }
}
```

#### Get Game State
```http
GET /games/{game_id}

Response 200:
{
  "game_id": "uuid",
  "status": "in_progress",
  "current_room": {
    "id": "room_1",
    "name": "Entry Hall",
    "description": "A dimly lit hallway...",
    "visible_objects": ["key", "painting"],
    "exits": ["north", "east"]
  },
  "inventory": ["flashlight"],
  "turn_count": 5,
  "elapsed_time_ms": 15000
}
```

### 6.2 Agent Actions

#### Move
```http
POST /games/{game_id}/move
Content-Type: application/json

{
  "direction": "north"
}

Response 200:
{
  "success": true,
  "new_room": { ... },
  "message": "You enter the library.",
  "turn_count": 6
}
```

#### Examine
```http
POST /games/{game_id}/examine
Content-Type: application/json

{
  "target": "painting"
}

Response 200:
{
  "success": true,
  "description": "An old portrait with a hidden panel behind it.",
  "hints": ["The frame looks loose"],
  "turn_count": 7
}
```

#### Solve Challenge
```http
POST /games/{game_id}/solve
Content-Type: application/json

{
  "challenge_id": "puzzle_1",
  "solution": "42"
}

Response 200:
{
  "success": true,
  "correct": true,
  "reward": "You hear a click as the door unlocks.",
  "turn_count": 8
}
```

### 6.3 Error Responses

```http
Response 400: Invalid Action
{
  "error": "invalid_move",
  "message": "No exit to the north from this room",
  "turn_count": 5
}

Response 404: Game Not Found
{
  "error": "game_not_found",
  "message": "Game {game_id} does not exist"
}

Response 409: Invalid State
{
  "error": "game_already_completed",
  "message": "This game has already ended"
}
```

## 7. Data Models

### 7.1 TypeScript Type Definitions

```typescript
// Core types
type Direction = 'north' | 'south' | 'east' | 'west';
type GameStatus = 'in_progress' | 'completed' | 'failed';
type ChallengeType = 'logic' | 'code' | 'riddle' | 'sequence';
type Difficulty = 'easy' | 'medium' | 'hard';

// Object in a room
interface GameObject {
  id: string;
  name: string;
  description: string;
  takeable: boolean;
  useable?: boolean;
  usesWith?: string; // ID of object this can be used with
}

// Room definition
interface Room {
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
interface Challenge {
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
interface Scenario {
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
interface GameState {
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
  roomsVisited: Set<string>;
}

// Action log entry
interface ActionLog {
  gameId: string;
  turnNumber: number;
  timestamp: number;
  action: string;
  parameters: Record<string, any>;
  success: boolean;
  result: string;
}
```

### 7.2 Example Room Data
```json
{
  "id": "room_1",
  "name": "Entry Hall",
  "description": "A dimly lit hallway with ancient paintings.",
  "exits": {
    "north": "room_2",
    "east": "room_3"
  },
  "objects": [
    {
      "id": "key_1",
      "name": "rusty key",
      "description": "An old key covered in rust",
      "takeable": true
    }
  ],
  "challenges": ["puzzle_1"],
  "isExit": false
}
```

### 7.3 Example Challenge Data
```json
{
  "id": "puzzle_1",
  "type": "logic",
  "title": "The Cipher",
  "description": "Decode the message: ROT13...",
  "solution": "expected_answer",
  "hints": [
    "Caesar cipher family",
    "13 positions"
  ],
  "requiredItems": ["cipher_wheel"],
  "unlocks": "room_4"
}
```

### 7.4 Example Scenario Data
```json
{
  "id": "scenario_1",
  "name": "The Abandoned Library",
  "difficulty": "medium",
  "description": "Escape from a mysterious library...",
  "startingRoom": "room_1",
  "exitRoom": "room_10",
  "rooms": [ ... ],
  "challenges": [ ... ],
  "optimalTurns": 15,
  "timeLimitMs": 300000
}
```

## 8. ASCII Visualization

### 8.1 Console Output Format

After each agent action, the platform renders the current game state to console:

```
╔═══════════════════════════════════════════════════════════════╗
║  🎮 The Abandoned Library - Turn 5                            ║
║  Agent: smart-agent-v1        Status: In Progress             ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║    ┌─────────┐                                                ║
║    │ Storage │                                                ║
║    │    ?    │                                                ║
║    └────┬────┘                                                ║
║         │                                                     ║
║    ┌────┴────┐     ┌─────────┐     ┌─────────┐              ║
║    │ Library │─────│ Reading │─────│  Exit   │              ║
║    │    ·    │     │ Room @  │     │    🚪   │              ║
║    └────┬────┘     └─────────┘     └─────────┘              ║
║         │                                                     ║
║    ┌────┴────┐                                                ║
║    │  Entry  │                                                ║
║    │  Hall   │                                                ║
║    └─────────┘                                                ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Current Room: Reading Room                                   ║
║  Description: A cozy room filled with old books and a desk.  ║
║                                                               ║
║  Exits: west, east                                           ║
║  Objects: desk, book_cipher                                  ║
║  Challenges: puzzle_1 (incomplete)                           ║
║                                                               ║
║  Inventory: flashlight, key_1                                ║
║  Challenges Completed: 0/3                                   ║
║  Rooms Explored: 3/5                                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Last Action: move east                                       ║
║  Result: ✓ You enter the Reading Room                        ║
╚═══════════════════════════════════════════════════════════════╝
```

### 8.2 Map Symbols

| Symbol | Meaning |
|--------|---------|
| `@` | Agent's current position |
| `·` | Previously visited room |
| `?` | Unexplored/unknown room |
| `🚪` | Exit room |
| `▓` | Locked door/room |
| `─`, `│`, `┌`, `┐`, `└`, `┘` | Room connections |
| `🔑` | Room contains key item |
| `⚡` | Room contains challenge |
| `✓` | Challenge completed |

### 8.3 Implementation Notes

**Rendering Strategy:**
- Calculate map bounds from room positions
- Use box-drawing characters (Unicode) for clean borders
- Support both color (ANSI codes) and monochrome terminals
- Auto-scale map to fit terminal width
- Show only discovered rooms by default (fog of war mode optional)

**Libraries:**
- `chalk` or `ansi-colors` for terminal colors
- `cli-table3` for structured data display
- `boxen` for bordered boxes
- Custom renderer for map grid

**Configuration Options:**
- Enable/disable visualization via environment variable
- Compact mode for smaller terminals
- Full map reveal mode for debugging
- Export visualization to text file for replay

## 9. Evaluation & Scoring

### 9.1 Scoring Formula

```
Base Score = 1000
Turn Penalty = -5 per turn over optimal
Time Penalty = -1 per 10 seconds over optimal
Hint Penalty = -50 per hint used
Exploration Bonus = +10 per room discovered
Challenge Bonus = +100 per optional challenge solved

Final Score = max(0, Base Score + Penalties + Bonuses)
```

### 9.2 Leaderboard Metrics

Track and rank agents by:
1. **Fastest Escape**: Minimum turns to completion
2. **Highest Score**: Best overall score
3. **Success Rate**: Completion percentage across scenarios
4. **Average Performance**: Normalized score across all scenarios

## 10. Technology Stack

### Backend
- **Language**: TypeScript (Node.js)
- **Framework**: Express - lightweight, flexible, large ecosystem
- **Runtime**: Node.js 20+
- **Type Safety**: Zod for runtime validation
- **Database**: JSON files for scenarios, SQLite for game state/logs
- **Development**: tsx for hot-reload during development
- **Visualization**: chalk (colors), boxen (borders), custom ASCII renderer

### Agent SDK
- **Primary SDK**: TypeScript/JavaScript client library
- Example agents provided as templates
- Simple HTTP client - agents can be written in any language

### Interactive CLI Client
- **CLI Framework**: Commander.js for command parsing
- **Input**: Readline for REPL interface
- **Output**: Uses same visualization system as server
- **Features**: Auto-complete, command history, help system

### Testing & Development
- **API Testing**: Jest with supertest
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Documentation**: Auto-generated from TypeScript types + OpenAPI spec

## 11. Implementation Phases

### Phase 1: Core Foundation
- [ ] Basic REST API server
- [ ] Simple map system (3-5 rooms with position coordinates)
- [ ] State management
- [ ] Move and examine actions
- [ ] Single scenario
- [ ] ASCII map visualization renderer
- [ ] Console output after each action
- [ ] Interactive CLI client for human play

### Phase 2: Challenge System
- [ ] Challenge framework
- [ ] 2-3 challenge types implemented
- [ ] Solution validation
- [ ] Hint system

### Phase 3: Evaluation & Persistence
- [ ] Turn/time tracking
- [ ] Scoring system
- [ ] Game state persistence
- [ ] Action logging

### Phase 4: Agent Experience
- [ ] TypeScript/JavaScript SDK
- [ ] Example agents (random, simple heuristic)
- [ ] Error handling improvements
- [ ] API documentation with TypeScript types

### Phase 5: Competition Features
- [ ] Multiple scenarios
- [ ] Leaderboard
- [ ] Replay system
- [ ] Performance analytics

## 12. Future Extensions

### Multi-Agent Support
- Competitive: Agents race to escape first
- Cooperative: Agents must collaborate to solve puzzles
- Adversarial: One agent tries to escape, another tries to block

### Advanced Features
- **Dynamic Maps**: Procedurally generated rooms
- **Partial Observability**: Fog of war, limited vision
- **Resource Constraints**: Energy/action limits
- **Real-time Events**: Time-based challenges, environmental changes
- **Agent Communication**: Message passing between agents (multi-agent)

### Platform Features
- **Web UI**: Visualize agent actions in real-time
- **Tournament Mode**: Automated bracket-style competitions
- **Scenario Editor**: Visual tool for creating escape rooms
- **Analytics Dashboard**: Performance insights and heatmaps

## 13. Security Considerations

### Current (Basic Trust Model)
- API key authentication
- Rate limiting per agent
- Input validation and sanitization
- Action validation (prevent impossible moves)
- Resource limits (turn/time caps)

### Future (Untrusted Code)
- Sandbox agent execution (Docker containers)
- Network isolation
- CPU/memory limits
- Timeout enforcement

## 14. Open Questions & Decisions

1. **API Authentication**: Simple API keys or JWT tokens?
2. **State Storage**: In-memory (with snapshots) or persistent from start?
3. **Scenario Format**: JSON files or database records?
4. **Action Validation**: Strict (reject invalid) or lenient (warn but allow)?
5. **Partial Observability**: Should agents see the full room state or discover gradually?
6. **LLM Integration**: Should the platform support LLM-based agents with specific prompting?
7. **Visualization Mode**: Always-on console output, or configurable/optional for headless runs?
8. **Map Layout**: Auto-calculate room positions or require manual positioning in scenario files?

---

**Document Version**: 1.3
**Last Updated**: 2026-01-23
**Implementation Language**: TypeScript (Node.js + Express)
**Status**: Initial Draft - Updated for TypeScript + ASCII Visualization + CLI Client
