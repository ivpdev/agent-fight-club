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
    console.log(chalk.bold.cyan('\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557'));
    console.log(chalk.bold.cyan('\u2551  AI Agent Competition Platform - CLI      \u2551'));
    console.log(chalk.bold.cyan('\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n'));
    if (this.options.visualize) {
      console.log(chalk.yellow('\uD83C\uDF10 Visualization mode enabled'));
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
        console.log(chalk.green(`\n\uD83C\uDF10 Browser opened: ${url}\n`));
      }
    });
  }

  private async handleCommand(input: string) {
    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      // Meta-commands handled locally
      switch (command) {
        case 'help':
        case 'h':
        case '?':
          await this.printHelp();
          return;

        case 'start':
          await this.startGame(args[0]);
          return;

        case 'scenarios':
        case 'list':
          await this.listScenarios();
          return;

        case 'status':
          await this.status();
          return;

        case 'quit':
        case 'exit':
        case 'q':
          this.rl.close();
          return;
      }

      // All other commands go to the server's generic command endpoint
      if (!this.session) {
        console.log(chalk.red(`Unknown command: ${command}`));
        console.log(chalk.gray('Type "help" for available commands'));
        return;
      }

      await this.sendCommand(command, args);
    } catch (error) {
      if (error instanceof Error) {
        console.log(chalk.red(`Error: ${error.message}`));
      }
    }
  }

  private async sendCommand(command: string, args: string[]) {
    if (!this.session) return;

    try {
      const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, args }),
      });

      const result = await response.json() as any;

      if (result.success) {
        console.log(chalk.green(`\n\u2713 ${result.message}\n`));
      } else {
        console.log(chalk.red(`\n\u2717 ${result.message}\n`));
      }

      if (result.gameStatus === 'completed') {
        console.log(chalk.bold.green('\uD83C\uDF89 Congratulations! You won!'));
        await this.status();
      } else if (result.gameStatus === 'failed') {
        console.log(chalk.bold.red('Game over! Time ran out.'));
        await this.status();
      }
    } catch (error) {
      console.log(chalk.red('Failed to execute command'));
    }
  }

  private async printHelp() {
    console.log(chalk.bold('\nAvailable Commands:\n'));

    if (this.options.visualize) {
      console.log(chalk.yellow('  \uD83C\uDF10 Visualization mode is enabled'));
      console.log(chalk.gray('     Browser will open when you start a game\n'));
    }

    const metaCommands = [
      ['start <scenario>', 'Start a new game with the specified scenario'],
      ['scenarios, list', 'List available scenarios'],
      ['status', 'Show current game status'],
      ['help, h, ?', 'Show this help message'],
      ['quit, exit, q', 'Exit the game'],
    ];

    metaCommands.forEach(([cmd, desc]) => {
      console.log(`  ${chalk.cyan(cmd.padEnd(25))} ${chalk.gray(desc)}`);
    });

    // Fetch scenario-specific help if a game is active
    if (this.session) {
      try {
        const response = await fetch(`${SERVER_URL}/games/${this.session.gameId}`);
        const state = await response.json() as any;
        if (state.scenarioState) {
          console.log(chalk.bold('\nGame Commands:'));
          console.log(chalk.gray('  (Commands depend on the active scenario. Try "help" in-game.)'));
        }
      } catch {
        // ignore
      }
    }

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

      console.log(chalk.green(`\n\u2713 Game started! Game ID: ${data.gameId}\n`));

      // Open visualization if enabled
      if (this.options.visualize) {
        const visualizeUrl = `${SERVER_URL}/visualize/${data.gameId}`;
        this.openBrowser(visualizeUrl);
      }

      // Show initial message from handler
      if (data.initialMessage) {
        console.log(data.initialMessage);
      }

      console.log('');
    } catch (error) {
      console.log(chalk.red('Failed to connect to server. Is it running?'));
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
