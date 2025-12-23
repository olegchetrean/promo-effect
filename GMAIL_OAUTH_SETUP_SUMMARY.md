# 📧 Gmail OAuth Integration - Setup Summary

## ✅ What Has Been Completed

### 1. Database Schema Updated
**File**: `backend/prisma/schema.prisma`

Added to `AdminSettings` model:
```prisma
gmailAccessToken      String?   @map("gmail_access_token")
gmailRefreshToken     String?   @map("gmail_refresh_token")
gmailTokenExpiry      DateTime? @map("gmail_token_expiry")
gmailEmail            String?   @map("gmail_email")
lastEmailFetchAt      DateTime? @map("last_email_fetch_at")
```

### 2. Backend Environment Variables
**File**: `backend/.env`

Added configuration:
```bash
GMAIL_CLIENT_ID=""
GMAIL_CLIENT_SECRET=""
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

### 3. Gmail Integration Service
**File**: `backend/src/integrations/gmail.integration.ts`

Updated methods:
- ✅ `saveTokens()` - Now saves to database with email
- ✅ `getTokens()` - Retrieves from AdminSettings table
- ✅ `getStatus()` - Returns connection status from database
- ✅ `getUserInfo()` - Gets Gmail user email address
- ✅ Token refresh with database persistence

### 4. API Endpoints Available
**File**: `backend/src/modules/emails/email.controller.ts`

All routes registered:
- `GET /api/admin/gmail/auth` - Initiate OAuth flow
- `GET /api/admin/gmail/callback` - OAuth callback handler
- `GET /api/admin/gmail/status` - Check connection status
- `POST /api/admin/emails/fetch` - Fetch emails from Gmail
- `GET /api/admin/queue` - View email processing queue
- `POST /api/admin/process-queue` - Process emails with AI
- `POST /api/emails/parse` - Parse single email (testing)

### 5. Documentation Created

#### Main Testing Guide
**File**: `GMAIL_OAUTH_TESTING_GUIDE.md`
- Complete testing procedure
- Phase-by-phase instructions
- Frontend integration code
- Troubleshooting guide
- Production deployment tips

#### Test Script
**File**: `test-gmail-oauth.sh`
- Automated testing script
- Checks backend status
- Tests OAuth endpoints
- Can fetch and process emails

---

## 🚀 Next Steps to Complete Integration

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add-gmail-oauth-fields
npx prisma generate
```

This will:
- Add Gmail OAuth columns to AdminSettings table
- Regenerate Prisma client with new types
- Fix TypeScript errors in gmail.integration.ts

### Step 2: Configure Google Cloud Console

1. **Go to**: https://console.cloud.google.com
2. **Create OAuth credentials**:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/api/admin/gmail/callback`
3. **Enable Gmail API**
4. **Copy credentials** to `backend/.env`:
   ```bash
   GMAIL_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GMAIL_CLIENT_SECRET="GOCSPX-your-secret"
   ```

### Step 3: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

Verify output shows:
```
✓ Server running on port 3001
✓ Database connected
```

### Step 4: Test OAuth Flow

#### Option A: Using Test Script
```bash
./test-gmail-oauth.sh
```

#### Option B: Manual Testing
```bash
# 1. Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@promo-efect.com","password":"your-password"}'

# Save token
TOKEN="eyJhbGc..."

# 2. Check Gmail status
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"

# 3. Get OAuth URL
curl -X GET http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"

# 4. Open authUrl in browser, authorize, and check status again
```

### Step 5: Add Frontend UI

Update `components/AdminSettingsPage.tsx` with Gmail connection UI:

```tsx
// See GMAIL_OAUTH_TESTING_GUIDE.md - Phase 5 for complete code
const handleConnectGmail = async () => {
  const response = await api.get('/admin/gmail/auth');
  window.location.href = response.data.authUrl;
};
```

### Step 6: Test Email Fetching

After OAuth is connected:

```bash
# Fetch emails
curl -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maxResults":5}'

# Check queue
curl -X GET http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN"

# Process with AI
curl -X POST http://localhost:3001/api/admin/process-queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"autoCreate":true,"minConfidence":80}'
```

---

## 📋 Testing Checklist

Before marking integration as complete:

### Backend Setup
- [ ] Database migration applied successfully
- [ ] Prisma client regenerated (no TypeScript errors)
- [ ] Google Cloud OAuth credentials created
- [ ] Gmail API enabled in Google Cloud Console
- [ ] Environment variables set in `backend/.env`
- [ ] Backend server starts without errors
- [ ] All API endpoints respond correctly

### OAuth Flow
- [ ] Can get OAuth URL from `/api/admin/gmail/auth`
- [ ] OAuth URL redirects to Google consent screen
- [ ] Can grant Gmail permissions
- [ ] Callback endpoint saves tokens to database
- [ ] Status endpoint shows `connected: true`
- [ ] Database has tokens and email stored

### Email Fetching
- [ ] Can fetch emails from Gmail inbox
- [ ] Emails appear in queue
- [ ] Queue endpoint returns pending emails
- [ ] Email data includes from, subject, body
- [ ] Attachments are listed (if any)

### AI Processing
- [ ] Gemini API key configured
- [ ] Process queue calls Gemini successfully
- [ ] Container data extracted correctly
- [ ] Bookings auto-created when confidence > 80%
- [ ] Low confidence emails marked for review
- [ ] Processing errors handled gracefully

### Frontend Integration
- [ ] Admin settings page shows Gmail status
- [ ] "Connect Gmail" button works
- [ ] OAuth flow completes and returns to frontend
- [ ] "Fetch Emails" button works
- [ ] Email queue viewer shows pending emails
- [ ] Can process queue from UI

### Automation (Optional)
- [ ] Cron job configured in `backend/src/jobs/emailSync.job.ts`
- [ ] Job runs every 15 minutes
- [ ] Job fetches and processes emails automatically
- [ ] Job logs execution status
- [ ] Can monitor job performance

---

## 🔧 Configuration Files Reference

### Backend Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="..."

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# Gmail OAuth
GMAIL_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-abcdefghijklmnop"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"

# AI
GEMINI_API_KEY="your-gemini-api-key"
```

### OAuth Redirect URIs
Development:
```
http://localhost:3001/api/admin/gmail/callback
```

Production:
```
https://api.promo-efect.com/api/admin/gmail/callback
```

---

## 🐛 Known Issues & Solutions

### Issue: Prisma Type Errors
**Symptom**: TypeScript errors about missing Gmail fields

**Solution**:
```bash
cd backend
npx prisma migrate dev --name add-gmail-oauth-fields
npx prisma generate
npm run dev
```

### Issue: OAuth Redirect Mismatch
**Symptom**: `redirect_uri_mismatch` error

**Solution**: 
- In Google Cloud Console, add exact URI
- Must match `GMAIL_REDIRECT_URI` in `.env`
- Include protocol (http/https)

### Issue: No Emails Fetched
**Symptom**: `fetched: 0` even though inbox has emails

**Solution**: Update query in `gmail.integration.ts`:
```typescript
// Current (line ~275)
const query = encodeURIComponent('is:unread category:primary');

// Change to match your emails
const query = encodeURIComponent('is:unread from:china');
// or
const query = encodeURIComponent('is:unread subject:container');
```

---

## 📊 Expected Performance

### Email Fetching
- **Speed**: 2-5 seconds for 10 emails
- **Frequency**: Every 15 minutes (automated)
- **Gmail API Quota**: 1 billion quota units/day (plenty)

### AI Parsing
- **Speed**: 5-10 seconds per email
- **Accuracy**: 80-95% for well-formatted emails
- **Confidence**: Auto-create when > 80%

### Booking Creation
- **Speed**: < 1 second per booking
- **Duplicate Detection**: Checks by container number
- **Error Rate**: < 5% (mostly low-confidence emails)

---

## 🎯 Success Metrics

Integration is successful when:

✅ OAuth connects within 30 seconds  
✅ Emails fetched every 15 minutes  
✅ 80%+ emails parsed correctly  
✅ 90%+ bookings auto-created accurately  
✅ Manual review queue < 5 emails/day  
✅ Zero duplicate bookings  
✅ **Ion saves 10+ hours/week**  

---

## 📞 Support Resources

### Documentation
- [GMAIL_OAUTH_TESTING_GUIDE.md](./GMAIL_OAUTH_TESTING_GUIDE.md) - Complete testing guide
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Gemini API Docs](https://ai.google.dev/docs)

### Test Scripts
- `test-gmail-oauth.sh` - Automated testing script
- Check backend logs: `cd backend && npm run dev`
- Database viewer: `cd backend && npx prisma studio`

### Debugging Commands
```bash
# Check database
cd backend && npx prisma studio

# Check backend logs
cd backend && npm run dev

# Test API endpoints
curl http://localhost:3001/health

# Check Gmail status
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎉 Ready to Start!

Follow the testing guide step-by-step:
1. Read `GMAIL_OAUTH_TESTING_GUIDE.md`
2. Run database migration
3. Configure Google Cloud Console
4. Start backend server
5. Test OAuth flow
6. Fetch and process emails

**Happy Testing! 🚀**
