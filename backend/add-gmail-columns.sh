#!/bin/bash

set -e

echo "🔧 Adăugare coloane Gmail OAuth în baza de date..."

# Load DATABASE_URL from .env
source <(grep DATABASE_URL /Users/megapromotingholding/Documents/promo-effect/backend/.env | sed 's/^/export /')

# Run SQL
psql "$DATABASE_URL" << EOF
ALTER TABLE "admin_settings" 
ADD COLUMN IF NOT EXISTS "gmail_access_token" TEXT,
ADD COLUMN IF NOT EXISTS "gmail_refresh_token" TEXT,
ADD COLUMN IF NOT EXISTS "gmail_token_expiry" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "gmail_email" TEXT,
ADD COLUMN IF NOT EXISTS "last_email_fetch_at" TIMESTAMP(3);

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND column_name LIKE 'gmail%'
ORDER BY column_name;
EOF

echo ""
echo "✅ Coloane adăugate cu succes!"
echo ""
echo "Acum:"
echo "1. Regenerează Prisma client: npx prisma generate"
echo "2. Restartează backend-ul"
echo "3. Încearcă din nou OAuth flow-ul"
