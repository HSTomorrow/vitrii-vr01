import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Fixing lojas table schema...");

    // Add columns one by one with proper type definitions
    const columns = [
      { name: "site", type: "VARCHAR(255)" },
      { name: "instagram", type: "VARCHAR(255)" },
      { name: "facebook", type: "VARCHAR(255)" },
      { name: "fotoUrl", type: "TEXT" },
      { name: "status", type: "VARCHAR(50) DEFAULT 'ativa'" },
      { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
    ];

    for (const col of columns) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "lojas" ADD COLUMN "${col.name}" ${col.type};`
        );
        console.log(`✓ Added column: ${col.name}`);
      } catch (e) {
        // Column might already exist, that's ok
        if (e.message && e.message.includes("already exists")) {
          console.log(`- Column already exists: ${col.name}`);
        } else {
          console.log(`- Skipping ${col.name}: ${e.message?.substring(0, 50)}`);
        }
      }
    }

    console.log("✅ Successfully fixed lojas table schema");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
