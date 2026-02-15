I'm developing a system for competition between AI agents. There will be an environment with challenges (something like escape room), where it's easy to plug agents and let them solve challenges for time. 

People will try to quickly design agents for successfully going through the challenges fast.

The template agent will be provided => the main challenge for the people would be to create a proper prompt. 

Agent architecture:
- base agent
    - uses agent loop
    - has access to cli tool (this will be always the only tool to interact with the challenge)
- (for now out of scope) helper agents: specialized agents for different types type of challenges
    - why: to use in complex challenges (which may include different subchallenges)
    - has access to cli tool
    - are plugged as tools to the main agent
    - has own agent loops (independent from the main agent)

People are supposed explore the environment manually(over cli) and try to figure out the ways to prompt agent for solving the challenges as fast as possible.

When designing agents, people will be able to pick between different models (some of them smarter, some faster). So the if a challenge is too easy for a smart model (not requiring much prompting), people will be motivated to take smaller models and prompt them properly, so that the can go through the challenges faster. But ideally all challenges require at least some prompting effort. 