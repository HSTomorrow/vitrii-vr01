import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Adding missing cnpjOuCpf column to lojas table...");

    // Add the cnpjOuCpf column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE lojas 
      ADD COLUMN IF NOT EXISTS "cnpjOuCpf" VARCHAR(18) UNIQUE;
    `);

    console.log("✅ Successfully added cnpjOuCpf column to lojas table");
  } catch (error) {
    console.error("❌ Error fixing lojas table:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
