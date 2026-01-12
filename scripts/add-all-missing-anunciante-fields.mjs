import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log(
      "Starting comprehensive migration: Adding all missing fields to anunciantes table...",
    );

    // Execute raw SQL to add ALL potentially missing optional columns
    // This includes: tipo, descricao, cnpj, telefone, email, endereco, cep, site, instagram, facebook, whatsapp, fotoUrl, status
    await prisma.$executeRaw`
      ALTER TABLE "public"."anunciantes" 
      ADD COLUMN IF NOT EXISTS "descricao" TEXT,
      ADD COLUMN IF NOT EXISTS "cnpj" VARCHAR(14),
      ADD COLUMN IF NOT EXISTS "telefone" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "endereco" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "cep" VARCHAR(8),
      ADD COLUMN IF NOT EXISTS "site" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "instagram" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "facebook" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "whatsapp" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "fotoUrl" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "tipo" VARCHAR(50) DEFAULT 'Padrão',
      ADD COLUMN IF NOT EXISTS "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `;

    console.log("✓ All columns added to anunciantes table (or already exist)");

    // Update required fields for existing records that might have NULLs
    await prisma.$executeRaw`
      UPDATE "public"."anunciantes" 
      SET 
        "tipo" = COALESCE("tipo", 'Padrão'),
        "dataCriacao" = COALESCE("dataCriacao", CURRENT_TIMESTAMP),
        "dataAtualizacao" = CURRENT_TIMESTAMP
      WHERE "tipo" IS NULL OR "dataCriacao" IS NULL;
    `;

    console.log("✓ Updated existing records with default values where needed");

    // Verify the changes
    const count = await prisma.anunciantes.count();
    console.log(`✓ Total anunciantes in database: ${count}`);

    // Get a sample to verify all fields
    const sample = await prisma.anunciantes.findMany({
      take: 3,
    });

    console.log("✓ Sample records with all fields:");
    sample.forEach((record) => {
      console.log(`\n  - ID: ${record.id}`);
      console.log(`    Nome: ${record.nome}`);
      console.log(`    Tipo: ${record.tipo}`);
      console.log(`    CNPJ: ${record.cnpj}`);
      console.log(`    Email: ${record.email}`);
      console.log(`    Telefone: ${record.telefone}`);
      console.log(`    Site: ${record.site}`);
      console.log(`    Instagram: ${record.instagram}`);
      console.log(`    Facebook: ${record.facebook}`);
      console.log(`    WhatsApp: ${record.whatsapp}`);
      console.log(`    FotoUrl: ${record.fotoUrl}`);
    });

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
