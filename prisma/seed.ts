import prisma from "../server/lib/prisma";
import bcrypt from "bcryptjs";

const stores = [
  {
    nome: "Total Mais",
    cnpjOuCpf: "12.345.678/0001-01",
    endereco: "Rua Ramiro Barcelos, 2045",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Atacadista de utilidades domésticas",
    email: "totalmais@email.com",
    telefone: "(49) 99941-0359",
    fotoUrl:
      "https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=300&fit=crop",
    instagram: "@totalmais",
    facebook: "total-mais",
  },
  {
    nome: "Mega Lojao Do Bras Montenegro",
    cnpjOuCpf: "12.345.678/0001-02",
    endereco: "Rua Ramiro Barcelos, 1495",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "megalojao@email.com",
    telefone: "(51) 99560-3860",
    fotoUrl:
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=400&h=300&fit=crop",
    instagram: "@megalojao",
    facebook: "mega-lojao",
  },
  {
    nome: "Malibu Conceito",
    cnpjOuCpf: "12.345.678/0001-03",
    endereco: "Rua Ramiro Barcelos, 1989",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "malibu@email.com",
    telefone: "(51) 3654-4387",
    fotoUrl:
      "https://images.unsplash.com/photo-1555529669-e69e7f0acec8?w=400&h=300&fit=crop",
    instagram: "@malubuconceito",
    facebook: "malibu-conceito",
  },
  {
    nome: "Loja 7 MONTENEGRO",
    cnpjOuCpf: "12.345.678/0001-04",
    endereco: "Rua Ramiro Barcelos, 2655",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Bazar",
    email: "loja7@email.com",
    telefone: "(51) 99717-8288",
    fotoUrl:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop",
    instagram: "@loja7mg",
    facebook: "loja-7-montenegro",
  },
  {
    nome: "Empório",
    cnpjOuCpf: "12.345.678/0001-05",
    endereco: "Rua Ramiro Barcelos, 1864",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "emporio@email.com",
    telefone: "(51) 3654-1234",
    fotoUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    instagram: "@emporiomg",
    facebook: "emporio-mg",
  },
  {
    nome: "Pormenos",
    cnpjOuCpf: "12.345.678/0001-06",
    endereco: "Rua Ramiro Barcelos, 2519",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "pormenos@email.com",
    telefone: "(54) 98403-9295",
    fotoUrl:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=300&fit=crop",
    instagram: "@pormenos",
    facebook: "pormenos",
  },
  {
    nome: "Monjuá - Montenegro",
    cnpjOuCpf: "12.345.678/0001-07",
    endereco: "Rua Ramiro Barcelos, 1847",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "monjua@email.com",
    telefone: "(55) 99185-0896",
    fotoUrl:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop",
    instagram: "@monjuamg",
    facebook: "monjua-montenegro",
  },
  {
    nome: "MIMI_Comercio",
    cnpjOuCpf: "12.345.678/0001-08",
    endereco: "Rua Ramiro Barcelos, 1847",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de departamento",
    email: "mimi@email.com",
    telefone: "(51) 2126-1979",
    fotoUrl:
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=300&fit=crop",
    instagram: "@mimimercio",
    facebook: "mimi-comercio",
  },
  {
    nome: "Loja A Barateira",
    cnpjOuCpf: "12.345.678/0001-09",
    endereco: "Rua Ramiro Barcelos, 1919",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de roupas de designer",
    email: "barateira@email.com",
    telefone: "(51) 3632-5102",
    fotoUrl:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop",
    instagram: "@abarateira",
    facebook: "loja-a-barateira",
  },
  {
    nome: "Faby Modas",
    cnpjOuCpf: "12.345.678/0001-10",
    endereco: "Rua Ramiro Barcelos, 2242",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de moda feminina",
    email: "fabysmodas@email.com",
    telefone: "(51) 99696-8048",
    fotoUrl:
      "https://images.unsplash.com/photo-1595777712802-61b6b64ac313?w=400&h=300&fit=crop",
    instagram: "@fabysmodas",
    facebook: "faby-modas",
  },
  {
    nome: "A Legitima Super 10",
    cnpjOuCpf: "12.345.678/0001-11",
    endereco: "Rua Ramiro Barcelos, 2200",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de artigos domésticos",
    email: "legitima@email.com",
    telefone: "(51) 99901-1334",
    fotoUrl:
      "https://images.unsplash.com/photo-1534400327717-46d1e0db9b5d?w=400&h=300&fit=crop",
    instagram: "@alegitima10",
    facebook: "a-legitima-super-10",
  },
  {
    nome: "Loja Nichel",
    cnpjOuCpf: "12.345.678/0001-12",
    endereco: "Rua Ramiro Barcelos, 1970",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "nichel@email.com",
    telefone: "(51) 3632-4459",
    fotoUrl:
      "https://images.unsplash.com/photo-1563062046-fa310c25ebc1?w=400&h=300&fit=crop",
    instagram: "@lojanichel",
    facebook: "loja-nichel",
  },
  {
    nome: "Loja Amorá",
    cnpjOuCpf: "12.345.678/0001-13",
    endereco: "Rua Ramiro Barcelos, 2362",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "amora@email.com",
    telefone: "(51) 99905-5327",
    fotoUrl:
      "https://images.unsplash.com/photo-1554522586-a97e6c0e89e2?w=400&h=300&fit=crop",
    instagram: "@lojaamora",
    facebook: "loja-amora",
  },
  {
    nome: "Lojas Radan",
    cnpjOuCpf: "12.345.678/0001-14",
    endereco: "Rua Ramiro Barcelos, 1864",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja",
    email: "radan@email.com",
    telefone: "(51) 3057-2077",
    fotoUrl:
      "https://images.unsplash.com/photo-1534452204719-7ceafdc80ebc?w=400&h=300&fit=crop",
    instagram: "@lojasradan",
    facebook: "lojas-radan",
  },
  {
    nome: "Lojas Dullius",
    cnpjOuCpf: "12.345.678/0001-15",
    endereco: "Rua Ramiro Barcelos, 2197",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de moda feminina",
    email: "dullius@email.com",
    telefone: "(51) 3649-4680",
    fotoUrl:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop",
    instagram: "@lojasedullius",
    facebook: "lojas-dullius",
  },
  {
    nome: "Estilo Radical",
    cnpjOuCpf: "12.345.678/0001-16",
    endereco: "Rua Ramiro Barcelos, 1631",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "estiloradical@email.com",
    telefone: "(51) 3654-5678",
    fotoUrl:
      "https://images.unsplash.com/photo-1571746148091-7e08d98dcd9c?w=400&h=300&fit=crop",
    instagram: "@estiloradical",
    facebook: "estilo-radical",
  },
  {
    nome: "Loja Espaço Filhos da Mata",
    cnpjOuCpf: "12.345.678/0001-17",
    endereco: "Rua Ramiro Barcelos, 2600",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de presentes",
    email: "espacofilhos@email.com",
    telefone: "(51) 99256-2630",
    fotoUrl:
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop",
    instagram: "@espacofilhosda",
    facebook: "espaco-filhos-da-mata",
  },
  {
    nome: "Sabrina Atelier e Aviamentos",
    cnpjOuCpf: "12.345.678/0001-18",
    endereco: "Rua Ramiro Barcelos, 2131",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de roupas para ocasiões formais",
    email: "sabrina@email.com",
    telefone: "(51) 3632-5410",
    fotoUrl:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    instagram: "@sabrinaatelier",
    facebook: "sabrina-atelier",
  },
  {
    nome: "Lojas Madu - Loja 1",
    cnpjOuCpf: "12.345.678/0001-19",
    endereco: "Rua Ramiro Barcelos, 2206",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja",
    email: "madu@email.com",
    telefone: "(51) 2126-1261",
    fotoUrl:
      "https://images.unsplash.com/photo-1552062407-291826de9e82?w=400&h=300&fit=crop",
    instagram: "@lojasmadu",
    facebook: "lojas-madu",
  },
  {
    nome: "Lojas Reggla",
    cnpjOuCpf: "12.345.678/0001-20",
    endereco: "Rua Ramiro Barcelos, 2485",
    cidade: "Montenegro",
    estado: "RS",
    descricao: "Loja de Roupa",
    email: "reggla@email.com",
    telefone: "(51) 99719-5020",
    fotoUrl:
      "https://images.unsplash.com/photo-1552062407-291826de9e82?w=400&h=300&fit=crop",
    instagram: "@lojasreggla",
    facebook: "lojas-reggla",
  },
];

const productsByCategory = {
  "Roupa": [
    "Camiseta Básica",
    "Calça Jeans",
    "Vestido Social",
    "Blusa Feminina",
    "Jaqueta de Couro",
    "Shorts",
    "Pijama Canelado",
    "Saia Midi",
  ],
  "Bazar": [
    "Jogo de Toalhas",
    "Cortinas",
    "Almofadas",
    "Tapete",
    "Jogo de Cama",
    "Panelas",
    "Talheres",
  ],
  "Artigos Domésticos": [
    "Panela Antiaderente",
    "Jogo de Copos",
    "Escorredor de Macarrão",
    "Abridor de Lata",
    "Peneira",
    "Ralador",
    "Faca de Manteiga",
  ],
  "Utilidades Domésticas": [
    "Vassoura",
    "Pá de Lixo",
    "Rodo",
    "Pano de Prato",
    "Esponja",
    "Detergente",
    "Desinfetante",
  ],
  "Presentes": [
    "Vela Aromática",
    "Difusor de Aromas",
    "Caixa de Presente",
    "Moldura Digital",
    "Luminária Decorativa",
    "Quadro para Parede",
  ],
  "Moda Feminina": [
    "Bolsa Feminina",
    "Sapato Confortável",
    "Meia Calça",
    "Sutiã",
    "Calçado Social",
    "Sandália de Verão",
  ],
  "Roupa de Designer": [
    "Vestido de Designer",
    "Jaqueta Premium",
    "Calça Importada",
    "Blusa Estilizada",
  ],
  "Loja de Departamento": [
    "Eletrônicos",
    "Livros",
    "Brinquedos",
    "Artigos Esportivos",
    "Decoração",
  ],
};

async function main() {
  console.log("🌱 Iniciando seed da base de dados...");

  try {
    // Clear existing data
    console.log("🗑️  Limpando dados existentes...");
    await prisma.anuncio.deleteMany({});
    await prisma.tabelaDePreco.deleteMany({});
    await prisma.producto.deleteMany({});
    await prisma.grupoDeProductos.deleteMany({});
    await prisma.usuarioAnunciante.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.anunciante.deleteMany({});

    console.log("✅ Dados anterior removidos");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.usuario.create({
      data: {
        nome: "Administrador",
        email: "admin@vitrii.com",
        senha: adminPassword,
        cpf: "00000000000",
        telefone: "(51) 99999-9999",
        endereco: "Rua Ramiro Barcelos, Montenegro",
        tipoUsuario: "adm",
      },
    });

    console.log("✅ Usuário administrador criado");

    // Create stores (Anunciantes)
    const anunciantes = [];
    for (const storeData of stores) {
      const anunciante = await prisma.anunciante.create({
        data: {
          nome: storeData.nome,
          cnpjOuCpf: storeData.cnpjOuCpf,
          endereco: storeData.endereco,
          cidade: storeData.cidade,
          estado: storeData.estado,
          descricao: storeData.descricao,
          email: storeData.email,
          instagram: storeData.instagram,
          facebook: storeData.facebook,
          fotoUrl: storeData.fotoUrl,
        },
      });

      // Create a user for each store
      const userPassword = await bcrypt.hash("loja123", 10);
      const user = await prisma.usuario.create({
        data: {
          nome: storeData.nome,
          email: storeData.email,
          senha: userPassword,
          cpf: `${String(anunciante.id).padStart(11, "0")}`,
          telefone: storeData.telefone,
          endereco: storeData.endereco,
          tipoUsuario: "comum",
        },
      });

      // Associate user with store
      await prisma.usuarioAnunciante.create({
        data: {
          usuarioId: user.id,
          anuncianteId: anunciante.id,
          tipoUsuario: "administrador",
        },
      });

      anunciantes.push({ store: anunciante, user });

      console.log(`✅ Loja criada: ${anunciante.nome}`);
    }

    console.log(`✅ ${anunciantes.length} lojas e usuários criados`);

    // Create product groups, products and announcements
    let totalProducts = 0;
    let totalAds = 0;

    for (const { store } of anunciantes) {
      // Determine category based on store description
      let category = Object.keys(productsByCategory).find((key) =>
        store.descricao.toLowerCase().includes(key.toLowerCase()),
      );

      if (!category) {
        category = store.descricao.includes("Roupa") ? "Roupa" : "Artigos Domésticos";
      }

      // Create product group
      const grupoDeProductos = await prisma.grupoDeProductos.create({
        data: {
          anuncianteId: store.id,
          nome: category,
          descricao: `Produtos de ${category} da ${store.nome}`,
        },
      });

      // Get products for this category
      const categoryProducts = productsByCategory[category as keyof typeof productsByCategory] || [];

      // Create products
      for (let i = 0; i < 3; i++) {
        const productName =
          categoryProducts[i % categoryProducts.length] || `Produto ${i + 1}`;

        const producto = await prisma.producto.create({
          data: {
            grupoId: grupoDeProductos.id,
            nome: productName,
            descricao: `${productName} de qualidade premium da ${store.nome}`,
            tipo: "produto",
          },
        });

        // Create price table for product
        const preco = Math.random() * 200 + 20; // Random price between 20-220
        const tabelaDePreco = await prisma.tabelaDePreco.create({
          data: {
            productId: producto.id,
            anuncianteId: store.id,
            tamanho: ["P", "M", "G", "GG"][Math.floor(Math.random() * 4)] || undefined,
            preco: preco,
            precoCusto: preco * 0.6,
          },
        });

        // Create announcement
        const anuncio = await prisma.anuncio.create({
          data: {
            anuncianteId: store.id,
            productId: producto.id,
            tabelaDePrecoId: tabelaDePreco.id,
            titulo: `${productName} - ${store.nome}`,
            descricao: `Produto: ${productName}\nLoja: ${store.nome}\nCidade: ${store.cidade}\nTelefone: ${store.email}\n\nExcelente qualidade com melhor preço do mercado!`,
            fotoUrl: store.fotoUrl,
            precoAnuncio: preco,
            cidade: store.cidade,
            estado: store.estado,
            categoria: category.toLowerCase().replace(/\s+/g, "-"),
            status: "pago",
            dataValidade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        totalProducts++;
        totalAds++;
        console.log(
          `  ✅ Produto criado: ${productName} - Anúncio ID: ${anuncio.id}`,
        );
      }
    }

    console.log("\n📊 Resumo do Seed:");
    console.log(`✅ ${anunciantes.length} Lojas criadas`);
    console.log(`✅ ${anunciantes.length} Usuários criados`);
    console.log(`✅ ${totalProducts} Produtos criados`);
    console.log(`✅ ${totalAds} Anúncios criados`);
    console.log("\n🎉 Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro durante seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
