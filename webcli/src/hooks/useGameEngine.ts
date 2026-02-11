import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, OutputLine } from '../game/types';
import { createRooms, getInitialState, ASCII_TITLE, INTRO_TEXT } from '../game/gameData';
import { parseCommand } from '../game/commandParser';

export function useGameEngine() {
  const rooms = useRef(createRooms());
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [outputHistory, setOutputHistory] = useState<OutputLine[]>(() => {
    const initial: OutputLine[] = [
      { text: ASCII_TITLE, type: 'ascii' },
      { text: '', type: 'narrative' },
      ...INTRO_TEXT.map((text) => ({ text, type: 'narrative' as const })),
      { text: '', type: 'narrative' },
    ];
    // Add initial room description
    const startRoom = rooms.current['entry_hall'];
    initial.push(
      { text: `── ${startRoom.name.toUpperCase()} ──`, type: 'system' },
      { text: startRoom.description, type: 'narrative' },
      { text: `Exits: ${Object.keys(startRoom.exits).join(', ')}`, type: 'system' },
      { text: '', type: 'narrative' }
    );
    return initial;
  });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const processCommand = useCallback(
    (input: string) => {
      if (gameState.gameOver) {
        setOutputHistory((prev) => [
          ...prev,
          { text: `> ${input}`, type: 'command' },
          { text: 'The game is over. Refresh to play again.', type: 'system' },
        ]);
        return;
      }

      const result = parseCommand(input, gameState, rooms.current);

      setOutputHistory((prev) => [
        ...prev,
        { text: `> ${input}`, type: 'command' },
        ...result.output,
        { text: '', type: 'narrative' },
      ]);

      if (result.newState) {
        setGameState((prev) => ({ ...prev, ...result.newState }));
      }

      setCommandHistory((prev) => [input, ...prev]);
      setHistoryIndex(-1);
    },
    [gameState]
  );

  const navigateHistory = useCallback(
    (direction: 'up' | 'down') => {
      if (direction === 'up') {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        return commandHistory[newIndex] || '';
      } else {
        const newIndex = Math.max(historyIndex - 1, -1);
        setHistoryIndex(newIndex);
        return newIndex === -1 ? '' : commandHistory[newIndex] || '';
      }
    },
    [commandHistory, historyIndex]
  );

  const resetGame = useCallback(() => {
    rooms.current = createRooms();
    setGameState(getInitialState());
    setOutputHistory([
      { text: ASCII_TITLE, type: 'ascii' },
      { text: '', type: 'narrative' },
      ...INTRO_TEXT.map((text) => ({ text, type: 'narrative' as const })),
      { text: '', type: 'narrative' },
    ]);
    setCommandHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    outputHistory,
    gameState,
    processCommand,
    navigateHistory,
    resetGame,
  };
}
