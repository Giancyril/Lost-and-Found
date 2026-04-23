import { Request, Response } from "express";
import sendResponse from "../../global/response";
import { StatusCodes } from "http-status-codes";
import { lostTItemServices } from "./lostItem.service";
import { utils } from "../../utils/utils";
import { matchService } from "../matching/match.service";
import { sendEmail } from "../../utils/mailer";
import { lostItemReportedTemplate } from "../../utils/emailTemplates";
import { logToSheet } from "../sheets/sheets.service";

const toggleFoundStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const result = await lostTItemServices.toggleFoundStatus(id);
    const message = result.isFound
      ? "Item marked as found successfully"
      : "Item marked as not found successfully";
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message,
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

const createLostItem = async (req: Request, res: Response) => {
  try {
    const item = req.body;
    const userId = req.user?.id;
    const result = await lostTItemServices.createLostItem(userId, item);

    if (result?.id) {
      // Log to Google Sheets
      try {
        await logToSheet({
          sheetName: "Lost Items",
          studentId: req.body.studentId || "N/A",
          reporterName: req.body.reporterName || "SAS Office",
          email: req.body.schoolEmail || "N/A",
          itemName: req.body.lostItemName,
          description: req.body.description || "",
          location: req.body.location,
          date: req.body.date,
          type: "LOST",
          reportId: result.id.toString(),
          scannedAt: new Date().toISOString()
        });
        console.log("[Sheets] Lost item logged to Google Sheets:", result.id);
      } catch (sheetsError) {
        console.error("[Sheets] Failed to log lost item to Google Sheets:", sheetsError);
      }

      // Send confirmation email to the reporter
      try {
        const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
        const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";
        
        const template = lostItemReportedTemplate({
          reporterName: req.body.reporterName || "Unknown",
          itemName: req.body.lostItemName,
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
        
        console.log("[Email] Lost item confirmation sent to:", req.body.schoolEmail);
      } catch (emailError) {
        console.error("[Email] Failed to send lost item confirmation:", emailError);
      }

      matchService.findMatchesForLostItem(result).catch((err) =>
        console.error("[SmartMatch] Error matching lost item:", err)
      );
    }

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Lost items created successfully",
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

const getLostItem = async (req: Request, res: Response) => {
  try {
    // ── EGRESS FIX: cache public list for 60 seconds ──────────────────────────
    res.set("Cache-Control", "public, max-age=60");
    const meta = await utils.calculateMeta({ ...req.query, itemType: 'lost' });
    const result = await lostTItemServices.getLostItem(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost items retrieved successfully",
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

const getAllLostItems = async (req: Request, res: Response) => {
  try {
    const meta = await utils.calculateMeta({ ...req.query, itemType: 'lost' });
    const result = await lostTItemServices.getAllLostItems(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "All lost items retrieved successfully",
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

const getSingleLostItem = async (req: Request, res: Response) => {
  try {
    const id: any = req?.params.id;
    const result = await lostTItemServices.getSingleLostItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item retrieved successfully",
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

const getMyLostItem = async (req: Request, res: Response) => {
  try {
    const result = await lostTItemServices.getMyLostItem(req.user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item retrieved successfully",
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

const editMyLostItem = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const user = req.user;
    const result = await lostTItemServices.editMyLostItem(data, user);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item edited successfully",
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

const deleteMyLostItem = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await lostTItemServices.deleteMyLostItem(id);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Lost item deleted successfully",
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

export const lostItemController = {
  toggleFoundStatus,
  createLostItem,
  getLostItem,
  getAllLostItems,
  getSingleLostItem,
  getMyLostItem,
  editMyLostItem,
  deleteMyLostItem,
};