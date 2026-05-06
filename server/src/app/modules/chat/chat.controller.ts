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
  const { claimId, reporterId } = req.body;
  const userId = (req as any).user.id;
  
  // Ensure we don't have undefined in participants array
  const participants = [userId, reporterId].filter(id => !!id);
  
  // If only one participant (e.g. reporterId was missing), 
  // the service will need to handle it or we could add a default admin
  const result = await chatService.createOrGetChatRoom(claimId, participants);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Chat initiated successfully",
    data: result,
  });
};

export const chatController = {
  getMyChatRooms,
  getChatMessages,
  initiateChat,
};
