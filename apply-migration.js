import pkg from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { PrismaClient } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'prisma/migrations/0_init/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('Applying migration...');
    
    // Split SQL by statement and execute each one
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.substring(0, 60) + '...');
        await prisma.$executeRawUnsafe(statement + ';');
      } catch (error) {
        // If table/index already exists, that's OK
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⚠️  Already exists, skipping:', statement.substring(0, 40) + '...');
        } else {
          throw error;
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
