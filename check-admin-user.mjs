import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminUsers() {
  try {
    console.log("🔍 Checking for admin users...\n");

    // Find all admin users
    const admins = await prisma.usuario.findMany({
      where: { tipoUsuario: "adm" },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
        dataCriacao: true,
      },
    });

    if (admins.length === 0) {
      console.log("❌ No admin users found in database!");
    } else {
      console.log(`✅ Found ${admins.length} admin user(s):\n`);
      admins.forEach((admin) => {
        console.log(`   ID: ${admin.id}`);
        console.log(`   Nome: ${admin.nome}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Tipo: ${admin.tipoUsuario}`);
        console.log(`   Data Criação: ${admin.dataCriacao}`);
        console.log("   ---");
      });
    }

    // Also check if there's any user with "admin" in email
    console.log("\n🔎 Checking for users with 'admin' in email...\n");
    const adminEmailUsers = await prisma.usuario.findMany({
      where: {
        email: {
          contains: "admin",
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
      },
    });

    if (adminEmailUsers.length === 0) {
      console.log("❌ No users with 'admin' in email found!");
    } else {
      console.log(
        `✅ Found ${adminEmailUsers.length} user(s) with 'admin' in email:\n`,
      );
      adminEmailUsers.forEach((user) => {
        console.log(`   ID: ${user.id}`);
        console.log(`   Nome: ${user.nome}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Tipo: ${user.tipoUsuario}`);
        console.log("   ---");
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUsers();
