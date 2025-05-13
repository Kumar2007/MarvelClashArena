import React, { useState } from 'react';
import TerminalOutput from '@/components/terminal/terminalOutput';
import TerminalInput from '@/components/terminal/terminalInput';
import TerminalLine from '@/components/terminal/terminalLine';
import { useGameState } from '@/hooks/useGameState';
import { useWebSocket } from '@/hooks/useWebSocket';

const Login = () => {
  const { processCommand } = useGameState();
  const { connectionStatus } = useWebSocket();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCommand = async (command: string) => {
    if (connectionStatus !== 'connected') {
      setErrorMessage('Connection to server not established. Please wait...');
      return;
    }

    try {
      await processCommand(command);
    } catch (error) {
      setErrorMessage(`Error processing command: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--terminal-bg))] text-[hsl(var(--terminal-text))] font-terminal">
      {/* Header with Marvel Clash logo */}
      <header className="py-4 border-b border-[hsl(var(--terminal-blue))]/30">
        <div className="container mx-auto px-4">
          <h1 className="font-comic text-4xl md:text-6xl text-center text-[hsl(var(--terminal-red))] tracking-wider">
            <span className="text-[hsl(var(--terminal-yellow))]">MARVEL</span> CLASH
            <span className="block text-xl md:text-2xl text-[hsl(var(--terminal-text))] mt-1">Text-Based Arena</span>
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        <div className="flex-grow flex flex-col lg:w-3/4 bg-[hsl(var(--terminal-bg))]/40 rounded-lg border border-[hsl(var(--terminal-blue))]/30 shadow-lg overflow-hidden">
          <TerminalOutput>
            <div className="flex flex-col h-full justify-center items-center text-center space-y-6 py-8 animate-text-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className="rounded-lg shadow-lg max-w-md">
                <rect width="800" height="400" fill="#1a1b26" />
                <text x="50%" y="50%" textAnchor="middle" fill="#d8dee9" fontSize="20" fontFamily="'JetBrains Mono', monospace">Marvel Heroes Assemble</text>
              </svg>
              
              <h2 className="font-comic text-3xl text-[hsl(var(--terminal-yellow))]">Welcome, Commander!</h2>
              
              <div className="text-[hsl(var(--terminal-text))] max-w-lg">
                <p className="mb-4">Marvel Clash is a turn-based arena game where you draft and command Marvel heroes in epic battles.</p>
                <p className="text-[hsl(var(--terminal-green))]">Type <span className="bg-[hsl(var(--terminal-bg))]/60 px-2 py-1 rounded">login [username] [password]</span> to begin your journey.</p>
                <p className="text-[hsl(var(--terminal-blue))] mt-2">New player? Type <span className="bg-[hsl(var(--terminal-bg))]/60 px-2 py-1 rounded">register [username] [password]</span> to join.</p>
              </div>
              
              {errorMessage && (
                <TerminalLine type="error">{errorMessage}</TerminalLine>
              )}
              
              {connectionStatus !== 'connected' && (
                <TerminalLine type="warning">Establishing connection to server... {connectionStatus}</TerminalLine>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-[hsl(var(--terminal-bg))]/60 p-4 rounded-lg border border-[hsl(var(--terminal-blue))]/30">
                  <i className="ri-sword-line text-3xl text-[hsl(var(--terminal-yellow))]"></i>
                  <h3 className="font-comic text-lg mt-2">Battle Arena</h3>
                  <p className="text-sm">Fight online against other players or AI opponents</p>
                </div>
                <div className="bg-[hsl(var(--terminal-bg))]/60 p-4 rounded-lg border border-[hsl(var(--terminal-blue))]/30">
                  <i className="ri-team-line text-3xl text-[hsl(var(--terminal-purple))]"></i>
                  <h3 className="font-comic text-lg mt-2">Hero Draft</h3>
                  <p className="text-sm">Choose from 15+ Marvel heroes with unique abilities</p>
                </div>
                <div className="bg-[hsl(var(--terminal-bg))]/60 p-4 rounded-lg border border-[hsl(var(--terminal-blue))]/30">
                  <i className="ri-trophy-line text-3xl text-[hsl(var(--terminal-cyan))]"></i>
                  <h3 className="font-comic text-lg mt-2">Progression</h3>
                  <p className="text-sm">Unlock new heroes and upgrades as you win battles</p>
                </div>
              </div>
            </div>
          </TerminalOutput>

          <TerminalInput 
            onSubmit={handleCommand} 
            placeholder="Type login [username] [password] or register [username] [password]..."
            disabled={connectionStatus !== 'connected'}
          />
        </div>
        
        {/* Game Info Panel - only shows on large screens */}
        <div className="hidden lg:block lg:w-1/4 bg-[hsl(var(--terminal-bg))]/40 rounded-lg border border-[hsl(var(--terminal-blue))]/30 p-4 h-min sticky top-4">
          <h2 className="font-comic text-xl text-[hsl(var(--terminal-yellow))] mb-4">Command Reference</h2>
          
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">Login Commands</h3>
            <ul className="space-y-1 text-sm">
              <li><span className="text-[hsl(var(--terminal-yellow))]">login [username] [password]</span> - Log in</li>
              <li><span className="text-[hsl(var(--terminal-yellow))]">register [username] [password]</span> - Register</li>
            </ul>
          </div>
          
          <div className="mb-6">
            <h3 className="text-[hsl(var(--terminal-blue))] text-lg mb-2">About the Game</h3>
            <p className="text-sm mb-2">Marvel Clash is a text-based multiplayer game featuring:</p>
            <ul className="list-disc pl-4 text-sm space-y-1">
              <li>Turn-based strategic combat</li>
              <li>15+ Marvel heroes to collect</li>
              <li>Unique hero abilities and classes</li>
              <li>Real-time online matchmaking</li>
              <li>Bot opponents with varying difficulty</li>
              <li>Private matches with friends</li>
            </ul>
          </div>
          
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" className="rounded-lg shadow-lg w-full mt-4">
            <rect width="400" height="300" fill="#1a1b26" />
            <text x="50%" y="50%" textAnchor="middle" fill="#d8dee9" fontSize="16" fontFamily="'JetBrains Mono', monospace">Marvel Heroes</text>
          </svg>
          
          <div className="text-xs text-center mt-2 text-[hsl(var(--terminal-text))]/60">
            Marvel Clash: Text-Based Arena v1.0
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
