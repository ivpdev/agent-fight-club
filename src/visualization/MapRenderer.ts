import chalk from 'chalk';
import boxen from 'boxen';
import { GameState, Room, Scenario } from '../types';

export class MapRenderer {
  /**
   * Render the complete game state visualization
   */
  render(gameState: GameState, scenario: Scenario, currentRoom: Room, allRooms: Room[]): string {
    const sections: string[] = [];

    // Header
    sections.push(this.renderHeader(gameState, scenario));

    // Map
    sections.push(this.renderMap(gameState, allRooms));

    // Current room details
    sections.push(this.renderRoomDetails(currentRoom, gameState));

    // Status bar
    sections.push(this.renderStatusBar(gameState, scenario));

    // Combine all sections
    const content = sections.join('\n' + '═'.repeat(63) + '\n');

    return boxen(content, {
      padding: 0,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
    });
  }

  /**
   * Render header with game title and status
   */
  private renderHeader(gameState: GameState, scenario: Scenario): string {
    const statusColor = gameState.status === 'completed' ? 'green' :
                       gameState.status === 'failed' ? 'red' : 'yellow';

    const title = chalk.bold.cyan(`🎮 ${scenario.name}`);
    const turn = chalk.gray(`Turn ${gameState.turnCount}`);
    const agent = chalk.gray(`Agent: ${gameState.agentId}`);
    const status = chalk[statusColor](gameState.status.replace('_', ' ').toUpperCase());

    return `${title} - ${turn}\n${agent}        Status: ${status}`;
  }

  /**
   * Render the ASCII map
   */
  private renderMap(gameState: GameState, allRooms: Room[]): string {
    // Calculate map bounds
    const positions = allRooms.map((r) => r.position);
    const minX = Math.min(...positions.map((p) => p.x));
    const maxX = Math.max(...positions.map((p) => p.x));
    const minY = Math.min(...positions.map((p) => p.y));
    const maxY = Math.max(...positions.map((p) => p.y));

    const width = (maxX - minX + 1) * 12; // 12 chars per room
    const height = (maxY - minY + 1) * 5; // 5 lines per room

    // Create empty grid
    const grid: string[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(' '));

    // Place rooms on grid
    for (const room of allRooms) {
      this.placeRoom(grid, room, gameState, minX, minY);
    }

    // Convert grid to string
    return grid.map((row) => row.join('')).join('\n');
  }

  /**
   * Place a room on the grid
   */
  private placeRoom(
    grid: string[][],
    room: Room,
    gameState: GameState,
    minX: number,
    minY: number
  ): void {
    const x = (room.position.x - minX) * 12;
    const y = (room.position.y - minY) * 5;

    const visited = gameState.roomsVisited.includes(room.id);
    const isCurrent = gameState.currentRoom === room.id;
    const isExit = room.isExit;

    // Determine room symbol
    let symbol = '?';
    if (isCurrent) symbol = '@';
    else if (isExit) symbol = '🚪';
    else if (visited) symbol = '·';

    // Determine room color
    let roomName = room.name;
    if (!visited && !isCurrent) {
      roomName = '???';
      symbol = '?';
    }

    // Truncate name if too long
    if (roomName.length > 9) {
      roomName = roomName.substring(0, 8) + '.';
    }

    // Draw room box (only if visited or current)
    if (visited || isCurrent) {
      const color = isCurrent ? 'cyan' : isExit ? 'green' : room.locked ? 'red' : 'white';
      const boxColor = chalk[color];

      this.setGrid(grid, x, y, boxColor('┌─────────┐'));
      this.setGrid(grid, x, y + 1, boxColor(`│ ${this.pad(roomName, 7)} │`));
      this.setGrid(grid, x, y + 2, boxColor(`│    ${symbol}    │`));
      this.setGrid(grid, x, y + 3, boxColor('└─────────┘'));

      // Draw connections
      this.drawConnections(grid, room, gameState, x, y, minX, minY);
    } else {
      // Unknown room - just show placeholder
      this.setGrid(grid, x + 2, y + 1, chalk.gray('┌───┐'));
      this.setGrid(grid, x + 2, y + 2, chalk.gray(`│ ${symbol} │`));
      this.setGrid(grid, x + 2, y + 3, chalk.gray('└───┘'));
    }
  }

  /**
   * Draw connections between rooms
   */
  private drawConnections(
    grid: string[][],
    room: Room,
    _gameState: GameState,
    x: number,
    y: number,
    _minX: number,
    _minY: number
  ): void {
    // North
    if (room.exits.north) {
      this.setGrid(grid, x + 5, y - 1, chalk.gray('│'));
    }

    // South
    if (room.exits.south) {
      this.setGrid(grid, x + 5, y + 4, chalk.gray('│'));
    }

    // East
    if (room.exits.east) {
      for (let i = 1; i <= 2; i++) {
        this.setGrid(grid, x + 11 + i, y + 2, chalk.gray('─'));
      }
    }

    // West
    if (room.exits.west) {
      for (let i = 1; i <= 2; i++) {
        this.setGrid(grid, x - i, y + 2, chalk.gray('─'));
      }
    }
  }

  /**
   * Set a character in the grid safely
   */
  private setGrid(grid: string[][], x: number, y: number, value: string): void {
    if (y >= 0 && y < grid.length && x >= 0) {
      const row = grid[y];
      const chars = [...value]; // Handle multi-byte characters (emoji, colors)

      for (let i = 0; i < chars.length && x + i < row.length; i++) {
        row[x + i] = chars[i];
      }
    }
  }

  /**
   * Pad string to specified length
   */
  private pad(str: string, length: number): string {
    if (str.length >= length) return str;
    const padding = ' '.repeat(length - str.length);
    return str + padding;
  }

  /**
   * Render current room details
   */
  private renderRoomDetails(room: Room, gameState: GameState): string {
    const lines: string[] = [];

    lines.push(chalk.bold(`Current Room: ${room.name}`));
    lines.push(chalk.gray(room.description));
    lines.push('');

    // Exits
    const exits = Object.keys(room.exits);
    if (exits.length > 0) {
      lines.push(`Exits: ${chalk.yellow(exits.join(', '))}`);
    }

    // Objects
    if (room.objects.length > 0) {
      const objectNames = room.objects.map((o) => o.name).join(', ');
      lines.push(`Objects: ${chalk.green(objectNames)}`);
    }

    // Challenges
    if (room.challenges.length > 0) {
      const challengeStatus = room.challenges.map((cId) => {
        const completed = gameState.challengesCompleted.includes(cId);
        return completed ? chalk.green(`✓ ${cId}`) : chalk.yellow(`⚡ ${cId}`);
      });
      lines.push(`Challenges: ${challengeStatus.join(', ')}`);
    }

    // Inventory
    lines.push('');
    if (gameState.inventory.length > 0) {
      lines.push(`Inventory: ${chalk.cyan(gameState.inventory.join(', '))}`);
    } else {
      lines.push(chalk.gray('Inventory: empty'));
    }

    return lines.join('\n');
  }

  /**
   * Render status bar
   */
  private renderStatusBar(gameState: GameState, scenario: Scenario): string {
    const lines: string[] = [];

    const challengesTotal = scenario.challenges.length;
    const challengesCompleted = gameState.challengesCompleted.length;
    const roomsTotal = scenario.rooms.length;
    const roomsVisited = gameState.roomsVisited.length;

    lines.push(
      `Challenges: ${chalk.cyan(`${challengesCompleted}/${challengesTotal}`)}  ` +
        `Rooms Explored: ${chalk.cyan(`${roomsVisited}/${roomsTotal}`)}`
    );

    lines.push(
      `Score: ${chalk.yellow(gameState.score.toString())}  ` +
        `Hints Used: ${chalk.magenta(gameState.hintsUsed.toString())}`
    );

    return lines.join('\n');
  }

  /**
   * Render action result
   */
  renderActionResult(success: boolean, message: string): string {
    const icon = success ? chalk.green('✓') : chalk.red('✗');
    return `${icon} ${message}`;
  }

  /**
   * Render simple message
   */
  renderMessage(message: string, color: 'info' | 'success' | 'error' | 'warning' = 'info'): string {
    switch (color) {
      case 'success':
        return chalk.green(message);
      case 'error':
        return chalk.red(message);
      case 'warning':
        return chalk.yellow(message);
      default:
        return chalk.blue(message);
    }
  }
}
