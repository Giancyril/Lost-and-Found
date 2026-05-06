 import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma";

const createOrGetChatRoom = async (claimId: string, participants: string[]) => {
  // Check if room already exists for this claim
  let room = await (prisma as any).chatRoom.findUnique({
    where: { claimId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 50,
      },
    },
  });

   if (!room) {
    room = await (prisma as any).chatRoom.create({
      data: {
        claimId,
        participants,
      },
      include: {
        messages: true,
      },
    });
  }

  return room;
};

const saveMessage = async (chatRoomId: string, senderId: string, content: string) => {
  const message = await (prisma as any).chatMessage.create({
    data: {
      chatRoomId,
      senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          userImg: true,
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
  return await (prisma as any).chatRoom.findMany({
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
    },
    orderBy: { updatedAt: "desc" },
  });
};

const getMessages = async (chatRoomId: string) => {
  return await (prisma as any).chatMessage.findMany({
    where: { chatRoomId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          userImg: true,
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

export const chatService = {
  createOrGetChatRoom,
  saveMessage,
  getChatRoomsForUser,
  getMessages,
  getChatRoomById,
};
