# ADR 001: WebSocket Visualization Architecture

## Status
Accepted

## Context
We needed to add a web-based live visualization feature that updates in real-time as the CLI game progresses. The visualization should display the game map, current position, inventory, challenges, and stats. Several architectural approaches were considered:

1. **Separate visualization server** - A standalone server that polls or listens to the main server
2. **Browser polls main server** - Browser makes periodic HTTP requests to fetch game state
3. **WebSocket from main server** - Browser connects directly to main server via WebSocket

## Decision
We chose to integrate WebSocket (Socket.IO) into the main server and have the browser connect directly to it.

**Architecture:**
- Main server (port 3000) serves both REST API and WebSocket endpoints
- Browser connects via WebSocket to main server
- No separate visualization server needed
- CLI client triggers browser to open visualization URL

## Consequences

### Positive
- **Simplicity**: Single server process, no coordination between servers needed
- **Real-time updates**: WebSocket provides instant updates with no polling overhead
- **Efficiency**: Bidirectional communication, low latency
- **Scalability**: Multiple browsers can watch the same game simultaneously
- **No redundancy**: Visualization server would only serve static files and proxy connections

### Negative
- **Coupling**: Visualization logic is coupled to main server (though minimally - just emitting events)
- **Dependencies**: Adds socket.io as a dependency to the main server

### Alternatives Considered
- **Separate visualization server**: Rejected due to unnecessary complexity and no clear benefit
- **HTTP polling**: Rejected due to poor real-time performance and higher server load
- **Server-Sent Events (SSE)**: Could work but Socket.IO provides better browser compatibility and bidirectional capability

## Implementation
- Socket.IO v4.8.3 integrated with Express server
- `/visualize/:gameId` route serves HTML page
- Game state broadcast via `gameStateUpdate` event after each action
- Clients subscribe to specific game IDs using room pattern `game:{gameId}`
