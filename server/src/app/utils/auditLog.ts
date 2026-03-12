import { Request, Response } from "express";
import { claimsService } from "../modules/claim/claim.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const result = await claimsService.getAuditLogs();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Audit logs retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message,
      data: null,
    });
  }
};