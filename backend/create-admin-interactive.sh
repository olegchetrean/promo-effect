#!/bin/bash

echo "🔐 CREARE USER ADMIN"
echo "===================="
echo ""

# Citește email
echo -n "📧 Email admin: "
read EMAIL

# Citește parola (hidden)
echo -n "🔑 Parolă: "
read -s PASSWORD
echo ""

# Citește numele (opțional)
echo -n "👤 Nume (opțional, apasă Enter pentru 'Admin User'): "
read NAME

if [ -z "$NAME" ]; then
  NAME="Admin User"
fi

echo ""
echo "⏳ Creez user admin..."
echo ""

cd "$(dirname "$0")"
npx ts-node create-admin.ts "$EMAIL" "$PASSWORD" "$NAME"

echo ""
echo "✅ Gata! Acum poți folosi:"
echo "   Email: $EMAIL"
echo "   Parolă: (parola pe care ai introdus-o)"
echo ""
echo "🚀 Rulează: ./test-gmail-oauth-complet.sh"
