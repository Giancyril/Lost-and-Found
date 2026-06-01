# Google Sheets Reconciliation Guide

## Overview

The Google Sheets Reconciliation system ensures data integrity between your database and Google Sheets audit trail. It automatically detects and alerts administrators when items fail to log to Google Sheets due to network errors, offline submissions, or webhook failures.

---

## The Problem

Your system logs every lost and found item submission to both:
1. **Database** (primary storage)
2. **Google Sheets** (offline audit trail backup)

However, the Sheets logging can fail silently due to:
- Network connectivity issues
- Offline submissions
- Webhook timeouts
- Google Sheets API errors
- Server restarts during logging

When this happens, items exist in the database but are missing from Google Sheets, creating gaps in your audit trail that go unnoticed until an audit.

---

## The Solution

The reconciliation system runs automatically every week and:

1. **Compares** database records with Google Sheets logs
2. **Identifies** items that are in the database but missing from Sheets
3. **Alerts** administrators via email with a detailed report
4. **Provides** a one-click re-sync button to fix discrepancies

---

## Key Features

### 1. **Weekly Automated Check**
- **Schedule**: Every Sunday at 11:00 PM
- **Scope**: Checks all items created in the last 7 days
- **Action**: Sends email alert if discrepancies are found

### 2. **Detailed Discrepancy Report**
- Lists all missing items with full details
- Separates lost items from found items
- Shows reporter name, location, and creation date
- Includes item IDs for easy tracking

### 3. **One-Click Re-Sync**
- Admin dashboard button to re-sync missing items
- Automatically logs missing items to Google Sheets
- Provides success/failure count
- No manual intervention required

### 4. **Email Alerts**
- Sent to all active administrators
- HTML-formatted with clear visual hierarchy
- Includes summary statistics
- Provides step-by-step fix instructions

---

## How It Works

### Weekly Reconciliation Flow

```
Sunday 11:00 PM
│
├─→ Fetch database items (last 7 days)
│   ├─→ Lost items
│   └─→ Found items
│
├─→ Fetch Google Sheets rows
│   ├─→ "Lost Items" sheet
│   └─→ "Found Items" sheet
│
├─→ Compare Report IDs
│   ├─→ Check each database item exists in Sheets
│   └─→ Flag missing items as discrepancies
│
├─→ Generate Report
│   ├─→ Count total items checked
│   ├─→ List all discrepancies
│   └─→ Calculate statistics
│
└─→ Send Email Alert (if discrepancies found)
    ├─→ To: All active admins
    ├─→ Subject: "⚠️ Sheets Reconciliation Alert - X items missing"
    └─→ Body: Detailed report with re-sync instructions
```

---

## Configuration

### Schedule Settings

The reconciliation schedule is configured in `server/src/app/jobs/retentionScheduler.ts`:

```typescript
// Runs every Sunday at 11:00 PM
cron.schedule("0 23 * * 0", async () => {
  await reconciliationService.runWeeklyReconciliation();
});
```

**To change the schedule:**
1. Open `server/src/app/jobs/retentionScheduler.ts`
2. Modify the cron expression: `"0 23 * * 0"`
3. Restart the server

**Cron Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `"0 23 * * 0"` - Every Sunday at 11:00 PM
- `"0 9 * * 1"` - Every Monday at 9:00 AM
- `"0 0 * * *"` - Every day at midnight

### Check Window

The system checks items from the **last 7 days** by default.

**To change the check window:**
1. Open `server/src/app/modules/sheets/reconciliation.service.ts`
2. Find the `performReconciliation` function
3. Modify this line:
   ```typescript
   startDate.setDate(startDate.getDate() - 7); // Change 7 to your desired days
   ```

---

## API Endpoints

All reconciliation endpoints require **admin authentication**.

### 1. Get Reconciliation Status

**Endpoint:** `GET /admin/reconciliation/status`

**Description:** Performs a reconciliation check and returns the results immediately.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation check completed successfully",
  "data": {
    "totalChecked": 45,
    "discrepancies": [
      {
        "id": "uuid",
        "type": "LOST",
        "itemName": "iPhone 13",
        "reporterName": "John Doe",
        "location": "Library",
        "createdAt": "2026-05-25T10:30:00.000Z",
        "reason": "Missing from Google Sheets"
      }
    ],
    "lostItemsChecked": 20,
    "foundItemsChecked": 25,
    "lostItemsDiscrepancies": 1,
    "foundItemsDiscrepancies": 2
  }
}
```

### 2. Re-Sync Missing Items

**Endpoint:** `POST /admin/reconciliation/resync`

**Body:**
```json
{
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Description:** Re-syncs the specified items to Google Sheets.

**Response:**
```json
{
  "success": true,
  "message": "Re-sync completed: 3 success, 0 failed",
  "data": {
    "success": 3,
    "failed": 0
  }
}
```

### 3. Manually Trigger Weekly Report

**Endpoint:** `POST /admin/reconciliation/trigger`

**Description:** Manually triggers the weekly reconciliation check and sends email alerts.

**Response:**
```json
{
  "success": true,
  "message": "Reconciliation report sent to admins. 3 discrepancies found.",
  "data": {
    "totalChecked": 45,
    "discrepancies": [...],
    "lostItemsChecked": 20,
    "foundItemsChecked": 25,
    "lostItemsDiscrepancies": 1,
    "foundItemsDiscrepancies": 2
  }
}
```

---

## Email Alert

### Email Content

When discrepancies are found, administrators receive an email with:

**Subject:** `[Lost & Found] ⚠️ Sheets Reconciliation Alert - X items missing`

**Body Includes:**
- ⚠️ Alert banner with total discrepancies count
- 📊 Summary statistics (total checked, lost/found breakdown)
- 📋 Detailed list of missing items with:
  - Item type (LOST/FOUND)
  - Item name
  - Reporter name
  - Location
  - Creation date
  - Item ID
- 🔧 Step-by-step fix instructions
- 💡 Explanation of why this matters

### Sample Email

```
⚠️ Google Sheets Reconciliation Alert

3 item(s) were not logged to Google Sheets this week

Summary
📊 Total Items Checked: 45
🔴 Lost Items Checked: 20 (1 missing)
🟢 Found Items Checked: 25 (2 missing)

Missing Items
─────────────
🔴 LOST: iPhone 13
Reporter: John Doe | Location: Library
Created: 5/25/2026, 10:30:00 AM
ID: abc-123-def

🟢 FOUND: Blue Backpack
Reporter: Jane Smith | Location: Cafeteria
Created: 5/26/2026, 2:15:00 PM
ID: xyz-456-ghi

🔧 How to Fix
1. Log in to the admin dashboard
2. Navigate to Sheets Reconciliation
3. Review the missing items
4. Click "Re-sync Missing Items"
```

---

## Admin Dashboard Integration

### Viewing Reconciliation Status

1. Log in as administrator
2. Navigate to **Admin Dashboard** → **Sheets Reconciliation**
3. View current reconciliation status
4. See list of discrepancies (if any)

### Re-Syncing Missing Items

1. In the Reconciliation section, review missing items
2. Select items to re-sync (or select all)
3. Click **"Re-sync Selected Items"** button
4. Wait for confirmation
5. Verify items now appear in Google Sheets

### Manual Reconciliation Check

1. Click **"Run Reconciliation Check"** button
2. System performs immediate check
3. Results display on screen
4. Email alert sent if discrepancies found

---

## Troubleshooting

### Issue: Reconciliation not running

**Check:**
1. Server logs for scheduler messages
2. Server is running continuously (not restarting weekly)
3. Cron schedule is correct

**Solution:**
```bash
# Check server logs
grep "ReconciliationScheduler" server.log

# Verify scheduler started
# Should see: "[ReconciliationScheduler] Weekly reconciliation job scheduled"
```

### Issue: Email alerts not sending

**Check:**
1. SendGrid API key is configured
2. Admin users have valid email addresses
3. Server logs for email errors

**Solution:**
1. Verify `.env`:
   ```
   SENDGRID_API_KEY=your_key_here
   SMTP_FROM_EMAIL=your_email@example.com
   ```

2. Check admin emails in database:
   ```sql
   SELECT email, username FROM users WHERE role = 'ADMIN' AND activated = true;
   ```

### Issue: False positives (items marked as missing but exist in Sheets)

**Check:**
1. Report ID column in Google Sheets (should be column 8)
2. Sheet names match exactly ("Lost Items", "Found Items")
3. Google Sheets is publicly accessible

**Solution:**
1. Verify sheet structure:
   - Column 0: Timestamp
   - Column 1: Student ID
   - Column 2: Reporter Name
   - Column 3: Email
   - Column 4: Item Name
   - Column 5: Description
   - Column 6: Location
   - Column 7: Date
   - Column 8: **Report ID** (critical for matching)
   - Column 9: Scanned At

2. Check sheet permissions:
   - Sheet must be shared publicly or with service account
   - Gviz API must be accessible

### Issue: Re-sync fails

**Check:**
1. Google Sheets webhook URL is configured
2. Webhook is responding
3. Network connectivity

**Solution:**
1. Verify `.env`:
   ```
   GOOGLE_SHEETS_WEBHOOK_URL=your_webhook_url
   ```

2. Test webhook manually:
   ```bash
   curl -X POST $GOOGLE_SHEETS_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"sheetName": "Test", "timestamp": "2026-06-01", ...}'
   ```

---

## Testing

### Manual Testing

**Test 1: Check Current Status**
```bash
curl -X GET http://localhost:5001/admin/reconciliation/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Test 2: Create Discrepancy**
1. Add an item to database
2. Manually delete its row from Google Sheets
3. Run reconciliation check
4. Verify it appears in discrepancies

**Test 3: Re-Sync Items**
```bash
curl -X POST http://localhost:5001/admin/reconciliation/resync \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"itemIds": ["item-id-1", "item-id-2"]}'
```

**Test 4: Trigger Manual Report**
```bash
curl -X POST http://localhost:5001/admin/reconciliation/trigger \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Automated Testing

**Test Schedule (Temporary)**

To test the weekly job without waiting for Sunday:

1. Edit `server/src/app/jobs/retentionScheduler.ts`
2. Change schedule to run every minute:
   ```typescript
   cron.schedule("* * * * *", async () => {
   ```
3. Restart server
4. Wait 1 minute
5. Check logs and email
6. **IMPORTANT:** Change back to weekly schedule!

---

## Best Practices

### For Administrators

1. **Review weekly emails promptly** - Check reconciliation alerts every Monday morning
2. **Re-sync immediately** - Fix discrepancies as soon as they're detected
3. **Monitor patterns** - If discrepancies occur frequently, investigate root cause
4. **Keep backups** - Download Google Sheets regularly as additional backup
5. **Test periodically** - Run manual reconciliation checks monthly

### For Developers

1. **Handle logging failures gracefully** - Don't let Sheets logging block item creation
2. **Log all errors** - Ensure Sheets logging errors are logged to console
3. **Monitor webhook health** - Set up alerts for webhook failures
4. **Test offline scenarios** - Verify offline sync works correctly
5. **Document sheet structure** - Keep sheet column structure documented

### For System Administrators

1. **Monitor scheduler logs** - Check that weekly job runs successfully
2. **Verify email delivery** - Ensure SendGrid is working properly
3. **Check Google Sheets access** - Verify sheets remain publicly accessible
4. **Set up alerts** - Configure monitoring for reconciliation failures
5. **Review discrepancy trends** - Track if certain times/days have more failures

---

## Database Queries

### Check Items Missing from Sheets

```sql
-- Find items created in last 7 days
SELECT 
  id,
  "lostItemName" as name,
  "reporterName",
  location,
  "createdAt",
  'LOST' as type
FROM "lostItems"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
  AND "isDeleted" = false

UNION ALL

SELECT 
  id,
  "foundItemName" as name,
  "reporterName",
  location,
  "createdAt",
  'FOUND' as type
FROM "foundItems"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
  AND "isDeleted" = false

ORDER BY "createdAt" DESC;
```

### Count Items by Date

```sql
-- Count items created each day (last 7 days)
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as total,
  SUM(CASE WHEN type = 'LOST' THEN 1 ELSE 0 END) as lost_items,
  SUM(CASE WHEN type = 'FOUND' THEN 1 ELSE 0 END) as found_items
FROM (
  SELECT "createdAt", 'LOST' as type FROM "lostItems" WHERE "isDeleted" = false
  UNION ALL
  SELECT "createdAt", 'FOUND' as type FROM "foundItems" WHERE "isDeleted" = false
) items
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;
```

---

## Integration with Existing Systems

### Retention Policy

The reconciliation system works alongside the retention policy:
- Retention policy manages data lifecycle (30-day grace period)
- Reconciliation ensures audit trail integrity
- Both send weekly email reports to admins
- Both use the same scheduler infrastructure

### Offline Sync

The reconciliation system catches failures from:
- Offline item submissions
- Network interruptions during sync
- Background sync failures
- Service worker errors

### Audit Trail

The reconciliation system ensures:
- Complete audit trail in Google Sheets
- No silent gaps in logging
- Compliance with audit requirements
- Data integrity verification

---

## Future Enhancements

Potential improvements:

1. **Real-time Alerts** - Notify admins immediately when logging fails
2. **Automatic Re-sync** - Automatically re-sync missing items without admin action
3. **Dashboard Widget** - Show reconciliation status on admin dashboard
4. **Historical Tracking** - Track reconciliation results over time
5. **Slack/Teams Integration** - Send alerts to team channels
6. **Custom Check Windows** - Allow admins to configure check period
7. **Detailed Analytics** - Show trends and patterns in logging failures
8. **Webhook Health Monitor** - Continuously monitor webhook availability

---

## Support

For questions or issues:

1. **Check server logs**: `[ReconciliationScheduler]` tag
2. **Review this documentation**
3. **Test manually** using API endpoints
4. **Check Google Sheets** structure and permissions
5. **Verify webhook** configuration

---

## Summary

The Google Sheets Reconciliation system provides:

✅ **Automated weekly checks** - Runs every Sunday at 11:00 PM  
✅ **Email alerts** - Notifies admins of discrepancies  
✅ **One-click re-sync** - Easy fix for missing items  
✅ **Detailed reporting** - Full visibility into audit trail gaps  
✅ **Audit compliance** - Ensures complete offline backup  
✅ **Silent failure detection** - Catches errors that would otherwise go unnoticed  

This system ensures your Google Sheets audit trail remains complete and accurate, meeting compliance requirements and providing reliable offline backup.

---

**Last Updated:** June 1, 2026  
**Version:** 1.0.0  
**Maintained By:** Lost & Found System Development Team
