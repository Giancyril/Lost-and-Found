# Security Testing Guide
**NBSC SAS Lost & Found System**  
**Last Updated:** June 2, 2026

This guide provides step-by-step instructions for testing all implemented security measures.

---

## Prerequisites

1. **Server running** on `http://localhost:5002`
2. **Two test user accounts:**
   - User A (regular student)
   - User B (regular student)
   - Admin account
3. **Tools installed:**
   ```bash
   npm install -g wscat  # For WebSocket testing
   curl  # For API testing (comes with Git Bash on Windows)
   ```

---

## 1. IDOR Protection Testing

### Test 1.1: Claim Deletion IDOR

**Objective:** Verify User A cannot delete User B's claim

```bash
# Step 1: Login as User A and get token
curl -X POST "http://localhost:5002/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"userA@nbsc.edu.ph","password":"password123"}' \
  > user_a_response.json

# Extract token (or copy manually)
TOKEN_A=$(cat user_a_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Step 2: Login as User B, create a claim, note the claim ID
curl -X POST "http://localhost:5002/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"userB@nbsc.edu.ph","password":"password123"}' \
  > user_b_response.json

TOKEN_B=$(cat user_b_response.json | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create claim as User B
curl -X POST "http://localhost:5002/api/claims" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{"foundItemId":"some-item-id","distinguishingFeatures":"Test","lostDate":"2026-06-01"}' \
  > claim_response.json

# Extract claim ID
CLAIM_ID=$(cat claim_response.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Step 3: Try to delete as User A (should fail)
curl -X DELETE "http://localhost:5002/api/claims/$CLAIM_ID" \
  -H "Authorization: Bearer $TOKEN_A"

# Expected: 401/403 error or "You are not authorized to delete this claim"
```

**✅ Pass Criteria:** Request returns error, claim is NOT deleted

**❌ Fail Criteria:** Request succeeds, claim is deleted

---

## 2. Self-Approval Prevention Testing

### Test 2.1: Approve Own Claim

**Objective:** Verify users cannot approve their own claims

```bash
# Step 1: Create a claim as User A
curl -X POST "http://localhost:5002/api/claims" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"foundItemId":"item-123","distinguishingFeatures":"My item","lostDate":"2026-06-01"}' \
  > my_claim.json

MY_CLAIM_ID=$(cat my_claim.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Step 2: Try to approve own claim
curl -X PUT "http://localhost:5002/api/claims/$MY_CLAIM_ID" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'

# Expected: Error message "You cannot approve your own claim"
```

**✅ Pass Criteria:** Error returned, claim status unchanged

### Test 2.2: Approve Claim for Self-Reported Item

**Objective:** Verify users cannot approve claims for items they reported

```bash
# Step 1: User A reports a found item
curl -X POST "http://localhost:5002/api/found-items" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"foundItemName":"Test Item","location":"Library","date":"2026-06-01"}' \
  > found_item.json

ITEM_ID=$(cat found_item.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Step 2: User B creates a claim for that item
curl -X POST "http://localhost:5002/api/claims" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d "{\"foundItemId\":\"$ITEM_ID\",\"distinguishingFeatures\":\"Test\",\"lostDate\":\"2026-06-01\"}" \
  > claim_for_my_item.json

CLAIM_FOR_MY_ITEM=$(cat claim_for_my_item.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Step 3: User A tries to approve the claim for their own reported item
curl -X PUT "http://localhost:5002/api/claims/$CLAIM_FOR_MY_ITEM" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"status":"APPROVED"}'

# Expected: Error message about conflict of interest
```

**✅ Pass Criteria:** Error returned, prevents conflict of interest

---

## 3. Rate Limiting Testing

### Test 3.1: Login Rate Limit

**Objective:** Verify 5 failed login attempts trigger lockout

```bash
# Make 6 consecutive failed login attempts
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST "http://localhost:5002/api/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"test@nbsc.edu.ph","password":"wrongpassword"}' \
    -w "\nHTTP Code: %{http_code}\n\n"
  sleep 1
done

# Expected: Attempts 1-5 return 400/401, Attempt 6 returns 429 "Too many requests"
```

**✅ Pass Criteria:**  
- First 5 attempts: 400/401 errors  
- 6th attempt: 429 Too Many Requests

### Test 3.2: Registration Rate Limit

**Objective:** Verify 3 registration attempts per hour limit

```bash
# Make 4 consecutive registration attempts
for i in {1..4}; do
  echo "Registration attempt $i:"
  curl -X POST "http://localhost:5002/api/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"testuser$i\",\"email\":\"test$i@nbsc.edu.ph\",\"password\":\"test123\"}" \
    -w "\nHTTP Code: %{http_code}\n\n"
  sleep 1
done

# Expected: First 3 attempts may fail for validation but return 400
# 4th attempt: 429 Too Many Requests
```

**✅ Pass Criteria:** 4th attempt blocked with 429 status

---

## 4. WebSocket Authentication Testing

### Test 4.1: Unauthenticated Room Join

**Objective:** Verify unauthenticated sockets cannot join rooms

```bash
# Install wscat if not already installed
npm install -g wscat

# Connect to socket server without authentication
wscat -c "ws://localhost:5002"

# Once connected, try to join a room:
> {"type":"join-item","itemId":"test-item-123"}

# Expected: Error response "Authentication required to join item rooms"
```

**✅ Pass Criteria:** Error message returned, room join rejected

### Test 4.2: Unauthorized Chat Room Join

**Objective:** Verify users can only join chats they're participants in

```bash
# Step 1: Get a valid token for User A
# (Use token from previous tests)

# Step 2: Connect with authentication
wscat -c "ws://localhost:5002" \
  -H "Authorization: Bearer $TOKEN_A"

# Step 3: Try to join a chat room User A is NOT a participant in
> {"type":"join-chat","chatRoomId":"unauthorized-chat-123"}

# Expected: Error "You are not authorized to join this chat room"
```

**✅ Pass Criteria:** Authorization check prevents unauthorized access

---

## 5. File Upload MIME Validation Testing

### Test 5.1: PHP File Disguised as Image

**Objective:** Verify dangerous file types are rejected

```bash
# Create a malicious PHP file
echo '<?php system($_GET["cmd"]); ?>' > malicious.php

# Rename to .jpg to bypass extension check
mv malicious.php malicious.jpg

# Try to upload
curl -X POST "http://localhost:5002/api/found-items/test-item-id/images" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "images=@malicious.jpg" \
  -F "primaryIndex=0"

# Expected: 400 Bad Request "File type not allowed for security reasons"
```

**✅ Pass Criteria:** Upload rejected, MIME type validation blocks PHP

### Test 5.2: Executable File as JPG

```bash
# On Windows (PowerShell)
Copy-Item "C:\Windows\System32\calc.exe" "fake-image.jpg"

# On Linux/Mac
cp /bin/ls fake-image.jpg

# Try to upload
curl -X POST "http://localhost:5002/api/found-items/test-item-id/images" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "images=@fake-image.jpg"

# Expected: Rejected by MIME validation
```

**✅ Pass Criteria:** Upload rejected despite .jpg extension

### Test 5.3: Image Count Limit

```bash
# Try to upload 6 images (limit is 5)
curl -X POST "http://localhost:5002/api/found-items/test-item-id/images" \
  -H "Authorization: Bearer $TOKEN_A" \
  -F "images=@image1.jpg" \
  -F "images=@image2.jpg" \
  -F "images=@image3.jpg" \
  -F "images=@image4.jpg" \
  -F "images=@image5.jpg" \
  -F "images=@image6.jpg"

# Expected: 400 "Maximum 5 images allowed per item"
```

**✅ Pass Criteria:** Server-side limit enforced

---

## 6. Points Farming Prevention Testing

### Test 6.1: Duplicate Points Award

**Objective:** Verify points only awarded once per action

```bash
# Step 1: Report a found item as User A
curl -X POST "http://localhost:5002/api/found-items" \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"foundItemName":"Test Wallet","location":"Cafeteria","date":"2026-06-01"}' \
  > found_item_points.json

ITEM_ID=$(cat found_item_points.json | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Step 2: Check points balance
curl -X GET "http://localhost:5002/api/points/my" \
  -H "Authorization: Bearer $TOKEN_A" \
  > points_before.json

# Step 3: Try to trigger duplicate award (internal test - points.award() should be idempotent)
# Manually call the API endpoint again with same refId
# Points should NOT increase

curl -X GET "http://localhost:5002/api/points/my" \
  -H "Authorization: Bearer $TOKEN_A" \
  > points_after.json

# Compare points_before.json and points_after.json
# Expected: Same totalPoints value (no duplicate award)
```

**✅ Pass Criteria:** Points awarded only once for the same `refId`

---

## 7. ReDoS Protection Testing

### Test 7.1: Large Input to Moderation Endpoint

**Objective:** Verify server doesn't hang on large inputs

```bash
# Generate a 10,000 character string
LARGE_STRING=$(python3 -c "print('a' * 10000)")

# Time the request (should complete quickly)
time curl -X POST "http://localhost:5002/api/moderation/test" \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"$LARGE_STRING\"}"

# Expected: 400 "Text too long for testing (max 10000 characters)" or quick response
# Response time should be < 1 second (not hanging)
```

**✅ Pass Criteria:**  
- Request completes in < 1 second  
- OR returns 400 error for excessive length  
- Server does NOT hang or timeout

---

## 8. Email Validation Bypass Testing

### Test 8.1: Subdomain Injection

**Objective:** Verify email domain validation prevents bypasses

```bash
# Try to register with subdomain injection
curl -X POST "http://localhost:5002/api/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","email":"hacker@nbsc.edu.ph.evil.com","password":"test123"}'

# Expected: 400 "Email must be from @nbsc.edu.ph or @student.nbsc.edu.ph"
```

**✅ Pass Criteria:** Registration rejected

### Test 8.2: Null Byte Injection

```bash
# Try null byte injection
curl -X POST "http://localhost:5002/api/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker2","email":"hacker@nbsc.edu.ph%00@evil.com","password":"test123"}'

# Expected: 400 "Invalid email format (null byte detected)"
```

**✅ Pass Criteria:** Validation detects and rejects

### Test 8.3: Homograph Attack

```bash
# Try unicode homoglyph (if possible in your terminal)
curl -X POST "http://localhost:5002/api/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker3","email":"user@nbsс.edu.ph","password":"test123"}'
# Note: The 'c' in nbsc is Cyrillic, not Latin

# Expected: 400 "Invalid email format (non-ASCII characters detected)"
```

**✅ Pass Criteria:** Non-ASCII detection blocks homograph

---

## 9. Scanner Input Sanitization Testing

### Test 9.1: XSS via Barcode

**Objective:** Verify barcode scanner sanitizes malicious input

**Manual Test Steps:**

1. Open the app and navigate to "Report Lost Item"
2. Click "Scan ID" button
3. Create a QR code containing:
   ```
   12345|<script>alert('XSS')</script>|BSCS|test@nbsc.edu.ph
   ```
4. Scan the QR code
5. Check the form fields

**✅ Pass Criteria:**  
- No JavaScript alert appears  
- Script tags are removed from the name field  
- Field contains sanitized text only

### Test 9.2: Event Handler Injection

1. Create QR code with:
   ```
   ID|<img src=x onerror=alert('XSS')>|Dept|email@nbsc.edu.ph
   ```
2. Scan the code
3. Verify no alert appears and HTML is stripped

**✅ Pass Criteria:** Event handlers removed, no code execution

---

## 10. Google Sheets Security Testing

### Test 10.1: Debug Endpoint Protection

```bash
# Try to access debug endpoint without authentication
curl -X GET "http://localhost:5002/api/debug/masterlist"

# Expected: 401 Unauthorized
```

**✅ Pass Criteria:** Endpoint requires authentication

### Test 10.2: Direct Gviz URL Access

**Manual Test:**

1. Open incognito/private browser window
2. Navigate to:
   ```
   https://docs.google.com/spreadsheets/d/1-uxgLmMS13UbC_BvcVjxeGjlJUgykvRIbb4D0y7zrPI/gviz/tq?tqx=out:json&sheet=Copy%20of%20Master%20List
   ```

**⚠️ CURRENT STATUS:** URL is publicly accessible (needs fix)

**✅ Target Pass Criteria:** Should return 403 or require Google account login

**Action Required:** Update Google Sheet permissions (see `GOOGLE_SHEETS_SECURITY.md`)

---

## Test Results Summary Template

```
=== SECURITY TEST RESULTS ===
Date: _______________
Tester: _____________

[ ] 1. IDOR Protection - Claim Deletion
[ ] 2. Self-Approval Prevention
[ ] 3. Login Rate Limiting
[ ] 4. Registration Rate Limiting
[ ] 5. WebSocket Authentication
[ ] 6. WebSocket Room Authorization
[ ] 7. File Upload - PHP Rejection
[ ] 8. File Upload - Executable Rejection
[ ] 9. File Upload - Image Count Limit
[ ] 10. Points Farming Prevention
[ ] 11. ReDoS Protection
[ ] 12. Email Subdomain Injection
[ ] 13. Email Null Byte Injection
[ ] 14. Email Homograph Attack
[ ] 15. Scanner XSS Prevention
[ ] 16. Debug Endpoint Protection
[ ] 17. Google Sheets Access (⚠️ Pending Fix)

Total Passed: ____ / 17
Total Failed: ____

Notes:
_______________________________________
_______________________________________
```

---

## Troubleshooting

### Issue: Rate limiting not working

**Solution:** Clear rate limit storage
```bash
# If using memory store, restart server
# If using Redis, flush keys:
redis-cli FLUSHALL
```

### Issue: WebSocket connection fails

**Solution:** Check server logs, ensure Socket.IO is running
```bash
# Check if socket server is listening
netstat -an | grep 5002
```

### Issue: File uploads always rejected

**Solution:** Check Content-Type header
```bash
# Ensure you're uploading actual image files
file your-image.jpg
# Should output: JPEG image data
```

---

**Security Testing Checklist Complete**  
For questions or issues, refer to `SECURITY_HARDENING.md`
