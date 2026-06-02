import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { chatService } from "./chat.service";

const getMyChatRooms = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const result = await chatService.getChatRoomsForUser(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chat rooms retrieved successfully",
    data: result,
  });
};

const getChatMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const result = await chatService.getMessages(roomId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
};

const initiateChat = async (req: Request, res: Response) => {
  const { claimId, reporterId, studentId } = req.body;
  const userId = (req as any).user.id;
  
  // Use either reporterId or studentId as the second participant
  const targetId = reporterId || studentId;
  
  // Ensure we have both participants
  const participants = [userId, targetId].filter(id => !!id);
  
  const result = await chatService.createOrGetChatRoom(claimId || null, participants);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chat initiated successfully",
    data: result,
  });
};

const markAsRead = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = (req as any).user.id;
  await chatService.markRoomAsRead(roomId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Room marked as read successfully",
    data: null,
  });
};

const markAsUnread = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = (req as any).user.id;
  await chatService.markRoomAsUnread(roomId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Room marked as unread successfully",
    data: null,
  });
};

const deleteConversation = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const userId = (req as any).user.id;
  await chatService.deleteChatRoom(roomId, userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Conversation deleted successfully",
    data: null,
  });
};

export const chatController = {
  getMyChatRooms,
  getChatMessages,
  initiateChat,
  markAsRead,
  markAsUnread,
  deleteConversation,
};
