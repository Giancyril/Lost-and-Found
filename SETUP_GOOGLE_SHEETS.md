# Google Sheets Logging Setup Guide

This guide will help you set up automatic logging of lost and found items to Google Sheets.

## Prerequisites
- Access to the Google Sheet: https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/edit
- Backend server access to add environment variables

## Step 1: Set up Google Apps Script Webhook

1. **Open the Google Sheet**
   - Go to: https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/edit

2. **Create Apps Script**
   - Click `Extensions` > `Apps Script`
   - Delete any existing code
   - Copy the entire contents of `google-apps-script/SheetsLogger.gs`
   - Paste it into the Apps Script editor
   - Save the project (Ctrl+S or Cmd+S)

3. **Deploy as Web App**
   - Click `Deploy` > `New deployment`
   - Select type: `Web app`
   - Description: "Lost and Found Items Logger"
   - Execute as: `Me` (your Google account)
   - Who has access: `Anyone`
   - Click `Deploy`
   - Authorize the permissions when prompted
   - Copy the **Web app URL** (it will end with `.googleusercontent.com`)

## Step 2: Configure Backend Environment

1. **Add Webhook URL to Backend**
   - Open `server/.env`
   - Add this line (replace with your actual webhook URL):
   ```
   GOOGLE_SHEETS_WEBHOOK_URL=https://your-webapp-url.googleusercontent.com
   ```

2. **Restart Backend Server**
   - Stop the current server
   - Restart it to load the new environment variable

## Step 3: Test the Integration

1. **Test the Webhook**
   - In the Apps Script editor, select the `testWebhook` function
   - Click `Run`
   - Check the execution logs to see if it works

2. **Setup Sheets (if needed)**
   - In the Apps Script editor, select the `setupSheets` function
   - Click `Run`
   - This will create the "Lost Items" and "Found Items" sheets with proper headers

3. **Test Frontend Logging**
   - Use the app to submit a lost or found item
   - Check the browser console for logging messages
   - Check the Google Sheet to see if the data appears

## Step 4: Verify Everything Works

1. **Check Browser Console**
   - Open browser dev tools
   - Look for messages like "Logged to Found Items successfully"

2. **Check Google Sheets**
   - Go to the Google Sheet
   - You should see new rows appearing in the appropriate sheet
   - Each row should contain: Timestamp, Student ID, Reporter Name, Email, Item Name, Description, Location, Date, Type, Report ID, Scanned At

3. **Check Backend Logs**
   - Monitor the backend console for any errors
   - Successful logs will show "Successfully logged to [sheet] sheet"

## Troubleshooting

### Common Issues:

1. **"Webhook URL not defined" error**
   - Make sure `GOOGLE_SHEETS_WEBHOOK_URL` is set in `server/.env`
   - Restart the backend server

2. **"Permission denied" in Apps Script**
   - Make sure the web app is deployed with "Who has access: Anyone"
   - Redeploy the web app if needed

3. **"Sheet not found" error**
   - Run the `setupSheets` function in Apps Script
   - Make sure the sheet names match exactly ("Lost Items", "Found Items")

4. **CORS errors in frontend**
   - The new backend API should handle CORS properly
   - Make sure the backend is running and accessible

5. **No data appearing in sheets**
   - Check the Apps Script execution logs
   - Make sure the webhook URL is correct and accessible
   - Verify the data format matches what the script expects

## Data Structure

The logged data includes:
- **Timestamp**: When the log was created
- **Student ID**: Scanned student ID or "N/A"
- **Reporter Name**: Name of person reporting the item
- **Email**: Email address of reporter
- **Item Name**: Name of the lost/found item
- **Description**: Item description
- **Location**: Where the item was lost/found
- **Date**: Date of the incident
- **Type**: "LOST" or "FOUND"
- **Report ID**: Database ID of the report
- **Scanned At**: When the student ID was scanned

## Security Notes

- The webhook URL should be kept secret
- Anyone with the URL can send data to your sheets
- Consider adding additional validation if needed
- Regularly check the Apps Script execution logs for unusual activity
