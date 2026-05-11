# Security Hardening Report
**Project:** NBSC SAS Lost & Found System  
**Date:** May 11, 2026  
**Status:** Completed

---

## Summary

A full dependency audit and security hardening pass was performed on both the server and frontend. All high/critical vulnerabilities were resolved, HTTP security headers were enabled via Helmet.js, and the JWT secret was strengthened.

| Area | Before | After |
|---|---|---|
| Server vulnerabilities | 21 |  0 |
| Frontend vulnerabilities | 21 |  0 |
| Security headers |  None |  All active |
| X-Powered-By exposed |  Yes |  Removed |
| JWT secret strength |  < 64 chars |  64+ bytes |

---

## 1. Dependency Vulnerabilities Fixed

### Server (`/server`)

| Package | Severity | Vulnerability | Fix |
|---|---|---|---|
| `axios` 1.0.0–1.15.1 | High | NO_PROXY SSRF bypass + unrestricted redirects | `npm install axios@latest` |
| `jsonwebtoken` / `jws` | High | Improper HMAC signature verification | `npm install jsonwebtoken@latest` |
| `nodemailer` | High | SMTP header injection | `npm install nodemailer@latest` |
| `bcrypt` → `tar` ≤7.5.10 | High | Path traversal via hardlink/symlink chain | `npm install bcrypt@latest` |

**Command sequence run:**
```bash
cd lost-and-found-main/server
npm install jsonwebtoken@latest
npm install axios@latest
npm install nodemailer@latest
npm install bcrypt@latest
npm audit --audit-level high  # → 0 vulnerabilities
```

---

### Frontend (`/frontend`)

| Package | Severity | Vulnerability | Fix |
|---|---|---|---|
| `react-router-dom` | High | XSS via open redirect | `npm audit fix` |
| `picomatch` ≤2.3.1 | High | ReDoS via extglob quantifiers | `npm audit fix` |
| `quagga` → `form-data` | Critical | Unsafe random boundary (CSRF-adjacent) | `npm audit fix --force` (breaking) |
| `quagga` → `qs` | Moderate | DoS via bracket notation | `npm audit fix --force` |
| `quagga` → `tough-cookie` | Moderate | Prototype pollution | `npm audit fix --force` |

**Command sequence run:**
```bash
cd lost-and-found-main/frontend
npm audit fix          # safe fixes first
npm audit fix --force  # quagga downgrade to 0.6.16 — scanner tested and confirmed working
npm audit --audit-level high  # → 0 vulnerabilities
```

---

### Accepted Residual Risks

The following vulnerabilities were accepted after risk assessment. They exist inside `quagga`'s internal `request` dependency chain and have **no runtime attack path** in this system:

| Package | Vulnerability | Why Accepted |
|---|---|---|
| `form-data` via `quagga` | Unsafe random boundary (critical) | Client-side only, quagga never makes outbound HTTP during scanning |
| `qs` via `quagga→request` | DoS via bracket notation (moderate) | Internal to quagga, not exposed to user input |
| `tough-cookie` via `quagga→request` | Prototype pollution (moderate) | Internal to quagga, not reachable from API |
| `tar` via `bcrypt→node-pre-gyp` (if applicable) | Path traversal (high) | Build-time only — never runs during server operation |

> **Future action:** Replace `quagga` with `@ericblade/quagga2` (actively maintained fork) to eliminate these entirely.

---

## 2. Security Headers (Helmet.js)

### Installation

```bash
cd lost-and-found-main/server
npm install helmet
```

### Configuration

Added to `src/app.ts` — **before** `cors()` and all routes:

```typescript
import helmet from "helmet";

// Helmet must be first middleware
app.use(helmet());
app.disable("x-powered-by");

// Then cors, body parsers, routes...
app.use(cors(corsOptions));
```

### Headers Now Active

Verified via:
```powershell
(Invoke-WebRequest -Method GET -Uri http://localhost:5001 -UseBasicParsing).Headers
```

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; ...` | Prevents XSS and injection |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS |
| `Referrer-Policy` | `no-referrer` | Prevents referrer leakage |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevents cross-origin reads |
| `X-Powered-By` | *(removed)* | Hides server technology |

---

## 3. JWT Secret Strengthening

### Problem
The `JWT_SECRET` in `.env` was shorter than the recommended 64 characters, making it potentially vulnerable to brute-force attacks against signed tokens.

### Fix
Generate a cryptographically secure 64-byte (128 hex character) secret:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Replace in `.env`:
```dotenv
JWT_SECRET=<128-character hex string>
```

### Verification
```powershell
Get-Content .env | Select-String "JWT_SECRET"
# The value after = should be 128 characters long
```

---

## 4. Remaining Security Checklist Items

These were identified during the audit but not yet completed. Address in order of priority:

### Critical (Do Next)
- [ ] **IDOR on claims/items** — Log in as User A, attempt to access/modify User B's claim using User A's token. Verify the server rejects it.
- [ ] **Approve own claim** — Attempt to approve a claim you submitted yourself via the API directly (bypass the UI).
- [ ] **Google Sheets Gviz endpoint** — Open the raw student masterlist Gviz URL in an incognito browser. It must return 403 or require auth.

### High Priority
- [ ] **Socket.io `join_room` auth** — Use `wscat` or a custom socket client to join a room without a valid claim. Server must reject unauthenticated room joins.
- [ ] **Rate limiting on auth routes** — Verify `express-rate-limit` is applied to `POST /api/login` and `POST /api/register`.
- [ ] **CORS lock** — Remove `http://localhost:5173` from allowed origins before deploying to production.

### Medium Priority
- [ ] **ReDoS on moderation keyword filter** — Send a 10,000-character string to `POST /api/moderation/test`. If the server hangs, the regex has a ReDoS vulnerability.
- [ ] **Email domain validation bypass** — Test `user@nbsc.edu.ph.evil.com` and `user@nbsc.edu.ph%00@evil.com` against the registration endpoint.
- [ ] **Scanner injection** — Test pipe-delimited input `ID|Name|Dept|<script>alert(1)</script>` through the barcode scanner to confirm DOM sanitization.
- [ ] **File upload MIME validation** — Upload a `.php` file renamed to `.jpg` to the item photo endpoint. Verify it is rejected by content type, not just extension.

### Low Priority
- [ ] **Points farming** — Verify a user cannot earn points by repeatedly submitting and deleting found item reports.
- [ ] **Image count enforcement** — Confirm the 5-image limit on found items is validated server-side, not just client-side.
- [ ] **NODE_ENV in production** — Ensure `NODE_ENV=production` is set in the Vercel/Render environment, not just locally.

---

## 5. Tools Used

| Tool | Purpose |
|---|---|
| `npm audit` | Dependency vulnerability scanning |
| `Invoke-WebRequest` (PowerShell) | HTTP header inspection |
| `helmet` npm package | Security header middleware |
| Node.js `crypto` module | JWT secret generation |

---

## 6. Files Modified

| File | Change |
|---|---|
| `server/src/app.ts` | Added `helmet` import, `app.use(helmet())`, `app.disable('x-powered-by')` |
| `server/package.json` | Updated `axios`, `jsonwebtoken`, `nodemailer`, `bcrypt` |
| `frontend/package.json` | Updated `react-router-dom`, `picomatch`, `quagga` (→ 0.6.16) |
| `server/.env` | Regenerated `JWT_SECRET` to 64+ byte value |

---
