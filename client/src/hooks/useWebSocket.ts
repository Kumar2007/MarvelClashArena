import { useContext } from 'react';
import { GameContext } from '../contexts/gameContext';

export function useWebSocket() {
  const { sendMessage, connectionStatus } = useContext(GameContext);

  return {
    connectionStatus,
    sendMessage
  };
}
