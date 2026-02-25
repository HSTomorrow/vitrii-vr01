import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🚀 Creating admin user...");

    const email = "vitriimarketplace@gmail.com";
    const senha = "Admin@2024"; // Default admin password
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Check if user already exists
    const existingUser = await prisma.usracessos.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Type: ${existingUser.tipoUsuario}`);
      process.exit(0);
    }

    // Create admin user
    const adminUser = await prisma.usracessos.create({
      data: {
        nome: "Admin Vitrii",
        email: email,
        senha: hashedPassword,
        tipoUsuario: "adm",
        tassinatura: "Gratuito",
        dataVigenciaContrato: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxAnunciosAtivos: 999,
      },
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`\n📊 User Details:`);
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.nome}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Type: ${adminUser.tipoUsuario}`);
    console.log(`   Password: ${senha}`);
    console.log(
      `\n✨ You can now login with these credentials at /auth/signin`
    );
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
