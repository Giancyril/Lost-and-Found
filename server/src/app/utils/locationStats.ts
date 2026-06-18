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

    processItems(allFound || [], "found");
    processItems(allLost || [], "lost");

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

// ── Heatmap Stats: returns per-item detail for the upgraded interactive heatmap ──
export const heatmapStats = async (req: Request, res: Response) => {
  try {
    const queryParams = { limit: 5000 };

    const [allFound, allLost] = await Promise.all([
      foundItemService.getFoundItem(queryParams),
      lostTItemServices.getLostItem(queryParams),
    ]);

    // Build a location → counts lookup
    const counts: Record<string, { found: number; lost: number; total: number }> = {};

    const addToCount = (loc: string, type: "found" | "lost") => {
      if (!counts[loc]) counts[loc] = { found: 0, lost: 0, total: 0 };
      if (type === "found") counts[loc].found++;
      else counts[loc].lost++;
      counts[loc].total++;
    };

    // Slim item payload for the frontend timeline
    const items: Array<{
      id: string;
      type: "found" | "lost";
      location: string;
      date: string;
      category: string;
      name: string;
    }> = [];

    for (const item of allFound || []) {
      const loc = (item.location || "Unknown").trim();
      addToCount(loc, "found");
      items.push({
        id: item.id,
        type: "found",
        location: loc,
        date: item.date ? new Date(item.date).toISOString() : new Date(item.createdAt).toISOString(),
        category: item.category?.name ?? "Unknown",
        name: item.foundItemName ?? "",
      });
    }

    for (const item of allLost || []) {
      const loc = (item.location || "Unknown").trim();
      addToCount(loc, "lost");
      items.push({
        id: item.id,
        type: "lost",
        location: loc,
        date: item.date ? new Date(item.date).toISOString() : new Date(item.createdAt).toISOString(),
        category: item.category?.name ?? "Unknown",
        name: item.lostItemName ?? "",
      });
    }

    const locationData = Object.entries(counts)
      .map(([location, data]) => ({ location, ...data }))
      .sort((a, b) => b.total - a.total);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Heatmap stats retrieved successfully",
      data: { locations: locationData, items },
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