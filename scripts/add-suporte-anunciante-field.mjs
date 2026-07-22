import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adding isSuporte field to anunciantes table...\n");

  try {
    await prisma.$executeRaw`
      ALTER TABLE "anunciantes"
      ADD COLUMN IF NOT EXISTS "isSuporte" BOOLEAN NOT NULL DEFAULT false;
    `;

    console.log("✅ Column added successfully!");

    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'anunciantes' AND column_name = 'isSuporte';
    `;

    console.log("\n📋 Column information:");
    result.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`,
      );
    });

    console.log("\n✨ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
