# Retention Policy - Quick Reference

## What It Does

The retention policy system automatically manages deleted items in the Lost & Found system:
- **Soft-delete**: Items are marked as deleted but kept for 30 days
- **Weekly reports**: Admins receive emails every Monday about items pending permanent deletion
- **Auto-purge**: Items are permanently deleted after 30 days
- **Restoration**: Admins can restore items during the 30-day grace period

---

## Key Numbers

- **Grace Period**: 30 days
- **Warning Window**: 7 days before permanent deletion
- **Weekly Report**: Every Monday at 9:00 AM
- **Daily Purge**: Every day at 2:00 AM

---

## Admin Actions

### View Pending Deletions
```
GET /admin/retention/pending
```

### Download CSV Report
```
GET /admin/retention/report/download
```

### Restore an Item
```
POST /admin/retention/restore
Body: { "itemId": "uuid", "itemType": "FoundItem" }
```

### Manual Purge
```
POST /admin/retention/purge
```

### Send Report Now
```
POST /admin/retention/report/send
```

---

## Configuration Files

| File | Purpose |
|------|---------|
| `server/src/app/modules/retention/retention.service.ts` | Core retention logic |
| `server/src/app/modules/retention/retention.controller.ts` | API endpoints |
| `server/src/app/jobs/retentionScheduler.ts` | Cron job schedules |
| `server/src/app/modules/retention/retention.route.ts` | Route definitions |
| `server/src/server.ts` | Scheduler initialization |

---

## Change Grace Period

1. Open `server/src/app/modules/retention/retention.service.ts`
2. Change `GRACE_PERIOD_DAYS = 30` to your desired value
3. Restart server

---

## Change Schedule

1. Open `server/src/app/jobs/retentionScheduler.ts`
2. Modify cron expressions:
   - Weekly report: `"0 9 * * 1"` (Monday 9 AM)
   - Daily purge: `"0 2 * * *"` (Daily 2 AM)
3. Restart server

**Cron format:** `minute hour day month weekday`

---

## Email Setup

Required environment variables in `.env`:
```env
SENDGRID_API_KEY=your_key_here
SMTP_FROM_NAME=NBSC SAS Lost & Found
SMTP_FROM_EMAIL=your_email@example.com
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Reports not sending | Check SendGrid API key, verify admin emails |
| Purge not running | Ensure server runs 24/7, check logs at 2 AM |
| Items not in pending list | Verify `isDeleted: true` and `deletedAt` timestamp |

---

## Compliance Benefits

✅ **Data retention policy** - 30-day grace period  
✅ **Administrator oversight** - Weekly review process  
✅ **Restoration capability** - Undo accidental deletions  
✅ **Audit trail** - All actions logged  
✅ **Automated enforcement** - No manual intervention needed  

---

For detailed documentation, see `RETENTION_POLICY_GUIDE.md`
