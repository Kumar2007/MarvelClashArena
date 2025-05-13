import { useContext } from 'react';
import { GameContext } from '../contexts/gameContext';

export function useGameState() {
  const { gameState, sendMessage, processCommand, resetGameState } = useContext(GameContext);

  const login = (username: string, password: string) => {
    sendMessage({
      type: 'auth:login',
      payload: { username, password }
    });
  };

  const register = (username: string, password: string) => {
    sendMessage({
      type: 'auth:register',
      payload: { username, password }
    });
  };

  const joinMatchmaking = () => {
    sendMessage({
      type: 'matchmaking:join',
      payload: {}
    });
  };

  const leaveMatchmaking = () => {
    sendMessage({
      type: 'matchmaking:leave',
      payload: {}
    });
  };

  const createLobby = (lobbyName: string) => {
    sendMessage({
      type: 'lobby:create',
      payload: { lobbyName }
    });
  };

  const joinLobby = (lobbyCode: string) => {
    sendMessage({
      type: 'lobby:join',
      payload: { lobbyCode }
    });
  };

  const createBotMatch = (difficulty: 'novice' | 'veteran' | 'master') => {
    sendMessage({
      type: 'bot:create',
      payload: { difficulty }
    });
  };

  const selectHero = (heroId: string) => {
    sendMessage({
      type: 'game:select_hero',
      payload: { heroId }
    });
  };

  const confirmTeam = () => {
    sendMessage({
      type: 'game:confirm_team',
      payload: {}
    });
  };

  const useSkill = (heroId: string, skillId: number, targetId: string) => {
    sendMessage({
      type: 'turn:action',
      payload: { heroId, skillId, targetId }
    });
  };

  const swapPosition = (heroId: string, position: 'front' | 'back') => {
    sendMessage({
      type: 'turn:swap',
      payload: { heroId, position }
    });
  };

  const surrender = () => {
    sendMessage({
      type: 'game:surrender',
      payload: {}
    });
  };

  const isMyTurn = () => {
    return gameState.currentTurn === gameState.user?.id;
  };

  const getAvailableHeroes = () => {
    return gameState.availableHeroes;
  };

  const getSelectedHeroes = () => {
    return gameState.selectedHeroes;
  };

  const getYourTeam = () => {
    return gameState.yourTeam;
  };

  const getOpponentTeam = () => {
    return gameState.opponentTeam;
  };

  const getBattleLog = () => {
    return gameState.battleLog;
  };

  const getAvailableActions = () => {
    return gameState.availableActions;
  };

  return {
    gameState,
    processCommand,
    resetGameState,
    login,
    register,
    joinMatchmaking,
    leaveMatchmaking,
    createLobby,
    joinLobby,
    createBotMatch,
    selectHero,
    confirmTeam,
    useSkill,
    swapPosition,
    surrender,
    isMyTurn,
    getAvailableHeroes,
    getSelectedHeroes,
    getYourTeam,
    getOpponentTeam,
    getBattleLog,
    getAvailableActions
  };
}
