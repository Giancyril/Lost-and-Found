# NBSC SAS — Lost & Found System
## Implementation Plan: Student Registration (Masterlist) + Points/Rewards System

---

## Overview

Two major features to build:

1. **Student Registration via Google Sheets Masterlist** — students can only register if their name/ID exists in the school masterlist pulled from Google Sheets. Leads to a dedicated student login page. Admin login remains hidden (triple-tap to reveal).
2. **Points & Rewards System** — students earn points when they report found items. Homepage teaser prompts unregistered users to sign up.

---

## Feature 1 — Student Registration & Login

### 1.1 Remove Existing Registration Frontend

**Files to delete / gut:**
```
src/pages/Register.tsx          ← delete entire page
src/pages/Login.tsx             ← repurpose as student-only login
src/components/auth/RegisterForm.tsx  ← delete
src/routes/                     ← remove /register route
```

**What to keep from the backend:**
- Keep all existing `/api/auth/register` and `/api/auth/login` endpoints
- Keep the User model and DB schema — just change who can trigger registration
- Keep JWT/session logic untouched

---

### 1.2 Google Sheets Masterlist Integration

**How it works:**
1. School publishes the masterlist Google Sheet as a public CSV or via the Sheets API
2. Backend fetches and caches the masterlist (refresh every 24h or on-demand)
3. On registration, backend validates the student's School ID + Full Name against the masterlist before creating the account

**Backend — new endpoint:**
```
GET  /api/masterlist/validate?schoolId=XXX&name=YYY
→ { valid: true/false, studentData: { name, course, year, } }
```

**Masterlist fetch strategy (choose one):**

| Option | Pros | Cons |
|---|---|---|
| **Google Sheets API (recommended)** | Real-time, authenticated | Needs service account key |
| **Published CSV export** | Zero auth setup | Manual publish step by admin |
| **Admin-uploaded CSV** | Fully offline | Admin must re-upload per semester |

**Recommended:** Published CSV export URL — simplest, no credentials needed.

```
Sheet URL format:
https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid=0
```

**Backend service (`masterlist.service.ts`):**
```ts
// Fetches CSV, parses rows, caches in Redis or in-memory Map
// Cache TTL: 24 hours
// Fields expected: School ID | Last Name | First Name | Course | Year |
```

---

### 1.3 Registration Flow (New Frontend)

```
Homepage
  └─ "Want points? Register here →" banner/button
        └─ /register  (StudentRegisterPage)
              ├─ Step 1: Enter School ID → validates against masterlist
              ├─ Step 2: Details auto-filled from masterlist (read-only)
              ├─ Step 3: Set password + confirm
              └─ Success → redirect to /login (student login page)
```

**StudentRegisterPage components:**
```
src/pages/StudentRegister.tsx
src/components/auth/MasterlistLookup.tsx   ← School ID input + validate
src/components/auth/RegisterDetails.tsx    ← Pre-filled name, course, year
src/components/auth/SetPassword.tsx        ← Password fields
```

**UI behavior:**
- School ID field → on blur, calls `/api/masterlist/validate`
- If found: shows student's name/course/year in read-only fields (confirms identity)
- If not found: shows error "School ID not found in masterlist. Contact your registrar."
- Already registered: shows "Account already exists. Go to login."

---

### 1.4 Student Login Page (`/login`)

Dedicated, publicly visible student login:
```
src/pages/StudentLogin.tsx
```

- Clean dark card, School ID + Password fields
- "Forgot password?" link (optional scope)
- No mention of admin anywhere on this page
- After login → redirect to homepage / item feed

---

### 1.5 Admin Login — Hidden (Triple-Tap)

Admin login stays completely hidden. **Triple-tap trigger** on a specific element (logo, footer text, or version number):

```ts
// Triple-tap detector hook
const useTripleTap = (onTripleTap: () => void) => {
  const tapCount = useRef(0);
  const timer = useRef<NodeJS.Timeout>();

  return () => {
    tapCount.current += 1;
    clearTimeout(timer.current);
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      onTripleTap();
    }
    timer.current = setTimeout(() => { tapCount.current = 0; }, 600);
  };
};
```

- Triple-tap on the school logo → reveals a small modal with admin login form
- Admin login posts to a separate endpoint: `POST /api/auth/admin/login`
- No `/admin-login` route — modal only, never linked anywhere

---

## Feature 2 — Points & Rewards System

### 2.1 Points Model (Backend)

**New DB table: `points`**
```prisma
model Points {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  amount    Int
  reason    String   // "FOUND_ITEM_REPORTED" | "ITEM_CLAIMED" | "BONUS"
  refId     String?  // foundItemId or claimId that triggered the points
  createdAt DateTime @default(now())
}
```

**Add to User model:**
```prisma
model User {
  ...
  totalPoints Int     @default(0)
  points      Points[]
}
```

**Point values (recommended starting values):**

| Action | Points |
|---|---|
| Report a found item | +50 pts |
| Found item gets claimed | +25 pts (bonus to reporter) |
| Comment that gets marked helpful | +10 pts |
| Weekly streak (active 5+ days) | +30 pts |

---

### 2.2 Points API Endpoints

```
GET  /api/points/me              → current user's total + history
GET  /api/points/leaderboard     → top 10 students by points
POST /api/points/award           → (admin only) manual award
```

Points are awarded automatically via service hooks:
- `foundItem.create` → `pointsService.award(userId, 50, 'FOUND_ITEM_REPORTED', itemId)`
- `claim.approve` → `pointsService.award(reporterUserId, 25, 'ITEM_CLAIMED', claimId)`

---

### 2.3 Frontend — Points Display

**Components to build:**
```
src/components/points/PointsBadge.tsx      ← shows "⭐ 125 pts" in navbar/profile
src/components/points/PointsHistory.tsx    ← list of earned points with reasons
src/components/points/Leaderboard.tsx      ← top students card on dashboard
src/pages/RewardsPage.tsx                  ← dedicated /rewards page
```

**PointsBadge** — shown in the student navbar next to their name:
```tsx
<span className="text-[11px] font-bold px-2 py-0.5 bg-yellow-400/10
  text-yellow-300 border border-yellow-400/20 rounded-full">
  ⭐ {user.totalPoints} pts
</span>
```

---

### 2.4 Homepage Teaser Banner

Shown only to **unauthenticated users** or users with 0 points:

```tsx
// src/components/home/PointsTeaserBanner.tsx

<div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10
  border border-yellow-500/20 rounded-2xl p-4 flex items-center
  justify-between gap-4">
  <div>
    <p className="text-white font-bold text-sm">
      🌟 Want to earn points?
    </p>
    <p className="text-gray-400 text-xs mt-0.5">
      Register with your School ID and earn rewards every time
      you help the community find lost items.
    </p>
  </div>
  <Link to="/register"
    className="shrink-0 px-4 py-2 bg-yellow-400/15 text-yellow-300
      border border-yellow-400/25 rounded-xl text-xs font-semibold
      hover:bg-yellow-400/25 transition-colors whitespace-nowrap">
    Register Now →
  </Link>
</div>
```

---

## Implementation Order (Sprints)

### Sprint 1 — Auth Cleanup & Masterlist (Week 1–2)
- [ ] Delete old Register frontend components and route
- [ ] Build `masterlist.service.ts` — fetch + cache Google Sheets CSV
- [ ] Build `GET /api/masterlist/validate` endpoint
- [ ] Build `StudentRegisterPage` with 3-step flow
- [ ] Build `StudentLoginPage` (`/login`)
- [ ] Implement `useTripleTap` hook + admin login modal
- [ ] Update React Router — add `/register`, `/login`, protect `/dashboard`

### Sprint 2 — Points System Backend (Week 2–3)
- [ ] Add `Points` table to Prisma schema + migrate
- [ ] Add `totalPoints` to User model
- [ ] Build `pointsService.award()` utility
- [ ] Hook into `foundItem.create` and `claim.approve` controllers
- [ ] Build `GET /api/points/me` and `GET /api/points/leaderboard`

### Sprint 3 — Points Frontend & Homepage (Week 3–4)
- [ ] `PointsBadge` in student navbar
- [ ] `PointsHistory` component (timeline style, matches dashboard)
- [ ] `Leaderboard` card on admin dashboard
- [ ] `PointsTeaserBanner` on homepage (conditional on auth state)
- [ ] `/rewards` page with full history + leaderboard

### Sprint 4 — Polish & QA (Week 4)
- [ ] Test masterlist validation edge cases (duplicate names, special chars)
- [ ] Test points not double-awarded on socket re-broadcast
- [ ] Mobile responsive check on all new pages
- [ ] Admin can manually award/revoke points
- [ ] Seed test data for leaderboard

---

## File Structure Summary

```
src/
├── pages/
│   ├── StudentRegister.tsx       ← NEW
│   ├── StudentLogin.tsx          ← NEW (replaces old Login)
│   └── RewardsPage.tsx           ← NEW
├── components/
│   ├── auth/
│   │   ├── MasterlistLookup.tsx  ← NEW
│   │   ├── RegisterDetails.tsx   ← NEW
│   │   ├── SetPassword.tsx       ← NEW
│   │   └── AdminLoginModal.tsx   ← NEW (hidden, triple-tap)
│   ├── points/
│   │   ├── PointsBadge.tsx       ← NEW
│   │   ├── PointsHistory.tsx     ← NEW
│   │   └── Leaderboard.tsx       ← NEW
│   └── home/
│       └── PointsTeaserBanner.tsx ← NEW
├── hooks/
│   └── useTripleTap.ts           ← NEW
backend/
├── src/
│   ├── masterlist/
│   │   ├── masterlist.service.ts ← NEW
│   │   └── masterlist.controller.ts ← NEW
│   └── points/
│       ├── points.service.ts     ← NEW
│       ├── points.controller.ts  ← NEW
│       └── points.module.ts      ← NEW
```

---

## Notes & Decisions

- **No email verification** — School ID + masterlist match is the trust anchor
- **Points are non-redeemable for now** — display only, future scope for actual rewards (merch, priority queue, etc.)
- **Masterlist refresh** — recommend a manual "Sync Masterlist" button in admin dashboard so the admin can trigger a fresh pull before enrollment periods
- **Anonymous users cannot earn points** — posting anonymously forfeits point eligibility for that interaction
- **Privacy** — leaderboard shows first name + last initial only (e.g. "Juan S.")
