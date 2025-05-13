import React from 'react';
import TerminalOutput from '@/components/terminal/terminalOutput';
import TerminalInput from '@/components/terminal/terminalInput';
import TerminalLine from '@/components/terminal/terminalLine';
import HeroBattleCard from '@/components/heroes/heroBattleCard';
import CommandReference from '@/components/layout/commandReference';
import { useGameState } from '@/hooks/useGameState';
import { useLocation } from "wouter";

const MatchResults = () => {
  const { gameState, processCommand, resetGameState } = useGameState();
  const [_, setLocation] = useLocation();

  const handleCommand = async (command: string) => {
    if (command.toLowerCase() === 'menu') {
      resetGameState();
      setLocation('/main-menu');
    } else {
      await processCommand(command);
    }
  };

  const { matchResults, yourTeam, opponentTeam, battleLog, user } = gameState;
  
  // Calculate some statistics from the battle
  const heroesLost = yourTeam.filter(hero => !hero.isAlive).length;
  const totalDamageDealt = 1000; // This would be calculated from battle log in a real implementation
  const highestSingleAttack = 150; // This would be calculated from battle log in a real implementation

  const isVictory = matchResults?.winnerId === user?.id;

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--terminal-bg))] text-[hsl(var(--terminal-text))] font-terminal">
      <header className="py-4 border-b border-[hsl(var(--terminal-blue))]/30">
        <div className="container mx-auto px-4">
          <h1 className="font-comic text-4xl md:text-6xl text-center text-[hsl(var(--terminal-red))] tracking-wider">
            <span className="text-[hsl(var(--terminal-yellow))]">MARVEL</span> CLASH
            <span className="block text-xl md:text-2xl text-[hsl(var(--terminal-text))] mt-1">Text-Based Arena</span>
          </h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        <div className="flex-grow flex flex-col lg:w-3/4 bg-[hsl(var(--terminal-bg))]/40 rounded-lg border border-[hsl(var(--terminal-blue))]/30 shadow-lg overflow-hidden">
          <TerminalOutput>
            <div className="text-center py-8 animate-text-fade-in">
              {/* Battle scene visualization */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className="rounded-lg shadow-lg mx-auto mb-6">
                <rect width="800" height="400" fill="#1a1b26" />
                <text x="50%" y="50%" textAnchor="middle" fill="#d8dee9" fontSize="24" fontFamily="'Bangers', cursive">
                  {isVictory ? 'VICTORY!' : 'DEFEAT!'}
                </text>
                <text x="50%" y="60%" textAnchor="middle" fill="#7aa2f7" fontSize="16" fontFamily="'JetBrains Mono', monospace">
                  Epic battle scene
                </text>
              </svg>
              
              <h2 className={`font-comic text-4xl ${isVictory ? 'text-[hsl(var(--terminal-green))]' : 'text-[hsl(var(--terminal-red))]'} mb-4`}>
                {isVictory ? 'VICTORY!' : 'DEFEAT!'}
              </h2>
              
              <div className="text-[hsl(var(--terminal-yellow))] text-lg mb-6">
                Match Duration: {formatDuration(matchResults?.matchDuration || 0)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-[hsl(var(--terminal-bg))]/40 p-4 rounded-lg">
                  <h3 className="font-comic text-xl text-[hsl(var(--terminal-blue))] mb-2">Match Statistics</h3>
                  <div className="space-y-1 text-left">
                    <div className="flex justify-between">
                      <span>Total Damage Dealt:</span>
                      <span className="text-[hsl(var(--terminal-red))]">{totalDamageDealt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Highest Single Attack:</span>
                      <span className="text-[hsl(var(--terminal-red))]">{highestSingleAttack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heroes Lost:</span>
                      <span>{heroesLost}/5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ELO Change:</span>
                      <span className={matchResults?.eloChange && matchResults.eloChange > 0 ? 'text-[hsl(var(--terminal-green))]' : 'text-[hsl(var(--terminal-red))]'}>
                        {matchResults?.eloChange && matchResults.eloChange > 0 ? '+' : ''}{matchResults?.eloChange}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[hsl(var(--terminal-bg))]/40 p-4 rounded-lg">
                  <h3 className="font-comic text-xl text-[hsl(var(--terminal-purple))] mb-2">Rewards</h3>
                  <div className="space-y-3 text-left">
                    <div>
                      <div className="text-[hsl(var(--terminal-yellow))]">Experience</div>
                      <div className="flex justify-between text-sm">
                        <span>Hero Experience:</span>
                        <span className="text-[hsl(var(--terminal-green))]">+{matchResults?.experience || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[hsl(var(--terminal-yellow))]">Unlocks Progress</div>
                      <div className="text-sm">Next Hero Unlock: 2/3 wins needed</div>
                      <div className="w-full bg-[hsl(var(--terminal-bg))] h-1.5 rounded-full mt-1">
                        <div className="bg-[hsl(var(--terminal-purple))] h-full rounded-full" style={{ width: '66%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 mb-4">
                <h3 className="font-comic text-xl text-[hsl(var(--terminal-blue))] mb-2">Final Team Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                  <div>
                    <h4 className="text-[hsl(var(--terminal-cyan))] mb-2">Your Team</h4>
                    <div className="space-y-2">
                      {yourTeam.map(hero => (
                        <HeroBattleCard
                          key={hero.heroId}
                          name={hero.name}
                          currentHp={hero.currentHp}
                          maxHp={hero.maxHp}
                          currentEp={hero.currentEp}
                          maxEp={hero.maxEp}
                          position={hero.position}
                          isAlive={hero.isAlive}
                          effects={hero.effects}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[hsl(var(--terminal-red))] mb-2">Opponent's Team</h4>
                    <div className="space-y-2">
                      {opponentTeam.map(hero => (
                        <HeroBattleCard
                          key={hero.heroId}
                          name={hero.name}
                          currentHp={hero.currentHp}
                          maxHp={hero.maxHp}
                          currentEp={hero.currentEp}
                          maxEp={hero.maxEp}
                          position={hero.position}
                          isAlive={hero.isAlive}
                          isEnemy={true}
                          effects={hero.effects}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <button 
                  className="px-4 py-2 bg-[hsl(var(--terminal-blue))] text-white rounded hover:bg-[hsl(var(--terminal-blue))]/80 transition-colors"
                  onClick={() => handleCommand('menu')}
                >
                  Return to Main Menu
                </button>
              </div>
            </div>
          </TerminalOutput>

          <TerminalInput onSubmit={handleCommand} placeholder="Type 'menu' to return to main menu..." />
        </div>
        
        <CommandReference phase="complete" />
      </main>
    </div>
  );
};

// Helper function to format duration in seconds to mm:ss format
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export default MatchResults;
