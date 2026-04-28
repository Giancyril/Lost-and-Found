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
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketHandlers = void 0;
const commentsService_1 = require("../app/comments/commentsService");
const socketHandlers = (io, socket) => {
    // Join item room for real-time updates
    socket.on('join-item', (itemId) => {
        const roomName = `item-${itemId}`;
        socket.join(roomName);
        console.log(`User ${socket.userId} joined room: ${roomName}`);
    });
    // Leave item room
    socket.on('leave-item', (itemId) => {
        const roomName = `item-${itemId}`;
        socket.leave(roomName);
        console.log(`User ${socket.userId} left room: ${roomName}`);
    });
    // Handle new comment (Broadcast only, saving is handled by REST API)
    socket.on('new-comment', (data) => __awaiter(void 0, void 0, void 0, function* () {
        // If data already has an ID, it means it's been saved by REST and we just broadcast
        if (data.id) {
            const roomName = `item-${data.itemId}`;
            socket.to(roomName).emit('comment-added', data);
        }
        else {
            console.warn('Received new-comment via socket without ID. Saving via socket is deprecated.');
            // Optional: still save for now if we want to support old clients
        }
    }));
    // Handle comment updates (helpful count, status)
    socket.on('update-comment', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const updatedComment = yield commentsService_1.commentService.updateComment(data.commentId, data.updateData, socket.userId || '', socket.userRole);
            const roomName = `item-${data.itemId}`;
            io.to(roomName).emit('comment-updated', updatedComment);
            console.log(`Comment ${data.commentId} updated by ${socket.userId}`);
        }
        catch (error) {
            console.error('Error updating comment:', error);
            socket.emit('error', {
                message: 'Failed to update comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    // Handle comment deletion
    socket.on('delete-comment', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield commentsService_1.commentService.deleteComment(data.commentId, socket.userId || '', socket.userRole);
            const roomName = `item-${data.itemId}`;
            io.to(roomName).emit('comment-deleted', { commentId: data.commentId });
            console.log(`Comment ${data.commentId} deleted by ${socket.userId}`);
        }
        catch (error) {
            console.error('Error deleting comment:', error);
            socket.emit('error', {
                message: 'Failed to delete comment',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    // Handle helpful vote
    socket.on('vote-helpful', (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const updatedComment = yield commentsService_1.commentService.voteHelpful(data.commentId, socket.userId || '');
            const roomName = `item-${data.itemId}`;
            io.to(roomName).emit('comment-updated', updatedComment);
            console.log(`Helpful vote on comment ${data.commentId} by ${socket.userId}`);
        }
        catch (error) {
            console.error('Error voting helpful:', error);
            socket.emit('error', {
                message: 'Failed to vote',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }));
    // Handle typing indicators
    socket.on('typing-start', (data) => {
        const roomName = `item-${data.itemId}`;
        socket.to(roomName).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: true
        });
    });
    socket.on('typing-stop', (data) => {
        const roomName = `item-${data.itemId}`;
        socket.to(roomName).emit('user-typing', {
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
        });
    });
};
exports.socketHandlers = socketHandlers;
