import { useContext, useState, useEffect } from 'react';
import { GameContext } from '../contexts/gameContext';

export function useWebSocket() {
  const { sendMessage } = useContext(GameContext);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Check if WebSocket is available
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connection established');
    };
    
    socket.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket connection closed');
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    // Reconnect logic
    if (connectionStatus === 'disconnected') {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        setConnectionStatus('connecting');
      }, 3000);
      
      return () => clearTimeout(reconnectTimer);
    }
    
    return () => {
      socket.close();
    };
  }, [connectionStatus]);

  return {
    connectionStatus,
    sendMessage
  };
}
