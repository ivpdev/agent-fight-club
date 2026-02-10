export interface Room {
  id: string;
  name: string;
  description: string;
  exits: Record<string, string>; // direction -> roomId
  items: string[];
  interactables?: Record<string, Interactable>;
  onEnter?: (state: GameState) => string | null;
}

export interface Interactable {
  description: string;
  requiresItem?: string;
  onUse?: (state: GameState) => { message: string; stateChanges?: Partial<GameState> };
}

export interface GameState {
  currentRoom: string;
  inventory: string[];
  flags: Record<string, boolean>;
  gameOver: boolean;
}

export interface OutputLine {
  text: string;
  type: 'narrative' | 'error' | 'system' | 'command' | 'ascii';
}
