# 🚀 Gmail OAuth Quick Start Guide

## TL;DR - 5 Minute Setup

### Prerequisites
- ✅ Backend code is ready (`gmail.integration.ts`, `email.controller.ts`)
- ✅ Database schema updated with Gmail fields
- ✅ Gemini API key configured

### 1. Run Database Migration (1 min)

```bash
cd backend
npx prisma migrate dev --name add-gmail-oauth-fields
npx prisma generate
```

### 2. Configure Google Cloud (2 min)

1. Go to: https://console.cloud.google.com
2. Enable Gmail API
3. Create OAuth credentials (Web application)
4. Add redirect URI: `http://localhost:3001/api/admin/gmail/callback`
5. Copy Client ID and Client Secret

### 3. Update .env File (1 min)

Edit `backend/.env`:
```bash
GMAIL_CLIENT_ID="paste-your-client-id-here"
GMAIL_CLIENT_SECRET="paste-your-client-secret-here"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

### 4. Start Backend (30 sec)

```bash
cd backend
npm run dev
```

### 5. Test OAuth Flow (30 sec)

Run the test script:
```bash
./test-gmail-oauth.sh
```

Or manually:
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'

# Get token and test
TOKEN="your-jwt-token"
curl -X GET http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"

# Open returned authUrl in browser
```

---

## What Each File Does

### Backend Files

**`backend/prisma/schema.prisma`**
- Added Gmail OAuth fields to AdminSettings model
- Stores tokens, email, expiry date

**`backend/src/integrations/gmail.integration.ts`**
- Handles OAuth flow (authorization, token exchange)
- Fetches emails from Gmail API
- Manages token refresh automatically
- Marks emails as read after processing

**`backend/src/modules/emails/email.controller.ts`**
- API endpoints for Gmail OAuth
- Email fetching and processing
- Queue management

**`backend/src/modules/emails/email.service.ts`**
- Email parsing (regex + AI)
- Booking auto-creation
- Queue processing

**`backend/.env`**
- Gmail OAuth credentials
- Redirect URI configuration

### Frontend Files (To Be Added)

**`components/AdminSettingsPage.tsx`**
- Gmail connection status
- "Connect Gmail" button
- "Fetch Emails" button

**`components/EmailQueueViewer.tsx`**
- View pending emails
- Process queue
- See parsing results

---

## API Endpoints Reference

### OAuth Endpoints

**GET** `/api/admin/gmail/auth`
- Returns OAuth authorization URL
- User should open this URL in browser

**GET** `/api/admin/gmail/callback?code=xxx`
- Handles OAuth callback from Google
- Exchanges code for tokens
- Saves tokens to database

**GET** `/api/admin/gmail/status`
- Returns Gmail connection status
- Shows connected email, token expiry

### Email Endpoints

**POST** `/api/admin/emails/fetch`
```json
{
  "maxResults": 10
}
```
- Fetches unread emails from Gmail
- Adds to processing queue

**GET** `/api/admin/queue`
- Returns pending emails in queue

**POST** `/api/admin/process-queue`
```json
{
  "autoCreate": true,
  "minConfidence": 80
}
```
- Processes all pending emails with AI
- Auto-creates bookings if confidence > threshold

**POST** `/api/emails/parse`
```json
{
  "from": "agent@china.com",
  "subject": "Container TEMU1234567",
  "body": "Container details..."
}
```
- Parse single email (for testing)
- Returns extracted data without creating booking

---

## Testing Flow

### 1. Check Configuration
```bash
# Should return Gmail OAuth config status
curl http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected (not connected):**
```json
{
  "connected": false
}
```

### 2. Connect Gmail
```bash
# Get OAuth URL
curl http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Action:** Open `authUrl` in browser, authorize Gmail access

### 3. Verify Connection
```bash
curl http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected (connected):**
```json
{
  "connected": true,
  "email": "ion@promo-efect.com",
  "tokenExpiry": "2025-12-18T10:00:00Z"
}
```

### 4. Fetch Emails
```bash
curl -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxResults": 5}'
```

**Expected:**
```json
{
  "success": true,
  "fetched": 3,
  "message": "3 emails queued for processing"
}
```

### 5. View Queue
```bash
curl http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "pending": 3,
  "emails": [
    {
      "id": "18c4f...",
      "from": "agent@china.com",
      "subject": "Container TEMU1234567",
      "status": "PENDING"
    }
  ]
}
```

### 6. Process Queue
```bash
curl -X POST http://localhost:3001/api/admin/process-queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"autoCreate":true,"minConfidence":80}'
```

**Expected:**
```json
{
  "total": 3,
  "success": 2,
  "needsReview": 1,
  "failed": 0,
  "results": [...]
}
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Fix:** In Google Cloud Console, add exact URI:
```
http://localhost:3001/api/admin/gmail/callback
```

### Error: "Gmail OAuth not configured"
**Fix:** Set environment variables in `backend/.env`:
```bash
GMAIL_CLIENT_ID="..."
GMAIL_CLIENT_SECRET="..."
```

### Error: Prisma type errors about Gmail fields
**Fix:** Run migration and regenerate Prisma client:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### No emails fetched
**Fix:** Update query filter in `gmail.integration.ts` (line ~275):
```typescript
// Change from:
const query = encodeURIComponent('is:unread category:primary');

// To match your emails:
const query = encodeURIComponent('is:unread from:china');
```

### AI parsing fails
**Fix:** Check Gemini API key is set:
```bash
# In backend/.env
GEMINI_API_KEY="your-key-here"
```

---

## Database Queries

Check Gmail connection:
```sql
SELECT gmailEmail, gmailTokenExpiry, lastEmailFetchAt 
FROM admin_settings WHERE id = 1;
```

Check email queue:
```sql
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;
```

View pending emails:
```sql
SELECT * FROM email_queue 
WHERE status = 'PENDING' 
ORDER BY receivedAt DESC;
```

Check auto-created bookings:
```sql
SELECT id, containerNumber, status, createdAt 
FROM bookings 
WHERE status = 'EMAIL_PARSED' 
ORDER BY createdAt DESC;
```

---

## Next Steps After Testing

1. **Add frontend UI** - See `GMAIL_OAUTH_TESTING_GUIDE.md` Phase 5
2. **Enable automation** - Set up cron job for auto-sync
3. **Monitor performance** - Track success rate, parsing accuracy
4. **Fine-tune AI** - Adjust prompts for better extraction
5. **Add notifications** - Alert when new bookings created

---

## Complete Documentation

- **GMAIL_OAUTH_TESTING_GUIDE.md** - Full testing procedure (all phases)
- **GMAIL_OAUTH_SETUP_SUMMARY.md** - Setup status and checklist
- **test-gmail-oauth.sh** - Automated test script

---

## Support

Need help? Check:
1. Backend logs: `cd backend && npm run dev`
2. Database: `cd backend && npx prisma studio`
3. Test script: `./test-gmail-oauth.sh`
4. Full guide: `GMAIL_OAUTH_TESTING_GUIDE.md`

**Ready to start! 🎉**
