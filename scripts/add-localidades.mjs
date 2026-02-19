import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🚀 Adding Localidades, Anunciantes x Localidades, and User Locality Field...\n"
  );

  try {
    // Create localidades table
    console.log("📝 Creating localidades table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "localidades" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "codigo" VARCHAR(50) NOT NULL UNIQUE,
        "municipio" VARCHAR(255) NOT NULL,
        "estado" VARCHAR(2) NOT NULL,
        "descricao" TEXT,
        "observacao" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ativo',
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("municipio", "estado")
      );
    `;
    console.log("✅ localidades table created");

    // Create indexes on localidades
    console.log("\n📝 Creating indexes for localidades...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "localidades_status_idx" ON "localidades"("status");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "localidades_municipio_idx" ON "localidades"("municipio");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "localidades_estado_idx" ON "localidades"("estado");`;
    console.log("✅ Localidades indexes created");

    // Add localidadePadraoId to usracessos
    console.log("\n📝 Adding localidadePadraoId field to usracessos...");
    await prisma.$executeRaw`
      ALTER TABLE "usracessos"
      ADD COLUMN IF NOT EXISTS "localidadePadraoId" INTEGER REFERENCES "localidades"("id") ON DELETE SET NULL;
    `;
    console.log("✅ localidadePadraoId field added to usracessos");

    // Create index on localidadePadraoId
    console.log("\n📝 Creating index for localidadePadraoId...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "usracessos_localidadePadraoId_idx" ON "usracessos"("localidadePadraoId");`;
    console.log("✅ localidadePadraoId index created");

    // Create anunciantes_x_localidades junction table
    console.log("\n📝 Creating anunciantes_x_localidades junction table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "anunciantes_x_localidades" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "anuncianteId" INTEGER NOT NULL REFERENCES "anunciantes"("id") ON DELETE CASCADE,
        "localidadeId" INTEGER NOT NULL REFERENCES "localidades"("id") ON DELETE CASCADE,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("anuncianteId", "localidadeId")
      );
    `;
    console.log("✅ anunciantes_x_localidades junction table created");

    // Create indexes on junction table
    console.log("\n📝 Creating indexes for anunciantes_x_localidades...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "anunciantes_x_localidades_anuncianteId_idx" ON "anunciantes_x_localidades"("anuncianteId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "anunciantes_x_localidades_localidadeId_idx" ON "anunciantes_x_localidades"("localidadeId");`;
    console.log("✅ Junction table indexes created");

    // Insert default localidade
    console.log("\n📝 Inserting default localidade...");
    await prisma.$executeRaw`
      INSERT INTO "localidades" ("codigo", "municipio", "estado", "descricao", "status")
      VALUES ('RS-MONTENEGRO', 'Montenegro', 'RS', 'Montenegro - Rio Grande do Sul', 'ativo')
      ON CONFLICT ("codigo") DO NOTHING;
    `;
    console.log("✅ Default localidade inserted");

    // Verify the changes
    console.log("\n📊 Verifying changes...");

    const localidadesTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'localidades'
      );
    `;

    if (localidadesTable[0].exists) {
      console.log("✅ localidades table verified");
    }

    const junctionTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'anunciantes_x_localidades'
      );
    `;

    if (junctionTable[0].exists) {
      console.log("✅ anunciantes_x_localidades junction table verified");
    }

    const localidadeColumn = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'usracessos' AND column_name = 'localidadePadraoId'
    `;

    if (localidadeColumn.length > 0) {
      console.log("✅ localidadePadraoId column verified in usracessos");
    }

    const defaultLocalidade = await prisma.$queryRaw`
      SELECT * FROM "localidades" WHERE "codigo" = 'RS-MONTENEGRO' LIMIT 1;
    `;

    if (defaultLocalidade && defaultLocalidade.length > 0) {
      console.log(
        `✅ Default localidade verified (ID: ${defaultLocalidade[0].id})`
      );
    }

    console.log(
      "\n✨ All localidade-related changes applied successfully!\n"
    );
  } catch (error) {
    console.error("❌ Error applying migrations:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
