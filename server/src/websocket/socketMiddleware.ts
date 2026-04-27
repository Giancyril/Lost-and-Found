import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { ExtendedSocket } from '../types/socket';

export const socketMiddleware = async (socket: Socket, next: any) => {
  const extendedSocket = socket as ExtendedSocket;
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow anonymous connections for guest users
      extendedSocket.userId = null;
      extendedSocket.userRole = 'GUEST';
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    extendedSocket.userId = decoded.id;
    extendedSocket.userRole = decoded.role || 'USER';
    extendedSocket.userName = decoded.name || 'Anonymous';
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    // Allow anonymous connections on auth failure
    extendedSocket.userId = null;
    extendedSocket.userRole = 'GUEST';
    next();
  }
};
