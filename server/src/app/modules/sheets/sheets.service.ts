/**
 * Google Sheets Logging Service
 * Handles logging lost and found items to Google Sheets via Google Apps Script Webhook
 */

interface SheetLogData {
  sheetName: "Lost Items" | "Found Items";
  timestamp: string;
  studentId: string;
  reporterName: string;
  email: string;
  itemName: string;
  description: string;
  location: string;
  date: string;
  type: "LOST" | "FOUND";
  reportId: string;
  scannedAt: string;
}

const SHEET_ID = "1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI";
const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

export const logToSheet = async (data: SheetLogData): Promise<void> => {
  if (!WEBHOOK_URL) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL is not defined in backend environment");
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Google Sheets webhook responded with status: ${response.status}`);
    }

    console.log(`Successfully logged to ${data.sheetName} sheet`);
  } catch (error) {
    console.error(`Error logging to Google Sheets (${data.sheetName}):`, error);
    throw error;
  }
};

export const getSheetsConfig = () => ({
  sheetId: SHEET_ID,
  webhookUrl: WEBHOOK_URL,
  isEnabled: !!WEBHOOK_URL,
});
