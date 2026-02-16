import { Scenario } from '../types';
import { libraryScenario } from './library';
import { bellTimerScenario } from './bellTimer';

export const scenarios: Scenario[] = [libraryScenario, bellTimerScenario];

export { libraryScenario, bellTimerScenario };
