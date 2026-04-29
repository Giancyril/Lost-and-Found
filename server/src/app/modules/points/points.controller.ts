// src/modules/points/points.controller.ts

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { pointsService } from "./points.service";

const getMyPoints = async (req: Request, res: Response) => {
  try {
    const result = await pointsService.getMyPoints(req.user.id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Points retrieved successfully",
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: err.statusCode ?? 400,
      success: false,
      message: err.message,
      data: null,
    });
  }
};

const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    const result = await pointsService.getLeaderboard();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Leaderboard retrieved",
      data: result,
    });
  } catch (err: any) {
    sendResponse(res, {
      statusCode: err.statusCode ?? 400,
      success: false,
      message: err.message,
      data: null,
    });
  }
};

export const pointsController = { getMyPoints, getLeaderboard };


// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE ROUTES to your main router.ts file:
// ─────────────────────────────────────────────────────────────────────────────
//
//   import { pointsController } from "../modules/points/points.controller";
//
//   router.get("/points/my",          auth(), pointsController.getMyPoints);
//   router.get("/points/leaderboard",         pointsController.getLeaderboard);
//
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// AWARD POINTS when a found item is reported — add this to foundItem.controller.ts
// inside your createFoundItem handler, after the item is created:
// ─────────────────────────────────────────────────────────────────────────────
//
//   import { pointsService } from "../points/points.service";
//
//   // After: const item = await prisma.foundItem.create(...)
//   if (req.user?.id) {
//     await pointsService.award(req.user.id, 'FOUND_ITEM_REPORTED', item.id)
//       .catch(() => {}); // don't block the response if points fail
//   }
//
// ─────────────────────────────────────────────────────────────────────────────