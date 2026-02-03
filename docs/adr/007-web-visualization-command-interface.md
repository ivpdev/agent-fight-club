# ADR 004: Web Visualization Command Interface

## Status
Accepted

## Context
The web visualization provided real-time game state viewing but was read-only. Users had to use either:
1. The CLI client to play interactively
2. Direct REST API calls via curl/Postman
3. Custom agent code

This created friction for casual exploration and debugging - you couldn't simply open the browser visualization and play the game.

## Decision
Added an interactive command interface directly to the web visualization page:
- Text input field for natural language commands
- Quick action buttons for directional movement
- Command history log with timestamps and success/error indication
- Full support for all game actions (move, examine, take, use, solve, hint, inventory)
- Commands send requests to REST API endpoints
- Game state updates automatically via existing WebSocket connection

## Consequences

### Positive
- **Single interface**: Can view and play from browser without switching tools
- **Easier debugging**: Test game mechanics while watching real-time state updates
- **Better UX**: Quick action buttons for common operations
- **Command history**: Easy to see what you tried and results
- **Learning aid**: Command log shows proper syntax and responses
- **No additional backend**: Uses existing REST API endpoints

### Negative
- **Not for production agents**: This is a human-facing UI, not for automated agents
- **Client-side only**: No command validation before sending to server
- **Basic parser**: Simple space-splitting, not sophisticated command parsing
- **Error handling**: Relies on server error messages

### Command Syntax
- `move <direction>` - Navigate between rooms
- `examine <target>` - Inspect objects/rooms/challenges
- `take <object>` - Pick up items
- `use <object> [on <target>]` - Use inventory items
- `solve <challenge_id> <solution>` - Attempt puzzle solutions
- `hint <challenge_id>` - Request hints
- `inventory` - View your inventory

### UI Features
- Quick action buttons for N/S/E/W movement
- Enter key submits commands
- Color-coded log entries (success=white, error=red, normal=yellow)
- Automatic scroll to latest commands
- Limited to 20 most recent entries
- Maintains retro electronic styling

### Implementation
- Command panel added below main visualization
- JavaScript functions: `executeCommand()`, `addLogEntry()`, `quickMove()`
- REST API calls using fetch()
- WebSocket provides automatic state refresh after commands
