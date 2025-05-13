import React, { useState, useRef, useEffect } from 'react';
import { useCommandHistory } from '@/hooks/useCommandHistory';

interface TerminalInputProps {
  onSubmit: (command: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TerminalInput: React.FC<TerminalInputProps> = ({ 
  onSubmit, 
  placeholder = 'Type a command...', 
  disabled = false 
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCommand, getPreviousCommand, getNextCommand } = useCommandHistory();

  // Focus input on mount and when component updates
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  // Handle click anywhere to focus input
  useEffect(() => {
    const handleDocumentClick = () => {
      if (!disabled && inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (input.trim() && !disabled) {
      onSubmit(input);
      addCommand(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow up for previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCommand = getPreviousCommand();
      if (prevCommand) {
        setInput(prevCommand);
      }
    }
    
    // Handle arrow down for next command
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCommand = getNextCommand();
      setInput(nextCommand);
    }
  };

  return (
    <div className="bg-[hsl(var(--terminal-bg))]/80 border-t border-[hsl(var(--terminal-blue))]/30 p-3">
      <form onSubmit={handleSubmit} className="flex">
        <span className="text-[hsl(var(--terminal-green))] mr-2">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-grow bg-transparent border-none outline-none text-[hsl(var(--terminal-text))] focus:text-[hsl(var(--terminal-yellow))] disabled:opacity-50"
          aria-label="Terminal input"
        />
      </form>
    </div>
  );
};

export default TerminalInput;
