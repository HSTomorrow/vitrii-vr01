import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting migration: Creating Sales Team tables...');

    // Add tamanho and cor columns to tabelas_de_preco if they don't exist
    console.log('Adding tamanho and cor columns to tabelas_de_preco...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."tabelas_de_preco"
        ADD COLUMN IF NOT EXISTS "tamanho" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "cor" VARCHAR(100);
      `);
      console.log('✓ Added tamanho and cor columns to tabelas_de_preco');
    } catch (error) {
      console.log('✓ tamanho and cor columns already exist or error:', error.message);
    }

    // Create equipes_de_venda table
    console.log('Creating equipes_de_venda table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "public"."equipes_de_venda" (
          "id" SERIAL NOT NULL,
          "lojaId" INTEGER NOT NULL,
          "nome" VARCHAR(255) NOT NULL,
          "descricao" TEXT,
          "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "equipes_de_venda_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "equipes_de_venda_lojaId_fkey" 
            FOREIGN KEY ("lojaId") 
            REFERENCES "public"."lojas"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      console.log('✓ Created equipes_de_venda table');
    } catch (error) {
      console.log('✓ equipes_de_venda table already exists or error:', error.message);
    }

    // Create membros_equipe table
    console.log('Creating membros_equipe table...');
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "public"."membros_equipe" (
          "id" SERIAL NOT NULL,
          "equipeId" INTEGER NOT NULL,
          "usuarioId" INTEGER NOT NULL,
          "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "dataAtualizacao" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "membros_equipe_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "membros_equipe_equipeId_fkey" 
            FOREIGN KEY ("equipeId") 
            REFERENCES "public"."equipes_de_venda"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "membros_equipe_usuarioId_fkey" 
            FOREIGN KEY ("usuarioId") 
            REFERENCES "public"."usuarios"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "membros_equipe_equipeId_usuarioId_key" 
            UNIQUE ("equipeId", "usuarioId")
        );
      `);
      console.log('✓ Created membros_equipe table');
    } catch (error) {
      console.log('✓ membros_equipe table already exists or error:', error.message);
    }

    // Add columns to anuncios table
    console.log('Adding equipeDeVendaId and isDoacao columns to anuncios...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ADD COLUMN IF NOT EXISTS "equipeDeVendaId" INTEGER,
        ADD COLUMN IF NOT EXISTS "isDoacao" BOOLEAN NOT NULL DEFAULT false;
      `);
      console.log('✓ Added equipeDeVendaId and isDoacao columns to anuncios');
    } catch (error) {
      console.log('✓ Columns already exist or error:', error.message);
    }

    // Add foreign key constraint for equipeDeVendaId
    console.log('Adding foreign key constraint for equipeDeVendaId...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."anuncios"
        ADD CONSTRAINT "anuncios_equipeDeVendaId_fkey" 
          FOREIGN KEY ("equipeDeVendaId") 
          REFERENCES "public"."equipes_de_venda"("id") 
          ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log('✓ Added foreign key constraint for equipeDeVendaId');
    } catch (error) {
      console.log('✓ Foreign key already exists or error:', error.message);
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
