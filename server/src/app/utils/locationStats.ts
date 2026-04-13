import { Request, Response } from "express";
import { foundItemService } from "../modules/foundItems/foundItem.service";
import { lostTItemServices } from "../modules/lostItem/lostItem.service";
import sendResponse from "../global/response";
import { StatusCodes } from "http-status-codes";

export const locationStats = async (req: Request, res: Response) => {
  try {
    const queryParams = { limit: 5000 };

    const [allFound, allLost] = await Promise.all([
      foundItemService.getFoundItem(queryParams),
      lostTItemServices.getLostItem(queryParams)
    ]);

    const counts: Record<string, { found: number; lost: number; total: number }> = {};

    const processItems = (items: any[], type: "found" | "lost") => {
      for (const item of items) {
        const loc = (item.location || "Unknown").trim();
        if (!counts[loc]) counts[loc] = { found: 0, lost: 0, total: 0 };
        
        if (type === "found") counts[loc].found++;
        else counts[loc].lost++;
        
        counts[loc].total++;
      }
    };

    processItems(allFound, "found");
    processItems(allLost, "lost");

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