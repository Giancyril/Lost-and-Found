import { Server } from 'socket.io';
import { ExtendedSocket } from '../types/socket';
import { commentService } from '../app/comments/commentsService';
import { getRedisClient } from '../redis/redisClient';
import { chatService } from '../app/modules/chat/chat.service';
import { pushService } from '../app/modules/push/push.service';
import prisma from '../app/config/prisma';

export const socketHandlers = (io: Server, socket: ExtendedSocket) => {
  // ✅ SECURITY: Join item room for real-time updates (authentication required)
  socket.on('join-item', (itemId: string) => {
    // Verify user is authenticated
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required to join item rooms' });
      console.warn(`Unauthenticated socket attempted to join room: item-${itemId}`);
      return;
    }

    const roomName = `item-${itemId}`;
    socket.join(roomName);
    console.log(`User ${socket.userId} joined room: ${roomName}`);
  });

  // ✅ SECURITY: Leave item room
  socket.on('leave-item', (itemId: string) => {
    const roomName = `item-${itemId}`;
    socket.leave(roomName);
    console.log(`User ${socket.userId || 'anonymous'} left room: ${roomName}`);
  });

  // Handle new comment (Broadcast only, saving is handled by REST API)
  socket.on('new-comment', async (data) => {
    // If data already has an ID, it means it's been saved by REST and we just broadcast
    if (data.id) {
      const roomName = `item-${data.itemId}`;
      socket.to(roomName).emit('comment-added', data);
    } else {
      console.warn('Received new-comment via socket without ID. Saving via socket is deprecated.');
      // Optional: still save for now if we want to support old clients
    }
  });

  // Handle comment updates (helpful count, status)
  socket.on('update-comment', async (data) => {
    try {
      const updatedComment = await commentService.updateComment(
        data.commentId,
        data.updateData,
        socket.userId || '',
        socket.userRole
      );

      const roomName = `item-${data.itemId}`;
      io.to(roomName).emit('comment-updated', updatedComment);

      console.log(`Comment ${data.commentId} updated by ${socket.userId}`);

    } catch (error) {
      console.error('Error updating comment:', error);
      socket.emit('error', {
        message: 'Failed to update comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle comment deletion
  socket.on('delete-comment', async (data) => {
    try {
      await commentService.deleteComment(
        data.commentId,
        socket.userId || '',
        socket.userRole
      );

      const roomName = `item-${data.itemId}`;
      io.to(roomName).emit('comment-deleted', { commentId: data.commentId });

      console.log(`Comment ${data.commentId} deleted by ${socket.userId}`);

    } catch (error) {
      console.error('Error deleting comment:', error);
      socket.emit('error', {
        message: 'Failed to delete comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Handle helpful vote
  socket.on('vote-helpful', async (data) => {
    try {
      const updatedComment = await commentService.voteHelpful(
        data.commentId,
        socket.userId || ''
      );

      const roomName = `item-${data.itemId}`;
      io.to(roomName).emit('comment-updated', updatedComment);

      console.log(`Helpful vote on comment ${data.commentId} by ${socket.userId}`);

    } catch (error) {
      console.error('Error voting helpful:', error);
      socket.emit('error', {
        message: 'Failed to vote',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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

  // ── CHAT HANDLERS ───────────────────────────────────────────────────────────

  // ✅ SECURITY: Join chat room (authentication required)
  socket.on('join-chat', async (chatRoomId: string) => {
    // Verify user is authenticated
    if (!socket.userId) {
      socket.emit('error', { message: 'Authentication required to join chat rooms' });
      console.warn(`Unauthenticated socket attempted to join room: chat-${chatRoomId}`);
      return;
    }

    // ✅ SECURITY: Verify user is a participant in this chat room
    try {
      const room = await chatService.getChatRoomById(chatRoomId);
      if (!room) {
        socket.emit('error', { message: 'Chat room not found' });
        return;
      }

      const isParticipant = (room.participants as string[]).includes(socket.userId);
      if (!isParticipant) {
        socket.emit('error', { message: 'You are not authorized to join this chat room' });
        console.warn(`User ${socket.userId} attempted to join unauthorized chat room: ${chatRoomId}`);
        return;
      }

      const roomName = `chat-${chatRoomId}`;
      socket.join(roomName);
      console.log(`User ${socket.userId} joined chat room: ${roomName}`);
    } catch (error) {
      console.error('Error joining chat room:', error);
      socket.emit('error', { message: 'Failed to join chat room' });
    }
  });

  socket.on('leave-chat', (chatRoomId: string) => {
    const roomName = `chat-${chatRoomId}`;
    socket.leave(roomName);
    console.log(`User ${socket.userId} left chat room: ${roomName}`);
  });

  socket.on('chat-typing-start', (data: { chatRoomId: string }) => {
    console.log(`[WS] chat-typing-start received for room: ${data.chatRoomId} from user ${socket.userId}`);
    const roomName = `chat-${data.chatRoomId}`;
    socket.to(roomName).emit('chat-user-typing', {
      userId: socket.userId,
      isTyping: true
    });
  });

  socket.on('chat-typing-stop', (data: { chatRoomId: string }) => {
    console.log(`[WS] chat-typing-stop received for room: ${data.chatRoomId} from user ${socket.userId}`);
    const roomName = `chat-${data.chatRoomId}`;
    socket.to(roomName).emit('chat-user-typing', {
      userId: socket.userId,
      isTyping: false
    });
  });

  socket.on('send-message', async (data: { chatRoomId: string, content: string, replyTo?: any }) => {
    try {
      if (!socket.userId) throw new Error('Unauthorized');

      const message = await chatService.saveMessage(
        data.chatRoomId,
        socket.userId,
        data.content,
        data.replyTo?.id
      );

      const roomName = `chat-${data.chatRoomId}`;
      // Emit to everyone in the room INCLUDING the sender (for confirmation)
      io.to(roomName).emit('message-received', message);

      // Trigger Push Notification to other participants
      const room = await chatService.getChatRoomById(data.chatRoomId);

      if (room) {
        const recipients = (room.participants as string[]).filter((id: string) => id !== socket.userId);
        for (const recipientId of recipients) {
          await pushService.sendNotificationToUser(recipientId, {
            title: `New message from ${socket.userName || 'Someone'}`,
            body: data.content.length > 50 ? data.content.substring(0, 47) + '...' : data.content,
            data: {
              type: 'CHAT',
              chatRoomId: data.chatRoomId,
            }
          });
        }
      }

      console.log(`Message sent in room ${data.chatRoomId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('delete-message', async (data: { messageId: string, chatRoomId: string }) => {
    try {
      if (!socket.userId) throw new Error('Unauthorized');
      
      await chatService.deleteMessage(data.messageId, socket.userId);
      
      const roomName = `chat-${data.chatRoomId}`;
      io.to(roomName).emit('message-deleted', { messageId: data.messageId });
      
      console.log(`Message ${data.messageId} deleted by ${socket.userId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  });

  socket.on('add-reaction', async (data: { messageId: string, chatRoomId: string, emoji: string }) => {
    try {
      if (!socket.userId) throw new Error('Unauthorized');
      
      const updatedMessage = await chatService.addReaction(data.messageId, socket.userId, data.emoji);
      
      const roomName = `chat-${data.chatRoomId}`;
      io.to(roomName).emit('reaction-updated', { 
        messageId: data.messageId, 
        reactions: updatedMessage.reactions 
      });
      
      console.log(`Reaction ${data.emoji} added to message ${data.messageId} by ${socket.userId}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
      socket.emit('error', { message: 'Failed to add reaction' });
    }
  });
};
