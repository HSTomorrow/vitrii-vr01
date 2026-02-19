import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting migration: Changing banners.imagemUrl from VARCHAR(500) to LONGTEXT");

    // PostgreSQL syntax - Simply alter the column type
    // We'll try with quoted identifier for safety
    await prisma.$executeRawUnsafe(
      `ALTER TABLE banners ALTER COLUMN "imagemUrl" TYPE TEXT`
    );

    console.log("✓ Migration completed successfully!");
    console.log("✓ banners.imagemUrl column has been changed to LONGTEXT");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
