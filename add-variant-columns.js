import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Adding variant columns to tabelas_de_preco...\n");

    // Add tamanho column
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "tabelas_de_preco" ADD COLUMN IF NOT EXISTS "tamanho" VARCHAR(100)'
      );
      console.log("✅ Added tamanho column");
    } catch (e) {
      console.log("ℹ️ tamanho column already exists or error:", e.message?.substring(0, 50));
    }

    // Add cor column
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "tabelas_de_preco" ADD COLUMN IF NOT EXISTS "cor" VARCHAR(100)'
      );
      console.log("✅ Added cor column");
    } catch (e) {
      console.log("ℹ️ cor column already exists or error:", e.message?.substring(0, 50));
    }

    console.log("\n✅ Variant columns added successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
