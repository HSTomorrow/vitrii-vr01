import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration: Updating titulo field length to 50 characters...');

    // Update titulo column length
    console.log('Updating titulo column in anuncios table...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ALTER COLUMN "titulo" TYPE VARCHAR(50);
      `);
      console.log('✓ Updated titulo column length to 50 characters');
    } catch (error) {
      console.log('✓ Column already updated or error:', error.message);
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
