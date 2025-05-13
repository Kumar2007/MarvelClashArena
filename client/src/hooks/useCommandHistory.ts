import { useState, useCallback } from 'react';

export function useCommandHistory(maxHistory = 50) {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addCommand = useCallback((command: string) => {
    if (!command.trim()) return;
    
    setHistory(prev => {
      // Filter out duplicate consecutive commands
      if (prev.length > 0 && prev[0] === command) {
        return prev;
      }
      
      // Add new command to the start of the array
      const newHistory = [command, ...prev];
      
      // Limit history length
      if (newHistory.length > maxHistory) {
        return newHistory.slice(0, maxHistory);
      }
      
      return newHistory;
    });
    
    // Reset index
    setHistoryIndex(-1);
  }, [maxHistory]);

  const getPreviousCommand = useCallback(() => {
    if (history.length === 0) return '';
    
    const newIndex = Math.min(historyIndex + 1, history.length - 1);
    setHistoryIndex(newIndex);
    return history[newIndex];
  }, [history, historyIndex]);

  const getNextCommand = useCallback(() => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1);
      return '';
    }
    
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    return history[newIndex];
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    addCommand,
    getPreviousCommand,
    getNextCommand,
    clearHistory
  };
}
