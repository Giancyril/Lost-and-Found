import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { pushService } from "./push.service";

const subscribe = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const subscription = req.body;
  
  await pushService.subscribeUser(userId, subscription);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscribed to push notifications successfully",
    data: null,
  });
};

const getPublicKey = async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Public key retrieved successfully",
    data: process.env.VAPID_PUBLIC_KEY,
  });
};

export const pushController = {
  subscribe,
  getPublicKey,
};
