import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Corrigindo datas de vigência de contrato...\n");

  // Get all users
  const users = await prisma.usracessos.findMany({
    select: { id: true, nome: true },
  });

  console.log(`Encontrados ${users.length} usuários\n`);

  // Calculate 30 days from now
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  console.log(
    `Atualizando contratos para: ${futureDate.toLocaleDateString("pt-BR")} ${futureDate.toLocaleTimeString("pt-BR")}\n`,
  );

  // Update all users' contract dates
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "usracessos"
     SET "dataVigenciaContrato" = $1
     WHERE id > 0`,
    futureDate,
  );

  console.log(`✅ ${result} usuários atualizados\n`);

  // Verify results
  const updatedUsers = await prisma.usracessos.findMany({
    select: { id: true, nome: true, dataVigenciaContrato: true },
  });

  console.log("📋 Datas atualizadas:\n");
  updatedUsers.forEach((u) => {
    const date = new Date(u.dataVigenciaContrato);
    console.log(`  ${u.nome}: ${date.toLocaleDateString("pt-BR")}`);
  });

  const today = new Date();
  const validUsers = updatedUsers.filter(
    (u) => new Date(u.dataVigenciaContrato) > today,
  );

  if (validUsers.length === updatedUsers.length) {
    console.log(
      `\n✨ Todos os ${validUsers.length} usuários agora têm contratos válidos!`,
    );
  } else {
    console.log(
      `\n⚠️ Apenas ${validUsers.length}/${updatedUsers.length} usuários têm contratos válidos`,
    );
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Erro:", error);
  process.exit(1);
});
