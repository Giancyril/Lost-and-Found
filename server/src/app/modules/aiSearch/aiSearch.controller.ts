import { Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { aiSearchService } from "./aiSearch.service";

const aiSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Search query is required",
        data: null,
      });
    }

    const result = await aiSearchService.aiSearchItems(query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "AI search completed successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.message || "AI search failed",
      data: null,
    });
  }
};

export const aiSearchController = {
  aiSearch,
};
