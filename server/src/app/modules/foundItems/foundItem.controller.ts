import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { Request, Response } from "express";
import { foundItemService } from "./foundItem.service";
import { utils } from "../../utils/utils";
import { matchService } from "../matching/match.service";
import { uploadFileToStorage } from "../../utils/storage";
import sharp from "sharp";
import { sendEmail } from "../../utils/mailer";
import { lostItemReportedTemplate } from "../../utils/emailTemplates";
import { logToSheet } from "../sheets/sheets.service";
import { pointsService } from "../points/points.service"; // ← NEW

const createFoundItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const result = await foundItemService.createFoundItem(req.body, userId);

    if (result?.id) {
      // ── Award points to the reporter ────────────────────────────────────────
      // Fire-and-forget: never blocks the response if points fail
      if (userId) {
        await pointsService
          .award(userId, "FOUND_ITEM_REPORTED", result.id)
          .catch((err) =>
            console.error("[Points] Failed to award points for found item:", err)
          );
      }

      // Log to Google Sheets
      try {
        const reportTimestamp = new Date().toISOString();
        const studentId =
          req.body.studentId ||
          (req.body.schoolEmail
            ? req.body.schoolEmail.split("@")[0]
            : "N/A");

        await logToSheet({
          sheetName: "Found Items",
          timestamp: reportTimestamp,
          studentId: studentId,
          reporterName: req.body.reporterName || "SAS Office",
          email: req.body.schoolEmail || "N/A",
          itemName: req.body.foundItemName,
          description: req.body.description || "",
          location: req.body.location,
          date: req.body.date,
          type: "FOUND",
          reportId: result.id.toString(),
          scannedAt: reportTimestamp,
        });
        console.log(
          "[Sheets] Found item logged to Google Sheets:",
          result.id
        );
      } catch (sheetsError) {
        console.error(
          "[Sheets] Failed to log found item to Google Sheets:",
          sheetsError
        );
      }

      // Send confirmation email to the reporter
      try {
        const fromName =
          process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
        const fromEmail =
          process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";

        const template = lostItemReportedTemplate({
          reporterName: req.body.reporterName || "Unknown",
          itemName: req.body.foundItemName,
          location: req.body.location,
          date: new Date(req.body.date).toLocaleDateString(),
          description: req.body.description,
        });

        await sendEmail({
          fromName,
          fromEmail,
          toEmail: req.body.schoolEmail,
          subject: template.subject,
          html: template.html,
        });

        console.log(
          "[Email] Found item confirmation sent to:",
          req.body.schoolEmail
        );
      } catch (emailError) {
        console.error(
          "[Email] Failed to send found item confirmation:",
          emailError
        );
      }

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
    res.set("Cache-Control", "public, max-age=60");
    const meta = await utils.calculateMeta({ ...req.query, itemType: "found" });
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
    const result = await foundItemService.getStaleFoundItems();
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

const uploadFoundItemImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    const { primaryIndex } = req.body;

    if (!files || files.length === 0) {
      return sendResponse(res, {
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "No images provided",
        data: null,
      });
    }

    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let compressedBuffer = file.buffer;
      try {
        compressedBuffer = await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({
            quality: 80,
            progressive: true,
          })
          .toBuffer();
      } catch (error) {
        console.error("Image compression error:", error);
        compressedBuffer = file.buffer;
      }

      const url = await uploadFileToStorage(
        compressedBuffer,
        file.mimetype,
        "found",
        id
      );
      uploadedUrls.push(url);
    }

    const primaryImageUrl = uploadedUrls[parseInt(primaryIndex) || 0];
    await foundItemService.updateFoundItemImage(id, primaryImageUrl);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Images uploaded successfully",
      data: {
        urls: uploadedUrls,
        primaryImageUrl,
      },
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
  uploadFoundItemImages,
};