# Google Sheets Reconciliation - Quick Reference

## What It Does

Automatically compares database records with Google Sheets logs every week and alerts admins if any items failed to log due to network errors or offline submissions.

---

## Key Numbers

- **Check Schedule**: Every Sunday at 11:00 PM
- **Check Window**: Last 7 days
- **Alert Method**: Email to all active admins
- **Fix Method**: One-click re-sync button

---

## The Problem

Items can fail to log to Google Sheets due to:
- Network connectivity issues
- Offline submissions
- Webhook timeouts
- Server restarts

This creates gaps in your audit trail that go unnoticed.

---

## The Solution

Weekly automated check that:
1. Compares database vs. Google Sheets
2. Identifies missing items
3. Alerts admins via email
4. Provides one-click re-sync

---

## Admin Actions

### Check Status
```
GET /admin/reconciliation/status
```

### Re-Sync Missing Items
```
POST /admin/reconciliation/resync
Body: { "itemIds": ["id1", "id2"] }
```

### Trigger Manual Report
```
POST /admin/reconciliation/trigger
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `server/src/app/modules/sheets/reconciliation.service.ts` | Core reconciliation logic |
| `server/src/app/modules/sheets/reconciliation.controller.ts` | API endpoints |
| `server/src/app/jobs/retentionScheduler.ts` | Cron job schedule |
| `server/src/app/modules/sheets/reconciliation.route.ts` | Route definitions |

---

## Change Schedule

1. Open `server/src/app/jobs/retentionScheduler.ts`
2. Modify cron expression: `"0 23 * * 0"` (Sunday 11 PM)
3. Restart server

**Cron format:** `minute hour day month weekday`

---

## Email Alert

**Subject:** `[Lost & Found] ⚠️ Sheets Reconciliation Alert - X items missing`

**Contains:**
- Total discrepancies count
- Lost/Found breakdown
- Detailed item list
- Re-sync instructions

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Job not running | Check server logs, verify cron schedule |
| Emails not sending | Check SendGrid API key, verify admin emails |
| False positives | Verify Report ID column (column 8) in Sheets |
| Re-sync fails | Check webhook URL, test connectivity |

---

## Testing

**Quick Test:**
```bash
# Get status
curl -X GET http://localhost:5001/admin/reconciliation/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Trigger report
curl -X POST http://localhost:5001/admin/reconciliation/trigger \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration

Works with:
- ✅ Retention Policy (data lifecycle)
- ✅ Offline Sync (catches failures)
- ✅ Audit Trail (ensures completeness)

---

For detailed documentation, see `SHEETS_RECONCILIATION_GUIDE.md`
