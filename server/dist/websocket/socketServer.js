"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const socketHandlers_1 = require("./socketHandlers");
const socketMiddleware_1 = require("./socketMiddleware");
const initializeSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
    });
    io.use(socketMiddleware_1.socketMiddleware);
    io.on('connection', (socket) => {
        const s = socket; // double cast fixes the type mismatch
        console.log(`User connected: ${s.userId || 'anonymous'}`);
        (0, socketHandlers_1.socketHandlers)(io, s);
        s.on('disconnect', (reason) => {
            console.log(`User disconnected: ${s.userId || 'anonymous'} - ${reason}`);
        });
        s.on('error', (error) => {
            console.error(`Socket error for ${s.userId || 'anonymous'}:`, error);
        });
    });
    return io;
};
exports.initializeSocket = initializeSocket;
