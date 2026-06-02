# Security Quick Reference Card
**NBSC SAS Lost & Found System**

Quick reference for all implemented security features and where to find them.

---

## 🔒 Authentication & Authorization

| Feature | Location | Status |
|---------|----------|--------|
| Login rate limiting (5 per 15min) | `server/src/app/midddlewares/authRateLimit.ts` | ✅ |
| Registration rate limiting (3 per hour) | `server/src/app/midddlewares/authRateLimit.ts` | ✅ |
| JWT token validation | `server/src/app/midddlewares/auth.ts` | ✅ |
| IDOR protection on claims | `server/src/app/modules/claim/claim.service.ts` | ✅ |
| Self-approval prevention | `server/src/app/modules/claim/claim.service.ts` | ✅ |
| Socket.IO authentication | `server/src/websocket/socketHandlers.ts` | ✅ |

---

## 🛡️ Input Validation & Sanitization

| Feature | Location | Status |
|---------|----------|--------|
| Email domain validation | `server/src/app/utils/emailValidator.ts` | ✅ |
| Scanner XSS prevention | `frontend/src/components/scanner/BarcodeScannerModal.tsx` | ✅ |
| File MIME type validation | `server/src/app/midddlewares/upload.ts` | ✅ |
| Image count enforcement (5 max) | `server/src/app/modules/foundItems/foundItem.controller.ts` | ✅ |
| ReDoS protection | `server/src/app/utils/moderationController.ts` | ✅ |

---

## 🚫 Attack Prevention

| Attack Type | Protection | Location |
|-------------|-----------|----------|
| Brute Force | Rate limiting on login/register | `authRateLimit.ts` |
| IDOR | User ownership validation | `claim.service.ts` |
| XSS | HTML sanitization in scanner | `BarcodeScannerModal.tsx` |
| File Upload | MIME validation + extension check | `upload.ts` |
| ReDoS | Input length limits (10k chars) | `moderationController.ts` |
| Points Farming | Duplicate award prevention | `points.service.ts` |
| Email Bypass | Multi-layer validation | `emailValidator.ts` |
| SQL Injection | Prisma ORM (parameterized queries) | All `*.service.ts` |
| CSRF | Double-submit cookie pattern | `app.ts` |

---

## 📋 Security Checklist Status

### ✅ Completed (All 13 Items)

#### Critical (3/3)
- [x] IDOR on claims/items
- [x] Self-approval prevention  
- [x] Google Sheets debug endpoint

#### High Priority (3/3)
- [x] Socket.IO room authentication
- [x] Rate limiting on auth routes
- [x] CORS production check

#### Medium Priority (4/4)
- [x] ReDoS protection
- [x] Email domain validation
- [x] Scanner input sanitization
- [x] File MIME validation

#### Low Priority (3/3)
- [x] Points farming prevention
- [x] Image count server-side enforcement
- [x] NODE_ENV production check

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `server/.env` | JWT secrets, database URLs |
| `server/src/app.ts` | Helmet, CORS, CSRF |
| `server/src/app/midddlewares/` | All middleware implementations |

---

## 📝 Testing Commands

### Quick Test: Rate Limiting
```bash
for i in {1..6}; do
  curl -X POST "http://localhost:5002/api/login" \
    -d '{"username":"test","password":"wrong"}' \
    -H "Content-Type: application/json"
done
```

### Quick Test: IDOR Protection
```bash
# Delete someone else's claim (should fail)
curl -X DELETE "http://localhost:5002/api/claims/<their-claim-id>" \
  -H "Authorization: Bearer <your-token>"
```

### Quick Test: File Upload
```bash
# Try to upload PHP file (should be rejected)
echo '<?php echo "test"; ?>' > test.php
mv test.php test.jpg
curl -X POST "http://localhost:5002/api/found-items/123/images" \
  -H "Authorization: Bearer <token>" \
  -F "images=@test.jpg"
```

---

## ⚠️ Known Issues

1. **Google Sheets Public Access**
   - **Issue:** Student masterlist accessible via public Gviz URL
   - **Impact:** PII exposure risk
   - **Action:** Update permissions in Google Drive
   - **Details:** See `GOOGLE_SHEETS_SECURITY.md`

2. **Development CORS in Production**
   - **Issue:** Localhost origins in ALLOWED_ORIGINS
   - **Impact:** Could allow dev access in production
   - **Action:** Remove before deploy
   - **Check:** Server logs on startup

---

## 📚 Documentation Files

1. **SECURITY_HARDENING.md** - Complete security audit report
2. **SECURITY_TESTING_GUIDE.md** - Step-by-step testing procedures
3. **GOOGLE_SHEETS_SECURITY.md** - Google Sheets security analysis
4. **This file** - Quick reference

---

## 🚀 Pre-Deployment Checklist

Before deploying to production:

- [ ] Remove localhost from `ALLOWED_ORIGINS` in `app.ts`
- [ ] Verify `NODE_ENV=production` is set
- [ ] Update Google Sheets permissions
- [ ] Run full security test suite
- [ ] Review all `.env` variables
- [ ] Check Helmet security headers
- [ ] Verify rate limiting is working
- [ ] Test socket authentication
- [ ] Confirm CSRF protection active

---

## 📞 Security Contacts

**For security issues:**
- Review: `SECURITY_HARDENING.md`
- Testing: `SECURITY_TESTING_GUIDE.md`
- Google Sheets: `GOOGLE_SHEETS_SECURITY.md`

**Emergency:**
- Disable affected endpoints in `routes.ts`
- Check `server/logs/` for attack attempts
- Review audit logs in database

---

**Last Updated:** June 2, 2026  
**Security Status:** ✅ All Checklist Items Complete  
**Version:** 2.0 (Post-Hardening)
