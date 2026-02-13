import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// URLs de imagens de teste públicas (sem copyright)
const anunciantePhotos = [
  "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=500&q=80", // Loja elegante
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80", // Loja moderna
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80", // Loja interior
  "https://images.unsplash.com/photo-1441984904556-0ac8e9a6830d?w=500&q=80", // Loja iluminada
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&q=80", // Fachada comercial
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80", // Vitrine
  "https://images.unsplash.com/photo-1497864149936-d3631f3ef3ff?w=500&q=80", // Entrada loja
  "https://images.unsplash.com/photo-1520022783209-ba82f4e65ebb?w=500&q=80", // Loja aconchegante
];

const produtoPhotos = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", // Eletrônicos
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80", // Moda
  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80", // Livros
  "https://images.unsplash.com/photo-1609042231298-d45c2c18b2d5?w=500&q=80", // Móveis
  "https://images.unsplash.com/photo-1492707892657-8d71bcdd2f65?w=500&q=80", // Utensílios
  "https://images.unsplash.com/photo-1494568642332-ecef0526e773?w=500&q=80", // Decoração
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", // Produtos eletrônicos
  "https://images.unsplash.com/photo-1449887749033-19ec7aade47f?w=500&q=80", // Serviços
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80", // Produtos variados
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80", // Beleza
  "https://images.unsplash.com/photo-1551717743-49959800b1f6?w=500&q=80", // Esporte
  "https://images.unsplash.com/photo-1585399787849-06b9f09c6155?w=500&q=80", // Alimentos
];

const servicoPhotos = [
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80", // Serviços gerais
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80", // Consultoria
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80", // Design
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80", // Marketing
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80", // Desenvolvimento
];

async function addPhotos() {
  try {
    console.log("🖼️  Iniciando adição de fotos de teste...\n");

    // 1. Adicionar fotos aos anunciantes
    console.log("📸 Adicionando fotos aos anunciantes...");
    const anunciantes = await prisma.anunciantes.findMany({
      select: { id: true, nome: true, fotoUrl: true },
    });

    let anunciantesAtualizados = 0;
    for (let i = 0; i < anunciantes.length; i++) {
      const anunciante = anunciantes[i];
      if (!anunciante.fotoUrl) {
        const fotoUrl = anunciantePhotos[i % anunciantePhotos.length];
        await prisma.anunciantes.update({
          where: { id: anunciante.id },
          data: { fotoUrl },
        });
        console.log(`  ✓ ${anunciante.nome}: foto adicionada`);
        anunciantesAtualizados++;
      } else {
        console.log(`  - ${anunciante.nome}: já possui foto`);
      }
    }
    console.log(`\n✓ ${anunciantesAtualizados} anunciante(s) atualizado(s)\n`);

    // 2. Adicionar imagens aos anúncios
    console.log("📸 Adicionando imagens aos anúncios...");
    const anuncios = await prisma.anuncios.findMany({
      select: { id: true, titulo: true, imagem: true, tipo: true },
    });

    let anunciosAtualizados = 0;
    for (let i = 0; i < anuncios.length; i++) {
      const anuncio = anuncios[i];
      if (!anuncio.imagem) {
        let imagemUrl;
        if (anuncio.tipo === "produto") {
          imagemUrl = produtoPhotos[i % produtoPhotos.length];
        } else if (anuncio.tipo === "servico") {
          imagemUrl = servicoPhotos[i % servicoPhotos.length];
        } else {
          imagemUrl = produtoPhotos[i % produtoPhotos.length];
        }

        await prisma.anuncios.update({
          where: { id: anuncio.id },
          data: { imagem: imagemUrl },
        });
        console.log(`  ✓ ${anuncio.titulo.substring(0, 40)}: imagem adicionada`);
        anunciosAtualizados++;
      } else {
        console.log(`  - ${anuncio.titulo.substring(0, 40)}: já possui imagem`);
      }
    }
    console.log(`\n✓ ${anunciosAtualizados} anúncio(s) atualizado(s)\n`);

    // 3. Adicionar fotos adicionais para alguns anúncios (fotos_anuncio)
    console.log("📸 Adicionando fotos adicionais para anúncios...");
    const anunciosComFotos = await prisma.anuncios.findMany({
      where: { tipo: "produto" },
      select: { id: true, titulo: true },
      take: 5,
    });

    let fotosAdicionadas = 0;
    const adminUser = await prisma.usracessos.findFirst({
      where: { tipoUsuario: "adm" },
      select: { id: true },
    });

    if (!adminUser) {
      console.log("  ⚠️  Usuário admin não encontrado, pulando fotos adicionais");
    } else {
      for (const anuncio of anunciosComFotos) {
        const fotosExistentes = await prisma.fotos_anuncio.count({
          where: { anuncio_id: anuncio.id },
        });

        if (fotosExistentes < 3) {
          for (let j = 0; j < 2; j++) {
            const fotoUrl = produtoPhotos[(Math.random() * produtoPhotos.length) | 0];
            await prisma.fotos_anuncio.create({
              data: {
                anuncio_id: anuncio.id,
                url: fotoUrl,
                ordem: fotosExistentes + j + 1,
                criado_por: adminUser.id,
              },
            });
            fotosAdicionadas++;
          }
          console.log(`  ✓ ${anuncio.titulo.substring(0, 40)}: 2 fotos adicionais adicionadas`);
        }
      }
      console.log(`\n✓ ${fotosAdicionadas} foto(s) adicional(is) adicionada(s)\n`);
    }

    console.log("✅ Fotos de teste adicionadas com sucesso!");
    console.log("\nResumo:");
    console.log(`  • ${anunciantesAtualizados} anunciante(s) com nova foto`);
    console.log(`  • ${anunciosAtualizados} anúncio(s) com nova imagem`);
    console.log(`  • ${fotosAdicionadas} foto(s) adicionais para produtos`);
  } catch (error) {
    console.error("❌ Erro ao adicionar fotos:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addPhotos();
