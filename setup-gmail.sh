#!/bin/bash

set -e

echo "════════════════════════════════════════════════════════"
echo "🚀 GMAIL OAUTH - CONFIGURARE COMPLETĂ"
echo "════════════════════════════════════════════════════════"
echo ""

# Test backend
echo "1️⃣  Verificare backend..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend nu rulează pe port 3001!"
    echo "   Rulează: cd backend && npm run dev"
    exit 1
fi
echo "✅ Backend OK"
echo ""

# Login
echo "2️⃣  Autentificare..."
LOGIN_JSON=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"albertfgh22@gmail.com","password":"parolatare"}')

# Check if login successful
if echo "$LOGIN_JSON" | grep -q "error"; then
    echo "❌ Login eșuat:"
    echo "$LOGIN_JSON"
    exit 1
fi

TOKEN=$(echo "$LOGIN_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Nu am putut extrage token-ul!"
    echo "Răspuns: $LOGIN_JSON"
    exit 1
fi

echo "✅ Autentificat: albertfgh22@gmail.com"
echo ""

# Check Gmail status
echo "3️⃣  Verificare status Gmail..."
STATUS_JSON=$(curl -s http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN")

echo "$STATUS_JSON" | python3 -m json.tool 2>/dev/null || echo "$STATUS_JSON"
echo ""

IS_CONNECTED=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('connected', False))" 2>/dev/null)

if [ "$IS_CONNECTED" = "True" ]; then
    echo "✅ Gmail deja conectat!"
    GMAIL_EMAIL=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('email', 'N/A'))" 2>/dev/null)
    echo "📧 Gmail: $GMAIL_EMAIL"
    echo ""
    
    # Ask to fetch emails
    read -p "Vrei să descarci emailuri acum? (y/n): " FETCH_NOW
    
    if [ "$FETCH_NOW" = "y" ] || [ "$FETCH_NOW" = "Y" ]; then
        read -p "Câte emailuri? (implicit 5): " EMAIL_COUNT
        EMAIL_COUNT=${EMAIL_COUNT:-5}
        
        echo ""
        echo "📥 Descarc $EMAIL_COUNT emailuri..."
        
        FETCH_JSON=$(curl -s -X POST http://localhost:3001/api/admin/emails/fetch \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"maxResults\": $EMAIL_COUNT}")
        
        echo "$FETCH_JSON" | python3 -m json.tool 2>/dev/null || echo "$FETCH_JSON"
    fi
else
    echo "⚠️  Gmail nu este conectat"
    echo ""
    
    # Get OAuth URL
    echo "4️⃣  Obținere URL OAuth..."
    AUTH_JSON=$(curl -s http://localhost:3001/api/admin/gmail/auth \
      -H "Authorization: Bearer $TOKEN" \
      -H "Accept: application/json")
    
    # Check for error
    if echo "$AUTH_JSON" | grep -q "error"; then
        echo "❌ Eroare la obținerea URL-ului:"
        echo "$AUTH_JSON" | python3 -m json.tool 2>/dev/null || echo "$AUTH_JSON"
        exit 1
    fi
    
    AUTH_URL=$(echo "$AUTH_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['authUrl'])" 2>/dev/null)
    
    if [ -z "$AUTH_URL" ]; then
        echo "❌ Nu am putut extrage URL-ul OAuth!"
        echo "Răspuns: $AUTH_JSON"
        exit 1
    fi
    
    echo "✅ URL OAuth obținut!"
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo "🔗 COPIAZĂ ȘI DESCHIDE ACEST URL ÎN BROWSER:"
    echo ""
    echo "$AUTH_URL"
    echo ""
    echo "════════════════════════════════════════════════════════"
    echo ""
    echo "📝 Pași:"
    echo "  1. Copiază URL-ul de mai sus"
    echo "  2. Deschide-l într-un browser"
    echo "  3. Alege contul Gmail"
    echo "  4. Aprobă permisiunile (citire emailuri)"
    echo "  5. Vei fi redirectat la: http://localhost:3001/api/admin/gmail/callback"
    echo "  6. Ar trebui să vezi: {\"success\": true, \"message\": \"Gmail connected successfully!\"}"
    echo ""
    read -p "Apasă Enter după ce ai autorizat Gmail..."
    
    # Reverify status
    echo ""
    echo "5️⃣  Reverificare status..."
    STATUS_JSON=$(curl -s http://localhost:3001/api/admin/gmail/status \
      -H "Authorization: Bearer $TOKEN")
    
    echo "$STATUS_JSON" | python3 -m json.tool 2>/dev/null || echo "$STATUS_JSON"
    echo ""
    
    IS_CONNECTED=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('connected', False))" 2>/dev/null)
    
    if [ "$IS_CONNECTED" = "True" ]; then
        echo "✅ Gmail conectat cu succes!"
        GMAIL_EMAIL=$(echo "$STATUS_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin).get('email', 'N/A'))" 2>/dev/null)
        echo "📧 Gmail: $GMAIL_EMAIL"
        echo ""
        
        # Ask to fetch emails
        read -p "Vrei să descarci emailuri acum? (y/n): " FETCH_NOW
        
        if [ "$FETCH_NOW" = "y" ] || [ "$FETCH_NOW" = "Y" ]; then
            read -p "Câte emailuri? (implicit 5): " EMAIL_COUNT
            EMAIL_COUNT=${EMAIL_COUNT:-5}
            
            echo ""
            echo "📥 Descarc $EMAIL_COUNT emailuri..."
            
            FETCH_JSON=$(curl -s -X POST http://localhost:3001/api/admin/emails/fetch \
              -H "Authorization: Bearer $TOKEN" \
              -H "Content-Type: application/json" \
              -d "{\"maxResults\": $EMAIL_COUNT}")
            
            echo "$FETCH_JSON" | python3 -m json.tool 2>/dev/null || echo "$FETCH_JSON"
        fi
    else
        echo "⚠️  Gmail încă nu este conectat"
        echo "   Încearcă din nou sau verifică logurile backend-ului"
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ GATA!"
echo "════════════════════════════════════════════════════════"
