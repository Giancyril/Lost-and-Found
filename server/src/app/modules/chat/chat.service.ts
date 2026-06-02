 import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma";

const createOrGetChatRoom = async (claimId: string | null, participants: string[]) => {
  // Ensure we have at least 2 participants. If not, add an admin.
  let finalParticipants = [...participants].filter(id => !!id);
  if (finalParticipants.length < 2) {
    const admin = await (prisma as any).user.findFirst({
      where: { role: "ADMIN", isDeleted: false },
      select: { id: true }
    });
    if (admin && !finalParticipants.includes(admin.id)) {
      finalParticipants.push(admin.id);
    }
  }

  // 1. If claimId exists, try finding room by it
  if (claimId) {
    let room = await (prisma as any).chatRoom.findUnique({
      where: { claimId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
        claim: { include: { foundItem: true } },
      },
    });
    if (room) return room;
  }

  // 2. If no claimId OR no room found by claimId, try to find by participants
  // We look for a room where ALL participants match and it has no claimId
  // (This handles direct messaging between admin and student)
  if (finalParticipants.length >= 2) {
    const existingRoom = await (prisma as any).chatRoom.findFirst({
      where: {
        AND: [
          ...finalParticipants.map(id => ({ participants: { has: id } })),
          { claimId: claimId || null } 
        ]
      },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 50 },
        claim: { include: { foundItem: true } },
      },
    });
    if (existingRoom) return existingRoom;
  }

  // 3. Create new room if none found
  return await (prisma as any).chatRoom.create({
    data: {
      claimId: claimId || null,
      participants: finalParticipants,
    },
    include: {
      messages: true,
      claim: { include: { foundItem: true } },
    },
  });
};

const saveMessage = async (chatRoomId: string, senderId: string, content: string, replyToId?: string) => {
  const message = await (prisma as any).chatMessage.create({
    data: {
      chatRoomId,
      senderId,
      content,
      replyToId: replyToId || null,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          userImg: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  });

  // Update chat room's updatedAt
  await (prisma as any).chatRoom.update({
    where: { id: chatRoomId },
    data: { updatedAt: new Date() },
  });

  return message;
};

const getChatRoomsForUser = async (userId: string) => {
  const rooms = await (prisma as any).chatRoom.findMany({
    where: {
      participants: {
        has: userId,
      },
    },
    include: {
      claim: {
        include: {
          foundItem: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      readStatuses: {
        where: {
          userId,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch participant details to show names instead of item titles
  const allParticipantIds = [...new Set(rooms.flatMap((r: any) => r.participants))];
  const users = await (prisma as any).user.findMany({
    where: { id: { in: allParticipantIds } },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      userImg: true,
    },
  });

  return rooms.map((room: any) => ({
    ...room,
    participantUsers: users.filter((u: any) => room.participants.includes(u.id)),
  }));
};

const getMessages = async (chatRoomId: string) => {
  return await (prisma as any).chatMessage.findMany({
    where: { chatRoomId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          userImg: true,
        },
      },
      replyTo: {
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
};

const getChatRoomById = async (id: string) => {
  return await (prisma as any).chatRoom.findUnique({
    where: { id },
  });
};

const markRoomAsRead = async (chatRoomId: string, userId: string) => {
  return await (prisma as any).chatReadStatus.upsert({
    where: {
      chatRoomId_userId: {
        chatRoomId,
        userId,
      },
    },
    update: {
      lastReadAt: new Date(),
    },
    create: {
      chatRoomId,
      userId,
      lastReadAt: new Date(),
    },
  });
};

const markRoomAsUnread = async (chatRoomId: string, userId: string) => {
  // Delete the read status to mark as unread
  const result = await (prisma as any).chatReadStatus.deleteMany({
    where: {
      chatRoomId,
      userId,
    },
  });
  console.log(`[Chat Service] Marked room ${chatRoomId} as unread for user ${userId}. Deleted ${result.count} read status(es).`);
  return result;
};

const deleteChatRoom = async (chatRoomId: string, userId: string) => {
  // First, verify the user is a participant
  const room = await (prisma as any).chatRoom.findFirst({
    where: {
      id: chatRoomId,
      participants: {
        has: userId,
      },
    },
  });

  if (!room) {
    throw new Error("Chat room not found or unauthorized");
  }

  // Delete all messages in the room
  await (prisma as any).chatMessage.deleteMany({
    where: { chatRoomId },
  });

  // Delete read statuses
  await (prisma as any).chatReadStatus.deleteMany({
    where: { chatRoomId },
  });

  // Delete the room
  return await (prisma as any).chatRoom.delete({
    where: { id: chatRoomId },
  });
};

const deleteMessage = async (messageId: string, userId: string) => {
  const message = await (prisma as any).chatMessage.findUnique({
    where: { id: messageId },
  });

  if (!message || message.senderId !== userId) {
    throw new Error("Message not found or unauthorized");
  }

  return await (prisma as any).chatMessage.update({
    where: { id: messageId },
    data: { 
      isDeleted: true, 
      content: "Message deleted" 
    },
  });
};

const addReaction = async (messageId: string, userId: string, emoji: string) => {
  const message = await (prisma as any).chatMessage.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  const reactions = Array.isArray(message.reactions) ? message.reactions : [];
  const existingIndex = reactions.findIndex(
    (r: any) => r.emoji === emoji && r.userId === userId
  );

  let updatedReactions;
  if (existingIndex !== -1) {
    // Remove reaction if exists (toggle off)
    updatedReactions = reactions.filter((_: any, i: number) => i !== existingIndex);
  } else {
    // Add reaction
    updatedReactions = [...reactions, { emoji, userId }];
  }

  return await (prisma as any).chatMessage.update({
    where: { id: messageId },
    data: { reactions: updatedReactions },
  });
};

export const chatService = {
  createOrGetChatRoom,
  saveMessage,
  getChatRoomsForUser,
  getMessages,
  getChatRoomById,
  markRoomAsRead,
  markRoomAsUnread,
  deleteChatRoom,
  deleteMessage,
  addReaction,
};
