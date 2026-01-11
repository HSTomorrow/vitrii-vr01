import prisma from "../server/lib/prisma";
import bcrypt from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

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
  },
];

const productsByCategory = {
  "Roupa": [
    "Camiseta Básica",
    "Calça Jeans",
    "Vestido Social",
    "Blusa Feminina",
    "Jaqueta de Couro",
  ],
  "Bazar": [
    "Jogo de Toalhas",
    "Cortinas",
    "Almofadas",
    "Tapete",
  ],
  "Utilidades Domésticas": [
    "Vassoura",
    "Pá de Lixo",
    "Rodo",
    "Pano de Prato",
  ],
};

async function main() {
  console.log("🌱 Iniciando seed da base de dados...");

  try {
    // Clear existing data in correct order (respecting foreign keys)
    console.log("🗑️  Limpando dados existentes...");
    await prisma.membros_equipe.deleteMany({});
    await prisma.equipes_de_venda.deleteMany({});
    await prisma.anuncios.deleteMany({});
    await prisma.movimentos_estoque.deleteMany({});
    await prisma.productos_visualizacoes.deleteMany({});
    await prisma.produtos_em_estoque.deleteMany({});
    await prisma.tabelas_preco.deleteMany({});
    await prisma.movimientos_estoque.deleteMany({});
    await prisma.usuarios_anunciantes.deleteMany({});
    await prisma.fotos_grupos.deleteMany({});
    await prisma.qrcodes_chamadas.deleteMany({});
    await prisma.qrcodes.deleteMany({});
    await prisma.productos.deleteMany({});
    await prisma.grupos_productos.deleteMany({});
    await prisma.usracessos.deleteMany({});
    await prisma.anunciantes.deleteMany({});

    console.log("✅ Dados anteriores removidos");

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await prisma.usracessos.create({
      data: {
        nome: "Administrador",
        email: "admin@vitrii.com",
        senha: adminPassword,
        cpf: "00000000000",
        telefone: "(51) 99999-9999",
        tipoUsuario: "adm",
        endereco: "Rua Ramiro Barcelos, Montenegro",
        dataAtualizacao: new Date(),
      },
    });

    console.log("✅ Usuário administrador criado");

    // Create stores (Anunciantes) and associated users
    const anunciantes = [];
    for (const storeData of stores) {
      // Create store
      const anunciante = await prisma.anunciantes.create({
        data: {
          nome: storeData.nome,
          cnpj: storeData.cnpjOuCpf,
          endereco: storeData.endereco,
          cidade: storeData.cidade,
          estado: storeData.estado,
          descricao: storeData.descricao,
          email: storeData.email,
          telefone: storeData.telefone,
          dataAtualizacao: new Date(),
        },
      });

      // Create user for store
      const userPassword = await bcrypt.hash("loja123", 10);
      const user = await prisma.usracessos.create({
        data: {
          nome: storeData.nome,
          email: storeData.email,
          senha: userPassword,
          cpf: `${String(anunciante.id).padStart(11, "0")}`,
          telefone: storeData.telefone,
          tipoUsuario: "comum",
          endereco: storeData.endereco,
          dataAtualizacao: new Date(),
        },
      });

      // Associate user with store
      await prisma.usuarios_anunciantes.create({
        data: {
          usuarioId: user.id,
          anuncianteId: anunciante.id,
          papel: "administrador",
        },
      });

      // Create sales team for store
      const equipe = await prisma.equipes_de_venda.create({
        data: {
          anuncianteId: anunciante.id,
          nome: `Equipe ${storeData.nome}`,
          descricao: `Equipe de vendas para ${storeData.nome}`,
          isActive: true,
        },
      });

      // Create team members
      const membros = [
        {
          nomeMembro: "João Silva",
          email: `joao@${storeData.email.split("@")[1]}`,
          whatsapp: "(51) 99111-1111",
        },
        {
          nomeMembro: "Maria Santos",
          email: `maria@${storeData.email.split("@")[1]}`,
          whatsapp: "(51) 99222-2222",
        },
      ];

      for (const membro of membros) {
        await prisma.membros_equipe.create({
          data: {
            equipeId: equipe.id,
            usuarioId: user.id,
            nomeMembro: membro.nomeMembro,
            email: membro.email,
            whatsapp: membro.whatsapp,
            status: "disponivel",
          },
        });
      }

      anunciantes.push({ store: anunciante, user });
      console.log(`✅ Loja criada: ${anunciante.nome} com equipe de vendas`);
    }

    console.log(`✅ ${anunciantes.length} lojas, usuários e equipes criados`);

    // Create products and announcements
    let totalProducts = 0;
    let totalAds = 0;

    for (const { store, user } of anunciantes) {
      // Determine category based on store description
      let category = Object.keys(productsByCategory).find((key) =>
        store.descricao?.toLowerCase().includes(key.toLowerCase()),
      );

      if (!category) {
        category = store.descricao?.includes("Roupa") ? "Roupa" : "Utilidades Domésticas";
      }

      // Create product group
      const grupoDeProductos = await prisma.grupos_productos.create({
        data: {
          lojaId: store.id,
          nome: category,
          descricao: `Produtos de ${category} da ${store.nome}`,
        },
      });

      // Get products for this category
      const categoryProducts = productsByCategory[category as keyof typeof productsByCategory] || [];

      // Create products and announcements
      for (let i = 0; i < 3; i++) {
        const productName =
          categoryProducts[i % categoryProducts.length] || `Produto ${i + 1}`;

        const producto = await prisma.productos.create({
          data: {
            lojaId: store.id,
            grupoId: grupoDeProductos.id,
            nome: productName,
            descricao: `${productName} de qualidade premium da ${store.nome}`,
            dataAtualizacao: new Date(),
          },
        });

        // Create price table for product
        const preco = Math.random() * 200 + 20; // Random price between 20-220
        await prisma.tabelas_preco.create({
          data: {
            productId: producto.id,
            lojaId: store.id,
            tamanho: ["P", "M", "G", "GG"][Math.floor(Math.random() * 4)] || undefined,
            preco: new Decimal(preco.toString()),
            dataAtualizacao: new Date(),
          },
        });

        // Create announcement
        const anuncio = await prisma.anuncios.create({
          data: {
            usuarioId: user.id,
            anuncianteId: store.id,
            titulo: `${productName} - ${store.nome}`,
            descricao: `Produto: ${productName}\nLoja: ${store.nome}\nCidade: ${store.cidade}\nTelefone: ${store.telefone}\n\nExcelente qualidade com melhor preço do mercado!`,
            preco: new Decimal(preco.toString()),
            categoria: category.toLowerCase().replace(/\s+/g, "-"),
            status: "ativo",
            cidade: store.cidade,
            estado: store.estado,
            dataAtualizacao: new Date(),
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
    console.log(`✅ ${anunciantes.length} Equipes de venda criadas`);
    console.log(`✅ ${anunciantes.length * 2} Membros de equipe criados`);
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
