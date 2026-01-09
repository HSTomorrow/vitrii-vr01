import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Adding endereco column to anuncios table...");

    // Add endereco column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE anuncios 
      ADD COLUMN IF NOT EXISTS endereco VARCHAR(100);
    `);

    console.log("✅ Endereco column added successfully!");
  } catch (error) {
    console.error("Error adding endereco column:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
