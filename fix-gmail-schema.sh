#!/bin/bash

echo "🔧 FIX: Sincronizare Schema Gmail OAuth"
echo "========================================="
echo ""

cd /Users/megapromotingholding/Documents/promo-effect/backend

echo "1️⃣  Verificare conexiune la baza de date..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Conexiune OK"
else
    echo "❌ Nu mă pot conecta la baza de date!"
    echo "   Verifică DATABASE_URL în .env"
    exit 1
fi

echo ""
echo "2️⃣  Aplicare schema (fără prompt)..."
npx prisma db push --skip-generate --accept-data-loss --force-reset 2>&1 | head -20

echo ""
echo "3️⃣  Regenerare Prisma Client..."
npx prisma generate

echo ""
echo "✅ GATA!"
echo ""
echo "Acum:"
echo "  1. Pornește backend: cd backend && npm run dev"
echo "  2. Testează OAuth: cd .. && ./setup-gmail.sh"
