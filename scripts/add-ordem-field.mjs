import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Adding ordem field to anuncios table...\n");

  try {
    // Add ordem column if it doesn't exist
    console.log("📝 Adding ordem column to anuncios...");
    await prisma.$executeRaw`
      ALTER TABLE "anuncios"
      ADD COLUMN IF NOT EXISTS "ordem" INTEGER NOT NULL DEFAULT 10;
    `;
    console.log("✅ ordem column added to anuncios");

    // Create index on ordem for sorting
    console.log("\n📝 Creating index on ordem column...");
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "anuncios_ordem_idx" ON "anuncios"("ordem" ASC);
    `;
    console.log("✅ Index created on ordem column");

    // Verify the column was added
    console.log("\n📊 Verifying changes...");
    const ordemColumn = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'anuncios' AND column_name = 'ordem'
    `;

    if (ordemColumn.length > 0) {
      console.log("✅ ordem column verified in anuncios");
      console.log(`   Data type: ${ordemColumn[0].data_type}`);
      console.log(`   Default: ${ordemColumn[0].column_default}`);
    }

    // Check if all existing ads have the ordem field set
    const anunciosWithoutOrdem = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "anuncios" WHERE "ordem" IS NULL;
    `;

    if (anunciosWithoutOrdem[0].count > 0) {
      console.log(
        `\n⚠️  Found ${anunciosWithoutOrdem[0].count} ads with NULL ordem, setting to 10...`,
      );
      await prisma.$executeRaw`
        UPDATE "anuncios" SET "ordem" = 10 WHERE "ordem" IS NULL;
      `;
      console.log("✅ Updated all NULL ordem values to 10");
    }

    console.log("\n✨ All changes applied successfully!\n");
  } catch (error) {
    console.error("❌ Error applying migrations:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
