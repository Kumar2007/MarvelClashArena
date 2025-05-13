import React, { useRef, useEffect } from 'react';
import TerminalLine from './terminalLine';

interface TerminalOutputProps {
  children: React.ReactNode;
  className?: string;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ children, className = '' }) => {
  const outputRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever content changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [children]);

  return (
    <div 
      ref={outputRef} 
      className={`terminal-output flex-grow overflow-y-auto p-4 ${className}`}
    >
      {children}
    </div>
  );
};

export default TerminalOutput;
