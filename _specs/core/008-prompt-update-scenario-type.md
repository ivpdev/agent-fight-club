update game engine
    - allow scenarios not in form of escape game (rooms, doors, inventory etc) but in an arbitraty form.
        for example if a challenge is about using a timer, the cli can have commands "set timer", "get time left". the available commands are always to see with help command.
    - you will need to refactor GameEngine: currently it contains both generic logic about games (crearing a game, listing scenarios) from the logic specific to type of the scenraio
    - create one example scenario that use commands different from the escape room ones

example of non-room scenario:
1. game is started and the first message of the game "you need to ring a bell and then ring it again in 10 seconds"
2. agent enter a command "help"
3. game yields "r - ring bell; s {x} - set timer to x seconds; w - wait till the times it done"
4. agent enter a command "r"
5. game yields "bell rung"
6. agent enters a command "s 10"
7. game yields timer is set to 10 seconds
8. agent enters a coomand "w"
9. game holds the execution for 10 seconds, then yields "time is up"
10. agent eneter a commnad "r"
11. game "you won"