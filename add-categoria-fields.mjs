#!/usr/bin/env node

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL or DIRECT_URL not set');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database');

    // Add categoria field to anuncios
    try {
      await client.query('ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS "categoria" VARCHAR(50);');
      console.log('✓ Added categoria to anuncios');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  categoria already exists in anuncios');
      } else {
        console.error('  Error adding categoria to anuncios:', e.message);
      }
    }

    // Add dadosCategoria field to anuncios (JSON text)
    try {
      await client.query('ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS "dadosCategoria" TEXT;');
      console.log('✓ Added dadosCategoria to anuncios');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  dadosCategoria already exists in anuncios');
      } else {
        console.error('  Error adding dadosCategoria to anuncios:', e.message);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
