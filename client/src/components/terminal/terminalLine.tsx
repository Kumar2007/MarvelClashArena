import React from 'react';

interface TerminalLineProps {
  children: React.ReactNode;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'system';
  className?: string;
  animate?: 'type' | 'blink' | 'fade-in' | 'none';
}

const TerminalLine: React.FC<TerminalLineProps> = ({ 
  children, 
  type = 'default', 
  className = '',
  animate = 'none'
}) => {
  // Define color classes based on type
  const typeClasses = {
    default: 'text-[hsl(var(--terminal-text))]',
    success: 'text-[hsl(var(--terminal-green))]',
    error: 'text-[hsl(var(--terminal-red))]',
    warning: 'text-[hsl(var(--terminal-yellow))]',
    info: 'text-[hsl(var(--terminal-blue))]',
    system: 'text-[hsl(var(--terminal-purple))]',
  };

  // Define animation classes
  const animationClasses = {
    'type': 'battle-narration',
    'blink': 'animate-text-blink',
    'fade-in': 'animate-text-fade-in',
    'none': ''
  };

  return (
    <div className={`terminal-line ${typeClasses[type]} ${animationClasses[animate]} ${className}`}>
      {children}
    </div>
  );
};

export default TerminalLine;
