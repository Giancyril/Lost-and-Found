/**
 * Google Apps Script Webhook for Logging Lost and Found Items
 * 
 * Setup Instructions:
 * 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/edit
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Deploy > New deployment > Web app
 * 5. Execute as: Me (your Google account)
 * 6. Who has access: Anyone
 * 7. Copy the Web app URL and add it as GOOGLE_SHEETS_WEBHOOK_URL in backend .env
 */

// Sheet names - make sure these match exactly in your Google Sheet
const LOST_ITEMS_SHEET = "Lost Items";
const FOUND_ITEMS_SHEET = "Found Items";

// Column headers - these must match your sheet structure
const LOST_ITEMS_HEADERS = [
  "Timestamp", "Student ID", "Reporter Name", "Email", "Item Name", 
  "Description", "Location", "Date Lost", "Type", "Report ID", "Scanned At"
];

const FOUND_ITEMS_HEADERS = [
  "Timestamp", "Student ID", "Reporter Name", "Email", "Item Name", 
  "Description", "Location", "Date Found", "Type", "Report ID", "Scanned At"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Validate the data
    if (!data.sheetName || !data.itemName || !data.location || !data.date) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing required fields"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Select the appropriate sheet
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(data.sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: `Sheet "${data.sheetName}" not found`
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Initialize sheet if needed
    initializeSheet(sheet, data.sheetName);

    // Add the new row - use exact data from backend, no fallbacks
    const rowData = [
      data.timestamp, // Use exact timestamp from backend
      data.studentId,
      data.reporterName,
      data.email,
      data.itemName,
      data.description,
      data.location,
      data.date,
      data.type,
      data.reportId,
      data.scannedAt // Use exact scannedAt from backend
    ];

    sheet.appendRow(rowData);

    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `Successfully logged to ${data.sheetName}`,
      rowAdded: rowData.length
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "Google Sheets Logger Webhook is running",
    sheets: {
      "Lost Items": LOST_ITEMS_SHEET,
      "Found Items": FOUND_ITEMS_SHEET
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

function initializeSheet(sheet, sheetName) {
  const headers = sheetName === LOST_ITEMS_SHEET ? LOST_ITEMS_HEADERS : FOUND_ITEMS_HEADERS;
  
  // Check if sheet has headers
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    // Sheet is empty, add headers
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4285F4");
    headerRange.setFontColor("white");
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
  }
}

// Test function - run this from the Apps Script editor to test
function testWebhook() {
  const testData = {
    sheetName: "Found Items",
    studentId: "2024-1234",
    reporterName: "Test User",
    email: "test@nbsc.edu.ph",
    itemName: "Test Wallet",
    description: "Black leather wallet with student ID",
    location: "Library",
    date: "2024-04-22",
    type: "FOUND",
    reportId: "test-123",
    scannedAt: new Date().toISOString()
  };
  
  const result = doPost({
    postData: {
      contents: JSON.stringify(testData)
    }
  });
  
  Logger.log("Test result: " + result.getContent());
}

// Setup function - run this to create the sheets if they don't exist
function setupSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Lost Items sheet if it doesn't exist
  if (!spreadsheet.getSheetByName(LOST_ITEMS_SHEET)) {
    const sheet = spreadsheet.insertSheet(LOST_ITEMS_SHEET);
    initializeSheet(sheet, LOST_ITEMS_SHEET);
  }
  
  // Create Found Items sheet if it doesn't exist
  if (!spreadsheet.getSheetByName(FOUND_ITEMS_SHEET)) {
    const sheet = spreadsheet.insertSheet(FOUND_ITEMS_SHEET);
    initializeSheet(sheet, FOUND_ITEMS_SHEET);
  }
  
  Logger.log("Sheets setup complete");
}
