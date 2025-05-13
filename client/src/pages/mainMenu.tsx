import React, { useState } from 'react';
import TerminalOutput from '@/components/terminal/terminalOutput';
import TerminalInput from '@/components/terminal/terminalInput';
import TerminalLine from '@/components/terminal/terminalLine';
import CommandReference from '@/components/layout/commandReference';
import { useGameState } from '@/hooks/useGameState';

const MainMenu = () => {
  const { gameState, processCommand } = useGameState();
  const [status, setStatus] = useState<string | null>(null);
  const [showingHeroes, setShowingHeroes] = useState(false);
  const [showingStats, setShowingStats] = useState(false);
  const [showingLeaderboard, setShowingLeaderboard] = useState(false);

  const handleCommand = async (command: string) => {
    try {
      if (command.toLowerCase() === 'heroes') {
        setShowingHeroes(true);
        setShowingStats(false);
        setShowingLeaderboard(false);
        return;
      } else if (command.toLowerCase() === 'stats') {
        setShowingHeroes(false);
        setShowingStats(true);
        setShowingLeaderboard(false);
        return;
      } else if (command.toLowerCase() === 'leaderboard') {
        setShowingHeroes(false);
        setShowingStats(false);
        setShowingLeaderboard(true);
        return;
      }
      
      setStatus('Processing command...');
      await processCommand(command);
      setStatus(null);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const user = gameState.user;

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
              <TerminalLine type="success">Welcome back, Commander <span className="text-[hsl(var(--terminal-yellow))]">{user?.username}</span>!</TerminalLine>
              <TerminalLine type="success">Current Rank: <span className="text-[hsl(var(--terminal-yellow))]">{user?.rank}</span> (ELO: <span className="text-[hsl(var(--terminal-yellow))]">{user?.elo}</span>)</TerminalLine>
              <TerminalLine type="info">Last login: <span>{new Date(user?.lastLogin || '').toLocaleString()}</span></TerminalLine>
              <TerminalLine>--------------------------------------------</TerminalLine>
              
              <TerminalLine type="warning" className="font-bold">AVAILABLE COMMANDS:</TerminalLine>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="bg-[hsl(var(--terminal-bg))]/60 p-3 rounded border border-[hsl(var(--terminal-blue))]/30">
                  <div className="text-[hsl(var(--terminal-cyan))]">Play Commands:</div>
                  <div className="pl-4">
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">quickplay</span> - Join matchmaking queue</TerminalLine>
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">create [room-name]</span> - Create private lobby</TerminalLine>
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">join [room-code]</span> - Join private lobby</TerminalLine>
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">solo [difficulty]</span> - Play vs. AI</TerminalLine>
                  </div>
                </div>
                
                <div className="bg-[hsl(var(--terminal-bg))]/60 p-3 rounded border border-[hsl(var(--terminal-blue))]/30">
                  <div className="text-[hsl(var(--terminal-cyan))]">Profile Commands:</div>
                  <div className="pl-4">
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">heroes</span> - View unlocked heroes</TerminalLine>
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">stats</span> - View your match history</TerminalLine>
                    <TerminalLine><span className="text-[hsl(var(--terminal-yellow))]">leaderboard</span> - View top players</TerminalLine>
                  </div>
                </div>
              </div>
              
              {status && <TerminalLine type="info">{status}</TerminalLine>}
              
              {showingHeroes && (
                <div className="mt-4">
                  <TerminalLine type="info" className="font-bold">YOUR UNLOCKED HEROES:</TerminalLine>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {user?.unlockedHeroes.map((heroId) => (
                      <div key={heroId} className="bg-[hsl(var(--terminal-bg))]/60 p-2 rounded">
                        <span className="text-[hsl(var(--terminal-yellow))]">{heroId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {showingStats && (
                <div className="mt-4">
                  <TerminalLine type="info" className="font-bold">YOUR STATS:</TerminalLine>
                  <div className="bg-[hsl(var(--terminal-bg))]/60 p-3 rounded mt-2">
                    <TerminalLine>Total Experience: <span className="text-[hsl(var(--terminal-yellow))]">{user?.experience}</span></TerminalLine>
                    <TerminalLine>Current Rank: <span className="text-[hsl(var(--terminal-yellow))]">{user?.rank}</span></TerminalLine>
                    <TerminalLine>ELO Rating: <span className="text-[hsl(var(--terminal-yellow))]">{user?.elo}</span></TerminalLine>
                    <TerminalLine>Unlocked Heroes: <span className="text-[hsl(var(--terminal-yellow))]">{user?.unlockedHeroes.length}</span></TerminalLine>
                  </div>
                </div>
              )}
              
              {showingLeaderboard && (
                <div className="mt-4">
                  <TerminalLine type="info" className="font-bold">LEADERBOARD:</TerminalLine>
                  <div className="bg-[hsl(var(--terminal-bg))]/60 p-3 rounded mt-2">
                    <TerminalLine type="warning">Fetching leaderboard data...</TerminalLine>
                  </div>
                </div>
              )}
              
              <TerminalLine className="mt-4">Type a command to continue...</TerminalLine>
            </div>
          </TerminalOutput>

          <TerminalInput onSubmit={handleCommand} />
        </div>
        
        <CommandReference phase="main-menu" />
      </main>
    </div>
  );
};

export default MainMenu;
