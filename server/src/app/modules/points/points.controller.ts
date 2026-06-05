// src/modules/points/points.controller.ts

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { pointsService } from "./points.service";

// GET /points/my  — auth() middleware required (already in router)
const getMyPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log(`[DEBUG] getMyPoints - User from request:`, {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role,
      username: req.user?.username
    });
    
    if (!userId) {
      console.log(`[DEBUG] getMyPoints - No userId found`);
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success:    false,
        message:    "Not authenticated",
        data:       null,
      });
    }

    // Returns { totalPoints, name, history, loginStreak, lastLoginDate, streak, boostEvent }
    // Frontend reads pointsData?.data?.totalPoints  ✅
    const data = await pointsService.getMyPoints(userId);
    
    console.log(`[DEBUG] getMyPoints - Service result:`, {
      totalPoints: data?.totalPoints,
      name: data?.name,
      historyLength: data?.history?.length || 0
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Points retrieved successfully",
      data,
    });
  } catch (error: any) {
    console.error(`[DEBUG] getMyPoints - Error:`, error);
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to retrieve points",
      data:       null,
    });
  }
};

// GET /points/leaderboard?type=alltime|weighted|weekly|monthly
const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as any) ?? "alltime";
    let data: any[];

    if (type === "weighted") {
      data = await pointsService.getWeightedLeaderboard();
    } else {
      data = await pointsService.getLeaderboard(type);
    }

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

// Admin: create a boost event
const createBoostEvent = async (req: Request, res: Response) => {
  try {
    const { name, multiplier, startDate, endDate } = req.body;
    const data = await pointsService.createBoostEvent({
      name,
      multiplier: parseFloat(multiplier),
      startDate:  new Date(startDate),
      endDate:    new Date(endDate),
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success:    true,
      message:    "Boost event created",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to create boost event",
      data:       null,
    });
  }
};

// Admin: list boost events
const getBoostEvents = async (req: Request, res: Response) => {
  try {
    const data = await pointsService.getBoostEvents();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Boost events retrieved",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to retrieve boost events",
      data:       null,
    });
  }
};

// Admin: deactivate a boost event
const deactivateBoostEvent = async (req: Request, res: Response) => {
  try {
    const data = await pointsService.deactivateBoostEvent(req.params.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Boost event deactivated",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed to deactivate boost event",
      data:       null,
    });
  }
};

// GET /points/my-rank — get user's exact rank even outside top 50
const getMyRank = async (req: Request, res: Response) => {
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

    const data = await pointsService.getMyRank(userId);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success:    true,
      message:    "Rank retrieved",
      data,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success:    false,
      message:    error?.message ?? "Failed",
      data:       null,
    });
  }
};

export const pointsController = {
  getMyPoints,
  getLeaderboard,
  createBoostEvent,
  getBoostEvents,
  deactivateBoostEvent,
  getMyRank,
};