import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration: Adding preco field and making tabelaDePrecoId nullable...');

    // Add preco column to anuncios
    console.log('Adding preco column to anuncios...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ADD COLUMN IF NOT EXISTS "preco" DECIMAL(10, 2);
      `);
      console.log('✓ Added preco column to anuncios');
    } catch (error) {
      console.log('✓ preco column already exists or error:', error.message);
    }

    // Make tabelaDePrecoId nullable
    console.log('Making tabelaDePrecoId nullable...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ALTER COLUMN "tabelaDePrecoId" DROP NOT NULL;
      `);
      console.log('✓ Made tabelaDePrecoId nullable');
    } catch (error) {
      console.log('✓ tabelaDePrecoId already nullable or error:', error.message);
    }

    // Update foreign key constraint if needed
    console.log('Updating foreign key constraint...');
    try {
      // Drop old constraint
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        DROP CONSTRAINT IF EXISTS "anuncios_tabelaDePrecoId_fkey";
      `);
      
      // Add new constraint with ON DELETE SET NULL
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ADD CONSTRAINT "anuncios_tabelaDePrecoId_fkey" 
          FOREIGN KEY ("tabelaDePrecoId") 
          REFERENCES "public"."tabelas_de_preco"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('✓ Updated foreign key constraint');
    } catch (error) {
      console.log('✓ Foreign key constraint already updated or error:', error.message);
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
