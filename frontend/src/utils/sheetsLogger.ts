/**
 * Professional Google Sheets Logger
 * Logs lost and found reports to specific sheets in a centralized Google Sheet.
 */

interface SheetLogData {
  sheetName: "Lost Items" | "Found Items";
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

export const logToSheet = async (data: SheetLogData) => {
  const WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    console.warn("VITE_SHEETS_WEBHOOK_URL is not defined. Skipping sheet logging.");
    return;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log(`Logged to ${data.sheetName} successfully`, response);
  } catch (error) {
    console.error(`Error logging to ${data.sheetName}:`, error);
  }
};
