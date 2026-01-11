import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log("🔐 Resetting admin password...\n");

    // The correct admin email (with "ii" not "eii")
    const adminEmail = "admin@vitrii.com";
    const newPassword = "Admin@2025";

    // Hash the password with bcrypt (matching signup flow)
    const senhaHash = await bcryptjs.hash(newPassword, 10);

    // Update the admin user with hashed password
    const updatedUser = await prisma.usracesso.update({
      where: { email: adminEmail },
      data: { senha: senhaHash },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
      },
    });

    console.log("✅ Admin password reset successfully!");
    console.log("\n📋 Updated User:");
    console.log(`   ID: ${updatedUser.id}`);
    console.log(`   Nome: ${updatedUser.nome}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Tipo: ${updatedUser.tipoUsuario}`);
    console.log("\n🔑 Login Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${newPassword}`);
    console.log("\n✨ You can now login with these credentials!");
  } catch (error) {
    console.error("❌ Error resetting password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
