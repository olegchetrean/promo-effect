# 🇷🇴 Ghid de Verificare - Integrare Gmail OAuth

## Ce am implementat?

Am pregătit sistemul backend pentru a se conecta automat la Gmail și a prelua emailuri cu informații despre containere. Sistemul va:
1. ✅ Se autentifica cu Gmail (OAuth 2.0 - foarte sigur)
2. ✅ Citi emailuri noi din inbox
3. ✅ Extrage automat: număr container, B/L, porturi, date ETD/ETA
4. ✅ Crea booking-uri automat în sistem
5. ✅ Economisește 10+ ore/săptămână pentru Ion

---

## 📁 Fișiere modificate/create

### Backend (cod)
1. **`backend/prisma/schema.prisma`**
   - Am adăugat câmpuri pentru stocarea token-urilor Gmail
   - `gmailAccessToken`, `gmailRefreshToken`, `gmailEmail`, etc.

2. **`backend/src/integrations/gmail.integration.ts`**
   - Logica OAuth (conectare la Gmail)
   - Preluare emailuri din Gmail API
   - Refresh automat al token-urilor

3. **`backend/.env`**
   - Variabile de mediu pentru credențialele Google
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`

### Documentație (4 ghiduri)
1. **`GMAIL_OAUTH_QUICKSTART.md`** - Start rapid (5 min)
2. **`GMAIL_OAUTH_TESTING_GUIDE.md`** - Ghid complet de testare
3. **`GMAIL_OAUTH_SETUP_SUMMARY.md`** - Rezumat configurare
4. **`IMPLEMENTATION_STATUS.md`** - Status implementare

### Script de testare
- **`test-gmail-oauth.sh`** - Script automat pentru testare

---

## 🚀 Cum verific funcționalul? (Pas cu Pas)

### PASUL 1: Rulează migrarea bazei de date (2 minute)

Deschide terminalul și rulează:

```bash
cd backend
npx prisma migrate dev --name add-gmail-oauth-fields
npx prisma generate
```

**Ce face:**
- Adaugă coloane noi în tabelul `admin_settings` pentru token-urile Gmail
- Regenerează Prisma client (pentru a elimina erorile TypeScript)

**Rezultat așteptat:**
```
✔ Migrations applied
✔ Prisma Client generated
```

---

### PASUL 2: Configurează Google Cloud Console (5 minute)

#### 2.1. Mergi la Google Cloud Console
Link: https://console.cloud.google.com

#### 2.2. Creează/Selectează proiect
- Click pe dropdown-ul de proiecte (sus în stânga)
- Click "New Project" → Nume: "Promo-Efect Logistics"
- SAU selectează un proiect existent

#### 2.3. Activează Gmail API
1. În meniul din stânga: **APIs & Services** → **Library**
2. Caută: "Gmail API"
3. Click pe **Gmail API**
4. Click **ENABLE**

#### 2.4. Creează credențiale OAuth 2.0
1. În meniul din stânga: **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** (sus)
3. Alege: **OAuth client ID**
4. La "Application type": alege **Web application**
5. Nume: "Promo-Efect Backend"

#### 2.5. Configurează Redirect URI
În secțiunea **Authorized redirect URIs**:
- Click **+ ADD URI**
- Adaugă exact: `http://localhost:3001/api/admin/gmail/callback`
- **Opțional (dacă știi deja domeniul pentru producție):**
  - Click **+ ADD URI** din nou
  - Adaugă: `https://api.promo-efect.com/api/admin/gmail/callback`
  - (sau orice va fi domeniul tău real)
- Click **CREATE**

**💡 Pro Tip:** Poți adăuga ambele URI-uri acum (localhost pentru testare + producție pentru server). Astfel nu trebuie să revii aici când urci pe server!

#### 2.6. Copiază credențialele
După creare, vei vedea un popup cu:
- **Client ID** (ex: `123456789-abc.apps.googleusercontent.com`)
- **Client Secret** (ex: `GOCSPX-abcdefghijklmnop`)

**NU ÎNCHIDE POPUP-UL ÎNCĂ!** Copiază ambele valori.

---

### PASUL 3: Actualizează fișierul .env (1 minut)

Deschide fișierul `backend/.env` și înlocuiește rândurile:

```bash
# Gmail OAuth Integration
GMAIL_CLIENT_ID="PUNE-CLIENT-ID-UL-TAU-AICI"
GMAIL_CLIENT_SECRET="PUNE-CLIENT-SECRET-UL-TAU-AICI"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

**Exemplu concret (DEZVOLTARE - localhost):**
```bash
GMAIL_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-Xxyzabc123def456"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

**⚠️ IMPORTANT pentru PRODUCȚIE:**

Când urci aplicația pe server, schimbă redirect URI-ul:

```bash
# Pe server (PRODUCȚIE)
GMAIL_CLIENT_ID="123456789-abc.apps.googleusercontent.com"     # ACELAȘI
GMAIL_CLIENT_SECRET="GOCSPX-Xxyzabc123def456"                  # ACELAȘI
GMAIL_REDIRECT_URI="https://api.promo-efect.com/api/admin/gmail/callback"  # SCHIMBAT!
```

**Nu uita:**
1. Adaugă ambele URI-uri în Google Cloud Console (localhost ȘI producție)
2. Pe server folosește HTTPS (nu HTTP) pentru securitate
3. Client ID și Secret rămân aceleași pentru local și producție

**Salvează fișierul!**

---

### PASUL 4: Pornește backend-ul (30 secunde)

În terminal:

```bash
cd backend
npm run dev
```

**Rezultat așteptat:**
```
✓ Server running on port 3001
✓ Database connected
✓ Prisma Client loaded
```

**Lasă serverul să ruleze!** Nu închide acest terminal.

---

### PASUL 5: Testează OAuth Flow (3 minute)

#### Opțiunea A: Cu script automat (RECOMANDAT)

Deschide un **nou terminal** (lasă backend-ul să ruleze) și rulează:

```bash
cd /Users/megapromotingholding/Documents/promo-effect
./test-gmail-oauth.sh
```

Script-ul va:
1. Verifica dacă backend-ul rulează ✓
2. Te va întreba email și parolă de admin
3. Va testa conexiunea Gmail
4. Dacă Gmail nu e conectat, îți va da un link să-l deschizi în browser

#### Opțiunea B: Manual (cu curl)

**Pas 5.1: Login ca admin**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@promo-efect.com",
    "password": "parola-ta-de-admin"
  }'
```

**Răspuns așteptat:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

**Copiază token-ul!** Îl vei folosi mai jos.

**Pas 5.2: Verifică status Gmail**

```bash
# Înlocuiește YOUR_TOKEN cu token-ul de mai sus
TOKEN="YOUR_TOKEN"

curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Răspuns așteptat (prima dată - neconectat):**
```json
{
  "connected": false
}
```

**Pas 5.3: Obține link-ul de autentificare Gmail**

```bash
curl -X GET http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"
```

**Răspuns așteptat:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "message": "Redirect user to this URL to authorize Gmail access"
}
```

**Pas 5.4: Deschide link-ul în browser**

1. Copiază URL-ul din `authUrl`
2. Deschide-l într-un browser (Chrome, Safari, etc.)
3. Vei vedea ecranul de login Google
4. Autentifică-te cu contul Gmail pe care vrei să-l folosești
5. Google va cere permisiuni:
   - ✓ "Read emails from Gmail"
   - ✓ "Modify emails" (pentru a marca ca citit)
6. Click **Allow** / **Permitere**

**Pas 5.5: După autorizare**

Browser-ul va redirecta către:
```
http://localhost:3001/api/admin/gmail/callback?code=4/0AY0e-g7...
```

Vei vedea un răspuns JSON:
```json
{
  "success": true,
  "message": "Gmail connected successfully!",
  "expiresAt": "2025-12-18T10:30:00Z"
}
```

**Pas 5.6: Verifică din nou status-ul**

```bash
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Acum ar trebui să vezi (conectat!):**
```json
{
  "connected": true,
  "email": "ion@promo-efect.com",
  "tokenExpiry": "2025-12-18T10:30:00Z",
  "lastFetch": null
}
```

✅ **SUCCES! Gmail este conectat!**

---

### PASUL 6: Testează preluarea de emailuri (2 minute)

#### 6.1. Preia emailuri din Gmail

```bash
curl -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 5
  }'
```

**Răspuns așteptat:**
```json
{
  "success": true,
  "fetched": 3,
  "message": "3 emails queued for processing"
}
```

**Ce se întâmplă:**
- Backend-ul se conectează la Gmail
- Citește ultimele 5 emailuri necitite
- Le adaugă în coada de procesare

#### 6.2. Verifică coada de emailuri

```bash
curl -X GET http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN"
```

**Răspuns așteptat:**
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
    },
    {
      "id": "28d5g3b2c4e7f8a9",
      "from": "supplier@ningbo-export.com",
      "subject": "B/L MEDUENT123456789",
      "date": "2025-12-17T09:15:00Z",
      "status": "PENDING"
    }
  ]
}
```

Poți vedea emailurile preluate din Gmail! ✅

---

### PASUL 7: Procesează emailurile cu AI (3 minute)

#### 7.1. Procesează coada cu Gemini AI

**IMPORTANT:** Asigură-te că ai `GEMINI_API_KEY` configurat în `backend/.env`

Dacă nu, obține-l de aici: https://makersuite.google.com/app/apikey

```bash
curl -X POST http://localhost:3001/api/admin/process-queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoCreate": true,
    "minConfidence": 80
  }'
```

**Răspuns așteptat:**
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
    },
    {
      "emailId": "28d5g3b2c4e7f8a9",
      "status": "SUCCESS",
      "bookingId": "BK-20251217-002",
      "extracted": {
        "containerNumber": "MAEU9876543",
        "blNumber": "BL987654321",
        "shippingLine": "Maersk",
        "portOrigin": "Ningbo",
        "portDestination": "Constanta",
        "confidence": 92
      }
    },
    {
      "emailId": "39e6h4c3d5f8g9b0",
      "status": "NEEDS_REVIEW",
      "extracted": {
        "confidence": 65
      }
    }
  ]
}
```

**Ce s-a întâmplat:**
- ✅ 2 emailuri au fost parsate cu succes (confidence > 80%)
- ✅ 2 booking-uri au fost create automat
- ⚠️ 1 email are confidence scăzută (65%) → necesită review manual

#### 7.2. Verifică booking-urile create

```bash
curl -X GET http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

Vei vedea booking-urile nou create cu datele extrase din emailuri! 🎉

---

## 🎯 Ce să verifici în Prisma Studio

Deschide interfața vizuală a bazei de date:

```bash
cd backend
npx prisma studio
```

Browser-ul va deschide http://localhost:5555

### Verifică tabelul `admin_settings`
Click pe **AdminSettings** în stânga:
- ✅ `gmailEmail` = adresa ta Gmail
- ✅ `gmailAccessToken` = token (lung, criptat)
- ✅ `gmailRefreshToken` = refresh token
- ✅ `gmailTokenExpiry` = dată în viitor
- ✅ `lastEmailFetchAt` = data ultimei sincronizări

### Verifică tabelul `email_queue`
Click pe **EmailQueue**:
- Vei vedea emailurile procesate
- Status: `PENDING`, `PROCESSED`, sau `FAILED`

### Verifică tabelul `bookings`
Click pe **Booking**:
- Vei vedea booking-urile create automat
- Cu `containerNumber`, `blNumber`, `portOrigin`, etc.

---

## ✅ Lista de Verificare (Checklist)

### Configurare Backend
- [ ] Migrare bază de date rulată (`npx prisma migrate dev`)
- [ ] Prisma client regenerat (`npx prisma generate`)
- [ ] Google Cloud OAuth credențiale create
- [ ] Gmail API activat în Google Cloud Console
- [ ] Variabile de mediu configurate în `backend/.env`
- [ ] Backend pornit (`npm run dev`)

### Testare OAuth
- [ ] Endpoint `/api/admin/gmail/auth` returnează authUrl
- [ ] AuthUrl deschis în browser
- [ ] Permisiuni Gmail acordate
- [ ] Callback salvează token-urile în baza de date
- [ ] Status endpoint arată `connected: true`

### Testare Preluare Emailuri
- [ ] Emailuri preluat din Gmail cu succes
- [ ] Emailuri adăugate în coadă (`email_queue`)
- [ ] Coada vizibilă prin endpoint `/api/admin/queue`

### Testare Procesare AI
- [ ] Gemini API key configurat
- [ ] Emailuri procesate cu AI
- [ ] Date extrase corect (container, B/L, porturi)
- [ ] Booking-uri create automat când confidence > 80%
- [ ] Emailuri cu confidence scăzută marcate pentru review

---

## 🐛 Probleme Comune și Soluții

### Eroare: "redirect_uri_mismatch"
**Cauză:** URI-ul de redirect nu coincide

**Soluție:**
1. Mergi în Google Cloud Console → Credentials
2. Editează OAuth client
3. Adaugă EXACT: `http://localhost:3001/api/admin/gmail/callback`
4. Salvează
5. Încearcă din nou

### Eroare: "Gmail OAuth not configured"
**Cauză:** Variabile de mediu lipsă

**Soluție:**
Verifică că în `backend/.env` ai:
```bash
GMAIL_CLIENT_ID="123..."
GMAIL_CLIENT_SECRET="GOCSPX-..."
```

### Eroare: Property 'gmailAccessToken' does not exist
**Cauză:** Prisma client nu e regenerat

**Soluție:**
```bash
cd backend
npx prisma generate
npm run dev
```

### Nu se preia niciun email (fetched: 0)
**Cauză:** Nu ai emailuri necitite sau filtrul nu se potrivește

**Soluție:**
Deschide `backend/src/integrations/gmail.integration.ts` (linia ~275):
```typescript
// Schimbă de la:
const query = encodeURIComponent('is:unread category:primary');

// La ceva mai specific pentru emailurile tale:
const query = encodeURIComponent('is:unread from:china');
// sau
const query = encodeURIComponent('is:unread subject:container');
```

---

## 📊 Verificare Finală - Ce ar trebui să funcționeze

După ce urmezi toți pașii, ar trebui să poți:

1. ✅ **Conecta Gmail** prin OAuth (o singură dată)
2. ✅ **Prelua automat emailuri** din inbox
3. ✅ **Extrage date** cu AI:
   - Număr container (ex: TEMU1234567)
   - B/L number
   - Companie shipping (MSC, Maersk, etc.)
   - Port origine (Shanghai, Ningbo)
   - Port destinație (Constanta)
   - ETD/ETA dates
4. ✅ **Crea booking-uri automat** când AI are confidence > 80%
5. ✅ **Marca emailuri pentru review** când confidence < 80%

---

## 🎉 Succes!

Dacă ai reușit să:
- Conectezi Gmail ✓
- Preluați emailuri ✓
- Procesați cu AI ✓
- Vezi booking-uri create ✓

**Felicitări! Integrarea funcționează perfect!** 🚀

---

## 📞 Ai nevoie de ajutor?

### Verifică:
1. **Backend logs:** În terminalul unde rulează `npm run dev`
2. **Baza de date:** Cu `npx prisma studio`
3. **Ghidul complet:** `GMAIL_OAUTH_TESTING_GUIDE.md`

### Comenzi utile pentru debugging:
```bash
# Verifică sănătatea serverului
curl http://localhost:3001/health

# Verifică status Gmail
curl http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"

# Vezi baza de date
cd backend && npx prisma studio
```

---

**Ultima actualizare:** 17 decembrie 2025  
**Status:** ✅ Gata de testare  
**Următorul pas:** Rulează PASUL 1 - Migrarea bazei de date
