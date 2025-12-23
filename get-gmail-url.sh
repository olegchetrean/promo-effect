#!/bin/bash

echo "🔐 LOGIN..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"albertfgh22@gmail.com","password":"parolatare"}')

echo "$LOGIN_RESPONSE" | python3 -m json.tool
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Nu am primit token!"
    exit 1
fi

echo "✅ Token: ${TOKEN:0:50}..."
echo ""
echo "🔗 OBȚINERE GMAIL AUTH URL..."
echo ""

GMAIL_AUTH_RESPONSE=$(curl -s http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN")

echo "$GMAIL_AUTH_RESPONSE" | python3 -m json.tool
echo ""

# Extrage URL
AUTH_URL=$(echo "$GMAIL_AUTH_RESPONSE" | grep -o '"authUrl":"[^"]*' | sed 's/"authUrl":"//g' | sed 's/\\//g')

if [ ! -z "$AUTH_URL" ]; then
    echo "════════════════════════════════════════════════════════"
    echo "🔗 COPIAZĂ ȘI DESCHIDE ACEST URL ÎN BROWSER:"
    echo ""
    echo "$AUTH_URL"
    echo ""
    echo "════════════════════════════════════════════════════════"
fi
