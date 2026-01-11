import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando preenchimento de datas de cadastro...\n");

  try {
    // Update usracessos (usuarios) com dataAtualizacao NULL
    console.log("📝 Atualizando usuários sem dataAtualizacao...");
    const usuariosResult = await prisma.$executeRawUnsafe(
      `UPDATE "usracessos" 
       SET "dataAtualizacao" = NOW() 
       WHERE "dataAtualizacao" IS NULL`
    );
    console.log(`✅ ${usuariosResult} usuários atualizados\n`);

    // Update anunciantes com dataAtualizacao NULL
    console.log("📝 Atualizando anunciantes sem dataAtualizacao...");
    const anunciantesResult = await prisma.$executeRawUnsafe(
      `UPDATE "anunciantes" 
       SET "dataAtualizacao" = NOW() 
       WHERE "dataAtualizacao" IS NULL`
    );
    console.log(`✅ ${anunciantesResult} anunciantes atualizados\n`);

    // Verify results
    console.log("📊 Verificando resultados:\n");

    const usuariosWithDate = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos" WHERE "dataAtualizacao" IS NOT NULL`
    );
    const usuariosTotal = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "usracessos"`
    );
    console.log(
      `Usuários: ${usuariosWithDate[0].count}/${usuariosTotal[0].count} com data de atualização`
    );

    const anunciantesWithDate = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "anunciantes" WHERE "dataAtualizacao" IS NOT NULL`
    );
    const anunciantesTotal = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "anunciantes"`
    );
    console.log(
      `Anunciantes: ${anunciantesWithDate[0].count}/${anunciantesTotal[0].count} com data de atualização\n`
    );

    console.log("✨ Preenchimento concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao preencher datas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
