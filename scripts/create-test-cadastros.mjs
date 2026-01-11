import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log("🚀 Creating test data for all cadastro menu items...\n");

    // 1. Create test Anunciante (Store)
    console.log("1️⃣ Creating test Anunciante (Loja)...");
    const anunciante = await prisma.anunciantes.upsert({
      where: { id: 999 }, // Use a high ID to avoid conflicts
      update: {},
      create: {
        id: 999,
        nome: "Loja Teste - Menu",
        cidade: "São Paulo",
        estado: "SP",
        cnpj: "12345678901234",
        endereco: "Rua Teste, 123",
        email: "loja-teste@vitrii.com",
        telefone: "(11) 98765-4321",
        cep: "01234567",
        descricao: "Loja de teste para o menu de cadastros",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Anunciante criado/atualizado: ${anunciante.nome}\n`);

    // 2. Create test Grupo de Produtos (Product Group)
    console.log("2️⃣ Creating test Grupo de Productos...");
    const grupo = await prisma.grupos_produtos.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        lojaId: anunciante.id,
        nome: "Grupo Teste - Menu",
        descricao: "Grupo de teste para o menu de cadastros",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Grupo de Produtos criado/atualizado: ${grupo.nome}\n`);

    // 3. Create test Producto (Product)
    console.log("3️⃣ Creating test Producto...");
    const producto = await prisma.productos.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        grupoId: grupo.id,
        nome: "Produto Teste - Menu",
        descricao: "Produto de teste para o menu de cadastros",
        sku: "SKU-TEST-999",
        tipo: "produto",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Producto criado/atualizado: ${producto.nome}\n`);

    // 4. Create test Tabela de Preço (Price Table)
    console.log("4️⃣ Creating test Tabela de Preço...");
    const tabela = await prisma.tabelas_preco.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        productId: producto.id,
        anuncianteId: anunciante.id,
        preco: 99.90,
        precoCusto: 50.00,
        tamanho: "Único",
        cor: "Padrão",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Tabela de Preço criada/atualizada: R$ ${tabela.preco}\n`);

    // 5. Create test Variante via Price Table (P+G variation)
    console.log("5️⃣ Creating test Variante (via Tabela de Preço variation)...");
    const variante = await prisma.tabelas_preco.create({
      data: {
        productId: producto.id,
        anuncianteId: anunciante.id,
        preco: 109.90,
        precoCusto: 60.00,
        tamanho: "M",
        cor: "Azul",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Variante criada: ${variante.tamanho}/${variante.cor} - R$ ${variante.preco}\n`);

    // 6. Create test Equipe de Venda (Sales Team)
    console.log("6️⃣ Creating test Equipe de Venda...");
    const equipe = await prisma.equipes_de_venda.upsert({
      where: { id: 999 },
      update: {},
      create: {
        id: 999,
        anuncianteId: anunciante.id,
        nome: "Equipe Teste - Menu",
        descricao: "Equipe de teste para o menu de cadastros",
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Equipe de Venda criada/atualizada: ${equipe.nome}\n`);

    console.log("🎉 Todos os dados de teste foram criados/atualizados com sucesso!");
    console.log("\n📋 Resumo:");
    console.log(`  - Anunciante: ${anunciante.nome} (ID: ${anunciante.id})`);
    console.log(`  - Grupo de Productos: ${grupo.nome} (ID: ${grupo.id})`);
    console.log(`  - Producto: ${producto.nome} (ID: ${producto.id})`);
    console.log(`  - Tabela de Preço: R$ ${tabela.preco} (ID: ${tabela.id})`);
    console.log(`  - Variante: ${variante.nome} (ID: ${variante.id})`);
    console.log(`  - Equipe de Venda: ${equipe.nome} (ID: ${equipe.id})`);
  } catch (error) {
    console.error("❌ Erro ao criar dados de teste:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
