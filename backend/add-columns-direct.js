#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGmailColumns() {
  console.log('🔧 Adăugare coloane Gmail în admin_settings...\n');

  try {
    // Executăm SQL direct pentru a adăuga coloanele
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "admin_settings" 
      ADD COLUMN IF NOT EXISTS "gmail_access_token" TEXT,
      ADD COLUMN IF NOT EXISTS "gmail_refresh_token" TEXT,
      ADD COLUMN IF NOT EXISTS "gmail_token_expiry" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "gmail_email" TEXT,
      ADD COLUMN IF NOT EXISTS "last_email_fetch_at" TIMESTAMP(3);
    `);

    console.log('✅ Coloane adăugate cu succes!\n');

    // Verificăm coloanele
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_settings' 
      AND column_name LIKE 'gmail%'
      ORDER BY column_name;
    `);

    console.log('📋 Coloane Gmail în admin_settings:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Eroare:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addGmailColumns();
