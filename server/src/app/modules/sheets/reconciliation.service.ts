import prisma from "../../config/prisma";
import { sendEmail } from "../../utils/mailer";
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

/**
 * Fetch all rows from a Google Sheet using Gviz API
 */
const fetchSheetRows = async (sheetName: string): Promise<any[]> => {
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    
    const response = await axios.get(gvizUrl, {
      timeout: 10000,
    });

    const jsonStr = response.data.substring(
      response.data.indexOf("(") + 1,
      response.data.lastIndexOf(")")
    );
    const json = JSON.parse(jsonStr);

    if (!json.table || !json.table.rows) {
      return [];
    }

    // Parse rows and extract Report ID (column index may vary)
    // Typical structure: Timestamp, Student ID, Reporter Name, Email, Item Name, Description, Location, Date, Report ID, Scanned At
    return json.table.rows
      .filter((row: any) => row.c && row.c.length > 0)
      .map((row: any) => {
        // Report ID is typically in column 8 (index 8)
        const reportId = row.c[8]?.v ? String(row.c[8].v).trim() : null;
        const timestamp = row.c[0]?.v ? String(row.c[0].v) : null;
        const itemName = row.c[4]?.v ? String(row.c[4].v) : null;
        
        return {
          reportId,
          timestamp,
          itemName,
          rawRow: row.c,
        };
      })
      .filter((item: any) => item.reportId); // Only include rows with Report ID
  } catch (error: any) {
    console.error(`[Reconciliation] Error fetching ${sheetName}:`, error.message);
    return [];
  }
};

/**
 * Get all items from database created in the last 7 days
 */
const getDatabaseItems = async (startDate: Date, endDate: Date) => {
  const [lostItems, foundItems] = await Promise.all([
    prisma.lostItem.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        lostItemName: true,
        reporterName: true,
        location: true,
        createdAt: true,
      },
    }),
    prisma.foundItem.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      select: {
        id: true,
        foundItemName: true,
        reporterName: true,
        location: true,
        createdAt: true,
      },
    }),
  ]);

  return { lostItems, foundItems };
};

/**
 * Perform weekly reconciliation check
 */
const performReconciliation = async (): Promise<ReconciliationResult> => {
  console.log("[Reconciliation] Starting weekly reconciliation check...");

  // Get date range for last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  console.log(`[Reconciliation] Checking items from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Fetch data from both sources
  const [dbItems, lostSheetRows, foundSheetRows] = await Promise.all([
    getDatabaseItems(startDate, endDate),
    fetchSheetRows(LOST_ITEMS_SHEET),
    fetchSheetRows(FOUND_ITEMS_SHEET),
  ]);

  console.log(`[Reconciliation] Database: ${dbItems.lostItems.length} lost, ${dbItems.foundItems.length} found`);
  console.log(`[Reconciliation] Sheets: ${lostSheetRows.length} lost, ${foundSheetRows.length} found`);

  // Create sets of Report IDs from sheets
  const lostSheetIds = new Set(lostSheetRows.map((row) => row.reportId));
  const foundSheetIds = new Set(foundSheetRows.map((row) => row.reportId));

  const discrepancies: DiscrepancyItem[] = [];

  // Check lost items
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

  // Check found items
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

  return result;
};

/**
 * Re-sync missing items to Google Sheets
 */
const resyncMissingItems = async (itemIds: string[]): Promise<{ success: number; failed: number }> => {
  console.log(`[Reconciliation] Re-syncing ${itemIds.length} missing items...`);

  let success = 0;
  let failed = 0;

  const SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!SHEETS_WEBHOOK_URL) {
    console.error("[Reconciliation] SHEETS_WEBHOOK_URL not configured");
    return { success: 0, failed: itemIds.length };
  }

  for (const itemId of itemIds) {
    try {
      // Try to find in lost items first
      let item: any = await prisma.lostItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      });

      let type: "LOST" | "FOUND" = "LOST";
      let sheetName = "Lost Items";

      // If not found, try found items
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

      // At this point, item is guaranteed to be non-null
      const itemName = type === "LOST" 
        ? (item as any).lostItemName 
        : (item as any).foundItemName;

      // Prepare log data
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

      // Send to webhook
      await axios.post(SHEETS_WEBHOOK_URL, logData, {
        timeout: 5000,
      });

      console.log(`[Reconciliation] Successfully re-synced ${itemId}`);
      success++;
    } catch (error: any) {
      console.error(`[Reconciliation] Failed to re-sync ${itemId}:`, error.message);
      failed++;
    }
  }

  console.log(`[Reconciliation] Re-sync complete: ${success} success, ${failed} failed`);

  return { success, failed };
};

/**
 * Send reconciliation report to admins
 */
const sendReconciliationReport = async (result: ReconciliationResult) => {
  if (result.discrepancies.length === 0) {
    console.log("[Reconciliation] No discrepancies found, skipping email");
    return;
  }

  // Get all admin emails
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", activated: true, isDeleted: false },
    select: { email: true, username: true },
  });

  if (admins.length === 0) {
    console.warn("[Reconciliation] No active admins found to send report");
    return;
  }

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Google Sheets Reconciliation Alert</h2>
      
      <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #991b1b;">
          ${result.discrepancies.length} item(s) were not logged to Google Sheets this week
        </p>
      </div>

      <h3 style="color: #1e40af;">Summary</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="padding: 8px 0;">📊 <strong>Total Items Checked:</strong> ${result.totalChecked}</li>
        <li style="padding: 8px 0;">🔴 <strong>Lost Items Checked:</strong> ${result.lostItemsChecked} (${result.lostItemsDiscrepancies} missing)</li>
        <li style="padding: 8px 0;">🟢 <strong>Found Items Checked:</strong> ${result.foundItemsChecked} (${result.foundItemsDiscrepancies} missing)</li>
      </ul>

      <h3 style="color: #1e40af;">Missing Items</h3>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${result.discrepancies
          .map(
            (item) => `
          <div style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
            <strong style="color: ${item.type === "LOST" ? "#dc2626" : "#16a34a"};">
              ${item.type === "LOST" ? "🔴 LOST" : "🟢 FOUND"}
            </strong>: ${item.itemName}<br/>
            <span style="color: #6b7280; font-size: 14px;">
              Reporter: ${item.reporterName} | Location: ${item.location}<br/>
              Created: ${new Date(item.createdAt).toLocaleString()}<br/>
              ID: ${item.id}
            </span>
          </div>
        `
          )
          .join("")}
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #1e40af;">🔧 How to Fix</h4>
        <p style="margin: 10px 0;">
          1. Log in to the admin dashboard<br/>
          2. Navigate to <strong>Sheets Reconciliation</strong><br/>
          3. Review the missing items<br/>
          4. Click <strong>"Re-sync Missing Items"</strong> to automatically log them to Google Sheets
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        This is an automated weekly reconciliation report. The check compares database records 
        from the last 7 days with Google Sheets logs to ensure data integrity.
      </p>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>Why this matters:</strong> Google Sheets serves as your offline audit trail. 
        Missing entries could indicate network failures, offline sync issues, or webhook errors.
      </p>
    </div>
  `;

  const fromName = process.env.SMTP_FROM_NAME || "NBSC SAS Lost & Found";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "mijaresgiancyril@gmail.com";

  // Send email to all admins
  for (const admin of admins) {
    try {
      await sendEmail({
        fromName,
        fromEmail,
        toEmail: admin.email,
        subject: `[Lost & Found] ⚠️ Sheets Reconciliation Alert - ${result.discrepancies.length} items missing`,
        html: emailBody,
      });
      console.log(`[Reconciliation] Report sent to ${admin.email}`);
    } catch (error) {
      console.error(`[Reconciliation] Failed to send report to ${admin.email}:`, error);
    }
  }
};

/**
 * Run weekly reconciliation check and send report
 */
const runWeeklyReconciliation = async () => {
  try {
    const result = await performReconciliation();
    
    if (result.discrepancies.length > 0) {
      await sendReconciliationReport(result);
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
