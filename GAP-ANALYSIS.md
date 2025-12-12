# GAP ANALYSIS - Ce am vs Ce trebuie

**Data:** 12 Decembrie 2025, 15:05
**Bazat pe:** TODO List din MEGA PROMPT + STATUS-CURRENT.md

---

## 🔴 P0 - BLOCKER TASKS (96h total, ~56h remaining)

### ✅ Task #1: Bookings Service + Controller (18h)
**Status:** ✅ **100% COMPLET**

**Ce există:**
- ✅ `booking-id.util.ts` (format PE2512001)
- ✅ `bookings.service.ts` (8/8 metode complete)
- ✅ `bookings.controller.ts` (5/5 endpoints)
- ✅ `bookings.routes.ts` (registered în app.ts)

**Ce lipsește:**
- ⚠️ **NEEDS TESTING** - Endpoints untested cu curl

**Acțiune:** TEST ONLY (nu trebuie rescris)

---

### ✅ Task #2-3: Frontend API Client + Auth Integration (10h)
**Status:** ✅ **100% COMPLET**

**Ce există:**
- ✅ `services/api.ts` (axios + interceptors)
- ✅ `services/auth.ts` (login/register/logout)
- ✅ `services/bookings.ts` (CRUD)
- ✅ `.env.local` (VITE_API_URL)
- ✅ `Login.tsx` (uses real API, not mock)
- ✅ `BookingsList.tsx` (uses real API)
- ✅ `MainDashboard.tsx` (uses real stats API)

**Ce lipsește:**
- ⚠️ **NEEDS TESTING** - Frontend nu am testat dacă pornește

**Acțiune:** TEST ONLY

---

### ✅ Task #4: Calculator API - 5 Offers Sorted (12h)
**Status:** ✅ **100% COMPLET**

**Ce există:**
- ✅ `calculator.service.ts` (calculate for ALL 6 lines)
- ✅ `calculator.controller.ts` (4 endpoints)
- ✅ Registered în app.ts
- ✅ **TESTED** - Calculator API funcționează
- ✅ Returns top 5 sorted by price
- ✅ NO "Shipping Line" input required ✅
- ✅ Frontend `PriceCalculator.tsx` updated cu API real

**Ce lipsește:**
- NIMIC! Task complet și testat

**Acțiune:** ✅ DONE

---

### ❌ Task #5: Email Processing + Gmail OAuth (20h) 🚨 HIGHEST PRIORITY
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- NIMIC

**Ce lipsește (ALL):**
```
backend/src/modules/emails/
  ├── email.service.ts (0/9 metode)
  ├── email.controller.ts (0/4 endpoints)
  └── email.routes.ts

backend/src/integrations/
  ├── gmail.integration.ts
  └── openai-parser.integration.ts

backend/src/config/
  └── gmail-oauth.config.ts
```

**Metode necesare în email.service.ts:**
1. `setupGmailOAuth()` - Gmail OAuth flow
2. `fetchUnreadEmails()` - Fetch emails (every 5 min cron)
3. `parseEmailWithAI(emailContent)` - OpenAI GPT-4 parsing
4. `extractBookingData(parsedEmail)` - Extract booking fields
5. `createBookingFromEmail(bookingData)` - Auto-create booking
6. `sendConfirmationEmail(bookingId)` - Send confirmation to client
7. `markEmailAsProcessed(emailId)` - Move to "Processed" label
8. `getEmailProcessingStats()` - Dashboard stats
9. `retryFailedEmail(emailId)` - Manual retry

**Endpoints necesare:**
- GET `/api/admin/gmail/auth` - Start OAuth flow
- GET `/api/admin/gmail/callback` - OAuth callback
- POST `/api/admin/emails/fetch` - Manual fetch trigger
- POST `/api/emails/parse` - Parse single email (manual test)

**Environment variables needed:**
```
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:3001/api/admin/gmail/callback
OPENAI_API_KEY=...
```

**Acțiune:** 🚨 **START IMMEDIATELY AFTER TESTING EXISTING CODE**

**ROI:** ⭐⭐⭐⭐⭐ HIGHEST (saves 10h/week pentru Ion!)

---

### ❌ Task #6: Portal Agenți (16h)
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- ⚠️ `agent_prices` table în DB EXISTS
- ⚠️ `agents` table în DB EXISTS

**Ce lipsește (ALL):**
```
backend/src/modules/agent-portal/
  ├── agent-portal.service.ts (0/7 metode)
  ├── agent-portal.controller.ts (0/5 endpoints)
  └── agent-portal.routes.ts

frontend/pages/agent-portal/
  ├── login.tsx
  ├── dashboard.tsx
  └── price-update.tsx
```

**Workflow necesar:**
1. Agent login (separate auth from main app)
2. View current prices
3. Submit new price → status = "PENDING"
4. Admin reviews → approve/reject
5. If approved → price goes LIVE
6. Email notification to agent

**Endpoints necesare:**
- POST `/api/agent-portal/login` - Agent authentication
- GET `/api/agent-portal/prices` - View current prices
- POST `/api/agent-portal/prices` - Submit new price (status: PENDING)
- PUT `/api/agent-portal/prices/:id` - Update pending price
- GET `/api/admin/agent-prices/pending` - Admin view pending
- PUT `/api/admin/agent-prices/:id/approve` - Admin approve
- PUT `/api/admin/agent-prices/:id/reject` - Admin reject

**Acțiune:** START AFTER Email Processing

**ROI:** ⭐⭐⭐⭐ HIGH (eliminates manual Excel updates)

---

### ❌ Task #7: Container Tracking + Terminal49 (12h)
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- ⚠️ `containers` table în DB EXISTS
- ⚠️ `tracking_events` table în DB EXISTS

**Ce lipsește (ALL):**
```
backend/src/modules/tracking/
  ├── tracking.service.ts
  ├── tracking.controller.ts
  └── tracking.routes.ts

backend/src/integrations/
  └── terminal49.integration.ts
```

**Features necesare:**
1. Track container by number
2. Get tracking events from Terminal49 API
3. Store events în DB (`tracking_events` table)
4. Webhook from Terminal49 for real-time updates
5. Frontend live tracking page cu timeline

**Endpoints necesare:**
- GET `/api/containers/:number/tracking` - Get tracking events
- POST `/api/webhooks/terminal49` - Webhook endpoint
- POST `/api/admin/containers/sync-all` - Manual sync all containers

**Environment variables:**
```
TERMINAL49_API_KEY=...
TERMINAL49_WEBHOOK_SECRET=...
```

**Acțiune:** START AFTER Portal Agenți

**ROI:** ⭐⭐⭐ MEDIUM-HIGH (clienții văd status real-time)

---

### ❌ Task #8: GPS Tracking Șoferi (20h) 🚨 COMPLEX
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- NIMIC (this is all new functionality)

**Ce lipsește (ALL):**
```
backend/src/modules/gps/
  ├── gps.service.ts
  ├── gps.controller.ts
  └── gps.routes.ts

backend/src/modules/drivers/
  ├── driver.service.ts
  └── driver.controller.ts

frontend/pages/tracking/
  └── live-gps-tracking.tsx (with Leaflet map)
```

**Workflow necesar:**
1. Admin assigns driver to booking
2. Driver receives SMS: "Start tracking for booking PE2512001"
3. Driver opens link → Mobile web app
4. Driver clicks "Start transport"
5. App sends GPS coordinates every 30 seconds
6. Client sees truck moving on map în real-time
7. Driver clicks "Arrived" → Tracking stops

**Endpoints necesare:**
- POST `/api/admin/bookings/:id/assign-driver` - Assign driver
- POST `/api/driver/start-transport/:id` - Driver starts
- POST `/api/driver/update-location/:id` - Update GPS coords
- POST `/api/driver/finish-transport/:id` - Driver finishes
- GET `/api/client/tracking/:containerNumber` - Client view (real-time)

**Frontend pages:**
- `/tracking/live/:containerNumber` - Client view (map cu truck icon)
- `/driver/transport/:bookingId` - Driver mobile interface

**Acțiune:** START AFTER Container Tracking

**ROI:** ⭐⭐⭐⭐⭐ HIGHEST (diferențiator competitiv MAJOR!)

---

### ❌ Task #9: Notifications Multi-Channel (16h)
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- ⚠️ `notifications` table în DB EXISTS
- ⚠️ `email_queue` table în DB EXISTS

**Ce lipsește (ALL):**
```
backend/src/modules/notifications/
  ├── notification.service.ts
  ├── notification.controller.ts
  └── notification.routes.ts

backend/src/integrations/
  ├── twilio.integration.ts (SMS + WhatsApp)
  ├── sendgrid.integration.ts (Email)
  └── viber.integration.ts (Viber - optional)

backend/src/templates/
  ├── email/
  │   ├── booking-confirmed.html
  │   ├── container-arrived.html
  │   └── payment-reminder.html
  └── sms/
      ├── booking-confirmed.txt
      └── container-arrived.txt
```

**Features necesare:**
1. Send notification (multi-channel: Email, SMS, WhatsApp, Viber)
2. Template system pentru notifications
3. Queue system (email_queue table)
4. Retry logic (max 3 retries)
5. Delivery tracking (sent_at, delivered_at, failed_at)

**Notification types:**
- Booking confirmed
- Booking status changed
- Container departed
- Container arrived Constanta
- Transport started (GPS tracking)
- Container delivered
- Invoice created
- Payment received
- Payment overdue

**Environment variables:**
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@promo-efect.md
```

**Acțiune:** START AFTER GPS Tracking

**ROI:** ⭐⭐⭐⭐ HIGH (client communication automated)

---

### ❌ Task #10: Payments Module (8h)
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- ⚠️ `payments` table în DB EXISTS
- ⚠️ `invoices` table în DB EXISTS

**Ce lipsește (ALL):**
```
backend/src/modules/payments/
  ├── payment.service.ts
  ├── payment.controller.ts
  └── payment.routes.ts

frontend/pages/payments/
  └── payment-history.tsx
```

**Features necesare:**
1. Record payment (manual entry)
2. Link payment to invoice
3. Calculate remaining balance
4. Mark invoice as PAID when full amount received
5. Payment reminders (cron job)
6. Payment history for client

**Endpoints necesare:**
- POST `/api/payments` - Record new payment
- GET `/api/payments` - List payments (with filters)
- GET `/api/payments/:id` - Get payment details
- GET `/api/invoices/:id/payments` - Payments for invoice
- POST `/api/admin/payments/send-reminder/:invoiceId` - Manual reminder

**Acțiune:** START AFTER Notifications

**ROI:** ⭐⭐⭐ MEDIUM (payments management)

---

## 🟡 P1 - HIGH PRIORITY TASKS (110h total, 110h remaining)

### ❌ Task #11: Background Jobs + Cron (12h)
**Status:** ❌ **0% - NOT STARTED**

**Ce există:**
- ⚠️ `background_jobs` table în DB EXISTS

**Ce lipsește:**
```
backend/src/services/cron/
  ├── email-fetcher.job.ts (every 5 min)
  ├── container-sync.job.ts (every 30 min)
  ├── payment-reminders.job.ts (daily 10:00)
  ├── daily-report.job.ts (daily 18:00)
  └── weekly-report.job.ts (Monday 09:00)

backend/src/config/
  └── cron-config.ts
```

**Cron jobs necesare:**
1. **Email fetching** (every 5 min) - Fetch unread from Gmail
2. **Container sync** (every 30 min) - Sync tracking from Terminal49
3. **Payment reminders** (daily 10:00) - Send reminders for overdue invoices
4. **Daily report** (daily 18:00) - Send to all admins
5. **Weekly report** (Monday 09:00) - Send to all admins

**Package needed:** `node-cron`

**Acțiune:** START AFTER All P0 tasks

**ROI:** ⭐⭐⭐⭐⭐ HIGHEST (full automation!)

---

### ❌ Task #12-18: [Other P1 tasks...]
- Task #12: Clients Service (8h)
- Task #13: Invoices Service (8h)
- Task #14: Documents Upload (8h)
- Task #15: Admin Settings Page (8h)
- Task #16: User Management (12h)
- Task #17: Audit Logs Viewer (8h)
- Task #18: Search & Filters (12h)

**Total P1 remaining:** 110h

---

## 🟢 P2 - NICE TO HAVE TASKS (152h total, 152h remaining)

### Task #19-30: [All P2 tasks...]
- Task #19: Dashboard KPIs (12h)
- Task #20: Reports (Daily + Weekly) (12h)
- Task #21: Data Migration Tool (12h)
- Task #22: Landing Page (16h)
- Task #23: Unit Tests (20h)
- Task #24: Integration Tests (20h)
- Task #25: E2E Tests (20h)
- Task #26: CI/CD Pipeline (16h)
- Task #27: Monitoring + Sentry (12h)
- Task #28: Documentation (12h)

**Total P2 remaining:** 152h

---

## 📊 SUMMARY

### Progress Overall
- **P0 Tasks:** 4/10 complete (40%) - **56h remaining**
- **P1 Tasks:** 0/8 complete (0%) - **110h remaining**
- **P2 Tasks:** 0/12 complete (0%) - **152h remaining**

**Total progress:** ~15% (40/358h complete)

### Critical Path (Must Do for MVP)
1. ✅ Task #1: Bookings API (18h) - DONE
2. ✅ Task #2-3: Frontend Integration (10h) - DONE
3. ✅ Task #4: Calculator API (12h) - DONE
4. ❌ Task #5: Email Processing (20h) - **NEXT** 🚨
5. ❌ Task #6: Portal Agenți (16h)
6. ❌ Task #7: Container Tracking (12h)
7. ❌ Task #8: GPS Tracking (20h)
8. ❌ Task #9: Notifications (16h)
9. ❌ Task #10: Payments (8h)
10. ❌ Task #11: Background Jobs (12h)

**MVP completion:** 40h done, 144h remaining = **35 work days** (4h/day)

### Time Estimates
- **If working 4h/day:** 36 days (~5 weeks)
- **If working 8h/day:** 18 days (~2.5 weeks)
- **If working full-time (12h/day):** 12 days (~2 weeks)

---

## 🎯 RECOMMENDED EXECUTION ORDER

### PHASE 1: Complete P0 (56h remaining)
**Order by ROI:**
1. Task #5: Email Processing (20h) ⭐⭐⭐⭐⭐
2. Task #8: GPS Tracking (20h) ⭐⭐⭐⭐⭐
3. Task #6: Portal Agenți (16h) ⭐⭐⭐⭐
4. Task #9: Notifications (16h) ⭐⭐⭐⭐
5. Task #7: Container Tracking (12h) ⭐⭐⭐
6. Task #10: Payments (8h) ⭐⭐⭐

### PHASE 2: Complete P1 (110h)
**Focus on automation & polish**
- Background jobs (12h)
- Admin features (44h)
- Search & filters (12h)
- Dashboard KPIs (12h)

### PHASE 3: Complete P2 (152h)
**Production readiness**
- Testing (60h)
- DevOps (28h)
- Documentation (12h)
- Landing page (16h)

---

**Generated:** 12 Decembrie 2025, 15:10
**By:** AI Development Agent
**Status:** READY FOR EXECUTION
