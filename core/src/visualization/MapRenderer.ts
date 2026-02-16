import chalk from 'chalk';
import boxen from 'boxen';
import { GameState, Room } from '../types';

const theme = {
  accent: '#f7d000',
  accentStrong: '#ffea3a',
  signal: '#c61f26',
  muted: '#8b8b8b',
  ink: '#f7f3e7',
};

export class MapRenderer {
  /**
   * Render the complete game state visualization.
   * Accepts gameState and a scenarioState record (from handler.getState()).
   * Only works for escape-room scenarios that provide allRooms/currentRoom.
   */
  render(gameState: GameState, scenarioState: Record<string, unknown>): string {
    const allRooms = scenarioState.allRooms as Room[];
    const currentRoom = scenarioState.currentRoomData as Room;
    const inventory = (scenarioState.inventory as string[]) || [];
    const challengesCompleted = (scenarioState.challengesCompleted as string[]) || [];
    const roomsVisited = (scenarioState.roomsVisited as string[]) || [];
    const hintsUsed = (scenarioState.hintsUsed as number) || 0;
    const currentRoomId = scenarioState.currentRoom as string;

    if (!allRooms || !currentRoom) return '';

    const sections: string[] = [];

    // Header
    sections.push(this.renderHeader(gameState));

    // Map
    sections.push(this.renderMap(currentRoomId, roomsVisited, allRooms));

    // Current room details
    sections.push(this.renderRoomDetails(currentRoom, inventory, challengesCompleted));

    // Status bar
    sections.push(this.renderStatusBar(gameState, allRooms, challengesCompleted, roomsVisited, hintsUsed));

    // Combine all sections
    const content = sections.join('\n' + '═'.repeat(63) + '\n');

    return boxen(content, {
      padding: 0,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'yellow',
    });
  }

  /**
   * Render header with game title and status
   */
  private renderHeader(gameState: GameState): string {
    const statusColor = gameState.status === 'completed' ? 'green' :
                       gameState.status === 'failed' ? 'red' : 'yellow';

    const title = chalk.hex(theme.accentStrong).bold(`\uD83C\uDFAE Game ${gameState.scenarioId}`);
    const turn = chalk.hex(theme.muted)(`Turn ${gameState.turnCount}`);
    const agent = chalk.hex(theme.muted)(`Agent: ${gameState.agentId}`);
    const status = chalk[statusColor](gameState.status.replace('_', ' ').toUpperCase());

    return `${title} - ${turn}\n${agent}        Status: ${status}`;
  }

  /**
   * Render the ASCII map
   */
  private renderMap(currentRoomId: string, roomsVisited: string[], allRooms: Room[]): string {
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
      this.placeRoom(grid, room, currentRoomId, roomsVisited, minX, minY);
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
    currentRoomId: string,
    roomsVisited: string[],
    minX: number,
    minY: number
  ): void {
    const x = (room.position.x - minX) * 12;
    const y = (room.position.y - minY) * 5;

    const visited = roomsVisited.includes(room.id);
    const isCurrent = currentRoomId === room.id;
    const isExit = room.isExit;

    // Determine room symbol
    let symbol = '?';
    if (isCurrent) symbol = '@';
    else if (isExit) symbol = '\uD83D\uDEAA';
    else if (visited) symbol = '\u00B7';

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
      const boxColor = isCurrent
        ? chalk.hex(theme.accentStrong)
        : isExit
          ? chalk.hex(theme.ink)
          : room.locked
            ? chalk.hex(theme.signal)
            : chalk.hex(theme.muted);

      this.setGrid(grid, x, y, boxColor('\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'));
      this.setGrid(grid, x, y + 1, boxColor(`\u2502 ${this.pad(roomName, 7)} \u2502`));
      this.setGrid(grid, x, y + 2, boxColor(`\u2502    ${symbol}    \u2502`));
      this.setGrid(grid, x, y + 3, boxColor('\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'));

      // Draw connections
      this.drawConnections(grid, room, x, y);
    } else {
      // Unknown room - just show placeholder
      const muted = chalk.hex(theme.muted);
      this.setGrid(grid, x + 2, y + 1, muted('\u250C\u2500\u2500\u2500\u2510'));
      this.setGrid(grid, x + 2, y + 2, muted(`\u2502 ${symbol} \u2502`));
      this.setGrid(grid, x + 2, y + 3, muted('\u2514\u2500\u2500\u2500\u2518'));
    }
  }

  /**
   * Draw connections between rooms
   */
  private drawConnections(
    grid: string[][],
    room: Room,
    x: number,
    y: number,
  ): void {
    // North
    if (room.exits.includes('north')) {
      this.setGrid(grid, x + 5, y - 1, chalk.hex(theme.muted)('\u2502'));
    }

    // South
    if (room.exits.includes('south')) {
      this.setGrid(grid, x + 5, y + 4, chalk.hex(theme.muted)('\u2502'));
    }

    // East
    if (room.exits.includes('east')) {
      for (let i = 1; i <= 2; i++) {
        this.setGrid(grid, x + 11 + i, y + 2, chalk.hex(theme.muted)('\u2500'));
      }
    }

    // West
    if (room.exits.includes('west')) {
      for (let i = 1; i <= 2; i++) {
        this.setGrid(grid, x - i, y + 2, chalk.hex(theme.muted)('\u2500'));
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
  private renderRoomDetails(room: Room, inventory: string[], challengesCompleted: string[]): string {
    const lines: string[] = [];

    lines.push(chalk.hex(theme.accentStrong).bold(`Current Room: ${room.name}`));
    lines.push(chalk.hex(theme.muted)(room.description));
    lines.push('');

    // Exits
    if (room.exits.length > 0) {
      lines.push(`Exits: ${chalk.hex(theme.accent)(room.exits.join(', '))}`);
    }

    // Objects
    if (room.objects.length > 0) {
      const objectNames = room.objects.map((o) => o.name).join(', ');
      lines.push(`Objects: ${chalk.hex(theme.accentStrong)(objectNames)}`);
    }

    // Challenges
    if (room.challenges.length > 0) {
      const challengeStatus = room.challenges.map((cId) => {
        const completed = challengesCompleted.includes(cId);
        return completed
          ? chalk.hex(theme.ink)(`\u2713 ${cId}`)
          : chalk.hex(theme.accent)(`\u26A1 ${cId}`);
      });
      lines.push(`Challenges: ${challengeStatus.join(', ')}`);
    }

    // Inventory
    lines.push('');
    if (inventory.length > 0) {
      lines.push(`Inventory: ${chalk.hex(theme.accent)(inventory.join(', '))}`);
    } else {
      lines.push(chalk.hex(theme.muted)('Inventory: empty'));
    }

    return lines.join('\n');
  }

  /**
   * Render status bar
   */
  private renderStatusBar(
    gameState: GameState,
    allRooms: Room[],
    challengesCompleted: string[],
    roomsVisited: string[],
    hintsUsed: number,
  ): string {
    const lines: string[] = [];

    // Count challenges across all rooms
    const allChallengeIds = new Set(allRooms.flatMap(r => r.challenges));
    const challengesTotal = allChallengeIds.size;
    const roomsTotal = allRooms.length;

    lines.push(
      `Challenges: ${chalk.hex(theme.accent)(`${challengesCompleted.length}/${challengesTotal}`)}  ` +
        `Rooms Explored: ${chalk.hex(theme.accent)(`${roomsVisited.length}/${roomsTotal}`)}`
    );

    lines.push(
      `Score: ${chalk.hex(theme.accentStrong)(gameState.score.toString())}  ` +
        `Hints Used: ${chalk.hex(theme.signal)(hintsUsed.toString())}`
    );

    return lines.join('\n');
  }

  /**
   * Render action result
   */
  renderActionResult(success: boolean, message: string): string {
    const icon = success ? chalk.green('\u2713') : chalk.red('\u2717');
    return `${icon} ${message}`;
  }

  /**
   * Render simple message
   */
  renderMessage(message: string, color: 'info' | 'success' | 'error' | 'warning' = 'info'): string {
    switch (color) {
      case 'success':
        return chalk.hex(theme.accentStrong)(message);
      case 'error':
        return chalk.hex(theme.signal)(message);
      case 'warning':
        return chalk.hex(theme.accent)(message);
      default:
        return chalk.hex(theme.muted)(message);
    }
  }
}
