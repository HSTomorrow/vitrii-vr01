import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function executeMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Reading migration SQL file...');
    const migrationPath = path.join(__dirname, 'prisma/migrations/0_init/migration.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    // Parse SQL statements more carefully
    const lines = sqlContent.split('\n');
    let currentStatement = '';
    const statements = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }
      
      currentStatement += ' ' + line + '\n';
      
      // If line ends with semicolon, we have a complete statement
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let skipCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
      
      try {
        await prisma.$executeRawUnsafe(stmt);
        successCount++;
        console.log(`✅ [${i + 1}/${statements.length}] Executed: ${preview}...`);
      } catch (error) {
        if (error.code === 'P2010' || error.message.includes('already exists') || error.message.includes('duplicate')) {
          skipCount++;
          console.log(`⏭️  [${i + 1}/${statements.length}] Skipped (already exists): ${preview}...`);
        } else {
          console.error(`❌ [${i + 1}/${statements.length}] Failed: ${preview}...`);
          console.error(`   Error: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log(`\n✅ Migration completed!`);
    console.log(`   Executed: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration execution failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

executeMigration();
