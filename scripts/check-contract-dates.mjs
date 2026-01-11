import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Verificando datas de vigência de contrato:\n");

  const users = await prisma.usracessos.findMany({
    select: { id: true, nome: true, dataVigenciaContrato: true },
  });

  users.forEach((u) => {
    const date = new Date(u.dataVigenciaContrato);
    console.log(`  ID ${u.id}: ${u.nome}`);
    console.log(`    Vigência: ${date.toLocaleDateString("pt-BR")} ${date.toLocaleTimeString("pt-BR")}`);
    console.log("");
  });

  const today = new Date();
  console.log(`Data/Hora atual: ${today.toLocaleDateString("pt-BR")} ${today.toLocaleTimeString("pt-BR")}\n`);

  // Check which users have expired contracts
  const expiredUsers = users.filter(
    (u) => new Date(u.dataVigenciaContrato) < today
  );

  if (expiredUsers.length > 0) {
    console.log(`⚠️ ${expiredUsers.length} usuários com contrato vencido:\n`);
    expiredUsers.forEach((u) => {
      const date = new Date(u.dataVigenciaContrato);
      const daysExpired = Math.floor(
        (today - date) / (1000 * 60 * 60 * 24)
      );
      console.log(`  - ${u.nome} (expirou há ${daysExpired} dias)`);
    });
  } else {
    console.log("✅ Todos os usuários têm contratos válidos");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
