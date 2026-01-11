import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createVitriiAdmin() {
  console.log("🔐 Creating Vitrii Admin User...\n");

  try {
    const adminEmail = "vitriimarketplace@gmail.com";
    const adminPassword = "AavItrII2025Zzç";

    // Check if admin already exists
    const existingAdmin = await prisma.usracessos.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${adminEmail}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Type: ${existingAdmin.tipoUsuario}`);
      await prisma.$disconnect();
      return;
    }

    // Create admin user
    const admUser = await prisma.usracessos.create({
      data: {
        nome: "Administrador Vitrii",
        email: adminEmail,
        senha: adminPassword,
        cpf: "00000000000",
        telefone: "0000000000",
        endereco: "Sistema Administrativo",
        tipoUsuario: "adm",
        dataAtualizacao: new Date(),
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log("\n📋 User Details:");
    console.log(`   ID: ${admUser.id}`);
    console.log(`   Nome: ${admUser.nome}`);
    console.log(`   Email: ${admUser.email}`);
    console.log(`   Tipo: ${admUser.tipoUsuario}`);
    console.log(`   Data Criação: ${admUser.dataCriacao}`);

    console.log("\n🔓 Login Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

    // Note: Admin users have access to all permissions by default
    console.log("\n✅ Admin user has full system access by default!");

    console.log("🎉 Admin setup complete! You can now login with:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createVitriiAdmin();
