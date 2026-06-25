import { Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { aiRecognitionService } from "./ai.service";

const recognizeImage = async (req: Request, res: Response) => {
  try {
    const imageSource = req.file ? req.file.buffer : req.body.image;
    const mimeType = req.file ? req.file.mimetype : req.body.mimeType;

    if (!imageSource) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Image is required (file upload, URL, or base64 string)",
        data: null,
      });
    }

    const result = await aiRecognitionService.recognizeImage(imageSource, mimeType);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Image recognized successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("[AI] Recognition Error:", error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.message || "AI recognition failed",
      data: null,
    });
  }
};

const parseVoice = async (req: Request, res: Response) => {
  try {
    const audioSource = req.file ? req.file.buffer : null;
    const mimeType = req.file ? req.file.mimetype : "audio/webm";

    if (!audioSource) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Audio file is required for voice parsing",
        data: null,
      });
    }

    const result = await aiRecognitionService.parseVoice(audioSource, mimeType);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Voice parsed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("[AI] Voice Parsing Error:", error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.message || "AI voice parsing failed",
      data: null,
    });
  }
};

const checkDuplicate = async (req: Request, res: Response) => {
  try {
    const { name, description, categoryId, itemType } = req.body;

    if (!name || !categoryId || !itemType) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "name, categoryId, and itemType are required",
        data: null,
      });
    }

    if (itemType !== "lost" && itemType !== "found") {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "itemType must be either 'lost' or 'found'",
        data: null,
      });
    }

    const duplicates = await aiRecognitionService.findDuplicates(
      name,
      description || "",
      categoryId,
      itemType
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Duplicate check completed",
      data: duplicates,
    });
  } catch (error: any) {
    console.error("[AI] Duplicate Check Controller Error:", error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.message || "Failed to check duplicates",
      data: null,
    });
  }
};

const comparePhotos = async (req: Request, res: Response) => {
  try {
    const { foundImageUrl, claimImageUrl, claimDescription } = req.body;

    if (!foundImageUrl) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "foundImageUrl is required",
        data: null,
      });
    }

    const result = await aiRecognitionService.comparePhotos(
      foundImageUrl,
      claimImageUrl || null,
      claimDescription || null
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Photo comparison completed",
      data: result,
    });
  } catch (error: any) {
    console.error("[AI] Photo Comparison Controller Error:", error);
    sendResponse(res, {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      success: false,
      message: error?.message || "Photo comparison failed",
      data: null,
    });
  }
};

export const aiRecognitionController = {
  recognizeImage,
  parseVoice,
  checkDuplicate,
  comparePhotos,
};
