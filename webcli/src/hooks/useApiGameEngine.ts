import { useState, useCallback, useRef, useEffect } from 'react';
import { OutputLine } from '../game/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ASCII_TITLE = `
 █████╗ ██╗     ███████╗███████╗ ██████╗ █████╗ ██████╗ ███████╗    ██████╗  ██████╗  ██████╗ ███╗   ███╗
██╔══██╗██║     ██╔════╝██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝    ██╔══██╗██╔═══██╗██╔═══██╗████╗ ████║
███████║██║     █████╗  ███████╗██║     ███████║██████╔╝█████╗      ██████╔╝██║   ██║██║   ██║██╔████╔██║
██╔══██║██║     ██╔══╝  ╚════██║██║     ██╔══██║██╔═══╝ ██╔══╝      ██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║
██║  ██║██║     ███████╗███████║╚██████╗██║  ██║██║     ███████╗    ██║  ██║╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
╚═╝  ╚═╝╚═╝     ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝     ╚══════╝    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝
`;

export function useApiGameEngine() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [outputHistory, setOutputHistory] = useState<OutputLine[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const initializeRef = useRef(false);

  // Initialize session on mount
  useEffect(() => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    const initSession = async () => {
      try {
        setOutputHistory([
          { text: ASCII_TITLE, type: 'ascii' },
          { text: '', type: 'narrative' },
          { text: 'Connecting to server...', type: 'system' }
        ]);

        const response = await fetch(`${API_BASE}/cli/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        setSessionId(data.sessionId);

        // Parse initial output
        const lines = parseOutput(data.output);
        setOutputHistory(lines);

        // Auto-execute help command
        await executeCommandDirect(data.sessionId, 'help');
      } catch (error) {
        setOutputHistory([
          { text: 'Failed to connect to server', type: 'error' },
          { text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' },
        ]);
      }
    };

    initSession();
  }, []);

  const parseOutput = (outputText: string): OutputLine[] => {
    const lines = outputText.split('\n');
    const result: OutputLine[] = [];

    for (const line of lines) {
      if (!line.trim()) {
        result.push({ text: '', type: 'narrative' });
        continue;
      }

      // Detect type based on content
      if (line.startsWith('✓') || line.startsWith('✗')) {
        result.push({ text: line, type: 'narrative' });
      } else if (line.startsWith('Error:') || line.includes('✗')) {
        result.push({ text: line, type: 'error' });
      } else if (
        line.match(/^(Game ID|Status|Turn|Score|Time|Exits|Objects|Inventory|Available|Usage|Tip):/) ||
        line.startsWith('  ') ||
        line.startsWith('──')
      ) {
        result.push({ text: line, type: 'system' });
      } else {
        result.push({ text: line, type: 'narrative' });
      }
    }

    return result;
  };

  const executeCommandDirect = async (sid: string, command: string) => {
    try {
      const response = await fetch(`${API_BASE}/cli/sessions/${sid}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (response.ok) {
        const lines = parseOutput(data.output);
        setOutputHistory((prev) => [
          ...prev,
          { text: `> ${command}`, type: 'command' },
          ...lines,
          { text: '', type: 'narrative' },
        ]);
      } else {
        setOutputHistory((prev) => [
          ...prev,
          { text: `> ${command}`, type: 'command' },
          { text: `Error: ${data.message || 'Request failed'}`, type: 'error' },
          { text: '', type: 'narrative' },
        ]);
      }
    } catch (error) {
      setOutputHistory((prev) => [
        ...prev,
        { text: `> ${command}`, type: 'command' },
        { text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, type: 'error' },
        { text: '', type: 'narrative' },
      ]);
    }
  };

  const processCommand = useCallback(
    async (input: string) => {
      if (!sessionId) {
        setOutputHistory((prev) => [
          ...prev,
          { text: `> ${input}`, type: 'command' },
          { text: 'No active session', type: 'error' },
        ]);
        return;
      }

      setIsLoading(true);
      setCommandHistory((prev) => [input, ...prev]);
      setHistoryIndex(-1);

      await executeCommandDirect(sessionId, input);
      setIsLoading(false);
    },
    [sessionId]
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

  return {
    outputHistory,
    processCommand,
    navigateHistory,
    gameState: { gameOver: false }, // Stub for compatibility
    isLoading,
  };
}
