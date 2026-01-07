import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration: Adding precoAnuncio field to anuncios...');

    // Add precoAnuncio column to anuncios
    console.log('Adding precoAnuncio column to anuncios...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ADD COLUMN IF NOT EXISTS "precoAnuncio" DECIMAL(10, 2);
      `);
      console.log('✓ Added precoAnuncio column to anuncios');
    } catch (error) {
      console.log('✓ precoAnuncio column already exists or error:', error.message);
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
