import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating Pagamento table...");

  try {
    // Create the Pagamento table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "public"."pagamentos" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "anuncioId" INTEGER NOT NULL UNIQUE,
        "valor" DECIMAL(10,2) NOT NULL,
        "status" VARCHAR(255) NOT NULL DEFAULT 'pendente',
        "tipo" VARCHAR(255) NOT NULL DEFAULT 'pix',
        "provedor" VARCHAR(255) NOT NULL DEFAULT 'mercado-pago',
        "idExterno" VARCHAR(255),
        "qrCode" TEXT,
        "urlCopiaECola" TEXT,
        "pixId" VARCHAR(255),
        "erroMsg" TEXT,
        "dataExpiracao" TIMESTAMP,
        "dataPagamento" TIMESTAMP,
        "dataCriacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataAtualizacao" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pagamentos_anuncioId_fkey" FOREIGN KEY ("anuncioId") REFERENCES "public"."anuncios"("id") ON DELETE CASCADE
      )
    `;

    console.log("✅ Pagamento table created successfully!");

    // Create an index on status for better query performance
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "pagamentos_status_idx" ON "public"."pagamentos"("status")
    `;

    console.log("✅ Index on status created successfully!");

  } catch (error) {
    console.error("❌ Error creating Pagamento table:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
