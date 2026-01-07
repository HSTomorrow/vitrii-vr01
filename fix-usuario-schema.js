import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function fixUsuarioSchema() {
  try {
    console.log('Fixing Usuario table schema...\n');

    // Add missing columns
    console.log('Adding cpf column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "cpf" VARCHAR(11)'
    );
    console.log('✓ CPF column added');

    console.log('Adding telefone column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" VARCHAR(20)'
    );
    console.log('✓ Telefone column added');

    console.log('Adding endereco column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "endereco" TEXT'
    );
    console.log('✓ Endereco column added');

    console.log('Adding/updating tipoUsuario column...');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "tipoUsuario" VARCHAR(255) DEFAULT \'comum\''
    );
    console.log('✓ TipoUsuario column added/updated');

    console.log('Setting default values for existing records...');
    await prisma.$executeRawUnsafe(
      'UPDATE "usuarios" SET "tipoUsuario" = \'comum\' WHERE "tipoUsuario" IS NULL'
    );
    console.log('✓ Default values set');

    console.log('Creating unique index for cpf...');
    await prisma.$executeRawUnsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_cpf_key" ON "usuarios"("cpf") WHERE "cpf" IS NOT NULL'
    );
    console.log('✓ CPF unique index created');

    console.log('\n✅ Schema update completed successfully!');
    console.log('\nTesting new schema...');

    // Test by creating a simple user
    const testUser = await prisma.usuario.findMany({
      take: 1,
    });

    console.log('✓ Schema is working correctly');
    console.log('\nYou can now create new users!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsuarioSchema();
