import {
  ScenarioHandler,
  WinConditionResult,
  ActionResult,
} from '../types';

export class BellTimerHandler implements ScenarioHandler {
  private bellRungCount: number = 0;
  private timerSeconds: number = 0;
  private timerStartedAt: number | null = null;
  private timerExpired: boolean = false;
  private firstRingTime: number | null = null;
  private won: boolean = false;

  constructor() {}

  getInitialMessage(): string {
    return [
      'Bell Timer Challenge',
      '',
      'You stand in a small room with a bell and a timer device.',
      'Ring the bell twice with approximately 10 seconds between rings to win.',
      '',
      'Commands: r (ring bell), s <seconds> (set timer), w (wait for timer)',
    ].join('\n');
  }

  getHelp(): string {
    return [
      '  r                         Ring the bell',
      '  s <seconds>               Set the timer (1-60 seconds)',
      '  w                         Wait for the timer to expire',
    ].join('\n');
  }

  async executeCommand(command: string, args: string[]): Promise<ActionResult> {
    switch (command) {
      case 'r':
        return this.ringBell();
      case 's':
        return this.setTimer(args[0]);
      case 'w':
        return await this.wait();
      case 'help':
      case 'h':
      case '?':
        return { success: true, message: this.getHelp(), turnCount: 0 };
      default:
        return {
          success: false,
          message: `Unknown command: ${command}. Use r (ring), s <seconds> (set timer), or w (wait).`,
          turnCount: 0,
        };
    }
  }

  checkWinCondition(): WinConditionResult {
    if (this.won) {
      return { won: true, message: 'You rang the bell with perfect timing!' };
    }
    return { won: false };
  }

  getState(): Record<string, unknown> {
    return {
      bellRungCount: this.bellRungCount,
      timerSeconds: this.timerSeconds,
      timerActive: this.timerStartedAt !== null && !this.timerExpired,
      timerExpired: this.timerExpired,
      won: this.won,
    };
  }

  getScoreAdjustment(): number {
    // Bonus for winning with fewer rings (optimal is exactly 2)
    if (this.won) {
      return this.bellRungCount === 2 ? 100 : 0;
    }
    return 0;
  }

  private ringBell(): ActionResult {
    this.bellRungCount++;
    const now = Date.now();

    if (this.firstRingTime === null) {
      this.firstRingTime = now;
      return {
        success: true,
        message: 'DING! You ring the bell. The sound echoes through the room. (Ring #1)',
        turnCount: 0,
      };
    }

    // Check if ~10 seconds have passed since first ring (8-12 second window)
    const elapsedMs = now - this.firstRingTime;
    const elapsedSeconds = elapsedMs / 1000;

    if (elapsedSeconds >= 8 && elapsedSeconds <= 12) {
      this.won = true;
      return {
        success: true,
        message: `DING! Perfect timing! ${elapsedSeconds.toFixed(1)}s between rings. You win!`,
        turnCount: 0,
      };
    }

    // Reset - wrong timing
    const message = elapsedSeconds < 8
      ? `DING! Too soon! Only ${elapsedSeconds.toFixed(1)}s since first ring. Need ~10s. Resetting.`
      : `DING! Too late! ${elapsedSeconds.toFixed(1)}s since first ring. Need ~10s. Resetting.`;

    this.firstRingTime = now; // This ring becomes the new first ring
    this.bellRungCount = 1; // Reset to 1 (this ring counts as new first)

    return {
      success: false,
      message,
      turnCount: 0,
    };
  }

  private setTimer(secondsStr: string): ActionResult {
    const seconds = parseInt(secondsStr, 10);
    if (isNaN(seconds) || seconds < 1 || seconds > 60) {
      return {
        success: false,
        message: 'Usage: s <seconds> (1-60)',
        turnCount: 0,
      };
    }

    this.timerSeconds = seconds;
    this.timerStartedAt = Date.now();
    this.timerExpired = false;

    return {
      success: true,
      message: `Timer set for ${seconds} seconds. Use "w" to wait for it.`,
      turnCount: 0,
    };
  }

  private async wait(): Promise<ActionResult> {
    if (this.timerStartedAt === null || this.timerExpired) {
      return {
        success: false,
        message: 'No active timer. Use "s <seconds>" to set one first.',
        turnCount: 0,
      };
    }

    const elapsed = Date.now() - this.timerStartedAt;
    const remainingMs = (this.timerSeconds * 1000) - elapsed;

    if (remainingMs <= 0) {
      this.timerExpired = true;
      return {
        success: true,
        message: 'The timer has already expired!',
        turnCount: 0,
      };
    }

    // Actually wait for the remaining time
    await new Promise((resolve) => setTimeout(resolve, remainingMs));
    this.timerExpired = true;

    return {
      success: true,
      message: `Tick... tock... BEEP! The ${this.timerSeconds}-second timer has expired.`,
      turnCount: 0,
    };
  }
}
