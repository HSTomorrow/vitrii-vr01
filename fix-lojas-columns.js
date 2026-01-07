import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Adding missing columns to lojas table...");

    // Add missing columns to lojas table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE lojas 
      ADD COLUMN IF NOT EXISTS "site" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "instagram" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "facebook" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'ativa',
      ADD COLUMN IF NOT EXISTS "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    console.log("✅ Successfully added missing columns to lojas table");
  } catch (error) {
    console.error("❌ Error fixing lojas table:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
