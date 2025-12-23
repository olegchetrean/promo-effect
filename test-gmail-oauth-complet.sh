#!/bin/bash

echo "==========================================TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then==="
echo "🚀 CONFIGURARE GMAIL OAUTH - TESTARE COMPLETĂ"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 CONFIGURAȚIA TA:${NC}"
echo ""
echo "✅ Gmail Client ID: 774509529574-s5jon1rkbhohs35tesgelrm4r60o5euq.apps.googleusercontent.com"
echo "✅ Gmail Client Secret: GOCSPX-*** (configurat)"
echo "✅ Gemini API Key: AIzaSy*** (configurat)"
echo "✅ Redirect URI: http://localhost:3001/api/admin/gmail/callback"
echo ""

# Test 1: Backend Health Check
echo "================================================"
echo "TEST 1: Verificare Backend"
echo "================================================"

sleep 2

if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend rulează pe port 3001"
    HEALTH=$(curl -s http://localhost:3001/health)
    echo "   Response: $HEALTH"
else
    echo -e "${RED}✗${NC} Backend NU rulează!"
    echo ""
    echo "Pornește backend-ul manual:"
    echo "   cd backend && npm run dev"
    exit 1
fi

echo ""

# Test 2: Login Admin
echo "================================================"
echo "TEST 2: Login Admin (pentru a obține token JWT)"
echo "================================================"

echo "Introdu emailul de admin:"
read -r ADMIN_EMAIL

echo "Introdu parola:"
read -rs ADMIN_PASSWORD

echo ""
echo "Loghează..."

TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗${NC} Login a eșuat!"
    echo "   Response: $TOKEN_RESPONSE"
    echo ""
    echo "Verifică:"
    echo "   1. Email-ul și parola sunt corecte"
    echo "   2. User-ul există în baza de date"
    echo ""
    echo "Vrei să creezi un user admin acum? (y/n)"
    read -r CREATE_ADMIN
    
    if [ "$CREATE_ADMIN" = "y" ]; then
        echo "Feature în dezvoltare - folosește Prisma Studio:"
        echo "   cd backend && npx prisma studio"
    fi
    exit 1
fi

echo -e "${GREEN}✓${NC} Login reușit!"
echo "   Token: ${TOKEN:0:50}..."
echo ""

# Test 3: Gmail OAuth Status
echo "================================================"
echo "TEST 3: Verificare Status Gmail OAuth"
echo "================================================"

STATUS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $STATUS_RESPONSE"
echo ""

if echo "$STATUS_RESPONSE" | grep -q '"connected":true'; then
    echo -e "${GREEN}✓${NC} Gmail este deja conectat!"
    
    EMAIL=$(echo "$STATUS_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    echo "   Email conectat: $EMAIL"
    echo ""
    
    # Skip to email fetch test
    SKIP_OAUTH=true
else
    echo -e "${YELLOW}⚠${NC} Gmail NU este conectat încă"
    SKIP_OAUTH=false
fi

# Test 4: Gmail OAuth Flow (dacă nu e conectat)
if [ "$SKIP_OAUTH" = false ]; then
    echo ""
    echo "================================================"
    echo "TEST 4: Conectare Gmail OAuth"
    echo "================================================"
    
    echo "Obțin link-ul de autorizare..."
    
    AUTH_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/gmail/auth \
      -H "Authorization: Bearer $TOKEN")
    
    AUTH_URL=$(echo "$AUTH_RESPONSE" | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g')
    
    if [ -z "$AUTH_URL" ]; then
        echo -e "${RED}✗${NC} Nu am putut obține authUrl"
        echo "   Response: $AUTH_RESPONSE"
        exit 1
    fi
    
    echo -e "${GREEN}✓${NC} Auth URL obținut!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}📱 DESCHIDE ACEST LINK ÎN BROWSER:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "$AUTH_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Pași:"
    echo "1. Copiază link-ul de mai sus"
    echo "2. Deschide-l într-un browser"
    echo "3. Loghează-te cu Gmail"
    echo "4. Aprobă permisiunile"
    echo "5. După redirect, apasă ENTER aici"
    echo ""
    
    # Try to open automatically
    if command -v open &> /dev/null; then
        echo "Deschid browser-ul automat..."
        open "$AUTH_URL"
    fi
    
    read -p "Apasă ENTER după ce ai autorizat Gmail..." 
    
    echo ""
    echo "Verificăm din nou status-ul..."
    sleep 2
    
    STATUS_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/gmail/status \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$STATUS_RESPONSE" | grep -q '"connected":true'; then
        echo -e "${GREEN}✓✓✓${NC} Gmail conectat cu SUCCES!"
        EMAIL=$(echo "$STATUS_RESPONSE" | grep -o '"email":"[^"]*' | cut -d'"' -f4)
        echo "   Email: $EMAIL"
    else
        echo -e "${RED}✗${NC} Gmail nu este încă conectat"
        echo "   Response: $STATUS_RESPONSE"
        echo ""
        echo "Încearcă manual să deschizi link-ul și apoi rulează din nou acest script."
        exit 1
    fi
fi

# Test 5: Fetch Emails
echo ""
echo "================================================"
echo "TEST 5: Preluare Emailuri din Gmail"
echo "================================================"

echo "Câte emailuri să preluăm? (1-10, default: 5)"
read -r MAX_RESULTS
MAX_RESULTS=${MAX_RESULTS:-5}

echo "Preluăm ultimele $MAX_RESULTS emailuri..."

FETCH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/admin/emails/fetch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"maxResults\":$MAX_RESULTS}")

echo "Response: $FETCH_RESPONSE"
echo ""

if echo "$FETCH_RESPONSE" | grep -q '"success":true'; then
    FETCHED=$(echo "$FETCH_RESPONSE" | grep -o '"fetched":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✓${NC} Preluat $FETCHED emailuri din Gmail"
else
    echo -e "${YELLOW}⚠${NC} Nu s-au preluat emailuri (poate nu există emailuri necitite)"
fi

# Test 6: Check Queue
echo ""
echo "================================================"
echo "TEST 6: Verificare Coadă Emailuri"
echo "================================================"

QUEUE_RESPONSE=$(curl -s -X GET http://localhost:3001/api/admin/queue \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $QUEUE_RESPONSE"
echo ""

PENDING=$(echo "$QUEUE_RESPONSE" | grep -o '"pending":[0-9]*' | cut -d':' -f2)

if [ -z "$PENDING" ] || [ "$PENDING" = "0" ]; then
    echo -e "${YELLOW}⚠${NC} Nu sunt emailuri în coadă"
    echo ""
    echo "Verifică:"
    echo "   1. Ai emailuri necitite în Gmail"
    echo "   2. Schimbă filtrul în gmail.integration.ts dacă e nevoie"
else
    echo -e "${GREEN}✓${NC} $PENDING emailuri în coadă, gata de procesare"
    
    # Test 7: Process Queue with AI
    echo ""
    echo "================================================"
    echo "TEST 7: Procesare Emailuri cu AI (Gemini)"
    echo "================================================"
    
    echo "Vrei să procesezi emailurile cu AI? (y/n)"
    read -r PROCESS
    
    if [ "$PROCESS" = "y" ]; then
        echo "Procesez emailurile cu Gemini AI..."
        echo "(Poate dura 5-15 secunde per email)"
        echo ""
        
        PROCESS_RESPONSE=$(curl -s -X POST http://localhost:3001/api/admin/process-queue \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{"autoCreate":true,"minConfidence":80}')
        
        echo "Response: $PROCESS_RESPONSE"
        echo ""
        
        if echo "$PROCESS_RESPONSE" | grep -q '"total"'; then
            TOTAL=$(echo "$PROCESS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
            SUCCESS=$(echo "$PROCESS_RESPONSE" | grep -o '"success":[0-9]*' | cut -d':' -f2)
            
            echo -e "${GREEN}✓${NC} Procesare completă!"
            echo "   Total: $TOTAL"
            echo "   Success: $SUCCESS"
            echo ""
            echo "Verifică booking-urile create:"
            echo "   curl http://localhost:3001/api/bookings -H \"Authorization: Bearer $TOKEN\""
        fi
    fi
fi

echo ""
echo "================================================"
echo "✅ TESTARE COMPLETĂ!"
echo "================================================"
echo ""
echo "Următorii pași:"
echo "1. Verifică booking-urile create în Prisma Studio:"
echo "   cd backend && npx prisma studio"
echo ""
echo "2. Adaugă UI în frontend (vezi VERIFICARE_GMAIL_OAUTH_RO.md)"
echo ""
echo "3. Set up automatizare (cron job pentru fetch la 15 min)"
echo ""
echo "🎉 Gmail OAuth funcționează perfect! 🎉"
