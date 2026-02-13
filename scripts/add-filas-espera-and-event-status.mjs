import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adding event status field and creating filas_espera_agenda table...\n");

  try {
    // Add status column to eventos_agenda_anunciante if it doesn't exist
    console.log("📝 Adding status field to eventos_agenda_anunciante...");
    await prisma.$executeRaw`
      ALTER TABLE "eventos_agenda_anunciante"
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(30) DEFAULT 'pendente';
    `;
    console.log("✅ Status field added to eventos_agenda_anunciante");

    // Create filas_espera_agenda table
    console.log("\n📝 Creating filas_espera_agenda table...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "filas_espera_agenda" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "eventoId" INTEGER NOT NULL,
        "usuarioSolicitanteId" INTEGER NOT NULL,
        "anuncianteAlvoId" INTEGER NOT NULL,
        "titulo" VARCHAR(255) NOT NULL,
        "descricao" TEXT,
        "dataInicio" TIMESTAMP(3) NOT NULL,
        "dataFim" TIMESTAMP(3) NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'pendente',
        "motivo_rejeicao" TEXT,
        "dataSugestao" TIMESTAMP(3),
        "horaSugestao" VARCHAR(5),
        "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataResposta" TIMESTAMP(3),
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "filas_espera_agenda_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "eventos_agenda_anunciante"("id") ON DELETE CASCADE,
        CONSTRAINT "filas_espera_agenda_usuarioSolicitanteId_fkey" FOREIGN KEY ("usuarioSolicitanteId") REFERENCES "usracessos"("id") ON DELETE CASCADE,
        CONSTRAINT "filas_espera_agenda_anuncianteAlvoId_fkey" FOREIGN KEY ("anuncianteAlvoId") REFERENCES "anunciantes"("id") ON DELETE CASCADE
      );
    `;
    console.log("✅ filas_espera_agenda table created");

    // Create indexes
    console.log("\n📝 Creating indexes for filas_espera_agenda...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "filas_espera_agenda_eventoId_idx" ON "filas_espera_agenda"("eventoId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "filas_espera_agenda_usuarioSolicitanteId_idx" ON "filas_espera_agenda"("usuarioSolicitanteId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "filas_espera_agenda_anuncianteAlvoId_idx" ON "filas_espera_agenda"("anuncianteAlvoId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "filas_espera_agenda_status_idx" ON "filas_espera_agenda"("status");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "filas_espera_agenda_dataSolicitacao_idx" ON "filas_espera_agenda"("dataSolicitacao");`;
    console.log("✅ Indexes created");

    // Create index for status on eventos_agenda_anunciante
    console.log("\n📝 Creating status index on eventos_agenda_anunciante...");
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "eventos_agenda_anunciante_status_idx" ON "eventos_agenda_anunciante"("status");`;
    console.log("✅ Status index created");

    console.log("\n📊 Verifying changes...");
    
    // Check if status column was added
    const statusColumn = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'eventos_agenda_anunciante' AND column_name = 'status'
    `;
    
    if (statusColumn.length > 0) {
      console.log("✅ Status column verified in eventos_agenda_anunciante");
    }

    // Check if table was created
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'filas_espera_agenda'
      );
    `;
    
    if (tableExists[0].exists) {
      console.log("✅ filas_espera_agenda table verified");
    }

    console.log("\n✨ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
