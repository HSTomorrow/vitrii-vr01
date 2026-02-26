const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Corrigindo status do usuário ID 16...\n');
  
  try {
    const user = await prisma.usracessos.findUnique({
      where: { id: 16 },
    });
    
    if (!user) {
      console.error('❌ Usuário ID 16 não encontrado');
      process.exit(1);
    }
    
    console.log('Usuário encontrado:');
    console.log('  - Nome: ' + user.nome);
    console.log('  - Email: ' + user.email);
    console.log('  - Status atual: ' + user.status);
    console.log('  - Email verificado: ' + user.emailVerificado);
    
    const updated = await prisma.usracessos.update({
      where: { id: 16 },
      data: {
        status: 'bloqueado',
        emailVerificado: false,
      },
    });
    
    console.log('\n✅ Usuário corrigido com sucesso!');
    console.log('  - Status novo: ' + updated.status);
    console.log('  - Email verificado: ' + updated.emailVerificado);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
