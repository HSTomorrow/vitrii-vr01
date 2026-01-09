import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function restoreAdminPermissions() {
  try {
    console.log("🔐 Restoring admin permissions...\n");

    // Find the admin user
    const admin = await prisma.usuario.findUnique({
      where: { email: "admin@vitrii.com" },
    });

    if (!admin) {
      console.log("❌ Admin user not found!");
      return;
    }

    console.log(`✅ Found admin user: ${admin.nome}\n`);

    // Get all active funcionalidades
    const funcionalidades = await prisma.funcionalidade.findMany({
      where: { isActive: true },
    });

    console.log(
      `📋 Found ${funcionalidades.length} funcionalidades to assign\n`,
    );

    // Clear existing permissions
    const deletedCount = await prisma.usuarioXFuncionalidade.deleteMany({
      where: { usuarioId: admin.id },
    });

    console.log(`🗑️  Removed ${deletedCount.count} old permissions\n`);

    // Assign all funcionalidades to admin
    let createdCount = 0;
    for (const func of funcionalidades) {
      const created = await prisma.usuarioXFuncionalidade.create({
        data: {
          usuarioId: admin.id,
          funcionalidadeId: func.id,
        },
      });
      createdCount++;
      console.log(`   ✅ ${func.nome}`);
    }

    console.log(
      `\n✨ Successfully assigned ${createdCount} permissions to admin!\n`,
    );

    // Verify permissions were assigned
    const updated = await prisma.usuario.findUnique({
      where: { id: admin.id },
      include: {
        usuarioXFuncionalidades: {
          include: {
            funcionalidade: true,
          },
        },
      },
    });

    console.log(
      `🎉 Verification - Admin now has ${updated.usuarioXFuncionalidades.length} permissions:`,
    );
    updated.usuarioXFuncionalidades.forEach((uxf) => {
      console.log(`   ✅ ${uxf.funcionalidade.nome}`);
    });

    console.log("\n🚀 Admin permissions restored successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreAdminPermissions();
