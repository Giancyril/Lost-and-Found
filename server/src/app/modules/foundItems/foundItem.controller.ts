import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { Request, Response } from "express";
import { foundItemService } from "./foundItem.service";
import { utils } from "../../utils/utils";
import { matchService } from "../matching/match.service";

const createFoundItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await foundItemService.createFoundItem(req.body, userId);

    if (result?.id) {
      matchService.findMatchesForFoundItem(result).catch((err) =>
        console.error("[SmartMatch] Error matching found item:", err)
      );
    }

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Found item reported successfully",
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

const getFoundItem = async (req: Request, res: Response) => {
  try {
    // ── EGRESS FIX: cache public list for 60 seconds ──────────────────────────
    res.set("Cache-Control", "public, max-age=60");
    const meta = await utils.calculateMeta(req.query);
    const result = await foundItemService.getFoundItem(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found items retrieved successfully",
      meta,
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

const getSingleFoundItem = async (req: Request, res: Response) => {
  try {
    const id: any = req?.params.id;
    const result = await foundItemService.getSingleFoundItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item retrieved successfully",
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

const getMyFoundItem = async (req: Request, res: Response) => {
  try {
    const result = await foundItemService.getMyFoundItem(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item retrieved successfully",
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

const editMyFoundItem = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    await foundItemService.editMyFoundItem(data);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item edited successfully",
      data: null,
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

const deleteMyFoundItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await foundItemService.deleteMyFoundItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item deleted successfully",
      data: null,
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

const archiveFoundItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await foundItemService.archiveFoundItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item archived successfully",
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

const restoreFoundItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await foundItemService.restoreFoundItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Found item restored successfully",
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

const getArchivedFoundItems = async (req: Request, res: Response) => {
  try {
    const result = await foundItemService.getArchivedFoundItems();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Archived items retrieved successfully",
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

const getStaleFoundItems = async (req: Request, res: Response) => {
  try {
    const result = await foundItemService.getStalFoundItems();
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Stale items retrieved successfully",
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

export const foundItemController = {
  createFoundItem,
  getFoundItem,
  getSingleFoundItem,
  getMyFoundItem,
  editMyFoundItem,
  deleteMyFoundItem,
  archiveFoundItem,
  restoreFoundItem,
  getArchivedFoundItems,
  getStaleFoundItems,
};