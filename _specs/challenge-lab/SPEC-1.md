I want to automatically evaluate performance of different prompts and different models against different challenges/scenarios.

So I need:
- an agent similar to simple-agent, but getting model and prompt file as parameters
- a machinery that will run the agent with different prompts and models against scenarios and write down stats of these games to a report

### Folder structure
- challenge-lab
	- run-configs
		- default
			- baseline-prompt.md
			- models.txt
		- library_escape
			- solution-prompt.md
			- models.txt (optional, overrides default)
		- ....
	- experiments
		- 20260216140567
			- run-configs (copy of configs used for this experiment)
			- logs
				- library_escape-anthropic_claude-sonnet-3.5_baseline.md
				- ....
			- report.md
		- ...

### Config files
- `models.txt` — one model ID per line, lines starting with `#` or `//` are ignored
- Any `.md` file in a config dir (that isn't `models.txt`) is a prompt — filename becomes the prompt name (e.g. `baseline-prompt.md` → `baseline-prompt`)
- Scenario-specific dirs override models from default and extend prompts (default prompts + scenario prompts are all used)

### Report format
Table containing columns:
- scenario
- model
- prompt
- success (true/false)
- turns
- time

Report is appended incrementally as each run completes (survives interruption).

### Console output
- Before each run: prints which scenario/model/prompt combination is about to run
- During each run: prints agent/environment interaction in colored format (same as simple-agent)
- After each run: prints result summary (success/fail, turns, time)

### npm run commands

- `npm run challenge:experiment` — run all scenarios
- `npm run challenge:experiment -- {scenario_name}` — run specific scenario
