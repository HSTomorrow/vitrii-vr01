import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BRAZILIAN_CITIES = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Brasília",
  "Salvador",
  "Fortaleza",
  "Manaus",
  "Curitiba",
  "Recife",
  "Porto Alegre",
  "Goiânia",
  "Belém",
  "Guarulhos",
  "Campinas",
  "São Gonçalo",
  "Maceió",
  "Natal",
  "Santa Bárbara d'Oeste",
  "Osasco",
  "Teresina",
  "Sorocaba",
  "Ribeirão Preto",
  "Santos",
  "Uberlândia",
  "Piracicaba",
  "Palmas",
  "Parauapebas",
  "João Pessoa",
  "Jaboatão dos Guararapes",
  "Jundiaí",
];

const BRAZILIAN_STATES = [
  "SP",
  "RJ",
  "MG",
  "DF",
  "BA",
  "CE",
  "AM",
  "PR",
  "PE",
  "RS",
  "GO",
  "PA",
  "ES",
  "PB",
  "RN",
  "TO",
  "MA",
  "MT",
  "MS",
  "AC",
  "AP",
  "RO",
  "RR",
  "SC",
];

const PRODUCT_TYPES = ["produto", "servico", "evento", "agenda_recorrente", "oportunidade"];

// Images from Unsplash API - Free to use
const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", // laptop
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop", // phone
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop", // furniture
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop", // jewelry
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop", // shoes
  "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop", // clothes
  "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=300&fit=crop", // device
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop", // camera
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop", // watch
  "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop", // headphones
  "https://images.unsplash.com/photo-1519167758993-c37df3a4e09f?w=400&h=300&fit=crop", // shirt
  "https://images.unsplash.com/photo-1603561596411-07134e71a2a9?w=400&h=300&fit=crop", // bag
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop", // sunglasses
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop", // belt
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=300&fit=crop", // accessory
];

const ANUNCIANTE_TYPES = ["Padrão", "Profissional"];

const COLORS = ["azul", "verde", "rosa", "vermelho", "laranja"];

async function main() {
  try {
    console.log("🚀 Starting database seed...");
    console.log("⚙️  Clearing existing data...");

    // Clear existing data (in correct order due to foreign keys)
    await prisma.anuncios.deleteMany();
    await prisma.anunciantes.deleteMany();
    await prisma.usracessos.deleteMany();

    console.log("✅ Existing data cleared");

    // ============================================
    // 1. CREATE 100 USERS
    // ============================================
    console.log("\n📝 Creating 100 users...");
    const users = [];
    const hashedPassword = await bcrypt.hash("senha123", 10);

    for (let i = 0; i < 100; i++) {
      const user = await prisma.usracessos.create({
        data: {
          nome: faker.person.fullName().substring(0, 255),
          email: `user${i + 1}@vitrii.com.br`,
          senha: hashedPassword,
          cpf: faker.string.numeric(11),
          telefone: faker.string.numeric(11),
          tipoUsuario: i === 0 ? "adm" : "common",
          tassinatura: "Gratuito",
          dataVigenciaContrato: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          maxAnunciosAtivos: 50,
          endereco: faker.location.streetAddress().substring(0, 255),
        },
      });
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // ============================================
    // 2. CREATE 400 ANUNCIANTES
    // ============================================
    console.log("\n🏪 Creating 400 anunciantes...");
    const anunciantes = [];

    for (let i = 0; i < 400; i++) {
      const usuario = users[Math.floor(Math.random() * users.length)];
      const city = BRAZILIAN_CITIES[Math.floor(Math.random() * BRAZILIAN_CITIES.length)];
      const state = BRAZILIAN_STATES[Math.floor(Math.random() * BRAZILIAN_STATES.length)];

      const anunciante = await prisma.anunciantes.create({
        data: {
          nome: faker.company.name().substring(0, 255),
          tipo: ANUNCIANTE_TYPES[Math.floor(Math.random() * ANUNCIANTE_TYPES.length)],
          descricao: faker.company.catchPhrase().substring(0, 500),
          cnpj: faker.string.numeric(14),
          telefone: faker.string.numeric(11),
          email: faker.internet.email(),
          endereco: faker.location.streetAddress().substring(0, 255),
          cidade: city,
          estado: state,
          cep: faker.string.numeric(8),
          site: faker.internet.url().substring(0, 255),
          instagram: faker.internet.username().substring(0, 255),
          facebook: faker.internet.url().substring(0, 255),
          whatsapp: faker.string.numeric(11),
          chavePix: faker.string.alphanumeric(32),
          fotoUrl: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
          iconColor: COLORS[Math.floor(Math.random() * COLORS.length)],
          status: "Ativo",
          temAgenda: Math.random() > 0.7,
          dataAtualizacao: new Date(),
        },
      });
      anunciantes.push(anunciante);

      // Link user to anunciante
      await prisma.usuarios_anunciantes.create({
        data: {
          usuarioId: usuario.id,
          anuncianteId: anunciante.id,
          papel: "owner",
        },
      });
    }
    console.log(`✅ Created ${anunciantes.length} anunciantes`);

    // ============================================
    // 3. CREATE 1000 ANÚNCIOS
    // ============================================
    console.log("\n📢 Creating 1000 ads...");
    let anuncioCount = 0;
    let destaquesCount = 0;

    // Regular products/services (600 ads) + 400 highlights
    for (let i = 0; i < 1000; i++) {
      const anunciante = anunciantes[Math.floor(Math.random() * anunciantes.length)];
      const tipo =
        i < 560
          ? "produto"
          : i < 620
            ? "servico"
            : i < 649
              ? "evento"
              : i < 694
                ? "agenda_recorrente"
                : "oportunidade";
      const isDestaque = i < 400; // First 400 are featured

      const anuncio = await prisma.anuncios.create({
        data: {
          usuarioId: users[Math.floor(Math.random() * users.length)].id,
          anuncianteId: anunciante.id,
          titulo: faker.commerce.productName().substring(0, 100),
          descricao: faker.commerce.productDescription().substring(0, 500),
          imagem: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
          preco:
            tipo === "produto" || tipo === "servico"
              ? parseFloat(faker.commerce.price({ min: 10, max: 1000 }))
              : null,
          status: "ativo",
          tipo: tipo,
          isDoacao: false,
          aCombinar: Math.random() > 0.8,
          destaque: isDestaque,
          ordem: isDestaque ? Math.floor(Math.random() * 10) + 1 : 10,
          statusPagamento: isDestaque || tipo === "produto" ? "aprovado" : "pendente",
          cidade: anunciante.cidade,
          estado: anunciante.estado,
          dataAtualizacao: new Date(),
        },
      });

      anuncioCount++;
      if (isDestaque) destaquesCount++;

      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/1000 ads created...`);
      }
    }
    console.log(`✅ Created ${anuncioCount} ads (${destaquesCount} featured)`);

    // ============================================
    // 4. CREATE 40 DOAÇÕES/BRINDES/SERVIÇOS GRATUITOS
    // ============================================
    console.log("\n🎁 Creating 40 donations/gifts/free services...");
    for (let i = 0; i < 40; i++) {
      const anunciante = anunciantes[Math.floor(Math.random() * anunciantes.length)];
      const tipos = ["Doação", "Brinde", "Serviço Gratuito"];
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];

      await prisma.anuncios.create({
        data: {
          usuarioId: users[Math.floor(Math.random() * users.length)].id,
          anuncianteId: anunciante.id,
          titulo: `${tipo}: ${faker.commerce.productName().substring(0, 35)}`,
          descricao: faker.commerce.productDescription().substring(0, 500),
          imagem: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
          preco: 0,
          status: "ativo",
          tipo: "produto",
          isDoacao: true,
          destaque: true,
          ordem: Math.floor(Math.random() * 5) + 1,
          statusPagamento: "aprovado",
          cidade: anunciante.cidade,
          estado: anunciante.estado,
          dataAtualizacao: new Date(),
        },
      });
    }
    console.log(`✅ Created 40 donations/gifts/free services`);

    // ============================================
    // 5. CREATE 29 EVENTOS
    // ============================================
    console.log("\n🎉 Creating 29 events...");
    for (let i = 0; i < 29; i++) {
      const anunciante = anunciantes[Math.floor(Math.random() * anunciantes.length)];
      const eventTypes = [
        "Workshop",
        "Conferência",
        "Meetup",
        "Festa",
        "Show",
        "Lançamento",
        "Seminário",
      ];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      await prisma.anuncios.create({
        data: {
          usuarioId: users[Math.floor(Math.random() * users.length)].id,
          anuncianteId: anunciante.id,
          titulo: `${eventType}: ${faker.lorem.words(3).substring(0, 40)}`,
          descricao: faker.lorem.paragraph().substring(0, 500),
          imagem: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
          preco: parseFloat(faker.commerce.price({ min: 50, max: 500 })),
          status: "ativo",
          tipo: "evento",
          isDoacao: false,
          destaque: true,
          ordem: Math.floor(Math.random() * 5) + 1,
          statusPagamento: "aprovado",
          cidade: anunciante.cidade,
          estado: anunciante.estado,
          dataAtualizacao: new Date(),
        },
      });
    }
    console.log(`✅ Created 29 events`);

    // ============================================
    // 6. CREATE 45 AULAS E AGENDAS
    // ============================================
    console.log("\n📚 Creating 45 classes/schedules...");
    for (let i = 0; i < 45; i++) {
      const anunciante = anunciantes[Math.floor(Math.random() * anunciantes.length)];
      const courseTypes = [
        "Aula de",
        "Curso de",
        "Treinamento em",
        "Oficina de",
        "Palestra sobre",
      ];
      const subjects = [
        "Programação",
        "Design",
        "Negócios",
        "Idiomas",
        "Fitness",
        "Culinária",
        "Música",
        "Arte",
        "Fotografia",
        "Desenvolvimento Pessoal",
      ];
      const courseType = courseTypes[Math.floor(Math.random() * courseTypes.length)];
      const subject = subjects[Math.floor(Math.random() * subjects.length)];

      await prisma.anuncios.create({
        data: {
          usuarioId: users[Math.floor(Math.random() * users.length)].id,
          anuncianteId: anunciante.id,
          titulo: `${courseType} ${subject}`,
          descricao: faker.lorem.paragraph().substring(0, 500),
          imagem: PRODUCT_IMAGES[Math.floor(Math.random() * PRODUCT_IMAGES.length)],
          preco: parseFloat(faker.commerce.price({ min: 50, max: 300 })),
          status: "ativo",
          tipo: "agenda_recorrente",
          isDoacao: false,
          destaque: true,
          ordem: Math.floor(Math.random() * 5) + 1,
          statusPagamento: "aprovado",
          cidade: anunciante.cidade,
          estado: anunciante.estado,
          dataAtualizacao: new Date(),
        },
      });
    }
    console.log(`✅ Created 45 classes/schedules`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n✨ DATABASE SEED COMPLETED SUCCESSFULLY! ✨");
    console.log("\n📊 Summary:");
    console.log(`  • Users: 100 (1 admin + 99 regular)`);
    console.log(`  • Anunciantes: 400`);
    console.log(`  • Total Ads: 1000`);
    console.log(`    - Featured: 400`);
    console.log(`    - Donations/Gifts/Free: 40`);
    console.log(`    - Events: 29`);
    console.log(`    - Classes/Schedules: 45`);
    console.log(`    - Regular Products/Services: 486`);
    console.log(`\n✅ All data has been successfully inserted into the database!`);
  } catch (error) {
    console.error("❌ Error during seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
