#!/bin/bash

echo "🚀 PORNIRE BACKEND ȘI TESTARE GMAIL OAUTH"
echo "=========================================="
echo ""

# Verifică dacă backend rulează
echo "🔍 Verificare backend..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend rulează deja!"
else
    echo "⚠️  Backend nu rulează. Trebuie să-l pornești manual!"
    echo ""
    echo "📝 Deschide un terminal NOU și rulează:"
    echo "   cd /Users/megapromotingholding/Documents/promo-effect/backend"
    echo "   npm run dev"
    echo ""
    echo "⏳ Apoi revino aici și apasă Enter..."
    read -p ""
fi

echo ""
echo "🔐 AUTENTIFICARE ADMIN"
echo "======================"
echo ""

# Email și parolă
EMAIL="albertfgh22@gmail.com"
PASSWORD="parolatare"

echo "📧 Email: $EMAIL"
echo "🔑 Parolă: ********"
echo ""
echo "⏳ Autentificare..."

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Autentificare eșuată!"
    echo "Răspuns: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Autentificat cu succes!"
echo ""

# Verifică status Gmail
echo "📬 VERIFICARE STATUS GMAIL"
echo "=========================="
echo ""

STATUS_RESPONSE=$(curl -s http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN")

echo "$STATUS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STATUS_RESPONSE"
echo ""

IS_CONNECTED=$(echo $STATUS_RESPONSE | grep -o '"connected":[^,}]*' | cut -d':' -f2)

if [ "$IS_CONNECTED" = "true" ]; then
    echo "✅ Gmail este conectat!"
    GMAIL_EMAIL=$(echo $STATUS_RESPONSE | grep -o '"email":"[^"]*' | cut -d'"' -f4)
    echo "📧 Gmail: $GMAIL_EMAIL"
    echo ""
    
    # Fetch emails
    echo "📥 DESCĂRCARE EMAILURI"
    echo "======================"
    echo ""
    read -p "Câte emailuri să descarc? (implicit: 5): " EMAIL_COUNT
    EMAIL_COUNT=${EMAIL_COUNT:-5}
    
    echo "⏳ Descarc ultimele $EMAIL_COUNT emailuri..."
    
    FETCH_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/admin/emails/fetch" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"maxResults\": $EMAIL_COUNT}")
    
    echo "$FETCH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FETCH_RESPONSE"
    
else
    echo "⚠️  Gmail NU este conectat!"
    echo ""
    echo "🔗 OBȚINERE URL OAUTH"
    echo "====================="
    echo ""
    
    AUTH_URL=$(curl -s http://localhost:3001/api/admin/gmail/auth \
      -H "Authorization: Bearer $TOKEN" | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$AUTH_URL" ]; then
        echo "❌ Nu am putut obține URL-ul OAuth!"
        exit 1
    fi
    
    echo "📋 Copiază acest URL și deschide-l în browser:"
    echo ""
    echo "$AUTH_URL"
    echo ""
    echo "📝 Pași:"
    echo "1. Deschide URL-ul în browser"
    echo "2. Alege contul Gmail"
    echo "3. Aprobă permisiunile"
    echo "4. Vei fi redirectat la localhost:3001"
    echo "5. Revino aici și apasă Enter"
    echo ""
    read -p "Apasă Enter după ce ai autorizat Gmail..."
    
    # Re-verifică status
    echo ""
    echo "🔄 Reverificare status..."
    STATUS_RESPONSE=$(curl -s http://localhost:3001/api/admin/gmail/status \
      -H "Authorization: Bearer $TOKEN")
    
    IS_CONNECTED=$(echo $STATUS_RESPONSE | grep -o '"connected":[^,}]*' | cut -d':' -f2)
    
    if [ "$IS_CONNECTED" = "true" ]; then
        echo "✅ Gmail conectat cu succes!"
        echo ""
        
        # Fetch emails
        echo "📥 DESCĂRCARE EMAILURI"
        echo "======================"
        echo ""
        read -p "Câte emailuri să descarc? (implicit: 5): " EMAIL_COUNT
        EMAIL_COUNT=${EMAIL_COUNT:-5}
        
        echo "⏳ Descarc ultimele $EMAIL_COUNT emailuri..."
        
        FETCH_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/admin/emails/fetch" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"maxResults\": $EMAIL_COUNT}")
        
        echo "$FETCH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$FETCH_RESPONSE"
    else
        echo "❌ Gmail încă nu este conectat!"
        echo "Răspuns: $STATUS_RESPONSE"
    fi
fi

echo ""
echo "✅ GATA!"
