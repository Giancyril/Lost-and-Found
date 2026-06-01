import { Request, Response } from "express";
import { retentionService } from "./retention.service";
import sendResponse from "../../global/response";

/**
 * Check if user is admin
 */
const checkAdminRole = (req: Request, res: Response): boolean => {
  if (!req.user || req.user.role !== "ADMIN") {
    sendResponse(res, {
      statusCode: 403,
      success: false,
      message: "Access denied. Admin privileges required.",
    });
    return false;
  }
  return true;
};

/**
 * Get items pending deletion (admin only)
 */
const getItemsPendingDeletion = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const items = await retentionService.getItemsPendingDeletion();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Items pending deletion retrieved successfully",
      data: {
        items,
        count: items.length,
        gracePeriodDays: retentionService.GRACE_PERIOD_DAYS,
        warningDays: retentionService.WARNING_DAYS_BEFORE_PURGE,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to retrieve pending deletions",
    });
  }
};

/**
 * Download CSV report of items pending deletion (admin only)
 */
const downloadDeletionReport = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const items = await retentionService.getItemsPendingDeletion();
    const csv = retentionService.generateCSVReport(items);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="deletion-report-${new Date().toISOString().split("T")[0]}.csv"`);
    res.send(csv);
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to generate report",
    });
  }
};

/**
 * Manually trigger purge of expired items (admin only)
 */
const purgeExpiredItems = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const results = await retentionService.purgeExpiredItems();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Expired items purged successfully",
      data: results,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to purge items",
    });
  }
};

/**
 * Restore a soft-deleted item (admin only)
 */
const restoreItem = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  try {
    const { itemId, itemType } = req.body;

    if (!itemId || !itemType) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "itemId and itemType are required",
      });
    }

    if (!["FoundItem", "LostItem", "Claim"].includes(itemType)) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid itemType. Must be FoundItem, LostItem, or Claim",
      });
    }

    const restoredItem = await retentionService.restoreItem(itemId, itemType);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `${itemType} restored successfully`,
      data: restoredItem,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to restore item",
    });
  }
};

/**
 * Manually trigger weekly deletion report email (admin only)
 */
const sendWeeklyReport = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  try {
    await retentionService.sendWeeklyDeletionReport();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Weekly deletion report sent to all admins",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to send report",
    });
  }
};

export const retentionController = {
  getItemsPendingDeletion,
  downloadDeletionReport,
  purgeExpiredItems,
  restoreItem,
  sendWeeklyReport,
};
