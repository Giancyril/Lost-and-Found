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

export const aiRecognitionController = {
  recognizeImage,
};
