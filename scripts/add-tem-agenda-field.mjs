import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Adding temAgenda field to anunciantes table...\n");

  try {
    // Add temAgenda column to anunciantes table
    console.log("📝 Adding temAgenda field...");
    await prisma.$executeRaw`
      ALTER TABLE "anunciantes"
      ADD COLUMN IF NOT EXISTS "temAgenda" BOOLEAN DEFAULT false;
    `;
    console.log("✅ temAgenda field added");

    // Create index for faster queries
    console.log("\n📝 Creating index for temAgenda...");
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "anunciantes_temAgenda_idx" ON "anunciantes"("temAgenda");
    `;
    console.log("✅ Index created");

    // Verify the column exists
    console.log("\n📊 Verifying changes...");
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'anunciantes' AND column_name = 'temAgenda'
    `;

    if (result.length > 0) {
      console.log("✅ temAgenda column verified:");
      console.log(`   - Type: ${result[0].data_type}`);
      console.log(`   - Default: ${result[0].column_default}`);
    }

    // Count anunciantes
    const count = await prisma.anunciantes.count();
    console.log(`\n📊 Total anunciantes in database: ${count}`);

    // Show sample of anunciantes
    const sampleAnunciantes = await prisma.anunciantes.findMany({
      select: {
        id: true,
        nome: true,
        temAgenda: true,
      },
      take: 5,
    });

    console.log("\n📝 Sample anunciantes with temAgenda field:");
    sampleAnunciantes.forEach((a) => {
      console.log(`   - ID ${a.id}: "${a.nome}" | Tem Agenda: ${a.temAgenda}`);
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
