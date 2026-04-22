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
  // ── FIX: Use the production API URL; never fall back to localhost ──
  const API_BASE_URL =
    import.meta.env.VITE_SERVER_URL ||
    "https://lost-and-found-jqmn.onrender.com";

  try {
    const response = await fetch(`${API_BASE_URL}/api/sheets/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`Logged to ${data.sheetName} successfully:`, result);
  } catch (error) {
    console.error(`Error logging to ${data.sheetName}:`, error);
    // Silently swallow — sheet logging should never block the main flow
  }
};