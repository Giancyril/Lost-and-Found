# Retention Policy System Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ITEM DELETION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────┘

Day 0: Item Deleted
│
│  User/Admin deletes item
│  ↓
│  Item marked: isDeleted = true, deletedAt = now()
│  ↓
│  Item hidden from public views
│
├─────────────────────────────────────────────────────────────────────
│
Day 1-22: Grace Period (Silent)
│
│  Item stored in database
│  Admin can restore via API
│  No notifications sent
│
├─────────────────────────────────────────────────────────────────────
│
Day 23: Warning Window Begins
│
│  Item enters "pending deletion" list
│  Visible in admin dashboard
│  Included in next weekly report
│
├─────────────────────────────────────────────────────────────────────
│
Next Monday 9:00 AM: Weekly Report
│
│  ┌──────────────────────────────────────┐
│  │  Email sent to all admins:           │
│  │  - List of pending items             │
│  │  - Days remaining for each           │
│  │  - Restoration instructions          │
│  └──────────────────────────────────────┘
│
│  Admin reviews report
│  ↓
│  ┌─────────────┐         ┌──────────────┐
│  │ Restore?    │   YES   │ Item restored│
│  │             ├────────→│ Back to active│
│  └──────┬──────┘         └──────────────┘
│         │ NO
│         ↓
│  Continue to purge
│
├─────────────────────────────────────────────────────────────────────
│
Day 30: Grace Period Expires
│
│  Next day at 2:00 AM: Daily Purge Job
│  ↓
│  Item permanently deleted from database
│  ↓
│  Action logged
│  ↓
│  ⚠️  IRREVERSIBLE - Item cannot be restored
│
└─────────────────────────────────────────────────────────────────────
```

---

## Automated Jobs Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CRON JOB SCHEDULER                           │
└─────────────────────────────────────────────────────────────────────┘

Server Starts
│
├─→ startRetentionScheduler()
│   │
│   ├─→ Weekly Report Job (Every Monday 9:00 AM)
│   │   │
│   │   └─→ Cron: "0 9 * * 1"
│   │       │
│   │       ├─→ Query items with deletedAt between 23-30 days ago
│   │       ├─→ Generate HTML email with item list
│   │       ├─→ Query all active admins
│   │       ├─→ Send email to each admin via SendGrid
│   │       └─→ Log results
│   │
│   └─→ Daily Purge Job (Every day 2:00 AM)
│       │
│       └─→ Cron: "0 2 * * *"
│           │
│           ├─→ Query items with deletedAt > 30 days ago
│           ├─→ Permanently delete from database
│           │   ├─→ Delete Found Items
│           │   ├─→ Delete Lost Items
│           │   └─→ Delete Claims
│           └─→ Log deletion counts
│
└─→ Server continues running...
```

---

## Admin Dashboard Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD ACTIONS                         │
└─────────────────────────────────────────────────────────────────────┘

Admin logs in
│
├─→ View Retention Policy Page
│   │
│   ├─→ GET /admin/retention/pending
│   │   │
│   │   └─→ Display list of items pending deletion
│   │       ├─→ Item name and type
│   │       ├─→ Deletion date
│   │       ├─→ Days remaining
│   │       └─→ Restore button
│   │
│   ├─→ Download CSV Report
│   │   │
│   │   └─→ GET /admin/retention/report/download
│   │       │
│   │       └─→ CSV file downloaded
│   │
│   ├─→ Restore Item
│   │   │
│   │   └─→ POST /admin/retention/restore
│   │       │
│   │       ├─→ Set isDeleted = false
│   │       ├─→ Set deletedAt = null
│   │       └─→ Item returns to active status
│   │
│   ├─→ Manual Purge
│   │   │
│   │   └─→ POST /admin/retention/purge
│   │       │
│   │       └─→ Immediately delete expired items
│   │
│   └─→ Send Report Now
│       │
│       └─→ POST /admin/retention/report/send
│           │
│           └─→ Trigger weekly report immediately
│
└─→ Admin completes action
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Active Item  │  isDeleted: false, deletedAt: null
└──────┬───────┘
       │
       │ User/Admin deletes
       ↓
┌──────────────┐
│ Soft-Deleted │  isDeleted: true, deletedAt: 2026-05-01
└──────┬───────┘
       │
       │ 23 days pass
       ↓
┌──────────────┐
│ Pending      │  In warning window (23-30 days)
│ Deletion     │  Appears in weekly reports
└──────┬───────┘
       │
       ├─→ Admin restores ──→ Back to Active Item
       │
       │ 30 days pass
       ↓
┌──────────────┐
│ Permanently  │  Deleted from database
│ Deleted      │  Cannot be restored
└──────────────┘
```

---

## Email Notification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      EMAIL NOTIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

Monday 9:00 AM
│
├─→ Weekly Report Job Triggered
│   │
│   ├─→ Query pending items (23-30 days old)
│   │   │
│   │   └─→ Found: 2 items, Lost: 1 item, Claims: 3 items
│   │
│   ├─→ Generate HTML email
│   │   │
│   │   ├─→ Subject: "[Lost & Found] Weekly Deletion Report - 6 items pending"
│   │   │
│   │   └─→ Body:
│   │       ├─→ List each item with days remaining
│   │       ├─→ Total count
│   │       └─→ Restoration instructions
│   │
│   ├─→ Query active admins
│   │   │
│   │   └─→ Found: admin1@school.edu, admin2@school.edu
│   │
│   ├─→ Send via SendGrid
│   │   │
│   │   ├─→ To: admin1@school.edu ✓ Sent
│   │   └─→ To: admin2@school.edu ✓ Sent
│   │
│   └─→ Log results
│       │
│       └─→ "[RetentionPolicy] Report sent to 2 admins"
│
└─→ Job complete
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────────┘

Job Execution
│
├─→ Try to execute
│   │
│   ├─→ Success
│   │   │
│   │   └─→ Log success message
│   │
│   └─→ Error
│       │
│       ├─→ Database connection failed
│       │   │
│       │   └─→ Log error, retry on next schedule
│       │
│       ├─→ Email sending failed
│       │   │
│       │   ├─→ Log which admin email failed
│       │   └─→ Continue with next admin
│       │
│       └─→ No admins found
│           │
│           └─→ Log warning, skip email sending
│
└─→ Job completes (success or failure)
```

---

## System Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SYSTEM INTEGRATION MAP                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Server Start   │
│   (server.ts)    │
└────────┬─────────┘
         │
         ├─→ Initialize Scheduler
         │   (retentionScheduler.ts)
         │
         ├─→ Register Routes
         │   (routes.ts → retention.route.ts)
         │
         └─→ Start Cron Jobs
             │
             ├─→ Weekly Report Job
             │   └─→ retention.service.ts
             │       └─→ sendWeeklyDeletionReport()
             │           └─→ mailer.ts (SendGrid)
             │
             └─→ Daily Purge Job
                 └─→ retention.service.ts
                     └─→ purgeExpiredItems()
                         └─→ prisma (Database)

┌──────────────────┐
│  Admin Actions   │
│  (Dashboard UI)  │
└────────┬─────────┘
         │
         └─→ API Requests
             │
             ├─→ GET /admin/retention/pending
             ├─→ GET /admin/retention/report/download
             ├─→ POST /admin/retention/restore
             ├─→ POST /admin/retention/purge
             └─→ POST /admin/retention/report/send
                 │
                 └─→ retention.controller.ts
                     └─→ retention.service.ts
                         └─→ prisma (Database)
```

---

## Timeline Example

```
Real-world example of an item's lifecycle:

May 1, 2026 (Day 0)
├─→ 10:30 AM: Admin deletes "iPhone 13" found item
└─→ Database: isDeleted=true, deletedAt=2026-05-01T10:30:00Z

May 1-23, 2026 (Days 1-22)
└─→ Item stored silently, no notifications

May 24, 2026 (Day 23)
└─→ Item enters warning window (7 days remaining)

May 26, 2026 (Monday, Day 25)
├─→ 9:00 AM: Weekly report sent to admins
└─→ Email: "iPhone 13 (Electronics) - Library (6 days remaining)"

May 27-30, 2026 (Days 26-29)
└─→ Admin can still restore item

May 31, 2026 (Day 30)
└─→ Grace period expires

June 1, 2026 (Day 31)
├─→ 2:00 AM: Daily purge job runs
├─→ "iPhone 13" permanently deleted from database
└─→ Log: "[RetentionScheduler] Purged 1 found item"
```

---

This visual guide helps understand how the retention policy system works from multiple perspectives: lifecycle, automation, admin actions, and data flow.
