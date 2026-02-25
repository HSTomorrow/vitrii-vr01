import prisma from "../server/lib/prisma";
import bcryptjs from "bcryptjs";

async function main() {
  try {
    console.log("🔄 Repopulando banco de dados com dados de teste...\n");

    // Clear existing data first
    console.log("🗑️  Limpando dados existentes...");
    await prisma.anuncios.deleteMany({});
    await prisma.usuarios_anunciantes.deleteMany({});
    await prisma.anunciantes.deleteMany({});
    await prisma.usracessos.deleteMany({});
    await prisma.localidades.deleteMany({});
    console.log("✅ Banco limpo\n");

    // Create admin user
    const adminPassword = await bcryptjs.hash("Admin@2024", 10);
    const admin = await prisma.usracessos.create({
      data: {
        nome: "Administrador",
        email: "vitriimarketplace@gmail.com",
        senha: adminPassword,
        cpf: "12345678901",
        tipoUsuario: "adm",
        status: "ativo",
        tassinatura: "Master",
        maxAnunciosAtivos: 1000,
        telefone: "51999999999",
        whatsapp: "51999999999",
      },
    });
    console.log("✅ Usuário Admin criado:");
    console.log(`   Email: vitriimarketplace@gmail.com`);
    console.log(`   Senha: Admin@2024\n`);

    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const password = await bcryptjs.hash("Teste@2024", 10);
      const user = await prisma.usracessos.create({
        data: {
          nome: `Usuário Teste ${i}`,
          email: `usuario${i}@vitrii.com.br`,
          senha: password,
          cpf: `${10000000000 + i}`,
          tipoUsuario: "comum",
          status: "ativo",
          tassinatura: "Gratuito",
          telefone: `5199999999${i}`,
          whatsapp: `5199999999${i}`,
        },
      });
      testUsers.push(user);
      console.log(`✅ Usuário ${i} criado: usuario${i}@vitrii.com.br (Senha: Teste@2024)`);
    }

    // Create some localidades
    console.log("\n🏙️  Criando localidades...");
    const localidade1 = await prisma.localidades.create({
      data: {
        codigo: "4314902",
        municipio: "Montenegro",
        estado: "RS",
        descricao: "Montenegro - Rio Grande do Sul",
        status: "ativo",
      },
    });
    console.log(`✅ Localidade criada: ${localidade1.municipio}, ${localidade1.estado}`);

    const localidade2 = await prisma.localidades.create({
      data: {
        codigo: "4314200",
        municipio: "Novo Hamburgo",
        estado: "RS",
        descricao: "Novo Hamburgo - Rio Grande do Sul",
        status: "ativo",
      },
    });
    console.log(`✅ Localidade criada: ${localidade2.municipio}, ${localidade2.estado}`);

    // Create anunciantes (vendors)
    console.log("\n🏪 Criando anunciantes...");
    const anunciante1 = await prisma.anunciantes.create({
      data: {
        nome: "Loja Teste 1",
        email: "loja1@vitrii.com.br",
        telefone: "51999999991",
        whatsapp: "51999999991",
        endereco: "Rua das Flores, 123, Montenegro, RS",
        cidade: "Montenegro",
        estado: "RS",
        status: "Ativo",
        localidadeId: localidade1.id,
        dataAtualizacao: new Date(),
      },
    });
    console.log(`✅ Anunciante criado: ${anunciante1.nome}`);

    // Link user to anunciante
    await prisma.usuarios_anunciantes.create({
      data: {
        usuarioId: testUsers[0].id,
        anuncianteId: anunciante1.id,
        papel: "owner",
      },
    });

    // Create test anuncios (ads)
    console.log("\n📢 Criando anúncios de teste...");
    const adTypes = ["produto", "servico", "evento", "agenda_recorrente", "oportunidade"];

    for (let i = 1; i <= 10; i++) {
      await prisma.anuncios.create({
        data: {
          usuarioId: testUsers[0].id,
          anuncianteId: anunciante1.id,
          titulo: `Produto Teste ${i}`,
          descricao: `Descrição do produto teste número ${i}`,
          tipo: adTypes[i % adTypes.length],
          preco: Math.random() * 500 + 10,
          status: "ativo",
          destaque: i <= 5, // First 5 are featured
          ordem: i,
          cidade: "Montenegro",
          estado: "RS",
          isDoacao: false,
          dataCriacao: new Date(),
          dataAtualizacao: new Date(),
        },
      });
    }
    console.log("✅ 10 anúncios criados (5 em destaque)");

    console.log("\n✨ Base de dados repopulada com sucesso!");
    console.log("\n📝 Credenciais para teste:");
    console.log("   Admin: vitriimarketplace@gmail.com / Admin@2024");
    console.log("   User: usuario1@vitrii.com.br / Teste@2024");
    console.log("\n");

  } catch (error) {
    console.error("❌ Erro ao repovoar banco:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
