import React, { useState } from 'react';
import TerminalOutput from '@/components/terminal/terminalOutput';
import TerminalInput from '@/components/terminal/terminalInput';
import TerminalLine from '@/components/terminal/terminalLine';
import HeroBattleCard from '@/components/heroes/heroBattleCard';
import BattleLog from '@/components/battle/battleLog';
import ActionList from '@/components/battle/actionList';
import CommandReference from '@/components/layout/commandReference';
import { useGameState } from '@/hooks/useGameState';

const Battle = () => {
  const { gameState, processCommand, isMyTurn } = useGameState();
  const [selectedHero, setSelectedHero] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCommand = async (command: string) => {
    try {
      setError(null);
      await processCommand(command);
      
      // Reset selections after command
      setSelectedHero(null);
      setSelectedSkill(null);
      setSelectedTarget(null);
    } catch (error) {
      setError(`Error: ${error}`);
    }
  };

  const handleSkillSelection = (heroId: string, skillId: number) => {
    setSelectedHero(heroId);
    setSelectedSkill(skillId);
    setSelectedTarget(null);
  };

  const handleTargetSelection = (targetId: string) => {
    if (selectedHero && selectedSkill !== null) {
      processCommand(`use ${selectedHero} ${selectedSkill} ${targetId}`);
      
      // Reset selections
      setSelectedHero(null);
      setSelectedSkill(null);
      setSelectedTarget(null);
    } else {
      setSelectedTarget(targetId);
    }
  };

  const { 
    round, 
    currentTurn, 
    timeRemaining, 
    yourTeam, 
    opponentTeam, 
    battleLog, 
    availableActions,
    user 
  } = gameState;

  const isPlayerTurn = isMyTurn();

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
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-comic text-lg text-[hsl(var(--terminal-yellow))]">Match #{gameState.matchId}</div>
                  <div className="text-xs">Round: <span className="text-[hsl(var(--terminal-green))]">{round}</span> | Turn: <span className={isPlayerTurn ? 'text-[hsl(var(--terminal-blue))]' : 'text-[hsl(var(--terminal-red))]'}>{isPlayerTurn ? 'Your Move' : 'Opponent\'s Move'}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs">Time Remaining: <span className="text-[hsl(var(--terminal-red))]">{Math.floor(timeRemaining / 1000)}s</span></div>
                  <div className="text-xs">Match Length: <span>{Math.floor((Date.now() - (gameState.matchId ? parseInt(gameState.matchId.split('-')[1]) : 0)) / 1000)}s</span></div>
                </div>
              </div>
              
              {error && <TerminalLine type="error">{error}</TerminalLine>}
              
              {selectedHero && selectedSkill !== null && (
                <TerminalLine type="info">
                  Selected {yourTeam.find(h => h.heroId === selectedHero)?.name} with skill #{selectedSkill + 1}. 
                  Click on an enemy to target them.
                </TerminalLine>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Your Team */}
                <div className="bg-[hsl(var(--terminal-bg))]/30 rounded-lg p-3">
                  <div className="text-[hsl(var(--terminal-yellow))] mb-2 font-bold">YOUR TEAM</div>
                  
                  <div className="space-y-3">
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
                        onClick={() => {
                          // Handle self-targeting for ally/self skills
                          if (selectedHero && selectedSkill !== null) {
                            const skillInfo = availableActions.find(h => h.heroId === selectedHero)?.skills[selectedSkill];
                            if (skillInfo && (skillInfo.targeting === 'self' || skillInfo.targeting === 'ally')) {
                              handleTargetSelection(hero.heroId);
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Opponent's Team */}
                <div className="bg-[hsl(var(--terminal-bg))]/30 rounded-lg p-3">
                  <div className="text-[hsl(var(--terminal-red))] mb-2 font-bold">OPPONENT'S TEAM</div>
                  
                  <div className="space-y-3">
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
                        onClick={() => {
                          if (selectedHero && selectedSkill !== null && isPlayerTurn) {
                            const skillInfo = availableActions.find(h => h.heroId === selectedHero)?.skills[selectedSkill];
                            if (skillInfo && (skillInfo.targeting === 'enemy' || skillInfo.targeting === 'all_enemies')) {
                              handleTargetSelection(hero.heroId);
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Battle Log */}
              <BattleLog entries={battleLog} className="mb-4" />
              
              {/* Available Actions */}
              {isPlayerTurn && (
                <ActionList 
                  availableActions={availableActions} 
                  onUseSkill={handleSkillSelection}
                />
              )}
              
              {!isPlayerTurn && (
                <div className="bg-[hsl(var(--terminal-bg))]/30 p-3 rounded-lg">
                  <div className="text-[hsl(var(--terminal-blue))] font-bold mb-2">WAITING FOR OPPONENT...</div>
                  <div className="text-sm">Your opponent is thinking about their next move. Please wait.</div>
                </div>
              )}
            </div>
          </TerminalOutput>

          <TerminalInput onSubmit={handleCommand} disabled={!isPlayerTurn} />
        </div>
        
        <CommandReference phase="battle" />
      </main>
    </div>
  );
};

export default Battle;
