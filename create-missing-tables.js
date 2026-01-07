import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Creating missing database tables...\n");

    // Create grupos_de_productos table
    console.log("📋 Creating grupos_de_productos table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "grupos_de_productos" (
          "id" SERIAL PRIMARY KEY,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "nome" VARCHAR(255) NOT NULL,
          "descricao" TEXT,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created grupos_de_productos table");
    } catch (e) {
      console.error("❌ Error creating grupos_de_productos:", e.message);
    }

    // Create fotos_grupo table
    console.log("📋 Creating fotos_grupo table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "fotos_grupo" (
          "id" SERIAL PRIMARY KEY,
          "grupoId" INTEGER NOT NULL REFERENCES "grupos_de_productos"("id") ON DELETE CASCADE,
          "fotoUrl" TEXT NOT NULL,
          "ordem" INTEGER DEFAULT 1,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created fotos_grupo table");
    } catch (e) {
      console.error("❌ Error creating fotos_grupo:", e.message);
    }

    // Create productos table
    console.log("📋 Creating productos table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "productos" (
          "id" SERIAL PRIMARY KEY,
          "grupoId" INTEGER NOT NULL REFERENCES "grupos_de_productos"("id") ON DELETE CASCADE,
          "nome" VARCHAR(255) NOT NULL,
          "descricao" TEXT,
          "sku" VARCHAR(100),
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created productos table");
    } catch (e) {
      console.error("❌ Error creating productos:", e.message);
    }

    // Create tabelas_de_preco table
    console.log("📋 Creating tabelas_de_preco table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "tabelas_de_preco" (
          "id" SERIAL PRIMARY KEY,
          "productId" INTEGER NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "preco" NUMERIC(10,2) NOT NULL,
          "precoCusto" NUMERIC(10,2),
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created tabelas_de_preco table");
    } catch (e) {
      console.error("❌ Error creating tabelas_de_preco:", e.message);
    }

    // Create qr_codes table
    console.log("📋 Creating qr_codes table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "qr_codes" (
          "id" SERIAL PRIMARY KEY,
          "tabelaDePrecoId" INTEGER NOT NULL REFERENCES "tabelas_de_preco"("id") ON DELETE CASCADE,
          "codigo" VARCHAR(500) UNIQUE NOT NULL,
          "descricao" TEXT,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created qr_codes table");
    } catch (e) {
      console.error("❌ Error creating qr_codes:", e.message);
    }

    // Create anuncios table
    console.log("📋 Creating anuncios table...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "anuncios" (
          "id" SERIAL PRIMARY KEY,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "productId" INTEGER NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
          "tabelaDePrecoId" INTEGER NOT NULL REFERENCES "tabelas_de_preco"("id") ON DELETE CASCADE,
          "titulo" VARCHAR(255) NOT NULL,
          "descricao" TEXT,
          "fotoUrl" TEXT,
          "status" VARCHAR(50) DEFAULT 'em_edicao',
          "dataValidade" TIMESTAMP,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created anuncios table");
    } catch (e) {
      console.error("❌ Error creating anuncios:", e.message);
    }

    // Create outros_relacionados tables
    console.log("📋 Creating related tables...");
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "usuarios_lojas" (
          "id" SERIAL PRIMARY KEY,
          "usuarioId" INTEGER NOT NULL REFERENCES "usuarios"("id") ON DELETE CASCADE,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "tipoUsuario" VARCHAR(50),
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("usuarioId", "lojaId")
        );
      `);
      console.log("✅ Created usuarios_lojas table");
    } catch (e) {
      console.error("❌ Error creating usuarios_lojas:", e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "produtos_em_estoque" (
          "id" SERIAL PRIMARY KEY,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "productId" INTEGER NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
          "quantidade" INTEGER DEFAULT 0,
          "quantidadeMinima" INTEGER DEFAULT 0,
          "quantidadeMaxima" INTEGER,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("lojaId", "productId")
        );
      `);
      console.log("✅ Created produtos_em_estoque table");
    } catch (e) {
      console.error("❌ Error creating produtos_em_estoque:", e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "movimentos_estoque" (
          "id" SERIAL PRIMARY KEY,
          "lojaId" INTEGER NOT NULL REFERENCES "lojas"("id") ON DELETE CASCADE,
          "productId" INTEGER NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
          "tipo" VARCHAR(50),
          "quantidade" INTEGER,
          "motivoSaida" VARCHAR(255),
          "observacoes" TEXT,
          "dataCriacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created movimentos_estoque table");
    } catch (e) {
      console.error("❌ Error creating movimentos_estoque:", e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "producto_visualizacoes" (
          "id" SERIAL PRIMARY KEY,
          "usuarioId" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL,
          "productId" INTEGER NOT NULL,
          "dataVisualizacao" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created producto_visualizacoes table");
    } catch (e) {
      console.error("❌ Error creating producto_visualizacoes:", e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "qr_code_chamadas" (
          "id" SERIAL PRIMARY KEY,
          "usuarioId" INTEGER REFERENCES "usuarios"("id") ON DELETE SET NULL,
          "qrCodeId" INTEGER NOT NULL REFERENCES "qr_codes"("id") ON DELETE CASCADE,
          "dataChamada" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Created qr_code_chamadas table");
    } catch (e) {
      console.error("❌ Error creating qr_code_chamadas:", e.message);
    }

    console.log("\n✅ Database tables creation complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
