import { ScenarioBase } from '../types';
import { BellTimerHandler } from '../engine/BellTimerHandler';

export const bellTimerScenario: ScenarioBase = {
  id: 'bell_timer',
  name: 'The Bell Timer',
  difficulty: 'easy',
  description:
    'Ring a bell twice with exactly 10 seconds between rings. Use the timer to help you.',
  optimalTurns: 4,
  timeLimitMs: 60000, // 60 seconds

  createHandler() {
    return new BellTimerHandler();
  },
};
