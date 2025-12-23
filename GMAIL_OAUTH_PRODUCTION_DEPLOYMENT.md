# 🚀 Gmail OAuth - Deployment pe Server (Producție)

## 📌 Diferențe: Dezvoltare vs. Producție

### Dezvoltare (Local - localhost)
```bash
# backend/.env (LOCAL)
GMAIL_REDIRECT_URI="http://localhost:3001/api/admin/gmail/callback"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### Producție (Server Real)
```bash
# backend/.env (PRODUCȚIE)
GMAIL_REDIRECT_URI="https://api.promo-efect.com/api/admin/gmail/callback"
FRONTEND_URL="https://promo-efect.com"
NODE_ENV="production"
```

**⚠️ Observații importante:**
- ✅ `GMAIL_CLIENT_ID` și `GMAIL_CLIENT_SECRET` rămân **aceleași** pentru local și producție
- ⚠️ `GMAIL_REDIRECT_URI` trebuie **schimbat** - folosește domeniul real
- 🔒 Producția trebuie să folosească **HTTPS** (nu HTTP) pentru securitate

---

## 🔧 Pași pentru Deployment pe Server

### PASUL 1: Configurează Google Cloud Console pentru Producție

1. **Mergi pe:** https://console.cloud.google.com
2. **Du-te la:** APIs & Services → Credentials
3. **Editează** OAuth client-ul existent
4. **În secțiunea "Authorized redirect URIs"**, adaugă URI-ul de producție:

```
# PĂSTREAZĂ (pentru testare locală):


# ADAUGĂ NOU (pentru server):
https://api.promo-efect.com/api/admin/gmail/callback
```

**💡 Pro Tip:** Poți avea ambele URI-uri active simultan. Astfel poți testa local și pe server cu aceleași credențiale.

5. **Salvează** modificările

---

### PASUL 2: Actualizează .env pe Server

Pe serverul de producție, creează/editează `backend/.env`:

```bash
# ============================================
# PRODUCȚIE - Promo-Efect Backend
# ============================================

# Database (Supabase Production)
DATABASE_URL="postgresql://postgres.dwpccxakylakskzuybnl:LOZASUV6hHgoeEo8@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?schema=public&sslmode=require&pgbouncer=true"

# Server Configuration
PORT=3001
NODE_ENV=production

# Frontend URL (pentru CORS și redirects după OAuth)
FRONTEND_URL=https://promo-efect.com

# JWT Security (SCHIMBĂ în producție!)
JWT_SECRET="PUNE-UN-SECRET-FOARTE-SIGUR-AICI-GENERAT-RANDOM"
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# ============================================
# GMAIL OAUTH - PRODUCȚIE
# ============================================
GMAIL_CLIENT_ID="123456789-abc.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="GOCSPX-abcdefghijklmnop"
GMAIL_REDIRECT_URI="https://api.promo-efect.com/api/admin/gmail/callback"

# ============================================
# AI SERVICES
# ============================================
GEMINI_API_KEY="your-production-gemini-api-key"

# ============================================
# EMAIL & SMS (Opțional)
# ============================================
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="noreply@promo-efect.com"
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
```

**⚠️ IMPORTANT:**
- Schimbă `JWT_SECRET` cu un string random foarte lung (minim 32 caractere)
- Generează cu: `openssl rand -base64 32`
- **NU folosi același JWT_SECRET ca în dezvoltare!**

---

### PASUL 3: Verifică Configurarea Domeniului

Asigură-te că domeniul tău are:

1. **DNS Records configurate:**
   ```
   api.promo-efect.com  →  IP-ul serverului tău
   promo-efect.com      →  IP-ul serverului tău (sau CDN)
   ```

2. **SSL Certificate instalat (HTTPS):**
   - Folosește Let's Encrypt (gratuit)
   - Sau certificat de la provider-ul de hosting
   - **OBLIGATORIU pentru OAuth în producție!**

3. **Backend accesibil pe:**
   ```
   https://api.promo-efect.com:3001
   # sau
   https://api.promo-efect.com  (dacă folosești reverse proxy)
   ```

---

### PASUL 4: Actualizează Callback-ul OAuth în Frontend

Dacă ai UI de conectare Gmail în frontend, asigură-te că folosește URL-ul corect:

```typescript
// components/AdminSettingsPage.tsx

const handleConnectGmail = async () => {
  try {
    const response = await api.get('/admin/gmail/auth');
    
    // Backend-ul va returna authUrl-ul corect automat
    // (folosind GMAIL_REDIRECT_URI din .env)
    window.location.href = response.data.authUrl;
  } catch (error) {
    console.error('Failed to initiate Gmail auth');
  }
};
```

**Nu trebuie să schimbi nimic în cod!** Backend-ul folosește automat `GMAIL_REDIRECT_URI` din `.env`.

---

### PASUL 5: Testează OAuth pe Server

După deployment:

1. **Accesează aplicația** pe domeniul de producție:
   ```
   https://promo-efect.com
   ```

2. **Login ca admin** în frontend

3. **Mergi la Admin Settings**

4. **Click "Connect Gmail"**

5. **Verifică flow-ul:**
   - Redirectează la Google OAuth ✓
   - După autorizare, redirectează la: `https://api.promo-efect.com/api/admin/gmail/callback` ✓
   - Apoi redirectează înapoi la frontend: `https://promo-efect.com` ✓
   - Status arată "Connected" ✓

6. **Testează fetch-ul de emailuri:**
   - Click "Fetch Emails"
   - Verifică că emailurile sunt preluat
   - Verifică că booking-urile sunt create

---

## 🔍 Verificare Rapidă - Producție

### Test 1: Health Check
```bash
curl https://api.promo-efect.com/health
```

**Răspuns așteptat:**
```json
{
  "status": "UP",
  "timestamp": "2025-12-17T..."
}
```

### Test 2: Gmail Status (cu token JWT)
```bash
curl https://api.promo-efect.com/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Verifică în Browser
1. Deschide: https://promo-efect.com
2. Login ca admin
3. Mergi la Admin Settings
4. Click "Connect Gmail"
5. Ar trebui să meargă fără erori!

---

## 🐛 Probleme Comune în Producție

### ❌ Eroare: "redirect_uri_mismatch"
**Cauză:** URI-ul din Google Cloud Console nu coincide cu cel din `.env`

**Soluție:**
1. Verifică în Google Cloud Console că ai adăugat EXACT:
   ```
   https://api.promo-efect.com/api/admin/gmail/callback
   ```
2. Verifică în `backend/.env` că ai:
   ```bash
   GMAIL_REDIRECT_URI="https://api.promo-efect.com/api/admin/gmail/callback"
   ```
3. **Atenție:** HTTP vs HTTPS face diferență!
4. **Atenție:** Slash-ul final (`/`) face diferență!

### ❌ Eroare: "SSL Certificate Error"
**Cauză:** HTTPS nu este configurat corect pe server

**Soluție:**
1. Instalează certificat SSL (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d api.promo-efect.com
   ```
2. Verifică că backend-ul rulează cu HTTPS
3. OAuth **NU funcționează** fără HTTPS în producție

### ❌ Eroare: "CORS blocked"
**Cauză:** Frontend-ul nu are permisiune să acceseze backend-ul

**Soluție:**
Verifică în `backend/src/app.ts` că `FRONTEND_URL` este în lista de origini permise:
```typescript
cors({
  origin: [
    process.env.FRONTEND_URL,  // https://promo-efect.com
    'http://localhost:5173',   // pentru dezvoltare
  ],
  credentials: true,
})
```

### ❌ Eroare: "Cannot connect to database"
**Cauză:** DATABASE_URL incorect sau firewall

**Soluție:**
1. Verifică că `DATABASE_URL` din `.env` este cel de producție
2. Verifică că serverul are acces la Supabase (firewall permisiv)
3. Testează conexiunea:
   ```bash
   cd backend
   npx prisma db pull
   ```

---

## 🔒 Securitate în Producție

### ✅ Checklist Securitate

- [ ] **HTTPS activat** pe tot site-ul (nu HTTP)
- [ ] **JWT_SECRET diferit** față de dezvoltare (random, lung)
- [ ] **Credențiale Gmail** (Client ID/Secret) **nu sunt** în cod - doar în `.env`
- [ ] **Fișierul .env** **nu este** în git (verifică `.gitignore`)
- [ ] **Token-urile Gmail** stocate în baza de date (nu în memorie/cache)
- [ ] **Rate limiting** activat pentru API endpoints
- [ ] **Firewall** configurat pe server (doar porturile necesare deschise)

### 🔐 Best Practices

1. **Nu commita niciodată .env în git!**
   ```bash
   # Verifică .gitignore
   echo "*.env" >> .gitignore
   echo ".env.local" >> .gitignore
   echo ".env.production" >> .gitignore
   ```

2. **Folosește variabile de mediu pe server:**
   - Heroku: `heroku config:set GMAIL_CLIENT_ID=...`
   - AWS: Systems Manager Parameter Store
   - Docker: Docker secrets

3. **Monitorizează accesul:**
   - Log-uri pentru OAuth events
   - Alert pentru failed login attempts
   - Track email fetch frequency

---

## 📊 Monitorizare în Producție

### Logs să verifici

```bash
# Pe server
tail -f /var/log/promo-efect-backend.log

# Căutați:
✓ Gmail tokens saved to database
✓ Fetched X emails
✓ Created booking: BK-20251217-001
❌ Gmail OAuth failed: ...
```

### Metrici de urmărit

```sql
-- Verifică OAuth tokens în baza de date
SELECT gmailEmail, gmailTokenExpiry, lastEmailFetchAt 
FROM admin_settings;

-- Verifică emailuri procesate
SELECT status, COUNT(*) 
FROM email_queue 
GROUP BY status;

-- Verifică booking-uri create automat
SELECT COUNT(*) 
FROM bookings 
WHERE status = 'EMAIL_PARSED' 
  AND createdAt > NOW() - INTERVAL '7 days';
```

---

## 🔄 Update la nouă versiune

Când faci update la cod:

```bash
# Pe server
cd /path/to/promo-effect/backend

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Restart backend
pm2 restart promo-effect-backend
# sau
systemctl restart promo-effect-backend
```

**NU trebuie să reconectezi Gmail!** Token-urile rămân în baza de date.

---

## ✅ Deployment Checklist

### Înainte de Deployment
- [ ] Cod testat local
- [ ] Migrări de bază de date rulate
- [ ] Credențiale Google Cloud configurate (ambele URI-uri)
- [ ] SSL certificate instalat pe server
- [ ] DNS records configurate
- [ ] `.env` pentru producție pregătit

### După Deployment
- [ ] Backend pornit și accesibil
- [ ] Health check funcționează
- [ ] OAuth flow testat end-to-end
- [ ] Fetch emails funcționează
- [ ] Procesare AI funcționează
- [ ] Booking-uri create automat
- [ ] Logs monitorizate
- [ ] Backup automatizat pentru baza de date

---

## 🎯 Rezultat Final

După deployment corect, sistemul va:

1. ✅ Rula pe domeniul de producție (HTTPS)
2. ✅ Conecta securizat la Gmail via OAuth
3. ✅ Prelua automat emailuri la fiecare 15 minute
4. ✅ Procesa cu AI și crea booking-uri
5. ✅ Economisi 10+ ore/săptămână pentru Ion
6. ✅ Funcționa 24/7 fără intervenție manuală

---

## 📞 Need Help?

### Resurse
- **Ghid testare:** `VERIFICARE_GMAIL_OAUTH_RO.md`
- **Quick start:** `GMAIL_OAUTH_QUICKSTART.md`
- **Status tehnic:** `IMPLEMENTATION_STATUS.md`

### Debugging
```bash
# Health check
curl https://api.promo-efect.com/health

# Gmail status
curl https://api.promo-efect.com/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"

# Database
cd backend && npx prisma studio
```

---

**Ultima actualizare:** 17 decembrie 2025  
**Status:** ✅ Ready for Production  
**Next:** Deploy pe server și testează OAuth flow!
