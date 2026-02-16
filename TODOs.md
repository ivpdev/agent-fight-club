TODO:
- implement web-cli
- implement agent using cli-api
- implement game results capturing (agents runs the game via API -> results are persisted)
- think about session management (currently game sessions are held in memory)
- implement agent builder   
- implement multiplayer
- workout good challenges
- think of cli design (should meta commands be available from the game cli?)
- cleanup libarary commands from API
- remove connecting to server from webcli
- create train/test rooms
- make production ready



COMPLETED:
- ✅ implement cli-api
- ✅ rework modules structure
- ✅ implement web visualizer via pub/sub - COMPLETED
    - ✅ Real-time WebSocket updates using Socket.IO
    - ✅ Progress bar (challenges completed, rooms explored)
    - ✅ Timer (elapsed time display)
- ✅ implement baseline agent
- ✅ fix navigation - COMPLETED
    FIXED: Refactored exits to be direction-only arrays. Destinations now calculated from grid positions.
    This makes navigation bugs impossible - exits and visual layout are always in sync.


ICEBOX:
- TODO challenge to test context compression and memory (e.g. to ensure that the console output it not summarized)
