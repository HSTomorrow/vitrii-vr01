import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Creating banners table...\n");

  try {
    // Create banners table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "banners" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "titulo" VARCHAR(255) NOT NULL,
        "descricao" TEXT,
        "imagemUrl" VARCHAR(500) NOT NULL,
        "link" VARCHAR(500),
        "ordem" INTEGER NOT NULL DEFAULT 0,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataAtualizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("✅ Banners table created successfully!");

    // Verify the table exists
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'banners'
      ORDER BY ordinal_position;
    `;

    console.log("\n📋 Banners table structure:");
    result.forEach((col) => {
      console.log(
        `   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });

    // Count banners
    const count = await prisma.banners.count();
    console.log(`\n📊 Total banners in database: ${count}`);

    // Insert some sample banners if table is empty
    if (count === 0) {
      await prisma.banners.createMany({
        data: [
          {
            titulo: "Bem-vindo ao Vitrii",
            descricao:
              "Marketplace seguro para compra e venda de produtos e serviços",
            imagemUrl:
              "https://via.placeholder.com/1200x300?text=Bem-vindo+ao+Vitrii",
            link: "/browse",
            ordem: 1,
            ativo: true,
          },
          {
            titulo: "Promoção Especial",
            descricao: "Descubra ofertas incríveis todos os dias",
            imagemUrl:
              "https://via.placeholder.com/1200x300?text=Promo%C3%A7%C3%A3o",
            link: "/browse",
            ordem: 2,
            ativo: true,
          },
        ],
      });

      console.log("\n🎨 Sample banners created:");
      const banners = await prisma.banners.findMany();
      banners.forEach((b) => {
        console.log(`   - ${b.titulo} (Ordem: ${b.ordem})`);
      });
    }

    console.log("\n✨ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
