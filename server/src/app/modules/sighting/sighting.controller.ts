import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sightingService } from "./sighting.service";
import sendResponse from "../../global/response";

const createSighting = async (req: Request, res: Response) => {
  try {
    const { lostItemId, reporterName, img, location, coordinates, details } = req.body;
    const userId = req.user?.id;

    if (!lostItemId || !location) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "lostItemId and location are required fields",
        data: null,
      });
    }

    const result = await sightingService.createSighting({
      lostItemId,
      userId,
      reporterName,
      img,
      location,
      coordinates,
      details,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Sighting pin reported successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to report sighting",
      data: null,
    });
  }
};

const getSightingsForLostItem = async (req: Request, res: Response) => {
  try {
    const { lostItemId } = req.params;

    if (!lostItemId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "lostItemId parameter is required",
        data: null,
      });
    }

    const result = await sightingService.getSightingsForLostItem(lostItemId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sightings retrieved successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to retrieve sightings",
      data: null,
    });
  }
};

const verifySighting = async (req: Request, res: Response) => {
  try {
    const { sightingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: StatusCodes.UNAUTHORIZED,
        success: false,
        message: "Authentication is required to verify sightings",
        data: null,
      });
    }

    if (!sightingId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "sightingId parameter is required",
        data: null,
      });
    }

    const result = await sightingService.verifySighting(sightingId, userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sighting verified successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to verify sighting",
      data: null,
    });
  }
};

const deleteSighting = async (req: Request, res: Response) => {
  try {
    const { sightingId } = req.params;

    if (req.user?.role !== "ADMIN") {
      return sendResponse(res, {
        statusCode: StatusCodes.FORBIDDEN,
        success: false,
        message: "Only administrators can delete sightings",
        data: null,
      });
    }

    if (!sightingId) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "sightingId parameter is required",
        data: null,
      });
    }

    const result = await sightingService.deleteSighting(sightingId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Sighting deleted successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: error?.message || "Failed to delete sighting",
      data: null,
    });
  }
};

export const sightingController = {
  createSighting,
  getSightingsForLostItem,
  verifySighting,
  deleteSighting,
};
