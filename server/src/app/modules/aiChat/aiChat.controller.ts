import { Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { aiChatService } from "./aiChat.service";

const chat = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Messages array is required",
        data: null,
      });
    }

    const result = await aiChatService.handleChat(messages, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Chat processed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("AI Chat Controller Error:", error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.stack || error?.message || "AI chat failed",
      data: null,
    });
  }
};

export const aiChatController = {
  chat,
};
