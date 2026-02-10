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
- **FR10**: Provide real-time web-based visualization with live updates via WebSocket

### Non-Functional Requirements
- **NFR1**: API response time < 100ms for typical operations
- **NFR2**: Support concurrent evaluation of different agents (sequential games)
- **NFR3**: Comprehensive logging of agent actions for analysis
- **NFR4**: Clear error messages and validation for invalid agent actions
- **NFR5**: Extensible architecture for adding new challenge types

## 3. System Architecture

### Project Structure (Monorepo)

```
/afc/
├── agents/              # Separate agents package
│   ├── package.json     # @afc/agents
│   ├── tsconfig.json
│   └── src/
│       ├── memoryless.ts        # Stateless agent
│       ├── simple-agent.ts      # Agent with memory
│       ├── run-memoryless.ts    # Runner script
│       └── run-simple-agent.ts  # Runner script
│
├── core/                # Core platform package
│   ├── package.json     # @afc/core
│   ├── tsconfig.json
│   ├── openapi.yml      # OpenAPI 3.0 specification
│   └── src/
│       ├── cli/         # Interactive CLI client
│       ├── engine/      # Game engine core
│       ├── scenarios/   # Scenario definitions
│       ├── server/      # REST + WebSocket server
│       ├── types/       # TypeScript type definitions
│       └── visualization/  # ASCII & web rendering
│
└── package.json         # Root workspace config
```

### High-Level Architecture

```
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│   Agent Clients      │   │  Interactive CLI     │   │  Web Visualization   │
│  (Any Language via   │   │  (Human Player)      │   │   (Browser)          │
│   REST API)          │   │  + HTTP CLI Sessions │   │                      │
└──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
           │                          │                          │
           │        HTTP/REST         │         WebSocket        │
           └──────────────┬───────────┴──────────────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────────────┐
        │         REST API + WebSocket Layer                     │
        │  - Authentication                                      │
        │  - Request Validation                                  │
        │  - Response Formatting                                 │
        │  - Real-time State Broadcasting (Socket.IO)            │
        │  - OpenAPI Documentation (Swagger UI)                  │
        │  - CLI Session Management                              │
        └─────────────────┬─────────────────────────────────────┘
                          │
        ┌─────────────────▼─────────────────────────────────────┐
        │          Game Engine Core                              │
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

Provides both console-based ASCII art and web-based real-time visualization of game state.

**Responsibilities:**
- Generate 2D map layout from room definitions
- Display agent's current position on the map
- Show room connections and locked/unlocked doors
- Indicate discovered vs undiscovered rooms
- Display inventory and challenge status
- Update visualization after each agent action
- Broadcast state changes to connected web clients via WebSocket

**ASCII Visualization Features:**
- ASCII art map with box-drawing characters
- Agent represented by `@` symbol
- Rooms: explored (light), current (highlighted), unexplored (dark/hidden)
- Doors: open `─`, locked `▓`, one-way `→`
- Objects and challenges indicated with symbols
- Color coding (if terminal supports): current room (cyan), exit (green), locked (red)

**Web Visualization Features (NEW):**
- **Real-time Updates**: WebSocket-based live synchronization with game state
- **Interactive Map**: Visual grid layout with rooms as styled boxes
- **Room States**: Current (cyan/glowing), Exit (green), Locked (red), Visited, Unknown (dashed)
- **Connections**: Visual lines showing paths between rooms
- **Live Stats Dashboard**: Turn count, score, challenges completed, rooms explored, elapsed time
- **Current Room Panel**: Description, exits, objects, active challenges
- **Inventory Display**: Visual list of collected items
- **Challenge Tracking**: Completed vs incomplete challenges with status indicators
- **Responsive Design**: Works on desktop and mobile browsers
- **Connection Status**: Visual indicator showing WebSocket connection state
- **Auto-open**: CLI can automatically launch browser with `--visualize` flag

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
- Built with Readline for interactive input
- Connects to REST API (same as agent SDKs)
- Optional web visualization via `--visualize` flag
- Cross-platform browser opening support
- Separate npm scripts: `npm run play` and `npm run play:visual`

**Usage:**
```bash
# Start the server
npm run dev

# In another terminal, start the interactive CLI
npm run play

# Or start with web visualization (auto-opens browser)
npm run play:visual

# Or use the flag directly
npm run play -- --visualize

# Future options (not yet implemented):
# npm run play -- --scenario scenario_1
# npm run play -- --server http://remote-host:3000
```

**Web Visualization:**
When using `--visualize` flag:
1. CLI starts normally
2. Browser automatically opens to visualization page
3. Start a game with `start <scenario_id>`
4. Web page shows live updates as you play
5. Manual URL: `http://localhost:3000/visualize/{gameId}`

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

### 6.0 API Documentation

The platform provides comprehensive OpenAPI 3.0 documentation:

**Interactive Documentation (Swagger UI):**
- URL: `http://localhost:3000/api-docs`
- Features:
  - Interactive API explorer
  - Try-it-out functionality
  - Request/response examples
  - Schema validation
  - Organized by tags (health, scenarios, games, actions, cli)

**Raw OpenAPI Spec:**
- YAML: `http://localhost:3000/api-docs/openapi.yml`
- File: `core/openapi.yml`

**Coverage:**
- All REST endpoints documented
- Request/response schemas with examples
- Error responses
- Reusable components
- CLI session endpoints

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

### 6.4 Web Visualization

#### Serve Visualization Page
```http
GET /visualize/{game_id}

Response 200:
Returns HTML page with embedded visualization client
```

The visualization page automatically:
- Connects to the WebSocket server
- Subscribes to game updates for the specified game ID
- Renders the game state in real-time

### 6.5 CLI Session API (NEW)

HTTP-based stateful CLI interface for programmatic text-based interaction.

#### Create CLI Session
```http
POST /cli/sessions

Response 201:
{
  "sessionId": "uuid",
  "output": "CLI session created. Type \"help\" for available commands."
}
```

#### Execute CLI Command
```http
POST /cli/sessions/{sessionId}/execute
Content-Type: application/json

{
  "command": "move north"
}

Response 200:
{
  "output": "✓ You moved north\n\nReading Room\nA cozy room filled with old books..."
}
```

**Supported Commands:**
- `help` - Show available commands
- `start <scenario>` - Start a new game
- `scenarios` - List available scenarios
- `move <dir>`, `n/s/e/w` - Move in direction
- `look`, `l` - Look around
- `examine <target>`, `x` - Examine object
- `take <object>` - Pick up object
- `use <object>` - Use object
- `inventory`, `i` - Check inventory
- `solve <challenge_id> <solution>` - Submit solution
- `hint <challenge_id>` - Get hint
- `status` - Show game status
- `quit` - End session

**Session Features:**
- Session state persisted on server
- Remembers active game across commands
- Auto-cleanup after 30 minutes of inactivity
- Simple text-only output format

#### Delete CLI Session
```http
DELETE /cli/sessions/{sessionId}

Response 200:
{
  "output": "Session deleted"
}
```

## 6.6 WebSocket API

The platform uses Socket.IO for real-time communication with web visualization clients.

**Connection:**
```javascript
// Client connects to server
const socket = io('http://localhost:3000');

// Subscribe to game updates
socket.emit('subscribe', gameId);

// Listen for game state updates
socket.on('gameStateUpdate', (data) => {
  // data contains: { gameState, scenario, currentRoom, allRooms }
});
```

**Events:**

| Event | Direction | Description | Payload |
|-------|-----------|-------------|---------|
| `connect` | Server → Client | Socket connection established | - |
| `disconnect` | Server → Client | Socket connection closed | - |
| `subscribe` | Client → Server | Subscribe to game updates | `gameId: string` |
| `gameStateUpdate` | Server → Client | Game state changed | `{ gameState, scenario, currentRoom, allRooms }` |

**Game State Update Payload:**
```typescript
{
  gameState: GameState,      // Complete game state
  scenario: Scenario,        // Scenario definition
  currentRoom: Room,         // Current room details
  allRooms: Room[]          // All rooms in scenario
}
```

**When Updates Are Sent:**
- When a game is created
- After each move action
- After each interact action (take/use)
- After each solve action
- After any action that changes game state

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
- **Database**: JSON files for scenarios, SQLite for game state/logs (future)
- **Development**: tsx for hot-reload during development
- **Visualization**: chalk (colors), boxen (borders), custom ASCII renderer
- **WebSocket**: Socket.IO v4.8+ for real-time web visualization updates
- **API Documentation**: OpenAPI 3.0 with Swagger UI (swagger-ui-express, js-yaml)
- **Project Structure**: npm workspaces (monorepo with @afc/core and @afc/agents packages)

### Agent SDK
- **Primary SDK**: TypeScript/JavaScript client library
- Example agents provided as templates
- Simple HTTP client - agents can be written in any language

### Interactive CLI Client
- **CLI Framework**: Readline for REPL interface (Commander.js available for future use)
- **Input**: Readline for interactive prompt
- **Output**: Uses ASCII visualization system from server
- **Features**: Command history, help system, shorthand commands
- **Visualization Mode**: `--visualize` flag to auto-open web browser

### Web Visualization Client (NEW)
- **Architecture**: Single-page HTML with embedded CSS/JS
- **WebSocket Client**: Socket.IO client (loaded via CDN)
- **Rendering**: Vanilla JavaScript with DOM manipulation
- **Styling**: Modern CSS with gradients, flexbox, grid, animations
- **Real-time**: Listens to `gameStateUpdate` events and re-renders UI
- **Responsive**: Works on desktop and mobile browsers
- **No Build Required**: Pure HTML/CSS/JS, no bundler or framework

### Testing & Development
- **API Testing**: Jest with supertest
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Documentation**: Auto-generated from TypeScript types + OpenAPI spec

## 11. Implementation Phases

### Phase 1: Core Foundation ✅ COMPLETED
- [x] Basic REST API server
- [x] Simple map system (3-5 rooms with position coordinates)
- [x] State management
- [x] Move and examine actions
- [x] Single scenario (library_escape)
- [x] ASCII map visualization renderer
- [x] Console output after each action
- [x] Interactive CLI client for human play

### Phase 2: Challenge System ✅ COMPLETED
- [x] Challenge framework
- [x] 2-3 challenge types implemented (logic, riddle)
- [x] Solution validation
- [x] Hint system

### Phase 3: Evaluation & Persistence ✅ PARTIALLY COMPLETED
- [x] Turn/time tracking
- [x] Scoring system
- [ ] Game state persistence (in-memory only, no DB yet)
- [ ] Action logging

### Phase 3.5: Real-time Web Visualization ✅ COMPLETED
- [x] WebSocket integration (Socket.IO)
- [x] Real-time game state broadcasting
- [x] Web-based visualization UI
- [x] Interactive map with live updates
- [x] CLI `--visualize` flag for auto-opening browser
- [x] Connection status indicators
- [x] Responsive design for desktop and mobile

### Phase 3.6: API Documentation & CLI Sessions ✅ COMPLETED (NEW)
- [x] OpenAPI 3.0 specification (YAML)
- [x] Swagger UI interactive documentation
- [x] HTTP-based CLI session endpoints
- [x] Stateful session management
- [x] Text-based command execution via API
- [x] Project refactored into monorepo structure (agents + core packages)

### Phase 4: Agent Experience ⏳ IN PROGRESS
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

### Resolved
- ✅ **Visualization Mode**: Implemented as optional - console ASCII always on, web visualization via `--visualize` flag
- ✅ **Map Layout**: Manual positioning required in scenario files (provides precise control)
- ✅ **State Storage**: Currently in-memory, can add persistence later

### Open
1. **API Authentication**: Simple API keys or JWT tokens?
2. **State Storage Enhancement**: Add SQLite/database persistence for game history?
3. **Scenario Format**: Keep as TypeScript files or migrate to JSON?
4. **Action Validation**: Strict (reject invalid) or lenient (warn but allow)?
5. **Partial Observability**: Should agents see the full room state or discover gradually?
6. **LLM Integration**: Should the platform support LLM-based agents with specific prompting?

---

**Document Version**: 1.4
**Last Updated**: 2026-01-31
**Implementation Language**: TypeScript (Node.js + Express + Socket.IO)
**Status**: Active Development - Core features complete, web visualization implemented
