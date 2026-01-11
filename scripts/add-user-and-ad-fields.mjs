import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adicionando campos de perfil de usuário e rastreamento de anúncios...\n");

  try {
    // Add whatsapp column to usracessos
    console.log("📝 Verificando coluna whatsapp em usracessos...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD COLUMN "whatsapp" VARCHAR(20);`
      );
      console.log("✅ Coluna whatsapp adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ Coluna whatsapp já existe");
      } else {
        throw err;
      }
    }

    // Add linkedin column to usracessos
    console.log("📝 Verificando coluna linkedin em usracessos...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD COLUMN "linkedin" VARCHAR(255);`
      );
      console.log("✅ Coluna linkedin adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ Coluna linkedin já existe");
      } else {
        throw err;
      }
    }

    // Add facebook column to usracessos
    console.log("📝 Verificando coluna facebook em usracessos...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD COLUMN "facebook" VARCHAR(255);`
      );
      console.log("✅ Coluna facebook adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ Coluna facebook já existe");
      } else {
        throw err;
      }
    }

    // Add visualizacoes column to anuncios
    console.log("📝 Verificando coluna visualizacoes em anuncios...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "anuncios" ADD COLUMN "visualizacoes" INTEGER DEFAULT 0;`
      );
      console.log("✅ Coluna visualizacoes adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ Coluna visualizacoes já existe");
      } else {
        throw err;
      }
    }

    // Create anuncioVisualizados table if it doesn't exist
    console.log("📝 Verificando tabela anuncioVisualizados...");
    try {
      await prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "anuncioVisualizados" (
          "id" SERIAL PRIMARY KEY,
          "anuncioId" INTEGER NOT NULL REFERENCES "anuncios"("id") ON DELETE CASCADE,
          "usuarioId" INTEGER REFERENCES "usracessos"("id") ON DELETE SET NULL,
          "dataCriacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );`
      );
      console.log("✅ Tabela anuncioVisualizados criada");

      // Create indices for better performance
      try {
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "anuncioVisualizados_anuncioId_idx" ON "anuncioVisualizados"("anuncioId");`
        );
        console.log("✅ Índice anuncioId criado");
      } catch (err) {
        console.log("ℹ️ Índice anuncioId já existe ou erro ao criar");
      }

      try {
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "anuncioVisualizados_usuarioId_idx" ON "anuncioVisualizados"("usuarioId");`
        );
        console.log("✅ Índice usuarioId criado");
      } catch (err) {
        console.log("ℹ️ Índice usuarioId já existe ou erro ao criar");
      }

      try {
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "anuncioVisualizados_dataCriacao_idx" ON "anuncioVisualizados"("dataCriacao");`
        );
        console.log("✅ Índice dataCriacao criado");
      } catch (err) {
        console.log("ℹ️ Índice dataCriacao já existe ou erro ao criar");
      }
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("ℹ️ Tabela anuncioVisualizados já existe");
      } else {
        throw err;
      }
    }

    console.log("\n✨ Campos e tabelas adicionados com sucesso!");

    // Verify results
    console.log("\n📊 Verificando esquema atualizado:\n");

    const usuariosSchema = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'usracessos' 
       ORDER BY ordinal_position`
    );

    console.log("Colunas em usracessos:");
    usuariosSchema.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const anunciosSchema = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'anuncios' 
       ORDER BY ordinal_position`
    );

    console.log("\nColunas em anuncios:");
    anunciosSchema.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    const vizualizacoesExists = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'anuncioVisualizados');`
    );

    if (vizualizacoesExists[0].exists) {
      console.log("\n✅ Tabela anuncioVisualizados criada com sucesso");
    }
  } catch (error) {
    console.error("❌ Erro ao adicionar campos:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
