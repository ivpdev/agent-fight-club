import readline from 'readline';
import chalk from 'chalk';
import { exec } from 'child_process';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

interface GameSession {
  gameId: string;
  scenarioId: string;
}

interface CLIOptions {
  visualize: boolean;
}

class CLIClient {
  private rl: readline.Interface;
  private session: GameSession | null = null;
  private options: CLIOptions;

  constructor(options: CLIOptions) {
    this.options = options;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('> '),
    });

    this.setupReadline();
  }

  private setupReadline() {
    this.rl.on('line', async (input: string) => {
      const trimmed = input.trim();

      if (!trimmed) {
        this.rl.prompt();
        return;
      }

      await this.handleCommand(trimmed);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye!'));
      process.exit(0);
    });
  }

  async start() {
    this.printWelcome();
    await this.listScenarios();
    this.rl.prompt();
  }

  private printWelcome() {
    console.log(chalk.bold.cyan('\n╔════════════════════════════════════════════╗'));
    console.log(chalk.bold.cyan('║  AI Agent Competition Platform - CLI      ║'));
    console.log(chalk.bold.cyan('╚════════════════════════════════════════════╝\n'));
    if (this.options.visualize) {
      console.log(chalk.yellow('🌐 Visualization mode enabled'));
      console.log(chalk.gray('Browser will open automatically when you start a game\n'));
    }
    console.log(chalk.gray('Type "help" for available commands\n'));
  }

  private openBrowser(url: string) {
    const platform = process.platform;
    let command: string;

    if (platform === 'darwin') {
      command = `open "${url}"`;
    } else if (platform === 'win32') {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.log(chalk.yellow(`\nCouldn't open browser automatically. Visit: ${url}`));
      } else {
        console.log(chalk.green(`\n🌐 Browser opened: ${url}\n`));
      }
    });
  }

  private async handleCommand(input: string) {
    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
        case 'h':
        case '?':
          this.printHelp();
          break;

        case 'start':
          await this.startGame(args[0]);
          break;

        case 'scenarios':
        case 'list':
          await this.listScenarios();
          break;

        case 'move':
        case 'go':
        case 'n':
        case 'north':
        case 's':
        case 'south':
        case 'e':
        case 'east':
        case 'w':
        case 'west':
          await this.move(command === 'move' || command === 'go' ? args[0] : command);
          break;

        case 'look':
        case 'l':
          await this.examine(args.join(' '));
          break;

        case 'examine':
        case 'x':
          await this.examine(args.join(' '));
          break;

        case 'take':
        case 'get':
        case 'pickup':
          await this.take(args.join(' '));
          break;

        case 'use':
          await this.use(args.join(' '));
          break;

        case 'inventory':
        case 'i':
        case 'inv':
          await this.inventory();
          break;

        case 'solve':
          await this.solve(args[0], args.slice(1).join(' '));
          break;

        case 'hint':
          await this.hint(args[0]);
          break;

        case 'status':
          await this.status();
          break;

        case 'quit':
        case 'exit':
        case 'q':
          this.rl.close();
          break;

        default:
          console.log(chalk.red(`Unknown command: ${command}`));
          console.log(chalk.gray('Type "help" for available commands'));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log(chalk.red(`Error: ${error.message}`));
      }
    }
  }

  private printHelp() {
    console.log(chalk.bold('\nAvailable Commands:\n'));

    if (this.options.visualize) {
      console.log(chalk.yellow('  🌐 Visualization mode is enabled'));
      console.log(chalk.gray('     Browser will open when you start a game\n'));
    }

    const commands = [
      ['start <scenario>', 'Start a new game with the specified scenario'],
      ['scenarios, list', 'List available scenarios'],
      ['', ''],
      ['move <dir>, go <dir>', 'Move in a direction (north/south/east/west)'],
      ['n, s, e, w', 'Shorthand for move north/south/east/west'],
      ['look, l', 'Look around the current room'],
      ['examine <target>, x', 'Examine object, challenge, or inventory item'],
      ['take <object>, get', 'Pick up an object'],
      ['use <object>', 'Use an object'],
      ['inventory, i', 'Check your inventory'],
      ['', ''],
      ['solve <challenge_id> <answer>', 'Submit solution (use examine to see ID)'],
      ['hint <challenge_id>', 'Get a hint for a challenge (penalty)'],
      ['', ''],
      ['status', 'Show current game status'],
      ['help, h, ?', 'Show this help message'],
      ['quit, exit, q', 'Exit the game'],
    ];

    commands.forEach(([cmd, desc]) => {
      if (!cmd && !desc) {
        console.log('');
      } else {
        console.log(`  ${chalk.cyan(cmd.padEnd(25))} ${chalk.gray(desc)}`);
      }
    });

    console.log('');
  }

  private async listScenarios() {
    try {
      const response = await fetch(`${SERVER_URL}/scenarios`);
      const scenarios = await response.json() as any[];

      console.log(chalk.bold('\nAvailable Scenarios:\n'));
      scenarios.forEach((s: any) => {
        const difficulty = s.difficulty === 'easy' ? chalk.green(s.difficulty) :
                          s.difficulty === 'medium' ? chalk.yellow(s.difficulty) :
                          chalk.red(s.difficulty);
        console.log(`  ${chalk.cyan(s.id.padEnd(20))} ${difficulty.padEnd(15)} ${chalk.gray(s.name)}`);
        console.log(`    ${chalk.gray(s.description)}`);
        console.log('');
      });
    } catch (error) {
      console.log(chalk.red('Failed to fetch scenarios. Is the server running?'));
    }
  }

  private async startGame(scenarioId: string) {
    if (!scenarioId) {
      console.log(chalk.red('Please specify a scenario ID'));
      console.log(chalk.gray('Usage: start <scenario_id>'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'human-player',
          scenarioId,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as any;
        console.log(chalk.red(`Failed to start game: ${error.message}`));
        return;
      }

      const data = await response.json() as any;
      this.session = {
        gameId: data.gameId,
        scenarioId,
      };

      console.log(chalk.green(`\n✓ Game started! Game ID: ${data.gameId}\n`));

      // Open visualization if enabled
      if (this.options.visualize) {
        const visualizeUrl = `${SERVER_URL}/visualize/${data.gameId}`;
        this.openBrowser(visualizeUrl);
      }

      // Show initial state
      const room = data.initialState.currentRoom;
      console.log(chalk.bold(room.name));
      console.log(chalk.gray(room.description));

      if (room.exits.length > 0) {
        console.log(`\nExits: ${chalk.yellow(room.exits.join(', '))}`);
      }

      if (room.visibleObjects.length > 0) {
        console.log(`Objects: ${chalk.green(room.visibleObjects.join(', '))}`);
      }

      console.log('');
    } catch (error) {
      console.log(chalk.red('Failed to connect to server. Is it running?'));
    }
  }

  private async move(direction: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first with "start <scenario>"'));
      return;
    }

    // Map shorthand to full direction
    const directionMap: Record<string, string> = {
      n: 'north',
      s: 'south',
      e: 'east',
      w: 'west',
    };

    const fullDirection = directionMap[direction] || direction;

    if (!['north', 'south', 'east', 'west'].includes(fullDirection)) {
      console.log(chalk.red('Invalid direction. Use: north, south, east, or west'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction: fullDirection }),
      });

      const result = await response.json() as any;

      if (result.success) {
        console.log(chalk.green(`\n✓ ${result.message}`));

        // Get updated game state
        await this.lookAround();

        if (result.gameStatus === 'completed') {
          console.log(chalk.bold.green('\n🎉 Congratulations! You escaped!'));
          await this.status();
        }
      } else {
        console.log(chalk.red(`\n✗ ${result.message}`));
      }
    } catch (error) {
      console.log(chalk.red('Failed to execute move'));
    }
  }

  private async examine(target: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/examine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });

      const result = await response.json() as any;
      console.log(result.success ? chalk.gray(`\n${result.message}\n`) : chalk.red(`\n${result.message}\n`));
    } catch (error) {
      console.log(chalk.red('Failed to examine'));
    }
  }

  private async lookAround() {
    if (!this.session) return;

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}`);
      const state = await response.json() as any;

      const room = state.currentRoom;
      console.log(chalk.bold(`\n${room.name}`));
      console.log(chalk.gray(room.description));

      if (room.exits.length > 0) {
        console.log(`\nExits: ${chalk.yellow(room.exits.join(', '))}`);
      }

      if (room.visibleObjects.length > 0) {
        console.log(`Objects: ${chalk.green(room.visibleObjects.join(', '))}`);
      }

      console.log('');
    } catch (error) {
      console.log(chalk.red('Failed to get game state'));
    }
  }

  private async take(objectId: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    if (!objectId) {
      console.log(chalk.red('What do you want to take?'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId,
          action: 'take',
        }),
      });

      const result = await response.json() as any;
      console.log(result.success ? chalk.green(`\n✓ ${result.message}\n`) : chalk.red(`\n✗ ${result.message}\n`));
    } catch (error) {
      console.log(chalk.red('Failed to take object'));
    }
  }

  private async use(objectId: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    if (!objectId) {
      console.log(chalk.red('What do you want to use?'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectId,
          action: 'use',
        }),
      });

      const result = await response.json() as any;
      console.log(result.success ? chalk.green(`\n✓ ${result.message}\n`) : chalk.red(`\n✗ ${result.message}\n`));
    } catch (error) {
      console.log(chalk.red('Failed to use object'));
    }
  }

  private async inventory() {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/inventory`);
      const data = await response.json() as any;

      console.log(chalk.bold('\nInventory:'));
      if (data.inventory.length === 0) {
        console.log(chalk.gray('  (empty)'));
      } else {
        data.inventory.forEach((item: string) => {
          console.log(`  ${chalk.cyan('•')} ${item}`);
        });
        console.log(chalk.gray('\nTip: Use "examine <item>" to read items in your inventory'));
      }
      console.log('');
    } catch (error) {
      console.log(chalk.red('Failed to get inventory'));
    }
  }

  private async solve(challengeId: string, solution: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    if (!challengeId || !solution) {
      console.log(chalk.red('Usage: solve <challenge_id> <solution>'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, solution }),
      });

      const result = await response.json() as any;
      console.log(result.success ? chalk.green(`\n✓ ${result.message}\n`) : chalk.red(`\n✗ ${result.message}\n`));
    } catch (error) {
      console.log(chalk.red('Failed to submit solution'));
    }
  }

  private async hint(challengeId: string) {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    if (!challengeId) {
      console.log(chalk.red('Usage: hint <challenge_id>'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      });

      const result = await response.json() as any;
      console.log(chalk.yellow(`\n${result.message}\n`));
    } catch (error) {
      console.log(chalk.red('Failed to get hint'));
    }
  }

  private async status() {
    if (!this.session) {
      console.log(chalk.red('No active game. Start a game first.'));
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}`);
      const state = await response.json() as any;

      console.log(chalk.bold('\nGame Status:'));
      console.log(`  Game ID: ${chalk.cyan(state.gameId)}`);
      console.log(`  Status: ${chalk.yellow(state.status)}`);
      console.log(`  Turn: ${chalk.cyan(state.turnCount)}`);
      console.log(`  Score: ${chalk.yellow(state.score)}`);
      console.log(`  Time: ${chalk.gray(Math.floor(state.elapsedTimeMs / 1000))}s`);
      console.log('');
    } catch (error) {
      console.log(chalk.red('Failed to get status'));
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CLIOptions = {
  visualize: args.includes('--visualize') || args.includes('-v'),
};

// Start the CLI
const client = new CLIClient(options);
client.start();
