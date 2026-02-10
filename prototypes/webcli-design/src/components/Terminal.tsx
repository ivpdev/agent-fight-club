import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { OutputLine } from '../game/types';

const Terminal: React.FC = () => {
  const { outputHistory, processCommand, navigateHistory, gameState } = useGameEngine();
  const [inputValue, setInputValue] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [displayedLines, setDisplayedLines] = useState<OutputLine[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingQueue = useRef<OutputLine[]>([]);
  const lastProcessedIndex = useRef(0);

  // Typewriter effect for new lines
  useEffect(() => {
    const newLines = outputHistory.slice(lastProcessedIndex.current);
    if (newLines.length === 0) return;
    lastProcessedIndex.current = outputHistory.length;

    // For initial load or ascii art, add immediately
    if (displayedLines.length === 0) {
      setDisplayedLines(outputHistory);
      return;
    }

    typingQueue.current.push(...newLines);

    if (!isTyping) {
      processQueue();
    }
  }, [outputHistory]);

  const processQueue = useCallback(() => {
    if (typingQueue.current.length === 0) {
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    const line = typingQueue.current.shift()!;

    if (line.type === 'command' || line.type === 'system' || line.type === 'ascii' || line.text === '') {
      setDisplayedLines((prev) => [...prev, line]);
      setTimeout(processQueue, 30);
    } else {
      // Typewriter for narrative/error text
      let charIndex = 0;
      const fullText = line.text;
      const partialLine = { ...line, text: '' };
      setDisplayedLines((prev) => [...prev, partialLine]);

      const typeChar = () => {
        charIndex++;
        setDisplayedLines((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...line, text: fullText.slice(0, charIndex) };
          return updated;
        });

        if (charIndex < fullText.length) {
          setTimeout(typeChar, 4);
        } else {
          setTimeout(processQueue, 20);
        }
      };
      typeChar();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedLines]);

  // Focus input on click anywhere
  const handleContainerClick = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    processCommand(inputValue);
    setInputValue('');
    setCursorPos(0);
  };

  const updateCursorPos = () => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart ?? inputValue.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = navigateHistory('up');
      setInputValue(prev);
      setCursorPos(prev.length);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = navigateHistory('down');
      setInputValue(next);
      setCursorPos(next.length);
    } else {
      // Defer cursor pos read to after the DOM updates
      setTimeout(updateCursorPos, 0);
    }
  };

  const getLineClassName = (type: OutputLine['type']) => {
    switch (type) {
      case 'narrative':
        return 'text-terminal-amber';
      case 'error':
        return 'text-terminal-red';
      case 'system':
        return 'text-terminal-dim';
      case 'command':
        return 'text-terminal-dim';
      case 'ascii':
        return 'text-terminal-amber font-bold';
      default:
        return 'text-terminal-amber';
    }
  };

  return (
    <div
      className="terminal-container"
      onClick={handleContainerClick}
    >
      {/* CRT flicker */}

      {/* Terminal content */}
      <div
        ref={scrollRef}
        className="terminal-scroll"
      >
        <div className="terminal-output">
          {displayedLines.map((line, idx) => (
            <div key={idx} className={getLineClassName(line.type)}>
              {line.type === 'ascii' ? (
                <pre className="text-[0.4rem] sm:text-[0.55rem] md:text-xs leading-tight">{line.text}</pre>
              ) : (
                <span className="whitespace-pre-wrap">{line.text}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input line */}
      <form onSubmit={handleSubmit} className="terminal-input-line">
        <span className="text-terminal-amber mr-2 shrink-0">{'>'}</span>
        <div className="relative flex-1 overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setTimeout(updateCursorPos, 0);
            }}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPos}
            className="terminal-input"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Terminal command input"
          />
          {/* Invisible text mirror to position cursor */}
          <span className="terminal-input-mirror" aria-hidden="true">
            {inputValue.slice(0, cursorPos)}
            <span className="terminal-cursor" />
          </span>
        </div>
      </form>
    </div>
  );
};

export default Terminal;
