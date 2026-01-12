import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    console.log(
      "Starting migration: Adding site, instagram, facebook, whatsapp fields to anunciantes table...",
    );

    // Execute raw SQL to add the columns if they don't exist
    await prisma.$executeRaw`
      ALTER TABLE "public"."anunciantes" 
      ADD COLUMN IF NOT EXISTS "site" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "instagram" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "facebook" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "whatsapp" VARCHAR(20);
    `;

    console.log(
      '✓ Columns "site", "instagram", "facebook", "whatsapp" added to anunciantes table',
    );

    // Verify the changes
    const count = await prisma.anunciantes.count();
    console.log(`✓ Total anunciantes in database: ${count}`);

    // Get a sample to verify
    const sample = await prisma.anunciantes.findMany({
      select: {
        id: true,
        nome: true,
        site: true,
        instagram: true,
        facebook: true,
        whatsapp: true,
      },
      take: 5,
    });

    console.log("✓ Sample records:");
    sample.forEach((record) => {
      console.log(
        `  - ID: ${record.id}, Nome: ${record.nome}, Site: ${record.site}, Instagram: ${record.instagram}, Facebook: ${record.facebook}, WhatsApp: ${record.whatsapp}`,
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
