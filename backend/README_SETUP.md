# 🚀 Promo-Efect Backend - Setup Guide

## ✅ CE A FOST CREAT

### 1. Database Schema (SQLite Compatible)
- **Fișier**: `prisma/schema.prisma`
- **16 tabele**: Users, Sessions, Clients, Agents, AgentPrices, AdminSettings, Bookings, Containers, TrackingEvents, Documents, Invoices, Payments, Notifications, EmailQueue, AuditLog, BackgroundJobs
- **Toate relațiile configurate**

### 2. Authentication System
- **JWT utilities**: `src/utils/jwt.util.ts`
- **Auth Service**: `src/modules/auth/auth.service.ts`
- **Auth Controller**: `src/modules/auth/auth.controller.ts`
- **Auth Middleware**: `src/middleware/auth.middleware.ts`
- **Routes**: `src/modules/auth/auth.routes.ts`

**Endpoints disponibile:**
- `POST /api/auth/register` - Înregistrare user nou
- `POST /api/auth/login` - Autentificare
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Deconectare
- `GET /api/auth/me` - Info user curent

### 3. Booking System
- **ID Generator**: `src/utils/booking-id.util.ts` (format: PE2512001)
- **Types**: `src/types/booking.types.ts`
- **Routes**: `src/modules/bookings/bookings.routes.ts` (placeholder)

### 4. Other Modules (Placeholders)
- `src/modules/clients/client.routes.ts`
- `src/modules/invoices/invoice.routes.ts`

### 5. Server Configuration
- **Main App**: `src/app.ts` (configured with CORS, Helmet, all routes)
- **Server**: `src/server.ts` (with Prisma connection)
- **Environment**: `.env` (SQLite configured)

---

## 📋 NEXT STEPS - FOLLOW IN ORDER

### STEP 1: Verify Prisma Installation

```bash
# Check if Prisma is installed
ls node_modules/.bin/prisma

# If not found, install compatible version:
npm install prisma@5.15.0 @prisma/client@5.15.0 --save-exact
```

### STEP 2: Generate Prisma Client

```bash
npx prisma generate
```

**Expected output**: "✔ Generated Prisma Client"

### STEP 3: Create Database & Run Migration

```bash
npx prisma migrate dev --name init
```

**Expected output**:
- Creates `dev.db` file in backend folder
- Creates `prisma/migrations/` folder
- Message: "Your database is now in sync with your schema"

### STEP 4: (Optional) View Database

```bash
npx prisma studio
```

Opens browser at `http://localhost:5555` to view/edit data.

### STEP 5: Start Development Server

```bash
npm run dev
```

**Expected output**:
```
✅ Database connection established.
🚀 Server running on http://localhost:3001
🩺 Health check available at http://localhost:3001/health
```

---

## 🧪 TESTING THE API

### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

**Expected**: `{"status":"UP","timestamp":"2025-12-11T..."}`

### Test 2: Register Admin User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ion@promo-efect.md",
    "password": "Admin123!",
    "name": "Ion Scacun",
    "phone": "+37369123456",
    "company": "Promo-Efect SRL",
    "role": "ADMIN"
  }'
```

**Expected**: Returns user object + `accessToken` + `refreshToken`

### Test 3: Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ion@promo-efect.md",
    "password": "Admin123!"
  }'
```

**Expected**: Returns user + tokens

### Test 4: Get Current User

```bash
# Replace YOUR_TOKEN with the accessToken from login
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns user info

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module '@prisma/client'"

**Solution**:
```bash
npx prisma generate
```

### Error: "Environment variable not found: DATABASE_URL"

**Solution**: Check that `.env` file exists in backend folder with:
```
DATABASE_URL="file:./dev.db"
```

### Error: "Prisma schema validation failed"

**Solution**: Run prisma format and validate:
```bash
npx prisma format
npx prisma validate
```

### Error: Port 3001 already in use

**Solution**: Change PORT in `.env`:
```
PORT=3002
```

---

##  Production (Supabase Postgres) - Minimal Setup

### 1) Create `.env.production` (DO NOT COMMIT)

Create a new file `backend/.env.production` on your server (or locally for testing) with:

- `DATABASE_URL` - Supabase Postgres connection string (must include SSL)
  - Example:
    - `DATABASE_URL="postgresql://postgres:<PASSWORD>@db.<PROJECT_REF>.supabase.co:5432/postgres?schema=public&sslmode=require"`

- `JWT_SECRET` - strong random secret (min 32 chars)
- `NODE_ENV=production`
- `PORT=3001` (or your desired port)
- `FRONTEND_URL=https://<your-frontend-domain>` (used by CORS)

### 2) Apply migrations to Supabase

Point `DATABASE_URL` to Supabase and run:
- `npx prisma migrate deploy`

### 3) Generate Prisma Client

- `npx prisma generate`

---

## 📝 NEXT FEATURES TO IMPLEMENT

### Priority 1: Bookings CRUD

Create these files:
1. `src/modules/bookings/bookings.service.ts`
2. `src/modules/bookings/bookings.controller.ts`
3. Update `src/modules/bookings/bookings.routes.ts`

### Priority 2: Clients Management

Create these files:
1. `src/modules/clients/clients.service.ts`
2. `src/modules/clients/clients.controller.ts`
3. Update `src/modules/clients/client.routes.ts`

### Priority 3: Admin Settings

Create:
1. `src/modules/settings/settings.service.ts`
2. `src/modules/settings/settings.controller.ts`

---

## 🎯 CURRENT STATUS

**Completion**: ~40% of Phase 1

| Feature | Status |
|---------|--------|
| Database Schema | ✅ 100% |
| Environment Setup | ✅ 100% |
| JWT & Auth | ✅ 100% |
| Auth API Endpoints | ✅ 100% |
| Bookings API | ⏸️ 20% (structure only) |
| Clients API | ⏸️ 10% (placeholder) |
| Invoices API | ⏸️ 10% (placeholder) |
| Frontend Integration | ⏸️ 0% |

---

## 📞 SUPPORT

If you encounter any issues:
1. Check server logs in terminal
2. Verify `.env` file exists and is correct
3. Ensure database migration ran successfully
4. Check Prisma Studio to verify tables exist

**Happy coding! 🎉**
