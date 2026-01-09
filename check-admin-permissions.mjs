import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    console.log("🔍 Checking admin user and permissions...\n");

    // Find the admin user
    const admin = await prisma.usuario.findUnique({
      where: { email: "admin@vitrii.com" },
      include: {
        usuarioXFuncionalidades: {
          include: {
            funcionalidade: true,
          },
        },
      },
    });

    if (!admin) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log("✅ Admin User Found:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.nome}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Tipo: ${admin.tipoUsuario}`);
    console.log(`   isActive: ${admin.isActive}`);
    console.log(`   Data Criação: ${admin.dataCriacao}`);

    console.log(
      `\n📋 Permissions (${admin.usuarioXFuncionalidades.length} funcionalidades):`,
    );

    if (admin.usuarioXFuncionalidades.length === 0) {
      console.log("   ❌ NO PERMISSIONS ASSIGNED!");
    } else {
      admin.usuarioXFuncionalidades.forEach((uxf) => {
        console.log(`   ✅ ${uxf.funcionalidade.nome}`);
      });
    }

    // Check if MANAGE_ADS and VIEW_ALL_ADS are assigned
    const manageAds = admin.usuarioXFuncionalidades.find(
      (uxf) => uxf.funcionalidade.slug === "MANAGE_ADS",
    );
    const viewAllAds = admin.usuarioXFuncionalidades.find(
      (uxf) => uxf.funcionalidade.slug === "VIEW_ALL_ADS",
    );

    console.log("\n🎯 Key Permissions for Admin Panel:");
    console.log(`   MANAGE_ADS: ${manageAds ? "✅ YES" : "❌ NO"}`);
    console.log(`   VIEW_ALL_ADS: ${viewAllAds ? "✅ YES" : "❌ NO"}`);

    // List all available funcionalidades
    console.log("\n📚 All Available Funcionalidades in System:");
    const allFuncs = await prisma.funcionalidade.findMany({
      where: { isActive: true },
    });

    allFuncs.forEach((func) => {
      console.log(`   - ${func.slug}: ${func.nome}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();
