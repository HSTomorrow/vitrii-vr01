import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log(
      "Starting migration: Adding tipo field to anunciantes table...",
    );

    // Execute raw SQL to add the column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "public"."anunciantes" 
      ADD COLUMN IF NOT EXISTS "tipo" VARCHAR(50) DEFAULT 'Padrão';
    `;

    console.log('✓ Column "tipo" added to anunciantes table');

    // Update all existing records to 'Padrão' where tipo is NULL
    const result = await prisma.$executeRaw`
      UPDATE "public"."anunciantes" 
      SET "tipo" = 'Padrão' 
      WHERE "tipo" IS NULL OR "tipo" = '';
    `;

    console.log(`✓ Updated ${result} existing records to tipo='Padrão'`);

    // Verify the changes
    const count = await prisma.anunciantes.count();
    console.log(`✓ Total anunciantes in database: ${count}`);

    // Get a sample to verify
    const sample = await prisma.anunciantes.findMany({
      select: { id: true, nome: true, tipo: true },
      take: 5,
    });

    console.log("✓ Sample records:");
    sample.forEach((record) => {
      console.log(
        `  - ID: ${record.id}, Nome: ${record.nome}, Tipo: ${record.tipo}`,
      );
    });

    console.log("\n✓ Migration completed successfully!");
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
