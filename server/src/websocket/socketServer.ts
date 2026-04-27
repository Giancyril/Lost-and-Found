import { Server } from 'socket.io';
import { socketHandlers } from './socketHandlers';
import { socketMiddleware } from './socketMiddleware';
import { ExtendedSocket } from '../types/socket';

export const initializeSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(socketMiddleware);

  io.on('connection', (socket) => {
    const s = socket as unknown as ExtendedSocket; // double cast fixes the type mismatch

    console.log(`User connected: ${s.userId || 'anonymous'}`);

    socketHandlers(io, s);

    s.on('disconnect', (reason) => {
      console.log(`User disconnected: ${s.userId || 'anonymous'} - ${reason}`);
    });

    s.on('error', (error) => {
      console.error(`Socket error for ${s.userId || 'anonymous'}:`, error);
    });
  });

  return io;
};