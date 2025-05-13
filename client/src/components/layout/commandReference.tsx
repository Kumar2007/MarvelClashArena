import React from 'react';

interface CommandReferenceProps {
  phase: 'login' | 'main-menu' | 'drafting' | 'battle' | 'complete';
}

const CommandReference: React.FC<CommandReferenceProps> = ({ phase }) => {
  return (
    <div className="hidden lg:block lg:w-1/4 bg-[hsl(var(--terminal-bg))]/40 rounded-lg border border-[hsl(var(--terminal-blue))]/30 p-4 h-min sticky top-4">
      <h2 className="font-comic text-xl text-[hsl(var(--terminal-yellow))] mb-4">Command Reference</h2>
      
      {phase === 'login' && (
        <div className="mb-6">
          <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Login Commands</h3>
          <ul className="space-y-1 text-sm">
            <li><span className="text-[hsl(var(--terminal-yellow))]">login [username] [password]</span> - Log in</li>
            <li><span className="text-[hsl(var(--terminal-yellow))]">register [username] [password]</span> - Register</li>
          </ul>
        </div>
      )}
      
      {phase === 'main-menu' && (
        <>
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Play Commands</h3>
            <ul className="space-y-1 text-sm">
              <li><span className="text-[hsl(var(--terminal-yellow))]">quickplay</span> - Join matchmaking queue</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">create [room-name]</span> - Create private lobby</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">join [room-code]</span> - Join private lobby</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">solo [difficulty]</span> - Play vs. AI</li>
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Profile Commands</h3>
            <ul className="space-y-1 text-sm">
              <li><span className="text-[hsl(var(--terminal-yellow))]">heroes</span> - View unlocked heroes</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">stats</span> - View your match history</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">leaderboard</span> - View top players</li>
            </ul>
          </div>
        </>
      )}
      
      {phase === 'drafting' && (
        <div className="mb-6">
          <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Draft Commands</h3>
          <ul className="space-y-1 text-sm">
            <li><span className="text-[hsl(var(--terminal-yellow))]">select [hero-id]</span> - Select hero</li>
            <li><span className="text-[hsl(var(--terminal-yellow))]">remove [hero-id]</span> - Remove selected hero</li>
            <li><span className="text-[hsl(var(--terminal-yellow))]">confirm</span> - Confirm team selection</li>
          </ul>
        </div>
      )}
      
      {phase === 'battle' && (
        <>
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Battle Commands</h3>
            <ul className="space-y-1 text-sm">
              <li><span className="text-[hsl(var(--terminal-yellow))]">use [hero] [skill] [target]</span> - Use hero skill</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">swap [position] [hero]</span> - Change hero position</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">status</span> - Show match status</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">surrender</span> - Forfeit match</li>
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Hero Classes</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-red))] mr-2"></span>
                <span className="text-[hsl(var(--terminal-red))] font-bold mr-1">Tank:</span>
                <span>High HP, defensive skills</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-yellow))] mr-2"></span>
                <span className="text-[hsl(var(--terminal-yellow))] font-bold mr-1">Blaster:</span>
                <span>High damage output</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-green))] mr-2"></span>
                <span className="text-[hsl(var(--terminal-green))] font-bold mr-1">Support:</span>
                <span>Healing and buffs</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-cyan))] mr-2"></span>
                <span className="text-[hsl(var(--terminal-cyan))] font-bold mr-1">Controller:</span>
                <span>Crowd control, debuffs</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-purple))] mr-2"></span>
                <span className="text-[hsl(var(--terminal-purple))] font-bold mr-1">Speedster:</span>
                <span>Fast attacks, evasion</span>
              </div>
            </div>
          </div>
        </>
      )}
      
      {phase === 'complete' && (
        <div className="mb-6">
          <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Result Commands</h3>
          <ul className="space-y-1 text-sm">
            <li><span className="text-[hsl(var(--terminal-yellow))]">menu</span> - Return to main menu</li>
          </ul>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">General Commands</h3>
        <ul className="space-y-1 text-sm">
          <li><span className="text-[hsl(var(--terminal-yellow))]">help</span> - Show all commands</li>
          <li><span className="text-[hsl(var(--terminal-yellow))]">clear</span> - Clear terminal</li>
        </ul>
      </div>
      
      <div className="text-xs text-center mt-2 text-[hsl(var(--terminal-text))]/60">
        Marvel Clash: Text-Based Arena v1.0
      </div>
    </div>
  );
};

export default CommandReference;
