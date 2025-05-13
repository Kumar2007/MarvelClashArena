import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WebSocketMessage } from '@shared/schema';

type Hero = {
  id: string;
  name: string;
  class: string;
  archetype: string;
  maxHp: number;
  epMax: number;
  epRegen: number;
  baseSpeed: number;
  skills: {
    id: number;
    name: string;
    description: string;
    energyCost: number;
    cooldown: number;
    baseDamage: number;
    healing: number;
    targeting: string;
    isAoe: boolean;
    isMultiTarget: boolean;
    narration: string;
  }[];
  description: string;
};

type HeroInstance = {
  heroId: string;
  name: string;
  currentHp: number;
  maxHp: number;
  currentEp: number;
  maxEp: number;
  position: 'front' | 'back';
  isAlive: boolean;
  effects: {
    type: string;
    duration: number;
    value?: number;
    source: string;
  }[];
};

type BattleLogEntry = {
  round: number;
  text: string;
  type: 'action' | 'system' | 'effect';
};

type GameAction = {
  heroId: string;
  skillId: number;
  targetId: string;
};

type GamePhase = 'login' | 'main-menu' | 'drafting' | 'battle' | 'complete';

type UserState = {
  id: number;
  username: string;
  elo: number;
  rank: string;
  experience: number;
  unlockedHeroes: string[];
  titles: string[];
  badges: string[];
  lastLogin: string;
};

interface GameState {
  isLoggedIn: boolean;
  user: UserState | null;
  currentPhase: GamePhase;
  matchId: string | null;
  opponent: {
    username: string;
    elo: number;
    isBot: boolean;
  } | null;
  round: number;
  currentTurn: number | null;
  timeRemaining: number;
  yourTeam: HeroInstance[];
  opponentTeam: HeroInstance[];
  availableHeroes: Hero[];
  availableActions: {
    heroId: string;
    name: string;
    skills: {
      id: number;
      name: string;
      description: string;
      energyCost: number;
      cooldown: number;
      remainingCooldown: number;
      canUse: boolean;
      targeting: string;
    }[];
  }[];
  selectedHeroes: string[];
  playerReady: boolean;
  opponentReady: boolean;
  battleLog: BattleLogEntry[];
  matchResults: {
    winnerId: number | null;
    winnerUsername: string;
    matchDuration: number;
    experience: number;
    eloChange: number;
  } | null;
}

interface GameContextType {
  gameState: GameState;
  sendMessage: (message: WebSocketMessage) => void;
  processCommand: (command: string) => Promise<void>;
  resetGameState: () => void;
}

const defaultGameState: GameState = {
  isLoggedIn: false,
  user: null,
  currentPhase: 'login',
  matchId: null,
  opponent: null,
  round: 0,
  currentTurn: null,
  timeRemaining: 0,
  yourTeam: [],
  opponentTeam: [],
  availableHeroes: [],
  availableActions: [],
  selectedHeroes: [],
  playerReady: false,
  opponentReady: false,
  battleLog: [],
  matchResults: null
};

export const GameContext = createContext<GameContextType>({
  gameState: defaultGameState,
  sendMessage: () => {},
  processCommand: async () => {},
  resetGameState: () => {}
});

type GameProviderProps = {
  children: ReactNode;
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [gameState, setGameState] = useState<GameState>(defaultGameState);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [socket]);

  // Process command from terminal input
  const processCommand = useCallback(async (command: string): Promise<void> => {
    if (!command.trim()) return;

    const args = command.toLowerCase().split(' ');
    const action = args[0];

    switch (gameState.currentPhase) {
      case 'login':
        if (action === 'login' && args.length > 1) {
          const username = args[1];
          const password = args.length > 2 ? args[2] : username; // Simple password for demo
          
          sendMessage({
            type: 'auth:login',
            payload: { username, password }
          });
        } else if (action === 'register' && args.length > 1) {
          const username = args[1];
          const password = args.length > 2 ? args[2] : username; // Simple password for demo
          
          sendMessage({
            type: 'auth:register',
            payload: { username, password }
          });
        }
        break;

      case 'main-menu':
        if (action === 'quickplay') {
          sendMessage({
            type: 'matchmaking:join',
            payload: {}
          });
        } else if (action === 'create' && args.length > 1) {
          const lobbyName = args.slice(1).join(' ');
          sendMessage({
            type: 'lobby:create',
            payload: { lobbyName }
          });
        } else if (action === 'join' && args.length > 1) {
          const lobbyCode = args[1];
          sendMessage({
            type: 'lobby:join',
            payload: { lobbyCode }
          });
        } else if (action === 'solo' && args.length > 1) {
          const difficulty = args[1] as 'novice' | 'veteran' | 'master';
          sendMessage({
            type: 'bot:create',
            payload: { difficulty }
          });
        } else if (action === 'heroes') {
          // Display heroes - handled in UI
        } else if (action === 'stats') {
          // Display stats - handled in UI
        } else if (action === 'leaderboard') {
          // Display leaderboard - handled in UI
        }
        break;

      case 'drafting':
        if (action === 'select' && args.length > 1) {
          const heroId = args[1];
          sendMessage({
            type: 'game:select_hero',
            payload: { heroId }
          });
        } else if (action === 'remove' && args.length > 1) {
          // Remove hero - this would need to be implemented server-side
          console.log('Remove hero not implemented');
        } else if (action === 'confirm') {
          sendMessage({
            type: 'game:confirm_team',
            payload: {}
          });
        }
        break;

      case 'battle':
        if (action === 'use' && args.length > 3) {
          const heroId = args[1];
          const skillId = parseInt(args[2]);
          const targetId = args[3];
          
          sendMessage({
            type: 'turn:action',
            payload: { heroId, skillId, targetId }
          });
        } else if (action === 'swap' && args.length > 2) {
          const position = args[1] as 'front' | 'back';
          const heroId = args[2];
          
          sendMessage({
            type: 'turn:swap',
            payload: { heroId, position }
          });
        } else if (action === 'surrender') {
          sendMessage({
            type: 'game:surrender',
            payload: {}
          });
        } else if (action === 'status') {
          // Show status - handled in UI
        }
        break;

      case 'complete':
        if (action === 'menu') {
          resetGameState();
        }
        break;

      default:
        // Unknown command
        console.log(`Unknown command: ${command}`);
    }
  }, [gameState.currentPhase, sendMessage]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    const { type, payload } = message;

    switch (type) {
      case 'auth:login_success':
      case 'auth:register_success':
        setGameState(prev => ({
          ...prev,
          isLoggedIn: true,
          user: payload,
          currentPhase: 'main-menu'
        }));
        break;

      case 'matchmaking:joined':
        // Just show a notification that we joined the queue
        break;

      case 'matchmaking:match_found':
        // Match found, waiting for match:start
        break;

      case 'match:start':
        setGameState(prev => ({
          ...prev,
          matchId: payload.matchId,
          opponent: payload.opponent,
          availableHeroes: payload.availableHeroes || [],
          yourTeam: payload.yourTeam || [],
          opponentTeam: payload.opponentTeam || [],
          currentPhase: payload.phase as GamePhase,
          selectedHeroes: [],
          playerReady: false,
          opponentReady: false,
          battleLog: []
        }));
        break;

      case 'game:hero_selected':
        if (payload.playerId === gameState.user?.id) {
          // Player selected a hero
          setGameState(prev => ({
            ...prev,
            selectedHeroes: [...prev.selectedHeroes, payload.heroId],
            yourTeam: payload.playerTeam || prev.yourTeam
          }));
        } else {
          // Opponent selected a hero
          setGameState(prev => ({
            ...prev,
            opponentTeam: Array(payload.playerTeam?.length || 0).fill({
              heroId: 'unknown',
              name: 'Unknown Hero',
              currentHp: 0,
              maxHp: 0,
              currentEp: 0,
              maxEp: 0,
              position: 'front',
              isAlive: true,
              effects: []
            })
          }));
        }
        break;

      case 'game:team_confirmed':
        if (payload.playerId === gameState.user?.id) {
          setGameState(prev => ({
            ...prev,
            playerReady: true
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            opponentReady: true
          }));
        }
        break;

      case 'battle:start':
        setGameState(prev => ({
          ...prev,
          currentPhase: 'battle',
          round: payload.round,
          currentTurn: payload.currentTurn,
          yourTeam: payload.player1Team || prev.yourTeam,
          opponentTeam: payload.player2Team || prev.opponentTeam,
          battleLog: payload.battleLog || []
        }));
        break;

      case 'turn:prompt':
        setGameState(prev => ({
          ...prev,
          round: payload.round,
          currentTurn: payload.currentTurn,
          timeRemaining: payload.timeRemaining,
          yourTeam: payload.yourTeam || prev.yourTeam,
          opponentTeam: payload.opponentTeam || prev.opponentTeam,
          availableActions: payload.availableActions || [],
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'turn:waiting':
        setGameState(prev => ({
          ...prev,
          round: payload.round,
          currentTurn: payload.currentTurn,
          timeRemaining: payload.timeRemaining,
          yourTeam: payload.yourTeam || prev.yourTeam,
          opponentTeam: payload.opponentTeam || prev.opponentTeam,
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'turn:update':
        setGameState(prev => ({
          ...prev,
          yourTeam: payload.player1Team || prev.yourTeam,
          opponentTeam: payload.player2Team || prev.opponentTeam,
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'turn:swap':
        setGameState(prev => ({
          ...prev,
          yourTeam: payload.player1Team || prev.yourTeam,
          opponentTeam: payload.player2Team || prev.opponentTeam,
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'turn:timeout':
        // Handle turn timeout
        setGameState(prev => ({
          ...prev,
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'match:end':
        setGameState(prev => ({
          ...prev,
          currentPhase: 'complete',
          matchResults: {
            winnerId: payload.winnerId,
            winnerUsername: payload.winnerUsername,
            matchDuration: payload.matchDuration,
            experience: payload.experience,
            eloChange: payload.eloChange
          },
          yourTeam: payload.player1Team || prev.yourTeam,
          opponentTeam: payload.player2Team || prev.opponentTeam,
          battleLog: payload.battleLog || prev.battleLog
        }));
        break;

      case 'hero:unlocked':
        // Alert about new hero
        break;

      case 'error':
        console.error('Server error:', payload);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }, [gameState.user?.id]);

  // Reset game state
  const resetGameState = useCallback(() => {
    setGameState(prev => ({
      ...defaultGameState,
      isLoggedIn: prev.isLoggedIn,
      user: prev.user,
      currentPhase: prev.isLoggedIn ? 'main-menu' : 'login'
    }));
  }, []);

  return (
    <GameContext.Provider value={{ gameState, sendMessage, processCommand, resetGameState }}>
      {children}
    </GameContext.Provider>
  );
};
