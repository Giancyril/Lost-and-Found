# Retention Policy & Data Governance Guide

## Overview

The Lost & Found system implements a comprehensive retention policy engine that manages the lifecycle of deleted items and ensures compliance with data governance requirements. This system automatically tracks soft-deleted items, sends weekly reports to administrators, and permanently purges data after a grace period.

---

## Key Features

### 1. **Soft-Delete with Grace Period**
- When items (Found Items, Lost Items, or Claims) are deleted, they are marked as `isDeleted: true` with a `deletedAt` timestamp
- Items remain in the database for **30 days** after deletion (grace period)
- During this period, administrators can restore items if needed

### 2. **Weekly Deletion Reports**
- **Schedule**: Every Monday at 9:00 AM
- **Recipients**: All active administrators
- **Content**: List of items that will be permanently deleted within the next 7 days
- **Format**: HTML email with detailed item information

### 3. **Automated Permanent Deletion**
- **Schedule**: Every day at 2:00 AM
- **Action**: Permanently deletes items that have exceeded the 30-day grace period
- **Scope**: Found Items, Lost Items, and Claims

### 4. **Admin Dashboard Integration**
- View all items pending deletion
- Download CSV reports
- Restore items before permanent deletion
- Manually trigger purge operations
- Manually send weekly reports

---

## Configuration

### Grace Period Settings

The grace period is configured in `server/src/app/modules/retention/retention.service.ts`:

```typescript
const GRACE_PERIOD_DAYS = 30;           // Days before permanent deletion
const WARNING_DAYS_BEFORE_PURGE = 7;    // Days before purge to send warning
```

**To change the grace period:**
1. Open `server/src/app/modules/retention/retention.service.ts`
2. Modify the `GRACE_PERIOD_DAYS` constant
3. Restart the server

### Email Configuration

Emails are sent using SendGrid. Ensure these environment variables are set in your `.env` file:

```env
SENDGRID_API_KEY=your_sendgrid_api_key
SMTP_FROM_NAME=NBSC SAS Lost & Found
SMTP_FROM_EMAIL=your_email@example.com
```

### Schedule Configuration

Schedules are configured in `server/src/app/jobs/retentionScheduler.ts`:

**Weekly Report Schedule:**
```typescript
cron.schedule("0 9 * * 1", async () => { ... });
// Format: minute hour day-of-month month day-of-week
// "0 9 * * 1" = Every Monday at 9:00 AM
```

**Daily Purge Schedule:**
```typescript
cron.schedule("0 2 * * *", async () => { ... });
// "0 2 * * *" = Every day at 2:00 AM
```

**To change schedules:**
1. Open `server/src/app/jobs/retentionScheduler.ts`
2. Modify the cron expressions
3. Restart the server

**Cron Format Reference:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

---

## API Endpoints

All retention policy endpoints require **admin authentication**.

### 1. Get Items Pending Deletion

**Endpoint:** `GET /admin/retention/pending`

**Description:** Retrieves all items that will be permanently deleted within the next 7 days.

**Response:**
```json
{
  "success": true,
  "message": "Items pending deletion retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "FoundItem",
        "name": "iPhone 13 (Electronics) - Library",
        "deletedAt": "2026-05-01T10:30:00.000Z",
        "permanentDeletionDate": "2026-05-31T10:30:00.000Z",
        "daysRemaining": 5
      }
    ],
    "count": 1,
    "gracePeriodDays": 30,
    "warningDays": 7
  }
}
```

### 2. Download CSV Report

**Endpoint:** `GET /admin/retention/report/download`

**Description:** Downloads a CSV file containing all items pending deletion.

**Response:** CSV file with headers:
```
Item ID,Type,Name,Deleted At,Permanent Deletion Date,Days Remaining
```

### 3. Manually Trigger Purge

**Endpoint:** `POST /admin/retention/purge`

**Description:** Manually triggers the permanent deletion of expired items.

**Response:**
```json
{
  "success": true,
  "message": "Expired items purged successfully",
  "data": {
    "foundItems": 2,
    "lostItems": 1,
    "claims": 3
  }
}
```

### 4. Restore Item

**Endpoint:** `POST /admin/retention/restore`

**Body:**
```json
{
  "itemId": "uuid",
  "itemType": "FoundItem"  // or "LostItem" or "Claim"
}
```

**Description:** Restores a soft-deleted item before permanent deletion.

**Response:**
```json
{
  "success": true,
  "message": "FoundItem restored successfully",
  "data": { /* restored item data */ }
}
```

### 5. Manually Send Weekly Report

**Endpoint:** `POST /admin/retention/report/send`

**Description:** Manually triggers the weekly deletion report email to all admins.

**Response:**
```json
{
  "success": true,
  "message": "Weekly deletion report sent to all admins"
}
```

---

## Weekly Report Email

### Email Content

The weekly report email includes:
- **Subject:** `[Lost & Found] Weekly Deletion Report - X items pending`
- **Body:**
  - List of all items pending deletion
  - Days remaining for each item
  - Total count of pending items
  - Instructions for restoring items
  - Note that this is an automated report

### Sample Email

```
Weekly Retention Policy Report

The following items are scheduled for permanent deletion within the next 7 days:

• FoundItem: iPhone 13 (Electronics) - Library (5 days remaining)
• LostItem: Blue Backpack (Bags) - Cafeteria (3 days remaining)
• Claim: Claim by John Doe for Wallet (2 days remaining)

Total items pending deletion: 3

To restore any of these items before permanent deletion, please log in to the 
admin dashboard and navigate to the Retention Policy section.

This is an automated report sent every Monday.
```

---

## Admin Dashboard Integration

### Viewing Pending Deletions

1. Log in as an administrator
2. Navigate to **Admin Dashboard** → **Retention Policy**
3. View the list of items pending deletion
4. See details: item type, name, deletion date, days remaining

### Restoring Items

1. In the Retention Policy section, locate the item to restore
2. Click the **Restore** button
3. Confirm the restoration
4. The item will be unmarked as deleted and returned to active status

### Downloading Reports

1. In the Retention Policy section, click **Download CSV Report**
2. A CSV file will be downloaded with all pending deletions
3. Use this for record-keeping or auditing purposes

### Manual Operations

**Manual Purge:**
- Click **Purge Expired Items** to immediately delete all items past the grace period
- Use with caution - this action is irreversible

**Manual Report:**
- Click **Send Weekly Report** to immediately send the deletion report to all admins
- Useful for testing or urgent notifications

---

## Compliance & Auditing

### Audit Trail

All retention policy actions are logged:
- Soft-delete operations (when items are marked as deleted)
- Restoration operations (when items are restored)
- Permanent deletion operations (when items are purged)

### Compliance Reports

The system maintains:
- **Deletion timestamps** for all soft-deleted items
- **Grace period tracking** to ensure compliance with data retention policies
- **Email records** of all weekly reports sent to administrators
- **CSV exports** for external auditing

### School Audit Requirements

This retention policy system addresses common school audit requirements:
- ✅ **Data retention policy** - 30-day grace period before permanent deletion
- ✅ **Administrator oversight** - Weekly reports ensure admins review pending deletions
- ✅ **Restoration capability** - Items can be restored during grace period
- ✅ **Audit trail** - All actions are logged and traceable
- ✅ **Automated compliance** - System enforces policy without manual intervention

---

## Troubleshooting

### Weekly Reports Not Sending

**Check:**
1. SendGrid API key is configured in `.env`
2. Server logs for error messages: `[RetentionPolicy] Failed to send report`
3. Admin users have valid email addresses
4. Admin users are activated and not deleted

**Solution:**
- Verify `SENDGRID_API_KEY` in `.env`
- Check admin user records in database
- Manually trigger report: `POST /admin/retention/report/send`

### Purge Not Running

**Check:**
1. Server logs for cron job execution: `[RetentionScheduler] Running daily purge job`
2. Server is running continuously (not restarting daily)
3. Cron schedule is correct in `retentionScheduler.ts`

**Solution:**
- Ensure server runs 24/7
- Check server logs at 2:00 AM for purge execution
- Manually trigger purge: `POST /admin/retention/purge`

### Items Not Appearing in Pending List

**Check:**
1. Items are marked as `isDeleted: true` in database
2. Items have a `deletedAt` timestamp
3. Items are within the warning window (23-30 days after deletion)

**Solution:**
- Query database to verify soft-delete status
- Check `deletedAt` timestamp is within range
- Wait until items enter the 7-day warning window

---

## Database Schema

### Soft-Delete Fields

All deletable entities have these fields:

```prisma
model FoundItem {
  // ... other fields
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
}

model LostItem {
  // ... other fields
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
}

model Claim {
  // ... other fields
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
}
```

### Querying Soft-Deleted Items

**Find all soft-deleted items:**
```typescript
const deletedItems = await prisma.foundItem.findMany({
  where: { isDeleted: true }
});
```

**Find items pending deletion:**
```typescript
const gracePeriodDate = new Date();
gracePeriodDate.setDate(gracePeriodDate.getDate() - 30);

const warningThresholdDate = new Date();
warningThresholdDate.setDate(warningThresholdDate.getDate() - 23);

const pendingItems = await prisma.foundItem.findMany({
  where: {
    isDeleted: true,
    deletedAt: {
      lte: warningThresholdDate,
      gte: gracePeriodDate,
    },
  },
});
```

---

## Best Practices

### For Administrators

1. **Review weekly reports promptly** - Check emails every Monday
2. **Restore items when needed** - Use the 7-day warning window to restore accidentally deleted items
3. **Keep CSV records** - Download and archive CSV reports for compliance
4. **Monitor purge logs** - Check server logs after 2:00 AM to verify purge operations
5. **Test the system** - Periodically test restoration and manual report features

### For Developers

1. **Never hard-delete directly** - Always use soft-delete (set `isDeleted: true`)
2. **Set deletedAt timestamp** - Always set `deletedAt: new Date()` when soft-deleting
3. **Exclude deleted items** - Always filter `isDeleted: false` in queries
4. **Test grace period** - Test with shorter grace periods in development
5. **Monitor email delivery** - Check SendGrid dashboard for email delivery status

### For System Administrators

1. **Backup before purge** - Ensure database backups run before 2:00 AM
2. **Monitor server uptime** - Ensure server runs continuously for cron jobs
3. **Check email configuration** - Verify SendGrid API key and email settings
4. **Review logs regularly** - Monitor retention policy logs for errors
5. **Document changes** - Record any changes to grace period or schedules

---

## Future Enhancements

Potential improvements to the retention policy system:

1. **Configurable grace periods** - Allow admins to set grace period per item type
2. **Email attachments** - Attach CSV reports to weekly emails
3. **Slack/Teams integration** - Send reports to team channels
4. **Item-specific warnings** - Send targeted emails for high-value items
5. **Restoration approval workflow** - Require approval for item restoration
6. **Extended audit logs** - Track who deleted and restored items
7. **Custom schedules** - Allow admins to configure report and purge schedules via UI
8. **Retention policy dashboard** - Dedicated UI for retention policy management

---

## Support

For questions or issues with the retention policy system:

1. Check server logs: `[RetentionScheduler]` and `[RetentionPolicy]` tags
2. Review this documentation
3. Contact the system administrator
4. Check the codebase:
   - Service: `server/src/app/modules/retention/retention.service.ts`
   - Controller: `server/src/app/modules/retention/retention.controller.ts`
   - Scheduler: `server/src/app/jobs/retentionScheduler.ts`
   - Routes: `server/src/app/modules/retention/retention.route.ts`

---

**Last Updated:** June 1, 2026  
**Version:** 1.0.0  
**Maintained By:** Lost & Found System Development Team
