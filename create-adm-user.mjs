import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Creating ADM user...\n");

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: "admin@vitrii.com.br" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists! Credentials:");
      console.log("   Email: admin@vitrii.com.br");
      console.log("   Senha: Admin@2025");
      console.log(
        "\n   If you need to change the password, update the database directly.",
      );
      await prisma.$disconnect();
      return;
    }

    // Create ADM user (password stored as-is, matching current system)
    const admUser = await prisma.usuario.create({
      data: {
        nome: "Administrador Vitrii",
        email: "admin@vitrii.com.br",
        senha: "Admin@2025",
        cpf: "00000000000",
        telefone: "0000000000",
        endereco: "Sistema Administrativo",
        tipoUsuario: "adm",
        isActive: true,
      },
    });

    console.log("✅ ADM user created successfully!");
    console.log("\n📋 User Details:");
    console.log("   Nome: Administrador Vitrii");
    console.log("   Email: admin@vitrii.com.br");
    console.log("   Senha: Admin@2025");
    console.log(`   ID: ${admUser.id}`);
    console.log("   Tipo: ADM");

    // Get all funcionalidades
    const allFuncionalidades = await prisma.funcionalidade.findMany({
      where: { isActive: true },
    });

    // Grant all funcionalidades to ADM user
    console.log(
      `\n🔑 Granting all ${allFuncionalidades.length} funcionalidades...`,
    );

    for (const func of allFuncionalidades) {
      const existing = await prisma.usuarioXFuncionalidade.findUnique({
        where: {
          usuarioId_funcionalidadeId: {
            usuarioId: admUser.id,
            funcionalidadeId: func.id,
          },
        },
      });

      if (!existing) {
        await prisma.usuarioXFuncionalidade.create({
          data: {
            usuarioId: admUser.id,
            funcionalidadeId: func.id,
          },
        });
      }
    }

    console.log(`✅ All ${allFuncionalidades.length} funcionalidades granted!`);

    console.log("\n🎉 Setup complete!");
    console.log("\n📝 Use these credentials to sign in:");
    console.log("   Email: admin@vitrii.com.br");
    console.log("   Password: Admin@2025");
  } catch (error) {
    console.error("❌ Error creating ADM user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
