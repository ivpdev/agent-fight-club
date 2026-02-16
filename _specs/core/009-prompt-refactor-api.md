let's rework current APIs.

- clean up API about game
    - the only way to interact with the game should be generic using generic commands over game or CLI API. there should not be APIs specific to concrete scenario (e.g. "move", "inventory" etc)
    - endpoint for CLI should have consistent naming with game API: replace "execute" with "command" 

don't implement right away. first share your implemenration plan