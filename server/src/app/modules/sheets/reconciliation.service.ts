import prisma from "../../config/prisma";
import { sendEmail } from "../../utils/mailer";
import { sheetsReconciliationAlertTemplate } from "../../utils/emailTemplates";
import { logSystemAudit } from "../../utils/auditLog";
import axios from "axios";

const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const LOST_ITEMS_SHEET = "Lost Items";
const FOUND_ITEMS_SHEET = "Found Items";

interface DiscrepancyItem {
  id: string;
  type: "LOST" | "FOUND";
  itemName: string;
  reporterName: string;
  location: string;
  createdAt: Date;
  reason: string;
}

interface ReconciliationResult {
  totalChecked: number;
  discrepancies: DiscrepancyItem[];
  lostItemsChecked: number;
  foundItemsChecked: number;
  lostItemsDiscrepancies: number;
  foundItemsDiscrepancies: number;
}

interface Performer {
  id: string;
  name: string;
}

/**
 * Fetch all rows from a Google Sheet using Gviz API
 */
const fetchSheetRows = async (sheetName: string): Promise<any[]> => {
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

    const response = await axios.get(gvizUrl, { timeout: 10000 });

    const jsonStr = response.data.substring(
      response.data.indexOf("(") + 1,
      response.data.lastIndexOf(")")
    );
    const json = JSON.parse(jsonStr);

    if (!json.table || !json.table.rows) return [];

    // Parse rows and extract Report ID (column index may vary)
    // Typical structure: Timestamp, Student ID, Reporter Name, Email, Item Name, Description, Location, Date, Report ID, Scanned At
    return json.table.rows
      .filter((row: any) => row.c && row.c.length > 0)
      .map((row: any) => {
        const reportId = row.c[8]?.v ? String(row.c[8].v).trim() : null;
        const timestamp = row.c[0]?.v ? String(row.c[0].v) : null;
        const itemName = row.c[4]?.v ? String(row.c[4].v) : null;
        return { reportId, timestamp, itemName, rawRow: row.c };
      })
      .filter((item: any) => item.reportId);
  } catch (error: any) {
    console.error(`[Reconciliation] Error fetching ${sheetName}:`, error.message);
    return [];
  }
};

/**
 * Get all items from database created between two dates
 */
const getDatabaseItems = async (startDate: Date, endDate: Date) => {
  const [lostItems, foundItems] = await Promise.all([
    prisma.lostItem.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, isDeleted: false },
      select: { id: true, lostItemName: true, reporterName: true, location: true, createdAt: true },
    }),
    prisma.foundItem.findMany({
      where: { createdAt: { gte: startDate, lte: endDate }, isDeleted: false },
      select: { id: true, foundItemName: true, reporterName: true, location: true, createdAt: true },
    }),
  ]);
  return { lostItems, foundItems };
};

/**
 * Perform reconciliation check (compares DB vs Google Sheets for last 7 days)
 */
const performReconciliation = async (performer?: Performer): Promise<ReconciliationResult> => {
  console.log("[Reconciliation] Starting reconciliation check...");

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  console.log(`[Reconciliation] Checking items from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const [dbItems, lostSheetRows, foundSheetRows] = await Promise.all([
    getDatabaseItems(startDate, endDate),
    fetchSheetRows(LOST_ITEMS_SHEET),
    fetchSheetRows(FOUND_ITEMS_SHEET),
  ]);

  console.log(`[Reconciliation] DB: ${dbItems.lostItems.length} lost, ${dbItems.foundItems.length} found`);
  console.log(`[Reconciliation] Sheets: ${lostSheetRows.length} lost, ${foundSheetRows.length} found`);

  const lostSheetIds = new Set(lostSheetRows.map((row) => row.reportId));
  const foundSheetIds = new Set(foundSheetRows.map((row) => row.reportId));
  const discrepancies: DiscrepancyItem[] = [];

  for (const item of dbItems.lostItems) {
    if (!lostSheetIds.has(item.id)) {
      discrepancies.push({
        id: item.id,
        type: "LOST",
        itemName: item.lostItemName,
        reporterName: item.reporterName,
        location: item.location,
        createdAt: item.createdAt,
        reason: "Missing from Google Sheets",
      });
    }
  }

  for (const item of dbItems.foundItems) {
    if (!foundSheetIds.has(item.id)) {
      discrepancies.push({
        id: item.id,
        type: "FOUND",
        itemName: item.foundItemName,
        reporterName: item.reporterName,
        location: item.location,
        createdAt: item.createdAt,
        reason: "Missing from Google Sheets",
      });
    }
  }

  const result: ReconciliationResult = {
    totalChecked: dbItems.lostItems.length + dbItems.foundItems.length,
    discrepancies,
    lostItemsChecked: dbItems.lostItems.length,
    foundItemsChecked: dbItems.foundItems.length,
    lostItemsDiscrepancies: discrepancies.filter((d) => d.type === "LOST").length,
    foundItemsDiscrepancies: discrepancies.filter((d) => d.type === "FOUND").length,
  };

  console.log(`[Reconciliation] Found ${discrepancies.length} discrepancies`);

  // Audit log
  await logSystemAudit({
    entityType: "RECONCILIATION",
    action: performer ? "MANUAL_RECONCILIATION_CHECK" : "RECONCILIATION_CHECK",
    newData: {
      totalChecked: result.totalChecked,
      discrepanciesFound: discrepancies.length,
      lostMissing: result.lostItemsDiscrepancies,
      foundMissing: result.foundItemsDiscrepancies,
    },
    performedBy: performer?.name ?? "System",
    performedById: performer?.id,
  });

  return result;
};

/**
 * Re-sync missing items back to Google Sheets via webhook
 */
const resyncMissingItems = async (
  itemIds: string[],
  performer?: Performer
): Promise<{ success: number; failed: number }> => {
  console.log(`[Reconciliation] Re-syncing ${itemIds.length} missing items...`);

  let success = 0;
  let failed = 0;
  const resynced: string[] = [];

  const SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!SHEETS_WEBHOOK_URL) {
    console.error("[Reconciliation] SHEETS_WEBHOOK_URL not configured");
    await logSystemAudit({
      entityType: "RECONCILIATION",
      action: "RECONCILIATION_RESYNC_FAILED",
      newData: { reason: "SHEETS_WEBHOOK_URL not configured", itemIds },
      performedBy: performer?.name ?? "System",
      performedById: performer?.id,
    });
    return { success: 0, failed: itemIds.length };
  }

  for (const itemId of itemIds) {
    try {
      let item: any = await prisma.lostItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      let type: "LOST" | "FOUND" = "LOST";
      let sheetName = "Lost Items";

      if (!item) {
        const foundItem = await prisma.foundItem.findUnique({
          where: { id: itemId },
          include: { category: true },
        });
        if (!foundItem) {
          console.error(`[Reconciliation] Item ${itemId} not found in database`);
          failed++;
          continue;
        }
        item = foundItem;
        type = "FOUND";
        sheetName = "Found Items";
      }

      const itemName = type === "LOST"
        ? (item as any).lostItemName
        : (item as any).foundItemName;

      const logData = {
        sheetName,
        timestamp: item.createdAt.toISOString(),
        studentId: item.schoolEmail ? item.schoolEmail.split("@")[0] : "N/A",
        reporterName: item.reporterName || "Anonymous",
        email: item.schoolEmail || "N/A",
        itemName,
        description: item.description,
        location: item.location,
        date: item.date.toISOString(),
        type,
        reportId: item.id,
        scannedAt: item.createdAt.toISOString(),
      };

      await axios.post(SHEETS_WEBHOOK_URL, logData, { timeout: 5000 });
      console.log(`[Reconciliation] Successfully re-synced ${itemId}`);
      resynced.push(itemId);
      success++;
    } catch (error: any) {
      console.error(`[Reconciliation] Failed to re-sync ${itemId}:`, error.message);
      failed++;
    }
  }

  console.log(`[Reconciliation] Re-sync complete: ${success} success, ${failed} failed`);

  // Audit log
  await logSystemAudit({
    entityType: "RECONCILIATION",
    action: "RECONCILIATION_RESYNC",
    newData: { requested: itemIds.length, success, failed, resyncedIds: resynced },
    performedBy: performer?.name ?? "System",
    performedById: performer?.id,
  });

  return { success, failed };
};

/**
 * Send styled reconciliation email report to all active admins
 */
const sendReconciliationReport = async (
  result: ReconciliationResult,
  performer?: Performer
) => {
  if (result.discrepancies.length === 0) {
    console.log("[Reconciliation] No discrepancies found, skipping email");
    return;
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", activated: true, isDeleted: false },
    select: { email: true, username: true },
  });

  if (admins.length === 0) {
    console.warn("[Reconciliation] No active admins found to send report");
    return;
  }

  const { subject, html } = sheetsReconciliationAlertTemplate({
    discrepanciesCount: result.discrepancies.length,
    lostItemsCount: result.lostItemsDiscrepancies,
    foundItemsCount: result.foundItemsDiscrepancies,
    totalChecked: result.totalChecked,
    items: result.discrepancies.map((d) => ({
      type: d.type,
      itemName: d.itemName,
      reporterName: d.reporterName,
      location: d.location,
      createdAt: d.createdAt,
      id: d.id,
    })),
  });

  const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";

  const sent: string[] = [];
  const failedEmails: string[] = [];

  for (const admin of admins) {
    try {
      await sendEmail({ fromName, fromEmail, toEmail: admin.email, subject, html });
      console.log(`[Reconciliation] Report sent to ${admin.email}`);
      sent.push(admin.email);
    } catch (error) {
      console.error(`[Reconciliation] Failed to send report to ${admin.email}:`, error);
      failedEmails.push(admin.email);
    }
  }

  // Audit log
  await logSystemAudit({
    entityType: "RECONCILIATION",
    action: performer ? "MANUAL_RECONCILIATION_REPORT_SEND" : "RECONCILIATION_REPORT_SEND",
    newData: {
      discrepanciesCount: result.discrepancies.length,
      sentTo: sent,
      failedDelivery: failedEmails,
    },
    performedBy: performer?.name ?? "System",
    performedById: performer?.id,
  });
};

/**
 * Run full weekly reconciliation check and send report if needed
 */
const runWeeklyReconciliation = async (performer?: Performer) => {
  try {
    const result = await performReconciliation(performer);

    if (result.discrepancies.length > 0) {
      await sendReconciliationReport(result, performer);
    } else {
      console.log("[Reconciliation] All items are properly synced ✓");
    }

    return result;
  } catch (error) {
    console.error("[Reconciliation] Error during weekly reconciliation:", error);
    throw error;
  }
};

export const reconciliationService = {
  performReconciliation,
  resyncMissingItems,
  sendReconciliationReport,
  runWeeklyReconciliation,
};
