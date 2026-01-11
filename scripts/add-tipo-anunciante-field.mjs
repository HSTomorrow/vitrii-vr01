import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adding tipo field to anunciantes table...\n");

  try {
    // Using raw SQL to add column
    await prisma.$executeRaw`
      ALTER TABLE "anunciantes"
      ADD COLUMN IF NOT EXISTS "tipo" VARCHAR(50) DEFAULT 'Comum';
    `;

    console.log("✅ Column added successfully!");

    // Verify the column exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'anunciantes' AND column_name = 'tipo';
    `;

    console.log("\n📋 Column information:");
    result.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`,
      );
    });

    // Count anunciantes
    const count = await prisma.anunciantes.count();
    console.log(`\n📊 Total advertisers in database: ${count}`);

    // Show sample of anunciantes with tipo status
    const sampleAnunciantes = await prisma.anunciantes.findMany({
      select: {
        id: true,
        nome: true,
        tipo: true,
      },
      take: 5,
    });

    console.log("\n📝 Sample advertisers with tipo field:");
    sampleAnunciantes.forEach((anunciante) => {
      console.log(
        `   - ID ${anunciante.id}: "${anunciante.nome}" | Tipo: ${anunciante.tipo}`,
      );
    });

    // Count by tipo
    const tipoStats = await prisma.$queryRaw`
      SELECT "tipo", COUNT(*) as count
      FROM "anunciantes"
      GROUP BY "tipo"
      ORDER BY "tipo";
    `;

    console.log("\n📊 Advertisers by type:");
    tipoStats.forEach((stat) => {
      console.log(`   - ${stat.tipo}: ${stat.count} advertiser(s)`);
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
