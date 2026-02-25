import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Verifying featured ads in database...\n");

    // Count all ads
    const totalAds = await prisma.anuncios.count();
    console.log(`📊 Total ads in database: ${totalAds}`);

    // Count featured ads
    const featuredAds = await prisma.anuncios.count({
      where: { destaque: true },
    });
    console.log(`⭐ Featured ads: ${featuredAds}`);

    // Count active ads
    const activeAds = await prisma.anuncios.count({
      where: { status: "ativo" },
    });
    console.log(`✅ Active ads: ${activeAds}`);

    // Count featured + active ads
    const featuredActiveAds = await prisma.anuncios.count({
      where: { 
        destaque: true,
        status: "ativo",
      },
    });
    console.log(`🎯 Featured + Active ads: ${featuredActiveAds}`);

    // Get a few featured ads to check
    const sampleFeatured = await prisma.anuncios.findMany({
      where: { 
        destaque: true,
        status: "ativo",
      },
      include: {
        anunciantes: {
          select: {
            id: true,
            nome: true,
            localidadeId: true,
          },
        },
      },
      take: 3,
    });

    console.log(`\n📌 Sample featured ads:`);
    sampleFeatured.forEach((ad, index) => {
      console.log(`\n  ${index + 1}. ${ad.titulo}`);
      console.log(`     ID: ${ad.id}`);
      console.log(`     Tipo: ${ad.tipo}`);
      console.log(`     Status: ${ad.status}`);
      console.log(`     Destaque: ${ad.destaque}`);
      console.log(`     Preço: ${ad.preco || "N/A"}`);
      console.log(`     Anunciante: ${ad.anunciantes?.nome}`);
      console.log(`     Localidade ID: ${ad.anunciantes?.localidadeId}`);
    });

    // Check Montenegro localidade
    const montenegro = await prisma.localidades.findFirst({
      where: {
        municipio: {
          contains: "Montenegro",
          mode: "insensitive",
        },
      },
    });

    console.log(`\n🏘️  Montenegro localidade:`);
    console.log(`   ID: ${montenegro?.id}`);
    console.log(`   Município: ${montenegro?.municipio}`);
    console.log(`   Estado: ${montenegro?.estado}`);

    // Count anunciantes in Montenegro
    const montenegroAnunciantes = await prisma.anunciantes.count({
      where: { localidadeId: montenegro?.id },
    });
    console.log(`   Anunciantes in Montenegro: ${montenegroAnunciantes}`);

    console.log("\n✅ Verification complete!");
  } catch (error) {
    console.error("❌ Error during verification:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
