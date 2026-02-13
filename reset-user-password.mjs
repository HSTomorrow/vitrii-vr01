import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = "vitriimarketplace@gmail.com";
    const newPassword = "vItrII2025";

    console.log(`Resetting password for ${email}...`);

    // Hash the new password
    const senhaHash = await bcryptjs.hash(newPassword, 10);
    console.log("Generated hash:", senhaHash);

    // Update the user's password
    const usuario = await prisma.usracessos.update({
      where: { email },
      data: { senha: senhaHash },
      select: { id: true, nome: true, email: true },
    });

    console.log("Password updated successfully for user:", usuario);

    // Verify the hash works
    const isValid = await bcryptjs.compare(newPassword, senhaHash);
    console.log("Hash verification:", isValid ? "✓ Valid" : "✗ Invalid");
  } catch (error) {
    console.error("Error resetting password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
