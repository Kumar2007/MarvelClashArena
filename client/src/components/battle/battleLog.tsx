import React, { useRef, useEffect } from 'react';
import TerminalLine from '../terminal/terminalLine';

interface BattleLogEntry {
  round: number;
  text: string;
  type: 'action' | 'system' | 'effect';
}

interface BattleLogProps {
  entries: BattleLogEntry[];
  className?: string;
}

const BattleLog: React.FC<BattleLogProps> = ({ entries, className = '' }) => {
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  // Get terminal line type based on entry type
  const getLineType = (entryType: string) => {
    switch(entryType) {
      case 'action': return 'default';
      case 'system': return 'info';
      case 'effect': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className={`bg-[hsl(var(--terminal-bg))]/40 rounded-lg p-3 ${className}`}>
      <div className="text-[hsl(var(--terminal-yellow))] font-bold mb-2">BATTLE LOG</div>
      
      <div 
        ref={logRef}
        className="text-xs space-y-1 h-40 overflow-y-auto"
      >
        {entries.length === 0 ? (
          <TerminalLine type="info">Waiting for battle to begin...</TerminalLine>
        ) : (
          entries.map((entry, index) => (
            <TerminalLine 
              key={index} 
              type={getLineType(entry.type)}
              animate={index === entries.length - 1 ? 'fade-in' : 'none'}
            >
              <span className="text-[hsl(var(--terminal-cyan))]">[Round {entry.round}]</span> {entry.text}
            </TerminalLine>
          ))
        )}
      </div>
    </div>
  );
};

export default BattleLog;
