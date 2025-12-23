#!/bin/bash

set -e  # Oprește la prima eroare

echo "=== TEST 1: Health Check ==="
curl -s http://localhost:3001/health
echo -e "\n"

echo "=== TEST 2: Login ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"albertfgh22@gmail.com","password":"parolatare"}')

echo "$LOGIN_RESPONSE"
echo -e "\n"

# Extrage token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ EROARE: Nu am primit token!"
    echo "Răspuns complet: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Token primit: ${TOKEN:0:20}..."
echo -e "\n"

echo "=== TEST 3: Gmail Status ==="
curl -s http://localhost:3001/api/admin/gmail/status \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "=== TEST 4: Gmail Auth URL ==="
curl -s http://localhost:3001/api/admin/gmail/auth \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n"

echo "✅ Toate testele au trecut!"
