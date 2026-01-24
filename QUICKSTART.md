# Quick Start Guide

## Installation

```bash
npm install
```

## Running the Platform

### 1. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` and display:
- Available scenarios
- ASCII visualization of each game action in the console

### 2. Play the Game (Interactive CLI)

In a separate terminal:

```bash
npm run play
```

## Playing the Game

Once in the CLI, you can use these commands:

### Getting Started
```
start library_escape      # Start the library escape scenario
help                      # Show all available commands
scenarios                 # List available scenarios
```

### Movement
```
move north               # Move in a direction
n, s, e, w              # Shorthand for directions
```

### Exploration
```
look                    # Look around current room
examine <object>        # Examine a specific object
inventory               # Check your inventory
```

### Interaction
```
take <object>           # Pick up an object
use <object>            # Use an object
```

### Challenges
```
solve <challenge> <answer>    # Submit solution
hint <challenge>              # Get a hint (-50 points)
```

### Game Info
```
status                  # Show current game status
quit                    # Exit the game
```

## Example Playthrough

```
> start library_escape
✓ Game started!

Entrance
A dusty entrance hall with faded wallpaper...

Exits: north, east
Objects: flashlight

> take flashlight
✓ You picked up the flashlight.

> move north
✓ You enter the Reading Room.

> look
Reading Room
A cozy room filled with old books...

Exits: south, east, north
Objects: cipher book, desk

> take cipher book
✓ You picked up the cipher book.

> move east
✓ You enter the Main Hall.

Main Hall
...A mysterious message is carved into the door: "URYYB JBEYQ"

> solve cipher_puzzle HELLO WORLD
✓ The door clicks open, revealing a secret study!

> move east
✓ You enter the Secret Study.

> take golden_key
✓ You picked up the golden key.

> move south
✓ You enter the Exit Door.

🎉 Congratulations! You escaped!
```

## API Access for AI Agents

The platform exposes a REST API that AI agents can use:

```bash
# List scenarios
curl http://localhost:3000/scenarios

# Create a game
curl -X POST http://localhost:3000/games \
  -H "Content-Type: application/json" \
  -d '{"agentId": "my-agent", "scenarioId": "library_escape"}'

# Move
curl -X POST http://localhost:3000/games/{gameId}/move \
  -H "Content-Type: application/json" \
  -d '{"direction": "north"}'
```

See [SPEC.md](./SPEC.md) for complete API documentation.

## Visualization

The server console displays ASCII art visualization after each action:
- Map layout with room positions
- Current room highlighted in cyan
- Exit room shown in green
- Visited vs unvisited rooms
- Inventory and challenge status
- Turn count and score

## Creating Custom Scenarios

1. Create a new file in `src/scenarios/` (e.g., `my-scenario.ts`)
2. Define rooms with positions for map visualization
3. Add challenges and objects
4. Export the scenario
5. Import and add to the scenarios array in `src/scenarios/index.ts`

See `src/scenarios/library.ts` for a complete example.

## Development

```bash
npm run build        # Compile TypeScript
npm run dev          # Run server with hot reload
npm run play         # Start interactive CLI
```

## Next Steps

- Create your own scenarios
- Build AI agents using the REST API
- Compete for the best scores
- Add new challenge types

For detailed architecture and specifications, see [SPEC.md](./SPEC.md).
