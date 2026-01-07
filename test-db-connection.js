import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('✅ Connection successful!');
    console.log('Database time:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
