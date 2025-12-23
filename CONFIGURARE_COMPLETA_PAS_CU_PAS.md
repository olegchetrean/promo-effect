# 🚀 Configurare Completă Gmail OAuth - Pas cu Pas (De la Zero)

## 📋 Ce vom face împreună

Vom configura integrarea Gmail OAuth în **7 pași simpli**. Eu te ghidez, tu îmi dai datele când ajungem la fiecare pas.

**Estimare timp total:** 15-20 minute

---

## ✅ PASUL 1: Verificare Mediu de Lucru

### 1.1. Verifică că ai Node.js și npm instalate

Deschide terminal și rulează:

```bash
node --version
npm --version
```

**Ce ar trebui să vezi:**
```
v18.x.x  (sau mai nou)
9.x.x    (sau mai nou)
```

✅ **Dacă vezi versiuni** → Merge perfect, trecem la pasul următor!  
❌ **Dacă nu** → Instalează Node.js de aici: https://nodejs.org/

---

### 1.2. Verifică structura proiectului

```bash
cd /Users/megapromotingholding/Documents/promo-effect
ls -la
```

**Ar trebui să vezi:**
```
backend/          ← folder backend
components/       ← folder frontend
package.json      ← configurare frontend
README.md
```

✅ **Dacă vezi aceste foldere** → Perfect!  
❌ **Dacă nu** → Verifică că ești în folderul corect

---

### 1.3. Verifică că backend-ul are fișierele necesare

```bash
ls -la backend/
```

**Ar trebui să vezi:**
```
src/
prisma/
package.json
.env              ← fișierul unde vom pune credențialele
```

✅ **Gata cu verificarea!** Trecem la configurare.

---

## 🗄️ PASUL 2: Configurare Bază de Date

### 2.1. Rulează migrarea bazei de date

Deschide terminal și rulează:

```bash
cd /Users/megapromotingholding/Documents/promo-effect/backend
npx prisma migrate dev --name add-gmail-oauth-fields
```

**Ce va face:**
- Va adăuga câmpuri noi în tabelul `admin_settings` pentru Gmail OAuth
- Va crea tabelele necesare dacă nu există

**Așteptăm împreună să se termine...**

**Întrebări posibile pe care le va pune Prisma:**
- "Would you like to create the database?" → Răspunde `y` (yes)
- "Do you want to continue?" → Răspunde `y` (yes)

**Rezultat așteptat:**
```
✔ Applying migration `add-gmail-oauth-fields`
✔ Generated Prisma Client
```

✅ **Dacă vezi asta** → Migrarea a reușit!

---

### 2.2. Regenerează Prisma Client

```bash
npx prisma generate
```

**Rezultat așteptat:**
```
✔ Generated Prisma Client
```

---

### 2.3. Verifică migrarea în Prisma Studio (opțional)

```bash
npx prisma studio
```

Browser-ul va deschide http://localhost:5555

**Click pe `AdminSettings`** în stânga → Ar trebui să vezi coloane noi:
- `gmailAccessToken`
- `gmailRefreshToken`
- `gmailTokenExpiry`
- `gmailEmail`
- `lastEmailFetchAt`

✅ **Dacă le vezi** → Perfect! Închide Prisma Studio (Ctrl+C în terminal)

---

## 🔐 PASUL 3: Configurare Google Cloud Console

**Acum mergem pe Google Cloud pentru a obține credențialele.**

### 3.1. Deschide Google Cloud Console

**Link:** https://console.cloud.google.com

👉 **Loghează-te cu contul Google al companiei** (sau contul tău personal pentru testare)

---

### 3.2. Creează/Selectează un Proiect

**În partea de sus (lângă logo Google Cloud)** → Click pe dropdown-ul de proiecte

**Opțiunea A - Proiect Nou:**
1. Click **"NEW PROJECT"**
2. Project name: `Promo-Efect-Logistics`
3. Organization: Lasă default (sau selectează organizația ta)
4. Click **"CREATE"**
5. **Așteaptă 10-15 secunde** până se creează proiectul
6. Click **"SELECT PROJECT"** când apare

**Opțiunea B - Proiect Existent:**
1. Selectează proiectul existent din listă
2. Click pe el

✅ **Verifică:** Sus în stânga ar trebui să scrie numele proiectului tău

---

### 3.3. Activează Gmail API

1. În meniul din stânga → Click **"APIs & Services"**
2. Click **"Library"** (sau "Bibliotecă")
3. În bara de căutare → Scrie: `Gmail API`
4. Click pe **"Gmail API"** (primul rezultat)
5. Click butonul albastru **"ENABLE"** (sau "ACTIVEAZĂ")
6. **Așteaptă 5-10 secunde** să se activeze

✅ **Verifică:** Ar trebui să vezi "API enabled" și butoane pentru configurare

---

### 3.4. Configurează OAuth Consent Screen (Ecran de Consimțământ)

**Înainte să creezi credențiale, trebuie să configurezi ecranul de consimțământ.**

1. În meniul din stânga → **APIs & Services** → **OAuth consent screen**
2. Selectează **"External"** (sau "Internal" dacă ai Google Workspace)
3. Click **"CREATE"**

**Completează formularul:**

**App information:**
- App name: `Promo-Efect Email Integration`
- User support email: `emailul.tau@gmail.com` **← SPUNE-MI EMAILUL TĂU**
- App logo: (opțional, poți sări)

**App domain (opțional pentru testare):**
- Application home page: `https://promo-efect.com` (sau lasă gol)
- Application privacy policy link: (lasă gol pentru testare)
- Application terms of service link: (lasă gol pentru testare)

**Developer contact information:**
- Email addresses: `emailul.tau@gmail.com` **← ACELAȘI EMAIL**

4. Click **"SAVE AND CONTINUE"**

**Scopes (Permisiuni):**
1. Click **"ADD OR REMOVE SCOPES"**
2. Caută și selectează:
   - ✅ `Gmail API` → `.../auth/gmail.readonly` (Read emails)
   - ✅ `Gmail API` → `.../auth/gmail.modify` (Modify emails)
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

**Test users (Utilizatori de test):**
1. Click **"+ ADD USERS"**
2. Adaugă emailul tău: `emailul.tau@gmail.com` **← EMAILUL GMAIL PE CARE-L VEI CONECTA**
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

**Summary:**
5. Click **"BACK TO DASHBOARD"**

✅ **Gata cu OAuth Consent Screen!**

---

### 3.5. Creează Credențiale OAuth 2.0

1. În meniul din stânga → **APIs & Services** → **Credentials**
2. Click butonul **"+ CREATE CREDENTIALS"** (sus)
3. Selectează **"OAuth client ID"**

**Configurare OAuth client:**

**Application type:**
- Selectează: **"Web application"**

**Name:**
- Nume: `Promo-Efect Backend OAuth`

**Authorized JavaScript origins (opțional):**
- Lasă gol pentru moment

**Authorized redirect URIs:**
- Click **"+ ADD URI"**
- Adaugă: `http://localhost:3001/api/admin/gmail/callback`

**Dacă știi deja domeniul de producție:**
- Click **"+ ADD URI"** din nou
- Adaugă: `https://api.promo-efect.com/api/admin/gmail/callback` **← SAU DOMENIUL TĂU REAL**

4. Click **"CREATE"**

---

### 3.6. Salvează Credențialele

**Va apărea un popup cu credențialele tale:**

```
OAuth client created

Your Client ID
123456789-abcdefghijklmnop.apps.googleusercontent.com

Your Client Secret
GOCSPX-Xxyz1234567890abcdef
```

**‼️ NU ÎNCHIDE POPUP-UL ÎNCĂ!**

**📋 COPIAZĂ ȘI PĂSTREAZĂ URMĂTOARELE:**

```
✅ PASUL 3.6 COMPLETAT - TRIMITE-MI ACESTE DATE:

Client ID: 
[PASTE AICI CLIENT ID-UL TĂU]

Client Secret: 
[PASTE AICI CLIENT SECRET-UL TĂU]
```

**După ce mi le trimiți, poți închide popup-ul.**

✅ **Poți descărca JSON-ul** (opțional) prin click pe **"DOWNLOAD JSON"** pentru backup

---

## ⚙️ PASUL 4: Configurare Backend .env

**Acum vom pune credențialele în fișierul de configurare.**

### 4.1. Deschide fișierul .env

```bash
cd /Users/megapromotingholding/Documents/promo-effect/backend
```

**Deschide fișierul `backend/.env` în VS Code sau orice editor.**

---

### 4.2. Verifică ce ai deja în .env

Ar trebui să ai deja:
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="..."
PORT=3001
FRONTEND_URL=http://localhost:5173
```

✅ **Lasă totul așa cum este!** Nu șterge nimic.

---

### 4.3. Adaugă configurația Gmail OAuth

**La SFÂRȘITUL fișierului .env**, adaugă:

```bash
# ============================================
# GMAIL OAUTH INTEGRATION
# ============================================
GMAIL_CLIENT_ID="PUNE-CLIENT-ID-UL-TAU-AICI"
GMAIL_CLIENT_SECRET="PUNE-CLIENT-SECRET-UL-TAU-AICI"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

---

### 4.4. Înlocuiește credențialele

**📋 TRIMITE-MI DATELE ȘI ÎȚI SPUN EXACT CE SĂ PUI:**

După ce îmi dai Client ID și Client Secret de la Pasul 3.6, îți voi da fișierul .env complet cu datele tale.

**EXEMPLU (nu folosi asta, sunt date fake):**
```bash
GMAIL_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-Xxyz1234567890abcdef"
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
```

---

### 4.5. Verifică configurația Gemini API (pentru AI parsing)

**În același fișier .env**, verifică dacă ai:

```bash
GEMINI_API_KEY="..."
```

**❓ AI DEJA GEMINI_API_KEY CONFIGURAT?**
- ✅ DA → Perfect, lasă-l așa
- ❌ NU → Trebuie să obținem unul

**Dacă NU ai Gemini API Key:**

1. Mergi pe: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"**
3. Selectează proiectul tău (sau creează unul nou)
4. Click **"Create API Key in existing project"**
5. **Copiază API Key-ul**

```bash
GEMINI_API_KEY="AI...xyz" 
```

**📋 TRIMITE-MI ȘI GEMINI_API_KEY DACĂ L-AI CREAT:**

```
Gemini API Key: 
[PASTE AICI]
```

---

### 4.6. Salvează fișierul .env

**⌘ + S** (Mac) sau **Ctrl + S** (Windows/Linux)

✅ **Fișierul .env este gata!**

---

## 🚀 PASUL 5: Pornire Backend

### 5.1. Instalează dependențele (dacă nu sunt deja)

```bash
cd /Users/megapromotingholding/Documents/promo-effect/backend
npm install
```

**Așteaptă 30-60 secunde...**

---

### 5.2. Pornește backend-ul

```bash
npm run dev
```

**Rezultat așteptat:**
```
✓ Server running on port 3001
✓ Database connected
✓ Prisma Client loaded
```

✅ **Dacă vezi asta** → Backend-ul rulează perfect!  
❌ **Dacă vezi erori** → Spune-mi ce eroare vezi și o rezolvăm

**🚨 IMPORTANT: LASĂ ACEST TERMINAL DESCHIS! Nu închide serverul.**

---

## 🧪 PASUL 6: Testare OAuth Flow

**Acum testăm dacă totul funcționează!**

### 6.1. Deschide un TERMINAL NOU (lasă backend-ul să ruleze)

**În VS Code:** Terminal → New Terminal  
**Sau:** Deschide o nouă fereastră de terminal

---

### 6.2. Testează health check

```bash
curl http://localhost:3001/health
```

**Rezultat așteptat:**
```json
{
  "status": "UP",
  "timestamp": "2025-12-17T..."
}
```

✅ **Backend-ul e activ!**

---

### 6.3. Login ca admin pentru a obține token JWT

**❓ AI DEJA UN USER ADMIN ÎN BAZA DE DATE?**

**Dacă DA:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@promo-efect.com",
    "password": "parola-ta-de-admin"
  }'
```

**📋 SPUNE-MI:**
```
Email admin: [EMAILUL TĂU DE ADMIN]
Parola: [PAROLA]
```

**Dacă NU (trebuie să creezi admin):**
Îți voi ajuta să creezi un user admin în baza de date.

---

### 6.4. Salvează token-ul JWT

După login, vei primi un răspuns JSON cu un `token`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI...",
  "user": { ... }
}
```

**Copiază token-ul** și salvează-l într-o variabilă:

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**SAU mai simplu (macOS/Linux):**

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@promo-efect.com","password":"parola"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token salvat: $TOKEN"
```

---

### 6.5. Verifică status Gmail (ar trebui să fie deconectat încă)

```bash
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Rezultat așteptat (prima dată):**
```json
{
  "connected": false
}
```

✅ **Perfect! Sistemul funcționează, dar Gmail nu e conectat încă.**

---

### 6.6. Obține link-ul de autentificare Gmail

```bash
curl -X GET http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"
```

**Rezultat așteptat:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...",
  "message": "Redirect user to this URL to authorize Gmail access"
}
```

**📋 COPIAZĂ LINK-UL `authUrl`**

---

### 6.7. Conectează Gmail prin browser

1. **Copiază întreg URL-ul** din `authUrl`
2. **Deschide-l într-un browser** (Chrome, Safari, etc.)
3. **Loghează-te cu contul Gmail** pe care vrei să-l conectezi
4. **Google va cere permisiuni:**
   - ✅ "Read your email messages and settings"
   - ✅ "Manage your email"
5. **Click "Allow"** / **"Permite"**

**Browser-ul va redirecta către:**
```
http://localhost:3001/api/admin/gmail/callback?code=4/0AY0e-g7...
```

**Vei vedea un răspuns JSON:**
```json
{
  "success": true,
  "message": "Gmail connected successfully!",
  "expiresAt": "2025-12-18T10:30:00Z"
}
```

✅ **SUCCES! Gmail este conectat!**

---

### 6.8. Verifică din nou status-ul Gmail

```bash
curl -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

**Rezultat așteptat (ACUM conectat):**
```json
{
  "connected": true,
  "email": "ion@promo-efect.com",
  "tokenExpiry": "2025-12-18T10:30:00Z",
  "lastFetch": null
}
```

🎉 **FELICITĂRI! OAuth funcționează perfect!**

---

## 📧 PASUL 7: Testare Preluare și Procesare Emailuri

### 7.1. Preia emailuri din Gmail

```bash
curl -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 5
  }'
```

**Rezultat așteptat:**
```json
{
  "success": true,
  "fetched": 3,
  "message": "3 emails queued for processing"
}
```

✅ **Emailurile au fost preluat din Gmail!**

---

### 7.2. Verifică coada de emailuri

```bash
curl -X GET http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN"
```

**Rezultat așteptat:**
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

✅ **Emailurile sunt în coadă, gata de procesare!**

---

### 7.3. Procesează emailurile cu AI (Gemini)

```bash
curl -X POST http://localhost:3001/api/admin/process-queue \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "autoCreate": true,
    "minConfidence": 80
  }'
```

**Rezultat așteptat:**
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

🎉 **BOOKING-URI CREATE AUTOMAT DIN EMAILURI!**

---

### 7.4. Verifică booking-urile create

```bash
curl -X GET http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

**Ar trebui să vezi booking-urile noi cu datele extrase din emailuri!**

---

## ✅ CHECKLIST FINAL

### Configurare completă:
- [ ] Node.js și npm instalate
- [ ] Migrare bază de date rulată (`prisma migrate dev`)
- [ ] Prisma client regenerat (`prisma generate`)
- [ ] Google Cloud Console configurat
- [ ] Gmail API activat
- [ ] OAuth Consent Screen configurat
- [ ] OAuth credentials create
- [ ] Fișierul `.env` actualizat cu credențiale
- [ ] Gemini API key configurat (pentru AI)
- [ ] Backend pornit (`npm run dev`)

### Testare completă:
- [ ] Health check funcționează
- [ ] Login admin funcționează
- [ ] Gmail OAuth flow funcționează
- [ ] Gmail status arată "connected"
- [ ] Emailuri preluat din Gmail
- [ ] Emailuri în coadă de procesare
- [ ] AI parsează emailurile
- [ ] Booking-uri create automat

---

## 🎯 CE URMEAZĂ?

### 1. **Adaugă UI în Frontend** (opțional)
Vezi codul în `VERIFICARE_GMAIL_OAUTH_RO.md` - secțiunea despre frontend

### 2. **Automatizare** (opțional)
Set up cron job pentru fetch automat la fiecare 15 minute

### 3. **Production Deployment** (când ești gata)
Citește `GMAIL_OAUTH_PRODUCTION_DEPLOYMENT.md`

---

## 🆘 DACĂ ÎNTÂMPINI PROBLEME

### ❌ Eroare la migrare Prisma
**Soluție:** Verifică că `DATABASE_URL` din `.env` este corect

### ❌ "redirect_uri_mismatch"
**Soluție:** Verifică că ai adăugat EXACT `http://localhost:3001/api/admin/gmail/callback` în Google Cloud Console

### ❌ "Gmail OAuth not configured"
**Soluție:** Verifică că `GMAIL_CLIENT_ID` și `GMAIL_CLIENT_SECRET` sunt în `.env`

### ❌ Backend nu pornește
**Soluție:** Rulează `npm install` din nou în folderul `backend/`

### ❌ Nu se preia niciun email
**Soluție:** Verifică că ai emailuri necitite în Gmail

---

## 📞 GATA SĂ ÎNCEPEM?

**Începem cu PASUL 1!**

Rulează comenzile din PASUL 1 și spune-mi ce vezi. Apoi mergem mai departe pas cu pas! 🚀

**Sau dacă ai deja datele pregătite, trimite-mi:**
1. Client ID de la Google Cloud
2. Client Secret de la Google Cloud
3. Gemini API Key (dacă ai)
4. Email și parolă de admin (pentru testare)

**Și configurăm totul împreună!** 😊
