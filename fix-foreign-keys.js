import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Checking and fixing foreign key constraints...\n");

    // Drop the problematic constraint if it exists
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "productos" DROP CONSTRAINT IF EXISTS "productos_grupoId_fkey"'
      );
      console.log("✅ Dropped existing productos_grupoId_fkey constraint");
    } catch (e) {
      console.log("ℹ️ Could not drop constraint (may not exist)");
    }

    // Recreate the constraint with proper reference
    try {
      await prisma.$executeRawUnsafe(
        'ALTER TABLE "productos" ADD CONSTRAINT "productos_grupoId_fkey" FOREIGN KEY ("grupoId") REFERENCES "grupos_de_productos"("id") ON DELETE CASCADE'
      );
      console.log("✅ Recreated productos_grupoId_fkey constraint");
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("already exists")) {
        console.log("ℹ️ Constraint already exists");
      } else {
        console.log("⚠️ Error:", msg.substring(0, 100));
      }
    }

    // Also fix other tables that might have issues
    const constraintFixes = [
      {
        table: "grupos_de_productos",
        constraint: "grupos_de_productos_lojaId_fkey",
        column: "lojaId",
        refTable: "lojas",
        refColumn: "id",
      },
      {
        table: "tabelas_de_preco",
        constraint: "tabelas_de_preco_productId_fkey",
        column: "productId",
        refTable: "productos",
        refColumn: "id",
      },
      {
        table: "tabelas_de_preco",
        constraint: "tabelas_de_preco_lojaId_fkey",
        column: "lojaId",
        refTable: "lojas",
        refColumn: "id",
      },
      {
        table: "anuncios",
        constraint: "anuncios_lojaId_fkey",
        column: "lojaId",
        refTable: "lojas",
        refColumn: "id",
      },
      {
        table: "anuncios",
        constraint: "anuncios_productId_fkey",
        column: "productId",
        refTable: "productos",
        refColumn: "id",
      },
      {
        table: "anuncios",
        constraint: "anuncios_tabelaDePrecoId_fkey",
        column: "tabelaDePrecoId",
        refTable: "tabelas_de_preco",
        refColumn: "id",
      },
    ];

    for (const fix of constraintFixes) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${fix.table}" DROP CONSTRAINT IF EXISTS "${fix.constraint}"`
        );
        console.log(`✅ Dropped ${fix.constraint}`);

        await prisma.$executeRawUnsafe(
          `ALTER TABLE "${fix.table}" ADD CONSTRAINT "${fix.constraint}" FOREIGN KEY ("${fix.column}") REFERENCES "${fix.refTable}"("${fix.refColumn}") ON DELETE CASCADE`
        );
        console.log(`✅ Recreated ${fix.constraint}`);
      } catch (e) {
        const msg = e.message || "";
        if (msg.includes("does not exist")) {
          // Constraint doesn't exist, try to create it
          try {
            await prisma.$executeRawUnsafe(
              `ALTER TABLE "${fix.table}" ADD CONSTRAINT "${fix.constraint}" FOREIGN KEY ("${fix.column}") REFERENCES "${fix.refTable}"("${fix.refColumn}") ON DELETE CASCADE`
            );
            console.log(`✅ Created ${fix.constraint}`);
          } catch (e2) {
            console.log(`⚠️ Could not create ${fix.constraint}: ${e2.message?.substring(0, 50)}`);
          }
        } else {
          console.log(`⚠️ Issue with ${fix.constraint}: ${msg.substring(0, 50)}`);
        }
      }
    }

    console.log("\n✅ Foreign key constraints check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
