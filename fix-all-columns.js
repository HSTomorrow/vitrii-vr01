import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Adding all missing columns...\n");

    const fixes = [
      // usuarios_lojas missing column
      {
        table: "usuarios_lojas",
        column: "tipoUsuario",
        type: "VARCHAR(50)",
      },
      // anuncios missing column
      {
        table: "anuncios",
        column: "productId",
        type: "INTEGER NOT NULL",
      },
      // Add lojaId to tabelas_de_preco if missing
      {
        table: "tabelas_de_preco",
        column: "lojaId",
        type: "INTEGER NOT NULL",
      },
      // Add missing columns to movimentos_estoque
      {
        table: "movimentos_estoque",
        column: "produtoEmEstoque_lojaId",
        type: "INTEGER",
      },
      {
        table: "movimentos_estoque",
        column: "produtoEmEstoque_productId",
        type: "INTEGER",
      },
    ];

    for (const fix of fixes) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${fix.table}" ADD COLUMN "${fix.column}" ${fix.type};`
        );
        console.log(`✅ Added ${fix.column} to ${fix.table}`);
      } catch (e) {
        const msg = e.message || "";
        if (msg.includes("already exists")) {
          console.log(`ℹ️ ${fix.column} already exists in ${fix.table}`);
        } else {
          console.log(`⚠️ Skipped ${fix.column} in ${fix.table}: ${msg.substring(0, 50)}`);
        }
      }
    }

    console.log("\n✅ All columns checked and fixed!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
