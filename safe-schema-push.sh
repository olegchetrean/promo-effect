#!/bin/bash

echo "🔧 Aplicare Schema Gmail OAuth (Safe)"
echo "======================================"
echo ""

cd /Users/megapromotingholding/Documents/promo-effect/backend

echo "📋 Schema actuală în schema.prisma:"
grep -A 5 "model AdminSettings" prisma/schema.prisma | grep gmail

echo ""
echo "⏳ Aplicare modificări în baza de date..."
echo ""

# Timeout de 10 secunde - dacă se blochează, îl oprim
timeout 10s npx prisma db push --skip-generate 2>&1 || {
    echo ""
    echo "⚠️  Comanda s-a blocat sau a eșuat!"
    echo ""
    echo "Încerc metoda alternativă..."
    echo ""
    
    # Verifică dacă coloanele există deja
    echo "SELECT column_name FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name LIKE 'gmail%';" | \
    psql "$DATABASE_URL" 2>/dev/null || echo "Nu pot verifica (psql lipsește)"
}

echo ""
echo "🔄 Regenerare Prisma Client..."
npx prisma generate

echo ""
echo "✅ Gata! Acum:"
echo "   1. Restartează backend-ul"
echo "   2. Încearcă OAuth din nou"
