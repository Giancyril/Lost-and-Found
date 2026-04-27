import { Server } from 'socket.io';
import { createServer } from 'http';
import { socketHandlers } from './socketHandlers';
import { socketMiddleware } from './socketMiddleware';

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

  // Apply middleware for authentication
  io.use(socketMiddleware);

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId || 'anonymous'}`);
    
    // Handle socket events
    socketHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.userId || 'anonymous'} - ${reason}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userId || 'anonymous'}:`, error);
    });
  });

  return io;
};
