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

    // Add isActive to usuarios
    try {
      await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to usuarios');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in usuarios');
      } else {
        console.error('  Error adding isActive to usuarios:', e.message);
      }
    }

    // Add isActive to lojas
    try {
      await client.query('ALTER TABLE lojas ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to lojas');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in lojas');
      } else {
        console.error('  Error adding isActive to lojas:', e.message);
      }
    }

    // Add isActive to grupos_de_productos
    try {
      await client.query('ALTER TABLE grupos_de_productos ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to grupos_de_productos');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in grupos_de_productos');
      } else {
        console.error('  Error adding isActive to grupos_de_productos:', e.message);
      }
    }

    // Add isActive to productos
    try {
      await client.query('ALTER TABLE productos ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to productos');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in productos');
      } else {
        console.error('  Error adding isActive to productos:', e.message);
      }
    }

    // Add isActive to tabelas_de_preco
    try {
      await client.query('ALTER TABLE tabelas_de_preco ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to tabelas_de_preco');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in tabelas_de_preco');
      } else {
        console.error('  Error adding isActive to tabelas_de_preco:', e.message);
      }
    }

    // Add isActive and destaque to anuncios
    try {
      await client.query('ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS "destaque" BOOLEAN DEFAULT false;');
      console.log('✓ Added destaque to anuncios');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  destaque already exists in anuncios');
      } else {
        console.error('  Error adding destaque to anuncios:', e.message);
      }
    }

    try {
      await client.query('ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to anuncios');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in anuncios');
      } else {
        console.error('  Error adding isActive to anuncios:', e.message);
      }
    }

    // Add isActive to equipes_de_venda
    try {
      await client.query('ALTER TABLE equipes_de_venda ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;');
      console.log('✓ Added isActive to equipes_de_venda');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('  isActive already exists in equipes_de_venda');
      } else {
        console.error('  Error adding isActive to equipes_de_venda:', e.message);
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
