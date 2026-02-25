import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519167758993-c37df3a4e09f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1603561596411-07134e71a2a9?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop",
];

async function main() {
  try {
    console.log("🚀 Starting data update...\n");

    // ============================================
    // 1. FIND MONTENEGRO-RS LOCALIDADE
    // ============================================
    console.log("🔍 Looking for Montenegro-RS localidade...");
    const montenegroLocalidade = await prisma.localidades.findFirst({
      where: {
        municipio: {
          contains: "Montenegro",
          mode: "insensitive",
        },
        estado: "RS",
      },
    });

    if (!montenegroLocalidade) {
      console.error(
        "❌ Error: Montenegro-RS localidade not found in database"
      );
      console.log(
        "\nAvailable localidades starting with 'M' in RS:"
      );
      const localidades = await prisma.localidades.findMany({
        where: {
          municipio: {
            startsWith: "M",
          },
          estado: "RS",
        },
        take: 10,
      });
      localidades.forEach((l) =>
        console.log(`  • ${l.municipio}, ${l.estado} (ID: ${l.id})`)
      );
      process.exit(1);
    }

    console.log(
      `✅ Found: ${montenegroLocalidade.municipio}, ${montenegroLocalidade.estado} (ID: ${montenegroLocalidade.id})\n`
    );

    // ============================================
    // 2. UPDATE ALL ANUNCIANTES
    // ============================================
    console.log("📝 Updating all anunciantes to Montenegro-RS...");
    const updateResult = await prisma.anunciantes.updateMany({
      data: {
        localidadeId: montenegroLocalidade.id,
      },
    });

    console.log(`✅ Updated ${updateResult.count} anunciantes\n`);

    // ============================================
    // 3. GET USERS FOR AD CREATION
    // ============================================
    console.log("👥 Fetching users for ad creation...");
    const users = await prisma.usracessos.findMany({
      take: 100,
    });
    console.log(`✅ Found ${users.length} users\n`);

    // ============================================
    // 4. GET ALL ANUNCIANTES FOR AD CREATION
    // ============================================
    console.log("🏪 Fetching anunciantes for ad creation...");
    const anunciantes = await prisma.anunciantes.findMany();
    console.log(`✅ Found ${anunciantes.length} anunciantes\n`);

    // ============================================
    // 5. CREATE 200 FEATURED ADS
    // ============================================
    console.log("📢 Creating 200 featured ads...");
    let createdCount = 0;

    for (let i = 0; i < 200; i++) {
      try {
        const usuario = users[Math.floor(Math.random() * users.length)];
        const anunciante = anunciantes[Math.floor(Math.random() * anunciantes.length)];
        const tipo =
          i % 5 === 0
            ? "servico"
            : i % 7 === 0
              ? "evento"
              : i % 11 === 0
                ? "agenda_recorrente"
                : "produto";

        const preco =
          tipo === "produto" || tipo === "servico"
            ? parseFloat(faker.commerce.price({ min: 20, max: 500 }))
            : null;

        await prisma.anuncios.create({
          data: {
            usuarioId: usuario.id,
            anuncianteId: anunciante.id,
            titulo: faker.commerce.productName().substring(0, 100),
            descricao: faker.commerce.productDescription().substring(0, 500),
            imagem: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
            preco: preco,
            status: "ativo",
            tipo: tipo,
            isDoacao: false,
            aCombinar: Math.random() > 0.8,
            destaque: true,
            ordem: Math.floor(Math.random() * 200) + 1,
            statusPagamento: "aprovado",
            cidade: anunciante.cidade,
            estado: anunciante.estado,
            dataAtualizacao: new Date(),
          },
        });

        createdCount++;

        if ((i + 1) % 50 === 0) {
          console.log(`  Progress: ${i + 1}/200 ads created...`);
        }
      } catch (error) {
        console.error(`  Error creating ad ${i + 1}:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} featured ads\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("✨ DATA UPDATE COMPLETED SUCCESSFULLY! ✨\n");
    console.log("📊 Summary:");
    console.log(
      `  • Updated ${updateResult.count} anunciantes to Montenegro-RS`
    );
    console.log(`  • Created ${createdCount} featured ads for testing`);
    console.log(
      `\n✅ All data has been successfully updated in the database!`
    );
  } catch (error) {
    console.error("❌ Error during data update:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
