import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

interface RealTimeState {
  isConnected: boolean;
  connectionCount: number;
  lastActivity: Date | null;
  typingUsers: string[];
  onlineUsers: number;
}

interface UseRealTimeOptions {
  autoConnect?: boolean;
  roomId?: string;
}

export const useRealTime = (options: UseRealTimeOptions = {}) => {
  const [state, setState] = useState<RealTimeState>({
    isConnected: false,
    connectionCount: 0,
    lastActivity: null,
    typingUsers: [],
    onlineUsers: 0
  });

  const socket = useSocket({ autoConnect: options.autoConnect });

  // Connection monitoring
  useEffect(() => {
    if (!socket.socket) return;

    const handleConnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionCount: prev.connectionCount + 1,
        lastActivity: new Date()
      }));
    };

    const handleDisconnect = () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
        typingUsers: [],
        onlineUsers: Math.max(0, prev.onlineUsers - 1)
      }));
    };

    const handleUserJoined = (userData: { userId: string; userName: string }) => {
      setState(prev => ({
        ...prev,
        onlineUsers: prev.onlineUsers + 1
      }));
    };

    const handleUserLeft = (userData: { userId: string; userName: string }) => {
      setState(prev => ({
        ...prev,
        onlineUsers: Math.max(0, prev.onlineUsers - 1)
      }));
    };

    const handleTypingStart = (userData: { userId: string; userName: string }) => {
      setState(prev => ({
        ...prev,
        typingUsers: [...new Set([...prev.typingUsers, userData.userId])]
      }));
    };

    const handleTypingStop = (userData: { userId: string; userName: string }) => {
      setState(prev => ({
        ...prev,
        typingUsers: prev.typingUsers.filter(id => id !== userData.userId)
      }));
    };

    socket.socket.on('connect', handleConnect);
    socket.socket.on('disconnect', handleDisconnect);
    socket.socket.on('user-joined', handleUserJoined);
    socket.socket.on('user-left', handleUserLeft);
    socket.socket.on('typing-start', handleTypingStart);
    socket.socket.on('typing-stop', handleTypingStop);

    return () => {
      socket.socket?.off('connect', handleConnect);
      socket.socket?.off('disconnect', handleDisconnect);
      socket.socket?.off('user-joined', handleUserJoined);
      socket?.off('user-left', handleUserLeft);
      socket?.off('typing-start', handleTypingStart);
      socket?.off('typing-stop', handleTypingStop);
    };
  }, [socket.socket]);

  // Join room if specified
  useEffect(() => {
    if (socket.socket && options.roomId) {
      socket.socket.emit('join-room', options.roomId);
    }
  }, [socket.socket, options.roomId]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (socket.socket) {
      socket.socket.emit('typing', isTyping);
    }
  }, [socket.socket]);

  const sendMessage = useCallback((message: string, roomId?: string) => {
    if (socket.socket) {
      socket.socket.emit('message', { message, roomId });
    }
  }, [socket.socket]);

  const emitPresence = useCallback((status: 'online' | 'away' | 'busy', roomId?: string) => {
    if (socket.socket) {
      socket.socket.emit('presence', { status, roomId });
    }
  }, [socket.socket]);

  return {
    ...state,
    socket,
    emitTyping,
    sendMessage,
    emitPresence
  };
};
