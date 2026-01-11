import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Iniciando preenchimento de datas de cadastro...\n");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Update usracessos (usuarios)
    console.log("📝 Atualizando usuários sem dataAtualizacao...");
    const usuariosUpdated = await prisma.usracessos.updateMany({
      where: {
        dataAtualizacao: null,
      },
      data: {
        dataAtualizacao: today,
      },
    });
    console.log(`✅ ${usuariosUpdated.count} usuários atualizados\n`);

    // Update anunciantes
    console.log("📝 Atualizando anunciantes sem dataAtualizacao...");
    const anunciantesUpdated = await prisma.anunciantes.updateMany({
      where: {
        dataAtualizacao: null,
      },
      data: {
        dataAtualizacao: today,
      },
    });
    console.log(`✅ ${anunciantesUpdated.count} anunciantes atualizados\n`);

    // Verify results
    console.log("📊 Verificando resultados:\n");

    const usuariosTotal = await prisma.usracessos.count();
    const usuariosComData = await prisma.usracessos.count({
      where: {
        dataAtualizacao: {
          not: null,
        },
      },
    });
    console.log(`Usuários: ${usuariosComData}/${usuariosTotal} com data de atualização`);

    const anunciantesTotal = await prisma.anunciantes.count();
    const anunciantesComData = await prisma.anunciantes.count({
      where: {
        dataAtualizacao: {
          not: null,
        },
      },
    });
    console.log(`Anunciantes: ${anunciantesComData}/${anunciantesTotal} com data de atualização\n`);

    console.log("✨ Preenchimento concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao preencher datas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
