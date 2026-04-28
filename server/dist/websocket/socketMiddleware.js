"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socketMiddleware = (socket, next) => __awaiter(void 0, void 0, void 0, function* () {
    const extendedSocket = socket;
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        extendedSocket.userId = decoded.id;
        extendedSocket.userRole = decoded.role || 'USER';
        extendedSocket.userName = decoded.name || 'Anonymous';
        next();
    }
    catch (error) {
        console.error('Socket authentication error:', error);
        // Allow anonymous connections on auth failure
        extendedSocket.userId = null;
        extendedSocket.userRole = 'GUEST';
        next();
    }
});
exports.socketMiddleware = socketMiddleware;
