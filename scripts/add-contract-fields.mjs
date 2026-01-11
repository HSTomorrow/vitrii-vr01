import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adicionando campos de contrato ao banco de dados...\n");

  // Calculate 30 days from today
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDateISO = futureDate.toISOString();

  try {
    // Add dataVigenciaContrato column if it doesn't exist
    console.log("📝 Adicionando coluna dataVigenciaContrato...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD COLUMN "dataVigenciaContrato" TIMESTAMP DEFAULT NOW();`
      );
      console.log("✅ Coluna dataVigenciaContrato adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Coluna dataVigenciaContrato já existe");
      } else {
        throw err;
      }
    }

    // Add numeroAnunciosAtivos column if it doesn't exist
    console.log("📝 Adicionando coluna numeroAnunciosAtivos...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD COLUMN "numeroAnunciosAtivos" INTEGER DEFAULT 0;`
      );
      console.log("✅ Coluna numeroAnunciosAtivos adicionada");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("⚠️ Coluna numeroAnunciosAtivos já existe");
      } else {
        throw err;
      }
    }

    // Add UNIQUE constraint to cpf column if it doesn't exist
    console.log("📝 Adicionando restrição UNIQUE em cpf...");
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "usracessos" ADD CONSTRAINT "usracessos_cpf_unique" UNIQUE ("cpf") WHERE "cpf" IS NOT NULL;`
      );
      console.log("✅ Restrição UNIQUE em cpf adicionada");
    } catch (err) {
      if (err.message.includes("already exists") || err.message.includes("duplicate")) {
        console.log("⚠️ Restrição UNIQUE em cpf já existe");
      } else {
        throw err;
      }
    }

    // Update existing records with contract date
    console.log("\n📝 Preenchendo contratos existentes com data + 30 dias...");
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "usracessos" 
       SET "dataVigenciaContrato" = $1 
       WHERE "dataVigenciaContrato" IS NULL OR "dataVigenciaContrato" = CURRENT_TIMESTAMP`,
      futureDateISO
    );
    console.log(`✅ ${result} usuários atualizados\n`);

    // Verify results
    console.log("📊 Verificando resultados:\n");

    const usuariosWithContract = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos" WHERE "dataVigenciaContrato" IS NOT NULL`
    );
    const usuariosTotal = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos"`
    );
    console.log(
      `Usuários: ${usuariosWithContract[0].count}/${usuariosTotal[0].count} com data de vigência de contrato`
    );

    // Show sample data
    const sample = await prisma.$queryRawUnsafe(
      `SELECT id, nome, email, "dataVigenciaContrato", "numeroAnunciosAtivos" FROM "usracessos" LIMIT 3`
    );
    console.log("\n📋 Amostra de dados:\n");
    sample.forEach((user) => {
      console.log(`  ID: ${user.id}`);
      console.log(`  Nome: ${user.nome}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Vigência: ${user.dataVigenciaContrato}`);
      console.log(`  Anúncios Ativos: ${user.numeroAnunciosAtivos}\n`);
    });

    console.log("✨ Campos adicionados e preenchidos com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao adicionar campos:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
