// src/modules/points/points.controller.ts

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { pointsService } from "./points.service";

// GET /points/my  — auth() middleware required (already in router)
const getMyPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success:    false,
        message:    "Not authenticated",
        data:       null,
      });
    }

    // Returns { totalPoints, name, history }
    // Frontend reads pointsData?.data?.totalPoints  ✅
    const data = await pointsService.getMyPoints(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Points retrieved successfully",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to retrieve points",
      data:       null,
    });
  }
};

// GET /points/leaderboard  — public, no auth required
const getLeaderboard = async (req: Request, res: Response) => {
  try {
    // Returns array of { id, name, totalPoints, userImg, schoolId }
    // Frontend reads boardData?.data  ✅
    const data = await pointsService.getLeaderboard();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Leaderboard retrieved successfully",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to retrieve leaderboard",
      data:       null,
    });
  }
};

export const pointsController = {
  getMyPoints,
  getLeaderboard,
};