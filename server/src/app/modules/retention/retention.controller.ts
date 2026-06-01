import { Request, Response } from "express";
import { retentionService } from "./retention.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

/**
 * Get items pending deletion (admin only)
 */
const getItemsPendingDeletion = catchAsync(async (req: Request, res: Response) => {
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
});

/**
 * Download CSV report of items pending deletion (admin only)
 */
const downloadDeletionReport = catchAsync(async (req: Request, res: Response) => {
  const items = await retentionService.getItemsPendingDeletion();
  const csv = retentionService.generateCSVReport(items);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="deletion-report-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(csv);
});

/**
 * Manually trigger purge of expired items (admin only)
 */
const purgeExpiredItems = catchAsync(async (req: Request, res: Response) => {
  const results = await retentionService.purgeExpiredItems();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Expired items purged successfully",
    data: results,
  });
});

/**
 * Restore a soft-deleted item (admin only)
 */
const restoreItem = catchAsync(async (req: Request, res: Response) => {
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
});

/**
 * Manually trigger weekly deletion report email (admin only)
 */
const sendWeeklyReport = catchAsync(async (req: Request, res: Response) => {
  await retentionService.sendWeeklyDeletionReport();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly deletion report sent to all admins",
  });
});

export const retentionController = {
  getItemsPendingDeletion,
  downloadDeletionReport,
  purgeExpiredItems,
  restoreItem,
  sendWeeklyReport,
};
