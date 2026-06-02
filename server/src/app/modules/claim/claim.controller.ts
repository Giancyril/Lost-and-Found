import { NextFunction, Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { Claim } from "@prisma/client";
import { claimsService } from "./claim.service";
import { checkClaimAchievements, checkPointAchievements } from "../../utils/achievementService";

const createClaim = async (req: Request, res: Response) => {
  try {
    const item: Claim = req.body;
    const result = await claimsService.createClaim(item, req.user);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Claim created successfully",
      data: result,
    });

    // ── Achievement triggers ────────────────────────────────────────────────
    const userId = (result as any).userId || (req.user as any)?.id;
    if (userId) {
      checkClaimAchievements(userId).catch(err =>
        console.error("[Achievement] Error checking claim badges:", err)
      );
    }
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
    const result = await claimsService.updateClaimStatus(
      req.params.claimId,
      req.body,
      { id: req.user?.id, name: req.user?.name || req.user?.username }
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claims updated successfully",
      data: result,
    });

    // ── Achievement triggers ────────────────────────────────────────────────
    if (result && (result as any).userId) {
      checkClaimAchievements((result as any).userId).catch(err =>
        console.error("[Achievement] Error checking claim badges:", err)
      );
      if (req.body.status === "APPROVED") {
        checkPointAchievements((result as any).userId).catch(err =>
          console.error("[Achievement] Error checking point badges:", err)
        );
      }
    }
  } catch (error: any) {
    next(error);
  }
};

const deleteClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.role === "ADMIN" ? undefined : req.user?.id;
    const result = await claimsService.deleteClaim(req.params.claimId, userId);
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

const trackClaim = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { claimId, email } = req.body;
    const result = await claimsService.trackClaim(claimId, email);
    if (!result) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Claim not found. Please check your Tracking ID and Email.",
        data: null,
      });
    }
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Claim tracked successfully",
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
  trackClaim,
};