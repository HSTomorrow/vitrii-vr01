import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function verifyTables() {
  try {
    console.log('Verifying database tables...\n');
    
    // Query to get all tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('✅ Found the following tables:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    console.log(`\nTotal: ${tables.length} tables created`);
    
    // Expected 13 tables
    const expectedTables = [
      'usuarios',
      'lojas',
      'usuarios_lojas',
      'grupos_produtos',
      'fotos_grupos',
      'productos',
      'tabelas_preco',
      'qrcodes',
      'anuncios',
      'produtos_em_estoque',
      'movimentos_estoque',
      'productos_visualizacoes',
      'qrcodes_chamadas'
    ];
    
    const missingTables = expectedTables.filter(
      expected => !tables.some(t => t.table_name === expected)
    );
    
    if (missingTables.length === 0) {
      console.log('\n✅ All 13 expected tables created successfully!');
    } else {
      console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
