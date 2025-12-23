const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addIncomingEmailTable() {
  try {
    // Creează tabelul principal
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS incoming_emails (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        message_id TEXT UNIQUE NOT NULL,
        from_address TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        received_at TIMESTAMP NOT NULL,
        status TEXT DEFAULT 'PENDING',
        processed_at TIMESTAMP,
        booking_id TEXT,
        extracted_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabel incoming_emails creat!');

    // Creează indexurile
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_incoming_emails_status ON incoming_emails(status)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_incoming_emails_received_at ON incoming_emails(received_at)
    `);

    console.log('✅ Indexuri create!');

    // Verifică tabelul
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'incoming_emails'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Coloane create:');
    console.table(result);

  } catch (error) {
    console.error('❌ Eroare:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addIncomingEmailTable();
