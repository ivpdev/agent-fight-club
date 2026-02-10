TODO:
- rework modules structure
    - game server
        - engine
        - scenarios
        - game visualization
    - clients
        - cli
        - webcli
        - cli-api
    - agents
- implement game evaluation (agents runs the game via API -> results are persisted)
- implement multiplayer
- workout good challenges
- create train/test rooms
- make production ready
    - think about session management (currently game sessions are help in memory)

COMPLETED:
- ✅ implement web visualizer via pub/sub - COMPLETED
    - ✅ Real-time WebSocket updates using Socket.IO
    - ✅ Progress bar (challenges completed, rooms explored)
    - ✅ Timer (elapsed time display)
- ✅ implement baseline agent
- ✅ fix navigation - COMPLETED
    FIXED: Refactored exits to be direction-only arrays. Destinations now calculated from grid positions.
    This makes navigation bugs impossible - exits and visual layout are always in sync.