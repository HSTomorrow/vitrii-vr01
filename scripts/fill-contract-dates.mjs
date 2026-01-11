import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando preenchimento de datas de vigência de contrato...\n");

  // Calculate 30 days from today
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 30);
  const futureDateISO = futureDate.toISOString();

  try {
    // Update usracessos (usuarios) com dataVigenciaContrato NULL ou vazio
    console.log("📝 Atualizando usuários com data de vigência de contrato...");
    const usuariosResult = await prisma.$executeRawUnsafe(
      `UPDATE "usracessos" 
       SET "dataVigenciaContrato" = $1 
       WHERE "dataVigenciaContrato" IS NULL`,
      futureDateISO
    );
    console.log(`✅ ${usuariosResult} usuários atualizados\n`);

    // Verify results
    console.log("📊 Verificando resultados:\n");

    const usuariosWithDate = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos" WHERE "dataVigenciaContrato" IS NOT NULL`
    );
    const usuariosTotal = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos"`
    );
    console.log(
      `Usuários: ${usuariosWithDate[0].count}/${usuariosTotal[0].count} com data de vigência de contrato`
    );

    // Show sample data
    const sample = await prisma.$queryRawUnsafe(
      `SELECT id, nome, email, "dataVigenciaContrato" FROM "usracessos" LIMIT 3`
    );
    console.log("\n📋 Amostra de dados:\n");
    sample.forEach((user) => {
      console.log(`  ID: ${user.id}, Nome: ${user.nome}, Vigência: ${user.dataVigenciaContrato}`);
    });

    console.log("\n✨ Preenchimento concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao preencher datas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
