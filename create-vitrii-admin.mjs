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

    // Now grant all permissions to this admin
    console.log("\n🔑 Granting permissions...");
    
    const funcionalidades = await prisma.funcionalidade.findMany({
      where: { isActive: true },
    });

    console.log(`   Found ${funcionalidades.length} funcionalidades\n`);

    let grantedCount = 0;
    for (const func of funcionalidades) {
      try {
        // Check if already granted
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
          grantedCount++;
        }
      } catch (error) {
        console.error(`   Error granting ${func.chave}:`, error.message);
      }
    }

    console.log(`✅ Granted ${grantedCount} permissions\n`);

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
