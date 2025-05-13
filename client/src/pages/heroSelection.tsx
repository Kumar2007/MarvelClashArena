import React, { useState } from 'react';
import TerminalOutput from '@/components/terminal/terminalOutput';
import TerminalInput from '@/components/terminal/terminalInput';
import TerminalLine from '@/components/terminal/terminalLine';
import HeroCard from '@/components/heroes/heroCard';
import CommandReference from '@/components/layout/commandReference';
import { useGameState } from '@/hooks/useGameState';

const HeroSelection = () => {
  const { gameState, processCommand } = useGameState();
  const [error, setError] = useState<string | null>(null);

  const handleCommand = async (command: string) => {
    try {
      setError(null);
      await processCommand(command);
    } catch (error) {
      setError(`Error: ${error}`);
    }
  };

  const { availableHeroes, selectedHeroes, playerReady, opponentReady } = gameState;

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
            <div className="animate-text-fade-in">
              <TerminalLine type="info" className="font-bold text-center text-xl">HERO DRAFT PHASE</TerminalLine>
              <TerminalLine className="text-center mb-4">Select your team of 5 Marvel heroes</TerminalLine>
              
              {error && <TerminalLine type="error">{error}</TerminalLine>}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {availableHeroes.map(hero => (
                  <HeroCard
                    key={hero.id}
                    id={hero.id}
                    name={hero.name}
                    archetype={hero.archetype}
                    heroClass={hero.class}
                    hp={hero.maxHp}
                    epRegen={hero.epRegen}
                    speed={hero.baseSpeed}
                    skills={hero.skills.map(skill => ({
                      name: skill.name,
                      energyCost: skill.energyCost,
                      damage: skill.baseDamage,
                      cooldown: skill.cooldown,
                      isAoe: skill.isAoe
                    }))}
                    isSelected={selectedHeroes.includes(hero.id)}
                    onSelect={() => processCommand(`select ${hero.id}`)}
                  />
                ))}
              </div>
              
              <div className="bg-[hsl(var(--terminal-bg))]/30 p-3 rounded-lg mb-4">
                <div className="mb-2 text-[hsl(var(--terminal-yellow))] font-bold">
                  Your Team ({selectedHeroes.length}/5):
                  {playerReady && <span className="ml-2 text-[hsl(var(--terminal-green))]">[READY]</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedHeroes.map(heroId => {
                    const hero = availableHeroes.find(h => h.id === heroId);
                    return (
                      <div key={heroId} className="px-3 py-1 bg-[hsl(var(--terminal-blue))]/20 rounded text-sm">
                        {hero?.name || heroId}
                      </div>
                    );
                  })}
                  
                  {Array.from({ length: Math.max(0, 5 - selectedHeroes.length) }).map((_, i) => (
                    <div key={i} className="px-3 py-1 border border-dashed border-[hsl(var(--terminal-text))]/30 rounded text-sm text-[hsl(var(--terminal-text))]/50">
                      Empty Slot
                    </div>
                  ))}
                </div>
                
                {opponentReady && (
                  <div className="mt-2 text-[hsl(var(--terminal-red))]">
                    Opponent is ready! Please complete your selection.
                  </div>
                )}
              </div>
              
              <TerminalLine>Type <span className="text-[hsl(var(--terminal-yellow))]">select [hero-id]</span> to add hero to your team</TerminalLine>
              <TerminalLine>Type <span className="text-[hsl(var(--terminal-yellow))]">remove [hero-id]</span> to remove hero from your team</TerminalLine>
              <TerminalLine>Type <span className="text-[hsl(var(--terminal-yellow))]">confirm</span> when your team is complete</TerminalLine>
            </div>
          </TerminalOutput>

          <TerminalInput onSubmit={handleCommand} />
        </div>
        
        <CommandReference phase="drafting" />
      </main>
    </div>
  );
};

export default HeroSelection;
