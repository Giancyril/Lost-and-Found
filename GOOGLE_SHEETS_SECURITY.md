# Google Sheets Security Configuration

## Current Setup

The NBSC SAS Lost & Found system uses Google Sheets as a student masterlist data source via the Gviz API.

**Sheet ID:** `1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI`

## ⚠️ CRITICAL SECURITY ISSUE

The Google Sheet is currently accessed via a **public Gviz URL** with no authentication:

```
https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/gviz/tq?tqx=out:json&sheet=Copy%20of%20Master%20List
```

This means **anyone with the URL can view the entire student masterlist** including:
- Student names
- Email addresses  
- Departments
- School IDs
- Other personally identifiable information (PII)

## Required Fix

### Option 1: Restrict Sheet Permissions (Recommended)

1. Open the Google Sheet in Google Drive
2. Click **Share** → **Change to restricted**
3. Set to: **"Only people with access can open with the link"**
4. Add only the following accounts with **Viewer** access:
   - Service account email (if using Google Sheets API with service account)
   - Server application email/domain

### Option 2: Use Google Sheets API with Service Account (Most Secure)

Instead of the public Gviz endpoint, use the official Google Sheets API v4 with a service account:

**Steps:**

1. **Create a Service Account** in Google Cloud Console:
   - Go to IAM & Admin → Service Accounts
   - Create a new service account
   - Download the JSON key file

2. **Share the Sheet** with the service account email (ends with `@PROJECT_ID.iam.gserviceaccount.com`)

3. **Update Code** to use `googleapis` package:

```bash
npm install googleapis
```

```typescript
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

const fetchMasterlist = async () => {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Copy of Master List!A:Z',
  });
  return response.data.values;
};
```

### Option 3: Migrate to Database (Long-term Solution)

For a production system, student data should be stored in a secure database (PostgreSQL/MySQL) instead of Google Sheets.

**Benefits:**
- Proper access control
- Audit logging
- Better performance
- GDPR/data protection compliance
- No third-party dependency

## Verification Steps

### Test 1: Unauthenticated Access
Open an incognito browser and navigate to:
```
https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/edit
```

**Expected Result:** Should show "You need permission" or require login  
**Current Result:** ⚠️ Publicly accessible

### Test 2: Gviz Endpoint Access
```bash
curl "https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/gviz/tq?tqx=out:json&sheet=Copy%20of%20Master%20List"
```

**Expected Result:** Should return 403 Forbidden or require authentication  
**Current Result:** ⚠️ Returns full student data

## Temporary Mitigations (Until Fixed)

1. ✅ `/api/debug/masterlist` endpoint now requires authentication
2. ⚠️ Google Sheet itself is still publicly accessible via direct URL
3. Consider adding IP whitelist in Google Sheet sharing settings (limit to server IP only)

## Data Protection Compliance

**GDPR Article 32:** Requires "appropriate technical and organizational measures" to ensure security of personal data.

**Recommendation:** Student PII should NOT be stored in publicly accessible Google Sheets. Implement Option 2 or 3 immediately.

## Action Items

- [ ] Change Google Sheet permissions to **Restricted** (immediate)
- [ ] Implement service account authentication (high priority)
- [ ] Plan migration to database (long-term)
- [ ] Audit all other Google Sheet endpoints
- [ ] Add monitoring/alerts for unauthorized access attempts
