import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adding destaque and isActive fields to anuncios table...\n");

  try {
    // Using raw SQL to add columns since Prisma migrations should be done with 'prisma migrate dev'
    // But we'll use executeRaw for safety check
    await prisma.$executeRaw`
      ALTER TABLE "anuncios"
      ADD COLUMN IF NOT EXISTS "destaque" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
    `;

    console.log("✅ Columns added successfully!");

    // Verify the columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'anuncios' AND column_name IN ('destaque', 'isActive')
      ORDER BY column_name;
    `;

    console.log("\n📋 Columns information:");
    result.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`,
      );
    });

    // Count ads
    const count = await prisma.anuncios.count();
    console.log(`\n📊 Total ads in database: ${count}`);

    // Show sample of ads with destaque status
    const sampleAds = await prisma.anuncios.findMany({
      select: {
        id: true,
        titulo: true,
        destaque: true,
        isActive: true,
      },
      take: 5,
    });

    console.log("\n📝 Sample ads with new fields:");
    sampleAds.forEach((ad) => {
      console.log(
        `   - ID ${ad.id}: "${ad.titulo.substring(0, 30)}..." | Destaque: ${ad.destaque} | Active: ${ad.isActive}`,
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
