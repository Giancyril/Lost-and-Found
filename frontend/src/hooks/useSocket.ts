import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

// Determine the socket URL:
const getSocketUrl = () => {
  const backendEnv = import.meta.env.VITE_BACKEND_URL;
  if (backendEnv) return backendEnv;

  const isProduction = import.meta.env.VITE_PRODUCTION === 'true';
  if (isProduction) {
    // Render uses https, so sockets should use wss automatically if we use the https URL
    const serverUrl = import.meta.env.VITE_SERVER_URL;
    return serverUrl ? serverUrl.replace(/\/api$/, '') : 'http://localhost:5000';
  }
  return 'http://localhost:5000';
};

export const useSocket = (options: UseSocketOptions = {}) => {
  const [socketInstance, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const hasGivenUp = useRef(false);

  useEffect(() => {
    if (!options.autoConnect || hasGivenUp.current) return;

    const SOCKET_URL = getSocketUrl();
    console.log('🔌 Attempting socket connection to:', SOCKET_URL);

    let socket: Socket;
    try {
      socket = io(SOCKET_URL, {
        auth: { token: options.token || '' },
        // Crucial for Render/Production: allow polling fallback and set specific transports
        transports: ['polling', 'websocket'], 
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 3000,
        timeout: 20000,
        // If your backend is at /socket.io, this is default, but sometimes it helps to be explicit
        path: '/socket.io/', 
        withCredentials: true
      });
    } catch (e) {
      console.error('Socket initialization failed:', e);
      hasGivenUp.current = true;
      setError('Real-time connection failed.');
      return;
    }

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully!');
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
      hasGivenUp.current = false;
    });

    socket.on('connect_error', (err) => {
      console.warn('❌ Socket connection error:', err.message);
      setIsConnected(false);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('🛑 Max socket reconnection attempts reached. Falling back to REST only.');
        hasGivenUp.current = true;
        socket.disconnect();
        setError('Real-time updates unavailable.');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(socket);

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('disconnect');
        socket.disconnect();
      }
    };
  }, [options.autoConnect, options.token]);

  const emit = (event: string, data: any) => {
    if (socketInstance && isConnected) {
      socketInstance.emit(event, data);
    }
  };

  return { socket: socketInstance, isConnected, error, emit };
};