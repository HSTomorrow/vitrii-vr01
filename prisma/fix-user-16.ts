import prisma from "../server/lib/prisma";

async function main() {
  console.log("🔧 Corrigindo status do usuário ID 16...\n");

  try {
    // Find user 16
    const user = await prisma.usracessos.findUnique({
      where: { id: 16 },
    });

    if (!user) {
      console.error("❌ Usuário ID 16 não encontrado");
      return;
    }

    console.log("Usuário encontrado:");
    console.log(`  - Nome: ${user.nome}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Status atual: ${user.status}`);
    console.log(`  - Email verificado: ${user.emailVerificado}`);

    // Update user to bloqueado and emailVerificado false
    const updatedUser = await prisma.usracessos.update({
      where: { id: 16 },
      data: {
        status: "bloqueado",
        emailVerificado: false,
      },
    });

    console.log("\n✅ Usuário corrigido com sucesso!");
    console.log(`  - Status novo: ${updatedUser.status}`);
    console.log(`  - Email verificado: ${updatedUser.emailVerificado}`);
  } catch (error) {
    console.error("❌ Erro ao corrigir usuário:", error);
    process.exit(1);
  }
}

main().then(() => {
  console.log("\n🎉 Script finalizado com sucesso!");
  process.exit(0);
});
