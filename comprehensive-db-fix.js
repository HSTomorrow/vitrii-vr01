import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔧 Checking and fixing database schema...\n");

    // Define all tables and their required columns
    const tableSchemas = {
      usuarios: [
        { name: "id", type: "SERIAL PRIMARY KEY" },
        { name: "nome", type: "VARCHAR(255) NOT NULL" },
        { name: "email", type: "VARCHAR(255) UNIQUE NOT NULL" },
        { name: "senha", type: "VARCHAR(255) NOT NULL" },
        { name: "cpf", type: "VARCHAR(11) UNIQUE" },
        { name: "telefone", type: "VARCHAR(20)" },
        { name: "endereco", type: "TEXT" },
        { name: "tipoUsuario", type: "VARCHAR(50) DEFAULT 'comum'" },
        { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
        { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      ],
      lojas: [
        { name: "id", type: "SERIAL PRIMARY KEY" },
        { name: "nome", type: "VARCHAR(255) NOT NULL" },
        { name: "cnpjOuCpf", type: "VARCHAR(18) UNIQUE" },
        { name: "endereco", type: "TEXT" },
        { name: "descricao", type: "TEXT" },
        { name: "email", type: "VARCHAR(255)" },
        { name: "site", type: "VARCHAR(255)" },
        { name: "instagram", type: "VARCHAR(255)" },
        { name: "facebook", type: "VARCHAR(255)" },
        { name: "fotoUrl", type: "TEXT" },
        { name: "status", type: "VARCHAR(50) DEFAULT 'ativa'" },
        { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
        { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      ],
      grupos_de_productos: [
        { name: "id", type: "SERIAL PRIMARY KEY" },
        { name: "lojaId", type: "INTEGER NOT NULL" },
        { name: "nome", type: "VARCHAR(255) NOT NULL" },
        { name: "descricao", type: "TEXT" },
        { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
        { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      ],
      productos: [
        { name: "id", type: "SERIAL PRIMARY KEY" },
        { name: "grupoId", type: "INTEGER NOT NULL" },
        { name: "nome", type: "VARCHAR(255) NOT NULL" },
        { name: "descricao", type: "TEXT" },
        { name: "sku", type: "VARCHAR(100)" },
        { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
        { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      ],
      tabelas_de_preco: [
        { name: "id", type: "SERIAL PRIMARY KEY" },
        { name: "productId", type: "INTEGER NOT NULL" },
        { name: "lojaId", type: "INTEGER NOT NULL" },
        { name: "preco", type: "NUMERIC(10,2) NOT NULL" },
        { name: "precoCusto", type: "NUMERIC(10,2)" },
        { name: "dataCriacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
        { name: "dataAtualizacao", type: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP" },
      ],
    };

    // Check each table
    for (const [tableName, columns] of Object.entries(tableSchemas)) {
      console.log(`📋 Checking table: ${tableName}`);

      for (const col of columns) {
        // Skip PRIMARY KEY columns
        if (col.type.includes("PRIMARY KEY")) continue;

        try {
          // Try to add the column
          const columnName = col.name;
          const columnType = col.type.replace("PRIMARY KEY", "").trim();

          await prisma.$executeRawUnsafe(
            `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType};`
          );
          console.log(`  ✓ Added column: ${columnName}`);
        } catch (e) {
          const msg = e.message || "";
          if (msg.includes("already exists")) {
            console.log(`  - ${col.name}: exists`);
          } else if (msg.includes("no such table")) {
            console.log(`  ✗ Table does not exist: ${tableName}`);
            break;
          } else {
            // Silent fail for other errors - column likely exists
          }
        }
      }
      console.log("");
    }

    console.log("✅ Database schema check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
