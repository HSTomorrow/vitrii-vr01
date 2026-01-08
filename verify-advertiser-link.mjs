import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyAdvertiserLink() {
  try {
    console.log("🔍 Verifying advertiser 67 and user 66...\n");

    // Check if user 66 exists
    const user = await prisma.usuario.findUnique({
      where: { id: 66 },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoUsuario: true,
      },
    });

    if (user) {
      console.log("✅ User 66 found:");
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log("❌ User 66 not found!");
    }

    console.log("\n---\n");

    // Check if advertiser 67 exists
    const anunciante = await prisma.anunciante.findUnique({
      where: { id: 67 },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
      },
    });

    if (anunciante) {
      console.log("✅ Advertiser 67 found:");
      console.log(JSON.stringify(anunciante, null, 2));
    } else {
      console.log("❌ Advertiser 67 not found!");
    }

    console.log("\n---\n");

    // Check if link exists between user 66 and advertiser 67
    const link = await prisma.usuarioAnunciante.findFirst({
      where: {
        usuarioId: 66,
        anuncianteId: 67,
      },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
        tipoUsuario: true,
        dataCriacao: true,
      },
    });

    if (link) {
      console.log("✅ Link between user 66 and advertiser 67 found:");
      console.log(JSON.stringify(link, null, 2));
    } else {
      console.log("❌ No link found between user 66 and advertiser 67!");
      console.log("\n   Checking all links for user 66:");
      const allLinksForUser = await prisma.usuarioAnunciante.findMany({
        where: { usuarioId: 66 },
        select: {
          id: true,
          usuarioId: true,
          anuncianteId: true,
          tipoUsuario: true,
          anunciante: {
            select: { id: true, nome: true },
          },
        },
      });

      if (allLinksForUser.length > 0) {
        console.log(`   Found ${allLinksForUser.length} advertiser(s) for user 66:`);
        allLinksForUser.forEach((link) => {
          console.log(
            `   - Advertiser ${link.anuncianteId} (${link.anunciante.nome})`
          );
        });
      } else {
        console.log("   No advertisers linked to user 66!");
      }
    }

    console.log("\n---\n");

    // Test the query that AnuncioForm uses
    console.log("🧪 Testing getAnunciantesByUsuario query for user 66:\n");
    const anunciantes = await prisma.anunciante.findMany({
      where: {
        usuarioAnunciantes: {
          some: {
            usuarioId: 66,
          },
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
        status: true,
      },
      orderBy: { dataCriacao: "desc" },
    });

    if (anunciantes.length > 0) {
      console.log(
        `✅ Found ${anunciantes.length} advertiser(s) for user 66:`
      );
      anunciantes.forEach((ad) => {
        console.log(`   - ${ad.id}: ${ad.nome} (${ad.email})`);
      });
    } else {
      console.log("❌ No advertisers found for user 66 using query!");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdvertiserLink();
