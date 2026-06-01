import { Request, Response } from "express";
import { reconciliationService } from "./reconciliation.service";
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
 * Get reconciliation status (admin only)
 */
const getReconciliationStatus = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  const performer = req.user
    ? { id: req.user.id, name: req.user.name || req.user.username || req.user.email }
    : undefined;

  try {
    const result = await reconciliationService.performReconciliation(performer);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Reconciliation check completed successfully",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to perform reconciliation check",
    });
  }
};

/**
 * Re-sync missing items to Google Sheets (admin only)
 */
const resyncMissingItems = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  const performer = req.user
    ? { id: req.user.id, name: req.user.name || req.user.username || req.user.email }
    : undefined;

  try {
    const { itemIds } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "itemIds array is required and must not be empty",
      });
    }

    const result = await reconciliationService.resyncMissingItems(itemIds, performer);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: `Re-sync completed: ${result.success} success, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to re-sync items",
    });
  }
};

/**
 * Manually trigger weekly reconciliation report (admin only)
 */
const triggerWeeklyReport = async (req: Request, res: Response) => {
  if (!checkAdminRole(req, res)) return;

  const performer = req.user
    ? { id: req.user.id, name: req.user.name || req.user.username || req.user.email }
    : undefined;

  try {
    const result = await reconciliationService.runWeeklyReconciliation(performer);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: result.discrepancies.length > 0 
        ? `Reconciliation report sent to admins. ${result.discrepancies.length} discrepancies found.`
        : "All items are properly synced. No report sent.",
      data: result,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to trigger reconciliation report",
    });
  }
};

export const reconciliationController = {
  getReconciliationStatus,
  resyncMissingItems,
  triggerWeeklyReport,
};

