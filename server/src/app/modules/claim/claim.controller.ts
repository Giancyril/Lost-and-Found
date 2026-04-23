import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { Claim } from "@prisma/client";
import { claimsService } from "./claim.service";

const createClaim = async (req: Request, res: Response) => {
  try {
    const item: Claim = req.body;
    // req.user is undefined for students (no auth) — service handles this gracefully
    const result = await claimsService.createClaim(item, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Claim created successfully",
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

const getClaim = async (req: Request, res: Response) => {
  try {
    const result = await claimsService.getClaim();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims retrieved successfully",
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

const getMyClaim = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const result = await claimsService.getMyClaim(user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims retrieved successfully",
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

const updateClaimStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await claimsService.updateClaimStatus(req.params.claimId, req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims updated successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

const deleteClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await claimsService.deleteClaim(req.params.claimId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claim deleted successfully",
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

export const claimsController = {
  createClaim,
  getClaim,
  updateClaimStatus,
  deleteClaim,
  getMyClaim,
};