# Gmail OAuth Integration - Complete Testing Guide

## 📋 Overview

This guide will help you test the Gmail OAuth integration end-to-end, from OAuth setup to automated email processing.

**What this integration does:**
- Connects to Gmail via OAuth 2.0
- Automatically fetches emails from inbox
- Parses container/shipping info using AI
- Auto-creates bookings in the system
- Saves Ion 10+ hours/week of manual data entry

---

## 🚀 Phase 1: Backend Setup

### Step 1: Update Database Schema

The schema has been updated with Gmail OAuth fields. Run the migration:

```bash
cd backend
npx prisma migrate dev --name add-gmail-oauth-fields
npx prisma generate
```

**Verify migration success:**
```bash
npx prisma studio
```
Check that `AdminSettings` table now has:
- `gmailAccessToken`
- `gmailRefreshToken`
- `gmailTokenExpiry`
- `gmailEmail`
- `lastEmailFetchAt`

### Step 2: Configure Google Cloud Console

1. **Go to**: https://console.cloud.google.com
2. **Create Project** (or select existing):
   - Project name: "Promo-Efect Logistics"
   
3. **Enable Gmail API**:
   - Navigate to: APIs & Services → Library
   - Search: "Gmail API"
   - Click: Enable

4. **Create OAuth 2.0 Credentials**:
   - Navigate to: APIs & Services → Credentials
   - Click: Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "Promo-Efect Backend"
   
5. **Configure Redirect URIs**:
   ```
   http://localhost:3001/api/admin/gmail/callback
   ```
   For production, add:
   ```
   https://your-domain.com/api/admin/gmail/callback
   ```

6. **Download credentials**:
   - Click on your OAuth client
   - Note the Client ID and Client Secret

### Step 3: Update Backend Environment Variables

Edit `backend/.env`:

```bash
# Gmail OAuth Integration
GMAIL_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-abcdefghijklmnop"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"

# Gemini AI for email parsing (already configured)
GEMINI_API_KEY="your-gemini-api-key"
```

**Get Gemini API Key** (if not already configured):
- Go to: https://makersuite.google.com/app/apikey
- Create new API key
- Add to `.env`

### Step 4: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
✓ Prisma Client generated
✓ Database connected
✓ Server running on port 3001
✓ Gmail OAuth configured
```

---

## 🧪 Phase 2: Testing OAuth Flow

### Test 1: Check Gmail Configuration

```bash
# Login first to get JWT token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@promo-efect.com",
    "password": "your-admin-password"
  }'
```

**Save the token:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Check Gmail status:**
```bash
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response (not connected yet):**
```json
{
  "connected": false
}
```

### Test 2: Initiate OAuth Flow

**Option A: Using browser (recommended)**

1. Start frontend:
   ```bash
   cd /Users/megapromotingholding/Documents/promo-effect
   npm run dev
   ```

2. Login as ADMIN user
3. Navigate to Admin Settings (we'll add UI next)
4. Click "Connect Gmail"

**Option B: Using curl**

```bash
curl -X GET http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "message": "Redirect user to this URL to authorize Gmail access"
}
```

**Open the authUrl in browser:**
- Copy the `authUrl` from response
- Paste in browser
- Login to Google account
- Grant permissions:
  - ✓ Read emails from Gmail
  - ✓ Modify emails (mark as read)
  - ✓ See email metadata

### Test 3: Complete OAuth Callback

After granting permissions, Google redirects to:
```
http://localhost:3001/api/admin/gmail/callback?code=4/0AY0e-g7...
```

Backend automatically:
1. Exchanges code for tokens
2. Saves tokens to database
3. Gets user's Gmail address
4. Returns success response

**Expected response:**
```json
{
  "success": true,
  "message": "Gmail connected successfully!",
  "expiresAt": "2025-12-18T10:30:00Z"
}
```

### Test 4: Verify Connection

```bash
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response (now connected):**
```json
{
  "connected": true,
  "email": "ion@promo-efect.com",
  "tokenExpiry": "2025-12-18T10:30:00Z",
  "lastFetch": null
}
```

✅ **OAuth flow complete!**

---

## 📧 Phase 3: Testing Email Fetching

### Test 5: Fetch Emails from Gmail

```bash
curl -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 5
  }'
```

**Expected response:**
```json
{
  "success": true,
  "fetched": 3,
  "message": "3 emails queued for processing"
}
```

**What happens:**
1. Backend calls Gmail API
2. Fetches unread emails from primary inbox
3. Parses email data (from, subject, body)
4. Adds to processing queue
5. Returns count of fetched emails

### Test 6: Check Email Queue

```bash
curl -X GET http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN"
```

**Expected response:**
```json
{
  "pending": 3,
  "emails": [
    {
      "id": "18c4f2a1b3d5e6f7",
      "from": "agent@china-logistics.cn",
      "subject": "Container TEMU1234567 - Shanghai to Constanta",
      "date": "2025-12-17T08:30:00Z",
      "status": "PENDING"
    }
  ]
}
```

---

## 🤖 Phase 4: Testing AI Email Parsing

### Test 7: Process Email Queue with AI

```bash
curl -X POST http://localhost:3001/api/admin/process-queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoCreate": true,
    "minConfidence": 80
  }'
```

**Expected response:**
```json
{
  "total": 3,
  "success": 2,
  "needsReview": 1,
  "failed": 0,
  "results": [
    {
      "emailId": "18c4f2a1b3d5e6f7",
      "status": "SUCCESS",
      "bookingId": "BK-20251217-001",
      "extracted": {
        "containerNumber": "TEMU1234567",
        "blNumber": "MEDUENT123456789",
        "shippingLine": "MSC",
        "portOrigin": "Shanghai",
        "portDestination": "Constanta",
        "eta": "2025-12-28",
        "confidence": 95
      }
    }
  ]
}
```

**What happens:**
1. Backend reads pending emails from queue
2. Calls Gemini AI to parse each email
3. Extracts: container number, B/L, ports, dates, etc.
4. If confidence > 80%, auto-creates booking
5. If confidence < 80%, marks for manual review
6. Updates email status in queue

### Test 8: Verify Bookings Created

```bash
curl -X GET http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
New bookings created from parsed emails with:
- Container number
- B/L number
- Shipping line
- Port origin/destination
- ETD/ETA dates
- Status: "EMAIL_PARSED"

---

## 🎨 Phase 5: Frontend Integration

### Step 1: Add Gmail Connection UI to Admin Settings

Update `components/AdminSettingsPage.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { GlassCard } from './ui/GlassCard';

export function AdminSettingsPage() {
  const [gmailStatus, setGmailStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      const response = await api.get('/admin/gmail/status');
      setGmailStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch Gmail status');
    }
  };

  const handleConnectGmail = async () => {
    try {
      const response = await api.get('/admin/gmail/auth');
      // Redirect to Google OAuth
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Failed to initiate Gmail auth');
    }
  };

  const handleFetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/admin/emails/fetch', {
        maxResults: 10
      });
      
      alert(`✅ Fetched ${response.data.fetched} emails`);
      
      // Process queue
      await api.post('/admin/process-queue');
      alert('✅ Emails processed');
      
      fetchGmailStatus();
    } catch (error) {
      alert('❌ Failed to fetch emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

      {/* Gmail Integration Section */}
      <GlassCard className="mb-6">
        <h2 className="text-xl font-semibold mb-4">📧 Gmail Integration</h2>
        
        {gmailStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="success">Connected</Badge>
              <span className="text-sm text-gray-600">
                {gmailStatus.email}
              </span>
            </div>
            
            <div className="text-sm text-gray-500">
              <p>Last fetch: {gmailStatus.lastFetch 
                ? new Date(gmailStatus.lastFetch).toLocaleString() 
                : 'Never'}</p>
              <p>Token expires: {new Date(gmailStatus.tokenExpiry).toLocaleString()}</p>
            </div>

            <Button 
              onClick={handleFetchEmails} 
              loading={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🔄 Fetch New Emails
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Connect your Gmail account to automatically fetch and process booking emails.
            </p>
            <Button 
              onClick={handleConnectGmail}
              className="bg-green-600 hover:bg-green-700"
            >
              🔗 Connect Gmail
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Other admin settings... */}
    </div>
  );
}
```

### Step 2: Add Email Queue Viewer

Create `components/EmailQueueViewer.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Table } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function EmailQueueViewer() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchQueue();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get('/admin/queue');
      setQueue(response.data.emails || []);
    } catch (error) {
      console.error('Failed to fetch queue');
    }
  };

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      await api.post('/admin/process-queue');
      alert('✅ Queue processed');
      fetchQueue();
    } catch (error) {
      alert('❌ Failed to process queue');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Email Queue ({queue.length} pending)
        </h3>
        <Button 
          onClick={handleProcessQueue}
          loading={isProcessing}
          disabled={queue.length === 0}
        >
          Process All
        </Button>
      </div>

      <Table>
        <thead>
          <tr>
            <th>From</th>
            <th>Subject</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((email) => (
            <tr key={email.id}>
              <td>{email.from}</td>
              <td>{email.subject}</td>
              <td>{new Date(email.date).toLocaleString()}</td>
              <td>
                <Badge variant={
                  email.status === 'PENDING' ? 'warning' :
                  email.status === 'PROCESSING' ? 'info' :
                  email.status === 'PROCESSED' ? 'success' : 'error'
                }>
                  {email.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
```

---

## ⚡ Phase 6: Automated Email Syncing

### Option A: Backend Cron Job

Create `backend/src/jobs/emailSync.job.ts`:

```typescript
import cron from 'node-cron';
import { gmailIntegration } from '../integrations/gmail.integration';
import { emailService } from '../modules/emails/email.service';

/**
 * Auto-fetch and process emails every 15 minutes
 */
export function startEmailSyncJob() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Email Sync] Starting scheduled email fetch...');
    
    try {
      // Check if Gmail is connected
      const status = await gmailIntegration.getStatus();
      if (!status.connected) {
        console.log('[Email Sync] Gmail not connected, skipping');
        return;
      }

      // Fetch emails
      const emails = await gmailIntegration.fetchUnreadEmails(10);
      console.log(`[Email Sync] Fetched ${emails.length} emails`);

      // Queue for processing
      for (const email of emails) {
        await emailService.queueEmailForProcessing(email);
      }

      // Process queue
      const pending = await emailService.getPendingEmails();
      for (const email of pending) {
        const result = await emailService.processEmail(email, true, 80);
        
        await emailService.markEmailProcessed(
          email.id,
          result.status === 'FAILED' ? 'FAILED' : 'PROCESSED',
          result.error
        );

        if (result.bookingId) {
          console.log(`[Email Sync] Created booking: ${result.bookingId}`);
        }
      }

      console.log('[Email Sync] Completed successfully');
    } catch (error) {
      console.error('[Email Sync] Error:', error);
    }
  });

  console.log('✓ Email sync job started (runs every 15 minutes)');
}
```

Install dependency:
```bash
cd backend
npm install node-cron @types/node-cron
```

Update `backend/src/server.ts`:
```typescript
import { startEmailSyncJob } from './jobs/emailSync.job';

// After server starts
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  
  // Start background jobs
  startEmailSyncJob();
});
```

---

## ✅ Testing Checklist

### OAuth Flow
- [ ] Gmail API enabled in Google Cloud Console
- [ ] OAuth credentials created
- [ ] Redirect URI configured correctly
- [ ] Environment variables set
- [ ] Can initiate OAuth from frontend
- [ ] Redirects to Google consent screen
- [ ] Can grant permissions
- [ ] Callback saves tokens to database
- [ ] Status endpoint shows "Connected"

### Email Fetching
- [ ] Status endpoint returns connection info
- [ ] Fetch endpoint retrieves emails from Gmail
- [ ] Emails are added to queue
- [ ] Queue endpoint shows pending emails
- [ ] Can view email details (from, subject, body)

### Email Processing
- [ ] Process queue calls Gemini AI
- [ ] Successfully parses container data
- [ ] Creates booking records in database
- [ ] Handles parsing errors gracefully
- [ ] Updates email queue status
- [ ] Low-confidence emails marked for review

### Frontend Integration
- [ ] Admin settings shows Gmail status
- [ ] Connect button works
- [ ] OAuth flow completes successfully
- [ ] Can manually trigger email fetch
- [ ] Email queue viewer shows pending emails
- [ ] Can process queue from UI
- [ ] Success/error messages displayed

### Automation
- [ ] Cron job runs every 15 minutes
- [ ] Job logs show successful syncs
- [ ] Job handles errors without crashing
- [ ] New bookings auto-created
- [ ] Can monitor job execution

---

## 🐛 Common Issues & Solutions

### Issue 1: "Redirect URI mismatch"
**Error:** `redirect_uri_mismatch`

**Solution:**
1. Go to Google Cloud Console
2. Navigate to Credentials
3. Edit OAuth client
4. Add exact URI: `http://localhost:3001/api/admin/gmail/callback`
5. Save changes
6. Try OAuth flow again

### Issue 2: "Invalid grant" error
**Error:** `invalid_grant` when exchanging code

**Solution:**
- Tokens expired, re-authenticate
- Click "Connect Gmail" again
- Complete OAuth flow again

### Issue 3: No emails fetched
**Error:** `fetched: 0` emails

**Solution:**
- Check Gmail has unread emails
- Verify query filter in `gmail.integration.ts`
- Default query: `is:unread category:primary`
- Update to match your emails:
  ```typescript
  const query = encodeURIComponent('is:unread from:china');
  ```

### Issue 4: Parsing fails
**Error:** AI parsing returns low confidence

**Solution:**
- Check Gemini API key is set
- Verify email contains container info
- Test with sample email:
  ```bash
  curl -X POST http://localhost:3001/api/emails/parse \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "subject": "Container TEMU1234567",
      "body": "Container: TEMU1234567\nB/L: BL123456\nPort: Shanghai to Constanta\nETA: 2025-12-28"
    }'
  ```

### Issue 5: Containers not created
**Error:** Parsing succeeds but no booking created

**Solution:**
- Check `minConfidence` threshold (default: 80)
- Lower threshold: `"minConfidence": 60`
- Check client mapping:
  ```typescript
  // In email.service.ts
  const client = await prisma.client.findFirst({
    where: { email: extractedData.supplierEmail }
  });
  ```
- Create default client if missing

### Issue 6: Token refresh fails
**Error:** `Token refresh failed`

**Solution:**
- Re-authenticate (tokens may be revoked)
- Check refresh token exists in database:
  ```sql
  SELECT gmailRefreshToken FROM admin_settings WHERE id = 1;
  ```
- If null, reconnect Gmail

---

## 📊 Monitoring & Metrics

### Database Queries

**Check Gmail connection:**
```sql
SELECT 
  gmailEmail,
  gmailTokenExpiry,
  lastEmailFetchAt
FROM admin_settings WHERE id = 1;
```

**Check email queue:**
```sql
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;
```

**Check auto-created bookings:**
```sql
SELECT 
  id,
  containerNumber,
  status,
  createdAt
FROM bookings
WHERE status = 'EMAIL_PARSED'
ORDER BY createdAt DESC
LIMIT 10;
```

### Performance Metrics

Track in application logs:
- Email fetch time (should be < 5s)
- AI parsing time (should be < 10s per email)
- Booking creation time (should be < 1s)
- Queue processing time

### Success Rate

Calculate daily:
```typescript
const totalEmails = await prisma.emailQueue.count();
const successfulParsing = await prisma.emailQueue.count({
  where: { status: 'PROCESSED', bookingCreated: true }
});

const successRate = (successfulParsing / totalEmails) * 100;
console.log(`Email parsing success rate: ${successRate}%`);
```

---

## 🚀 Production Deployment

### Environment Variables (Production)

```bash
# Gmail OAuth
GMAIL_CLIENT_ID="prod-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="prod-secret"
GMAIL_REDIRECT_URI="https://api.promo-efect.com/api/admin/gmail/callback"

# Database (production)
DATABASE_URL="postgresql://user:pass@prod-db:5432/promo_efect?sslmode=require"

# Gemini AI
GEMINI_API_KEY="prod-api-key"
```

### Security Considerations

1. **Token Encryption**: Consider encrypting tokens in database
2. **Rate Limiting**: Implement rate limits for API calls
3. **Audit Logging**: Log all OAuth events
4. **HTTPS Only**: Use HTTPS for all redirect URIs
5. **Token Rotation**: Refresh tokens before expiry

### Monitoring

Use tools like:
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Datadog**: Performance monitoring
- **Gmail API Dashboard**: Track quota usage

---

## 📝 Next Steps

After successful testing:

1. **Add frontend UI** for Gmail management
2. **Create email templates** for common container types
3. **Implement smart client matching** (by email domain)
4. **Add duplicate detection** (same container number)
5. **Create notification system** (Slack/email on new bookings)
6. **Build analytics dashboard** (emails processed, success rate)

---

## 🎯 Success Criteria

Integration is successful when:

✅ OAuth flow completes without errors  
✅ Emails fetched automatically every 15 minutes  
✅ 80%+ of emails parsed correctly  
✅ Bookings auto-created with 90%+ accuracy  
✅ Manual review queue < 5 emails/day  
✅ Zero duplicate bookings created  
✅ Ion saves 10+ hours/week  

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check backend logs: `cd backend && npm run dev`
2. Check database: `npx prisma studio`
3. Test with Postman/curl
4. Review Google Cloud Console logs
5. Check Gemini API quota

**Happy Testing! 🎉**
