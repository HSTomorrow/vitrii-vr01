import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Adding timestamp columns...\n");

    await prisma.$executeRawUnsafe(
      'ALTER TABLE usuarios_lojas ADD COLUMN IF NOT EXISTS "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    );
    console.log("✅ Added dataCriacao");

    await prisma.$executeRawUnsafe(
      'ALTER TABLE usuarios_lojas ADD COLUMN IF NOT EXISTS "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    );
    console.log("✅ Added dataAtualizacao");

    console.log("\n✅ All timestamp columns added!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
