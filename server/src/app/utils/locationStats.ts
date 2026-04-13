import { Request, Response } from "express";
import { foundItemService } from "../modules/foundItems/foundItem.service";
import { lostTItemServices } from "../modules/lostItem/lostItem.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

export const locationStats = async (req: Request, res: Response) => {
  try {
    // Revert to simple location-only stats
    const [foundItems, lostItems] = await Promise.all([
      foundItemService.getFoundItem({ limit: 5000 }),
      lostTItemServices.getLostItem({ limit: 5000 })
    ]);

    const counts: Record<string, { found: number; lost: number; total: number }> = {};

    for (const item of foundItems) {
      const loc = (item.location || "Unknown").trim();
      if (!counts[loc]) counts[loc] = { found: 0, lost: 0, total: 0 };
      counts[loc].found++;
      counts[loc].total++;
    }

    for (const item of lostItems) {
      const loc = (item.location || "Unknown").trim();
      if (!counts[loc]) counts[loc] = { found: 0, lost: 0, total: 0 };
      counts[loc].lost++;
      counts[loc].total++;
    }

    const locationData = Object.entries(counts)
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.total - a.total);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Location stats retrieved successfully",
      data: locationData,
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