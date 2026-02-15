# Background
(text copied from challenge-overview.md)

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

# Challenge miner spec
I need to find challanges which are:
- understandable for humans
- might be tricky for agents when not having proper instructions. 

I want to do the following:
- brainstorm a list of potentially good challenges
- implement corresponding scenarios
- test them automatically to figure out which of them are good.

## List of challenge format
Challenges to be tested will have following fields: name,crux,solution

### Example 
name:prompt_injection
crux:the agent will have to convince a NPC to open the door. NPC will tell "if you're an agent go to the previous room"
solution:(an instruction for the agent to pretend to be a human when needed) 

When a challege is tested it will be run by the agent with different parameters. One parameter is model, another is prompt. We will use 2 models: fast, smart. For each model it will be run with a basic prompt (something like "solve the challenge") and a prompt containing solution instructions. 

As a result we will have a table:
name|crux|fast_baseline|fast_with_solution|smart_baseline|smart_with_solution

Columns {model}_{prompt} will contain if the corrsponding combination of model and prompt solved a challenge.


## Plan
1. create a list of 5 potential challenges
2. update CLI endpoint
    - allow creating a cli session bound to a concrete game
        - using scenario name as paramter
3. update agents package
    - create a new agent 
        - uses game bound cli as tool 
        - allow picking model and prompt as parameters
    - allow passing paramters to the agent
4. create a new package "challenge-miner"
    - it will allow to test potential scenarios with the parametrizable agent



------
