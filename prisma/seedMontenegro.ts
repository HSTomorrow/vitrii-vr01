import { PrismaClient } from "@prisma/client";
import { fakerPT_BR as faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

// ADDITIVE seed: creates new fictitious data without touching or deleting anything
// that already exists. Safe to run against a database that has real users.
//
// All accounts use the email domain "example.com" (IANA-reserved for
// documentation/testing, never a real mailbox) so seeded data is trivially
// identifiable and nobody real ever receives anything from it.

const prisma = new PrismaClient();

const CIDADE = "Montenegro";
const ESTADO = "RS";
const TEST_PASSWORD = "Teste@Vitrii2026";
const EMAIL_DOMAIN = "example.com";

// Surnames common in the Vale do Caí / Montenegro-RS region (German colonization
// heritage) mixed with common Brazilian surnames, for realistic local flavor.
const SOBRENOMES_REGIONAIS = [
  "Schmidt", "Kunzler", "Hoffmann", "Bortolaso", "Feldmann", "Wagner", "Klein",
  "Weber", "Fischer", "Muller", "Zimmer", "Krause", "Lehnen", "Roos", "Stein",
  "Silva", "Souza", "Oliveira", "Pereira", "Costa", "Almeida", "Ribeiro",
];

// A handful of real, publicly-known businesses registered in Montenegro-RS
// (national retail chain branch + local metalworking/industrial companies),
// used as the advertiser "nome" per the user's request. Contact details
// (email/phone/cnpj) are entirely fictional placeholders, not the real ones.
type PerfilNegocio = { nome: string; tipo: string; categoria: string };

const NEGOCIOS_REAIS: PerfilNegocio[] = [
  { nome: "Lojas Colombo - Montenegro", tipo: "Profissional", categoria: "Eletrodomésticos e Móveis" },
  { nome: "Lojas MM Móveis e Eletro", tipo: "Profissional", categoria: "Móveis" },
  { nome: "Metalúrgica Jalmak", tipo: "Profissional", categoria: "Metalurgia e Serviços Industriais" },
  { nome: "Tecforj Metalúrgica", tipo: "Profissional", categoria: "Metalurgia e Serviços Industriais" },
  { nome: "Erplasti Indústria e Comércio de Plásticos", tipo: "Profissional", categoria: "Plásticos e Embalagens" },
  { nome: "Comércio de Ferros Bortolaso", tipo: "Profissional", categoria: "Materiais de Construção" },
];

// Realistic fictional small businesses styled after Montenegro-RS's known
// character: German colonial heritage, the Rio Caí, the Festa da Bergamota
// Montenegrina, and the Feira do Peixe Vivo.
const NEGOCIOS_FICTICIOS = [
  { nome: "Padaria Colonial Montenegrina", categoria: "Padaria e Confeitaria" },
  { nome: "Padaria Casa Alemã", categoria: "Padaria e Confeitaria" },
  { nome: "Doceria Bergamota do Vale", categoria: "Doces e Sobremesas" },
  { nome: "Cristal Doces & Cia", categoria: "Doces e Sobremesas" },
  { nome: "Peixaria Rio Caí", categoria: "Peixes e Frutos do Mar" },
  { nome: "Peixes Frescos do Vale", categoria: "Peixes e Frutos do Mar" },
  { nome: "Marcenaria Kunzler", categoria: "Móveis" },
  { nome: "Móveis Vale do Caí", categoria: "Móveis" },
  { nome: "Salão Bela Montenegrina", categoria: "Beleza e Estética" },
  { nome: "Barbearia do Vale", categoria: "Beleza e Estética" },
  { nome: "Auto Peças Montenegro", categoria: "Automotivo" },
  { nome: "Oficina Schmidt", categoria: "Automotivo" },
  { nome: "Passeios Rio Caí Turismo", categoria: "Turismo e Lazer" },
  { nome: "Boutique Montenegrina", categoria: "Moda e Vestuário" },
  { nome: "Mercado Central Montenegro", categoria: "Mercado e Alimentação" },
  { nome: "Mercearia do Vale", categoria: "Mercado e Alimentação" },
  { nome: "Estúdio de Dança Montenegro", categoria: "Aulas e Cursos" },
  { nome: "Escola de Idiomas Vale do Caí", categoria: "Aulas e Cursos" },
  { nome: "Espaço de Festas Rio Caí", categoria: "Eventos" },
  { nome: "Buffet Bergamota", categoria: "Eventos" },
  { nome: "Agropecuária Vale do Caí", categoria: "Agropecuária" },
  { nome: "Sementes e Insumos Montenegro", categoria: "Agropecuária" },
  { nome: "Pet Shop Montenegrino", categoria: "Pet Shop" },
  { nome: "Assistência Técnica Vale do Caí", categoria: "Eletrônicos e Informática" },
  { nome: "Floricultura Jardim do Caí", categoria: "Flores e Presentes" },
  { nome: "Academia Vale Fitness", categoria: "Saúde e Bem-estar" },
  { nome: "Fisioterapia Montenegro", categoria: "Saúde e Bem-estar" },
  { nome: "Chaveiro e Fechaduras do Vale", categoria: "Serviços Gerais" },
  { nome: "Vidraçaria Montenegrina", categoria: "Serviços Gerais" },
  { nome: "Confeitaria Frau Ana", categoria: "Doces e Sobremesas" },
  { nome: "Restaurante Colonial do Caí", categoria: "Alimentação" },
  { nome: "Churrascaria Vale do Caí", categoria: "Alimentação" },
  { nome: "Papelaria Montenegro", categoria: "Papelaria" },
  { nome: "Ótica Vale do Caí", categoria: "Saúde e Bem-estar" },
  { nome: "Loja de Roupas Bella Cai", categoria: "Moda e Vestuário" },
  { nome: "Materiais de Construção Kunzler", categoria: "Materiais de Construção" },
  { nome: "Locação de Ferramentas Montenegro", categoria: "Ferramentas" },
  { nome: "Estética e Spa Rio Caí", categoria: "Beleza e Estética" },
  { nome: "Fotografia Montenegrina", categoria: "Serviços Gerais" },
  { nome: "Consultoria Agrícola do Vale", categoria: "Agropecuária" },
  { nome: "Adega Vale do Caí", categoria: "Alimentação" },
  { nome: "Empório Colonial", categoria: "Mercado e Alimentação" },
  { nome: "Bicicletaria Montenegro", categoria: "Esportes e Lazer" },
  { nome: "Loja de Instrumentos Musicais do Vale", categoria: "Música" },
];

// Free-to-use Unsplash images, grouped roughly by theme to match categories above.
const IMAGENS_POR_TEMA: Record<string, string[]> = {
  padaria: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&h=450&fit=crop",
  ],
  doces: [
    "https://images.unsplash.com/photo-1516559828984-fb3b99548b21?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=600&h=450&fit=crop",
  ],
  peixe: [
    "https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?w=600&h=450&fit=crop",
  ],
  moveis: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&h=450&fit=crop",
  ],
  metalurgia: [
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1581091870627-3c9d5a1c3f3d?w=600&h=450&fit=crop",
  ],
  beleza: [
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop",
  ],
  automotivo: [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&h=450&fit=crop",
  ],
  turismo: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1483168527879-c66136b56105?w=600&h=450&fit=crop",
  ],
  moda: [
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=450&fit=crop",
  ],
  mercado: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&h=450&fit=crop",
  ],
  aulas: [
    "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=450&fit=crop",
  ],
  eventos: [
    "https://images.unsplash.com/photo-1555244162-803834f70033?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1519167758993-c37df3a4e09f?w=600&h=450&fit=crop",
  ],
  agro: [
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=450&fit=crop",
  ],
  generico: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=450&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=450&fit=crop",
  ],
};

function imagensPorCategoria(categoria: string): string[] {
  const c = categoria.toLowerCase();
  if (c.includes("padaria")) return IMAGENS_POR_TEMA.padaria;
  if (c.includes("doce")) return IMAGENS_POR_TEMA.doces;
  if (c.includes("peixe")) return IMAGENS_POR_TEMA.peixe;
  if (c.includes("móve") || c.includes("move")) return IMAGENS_POR_TEMA.moveis;
  if (c.includes("metal") || c.includes("plástic") || c.includes("plastic") || c.includes("construção") || c.includes("ferramenta")) return IMAGENS_POR_TEMA.metalurgia;
  if (c.includes("beleza") || c.includes("saúde") || c.includes("saude")) return IMAGENS_POR_TEMA.beleza;
  if (c.includes("automotivo")) return IMAGENS_POR_TEMA.automotivo;
  if (c.includes("turismo") || c.includes("esporte")) return IMAGENS_POR_TEMA.turismo;
  if (c.includes("moda")) return IMAGENS_POR_TEMA.moda;
  if (c.includes("mercado") || c.includes("aliment")) return IMAGENS_POR_TEMA.mercado;
  if (c.includes("aula") || c.includes("curso") || c.includes("música") || c.includes("musica")) return IMAGENS_POR_TEMA.aulas;
  if (c.includes("evento")) return IMAGENS_POR_TEMA.eventos;
  if (c.includes("agro")) return IMAGENS_POR_TEMA.agro;
  return IMAGENS_POR_TEMA.generico;
}

function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function findOrCreateLocalidade() {
  return prisma.localidades.upsert({
    where: { municipio_estado: { municipio: CIDADE, estado: ESTADO } },
    update: {},
    create: {
      codigo: "RS-MONTENEGRO",
      municipio: CIDADE,
      estado: ESTADO,
      descricao: "Município do Vale do Caí, Rio Grande do Sul, conhecido pela colonização alemã, a Festa da Bergamota Montenegrina e a Feira do Peixe Vivo.",
      status: "ativo",
    },
  });
}

async function main() {
  console.log("🍇 Seed adicional: Montenegro-RS (50 usuários, 100 anúncios, dados de interação)");
  console.log("⚠️  Modo aditivo: nenhum dado existente será apagado.\n");

  const localidade = await findOrCreateLocalidade();
  console.log(`✅ Localidade "${CIDADE}/${ESTADO}" pronta (id ${localidade.id})`);

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // ============================================
  // 1. 50 USUÁRIOS
  // ============================================
  console.log("\n📝 Criando 50 usuários...");
  const usuarios = [];
  for (let i = 0; i < 50; i++) {
    const primeiroNome = faker.person.firstName();
    const sobrenome = faker.helpers.arrayElement(SOBRENOMES_REGIONAIS);
    const nome = `${primeiroNome} ${sobrenome}`;
    const emailBase = `${slugify(primeiroNome)}.${slugify(sobrenome)}${i}`;

    const usuario = await prisma.usracessos.create({
      data: {
        nome,
        email: `${emailBase}@${EMAIL_DOMAIN}`,
        senha: hashedPassword,
        cpf: faker.string.numeric(11),
        telefone: faker.string.numeric(11),
        whatsapp: faker.string.numeric(11),
        tipoUsuario: "common",
        tassinatura: "Gratuito",
        status: "ativo",
        emailVerificado: true,
        dataVigenciaContrato: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxAnunciosAtivos: 20,
        endereco: `${faker.location.street()}, Montenegro - RS`,
        localidadePadraoId: localidade.id,
      },
    });
    usuarios.push(usuario);
  }
  console.log(`✅ ${usuarios.length} usuários criados (senha de teste para todos: "${TEST_PASSWORD}")`);

  // ============================================
  // 2. 50 ANUNCIANTES (1 por usuário, nomes reais + fictícios de Montenegro-RS)
  // ============================================
  console.log("\n🏪 Criando 50 anunciantes...");
  const perfisNegocio: PerfilNegocio[] = [
    ...NEGOCIOS_REAIS,
    ...faker.helpers
      .shuffle(NEGOCIOS_FICTICIOS)
      .slice(0, 50 - NEGOCIOS_REAIS.length)
      .map((n) => ({ ...n, tipo: "Padrão" })),
  ];

  const anunciantes = [];
  for (let i = 0; i < perfisNegocio.length; i++) {
    const perfil = perfisNegocio[i];
    const usuario = usuarios[i];
    const slug = slugify(perfil.nome);

    const anunciante = await prisma.anunciantes.create({
      data: {
        nome: perfil.nome,
        tipo: perfil.tipo,
        descricao: `${perfil.nome} atende a região de ${CIDADE}/${ESTADO}. Categoria: ${perfil.categoria}.`,
        cnpj: faker.string.numeric(14),
        telefone: faker.string.numeric(11),
        whatsapp: faker.string.numeric(11),
        email: `contato.${slug}@${EMAIL_DOMAIN}`,
        endereco: `${faker.location.street()}, Centro`,
        cidade: CIDADE,
        estado: ESTADO,
        cep: "95780000",
        site: `https://${slug}.exemplo.com.br`,
        instagram: slug,
        chavePix: `${slug}@${EMAIL_DOMAIN}`.slice(0, 32),
        fotoUrl: imagensPorCategoria(perfil.categoria)[0],
        iconColor: faker.helpers.arrayElement(["azul", "verde", "rosa", "vermelho", "laranja"]),
        status: "Ativo",
        temAgenda: Math.random() > 0.7,
        localidadeId: localidade.id,
        dataAtualizacao: new Date(),
      },
    });
    anunciantes.push({ ...anunciante, categoria: perfil.categoria });

    await prisma.usuarios_anunciantes.create({
      data: { usuarioId: usuario.id, anuncianteId: anunciante.id, papel: "owner" },
    });

    await prisma.anunciantes_x_localidades.create({
      data: { anuncianteId: anunciante.id, localidadeId: localidade.id },
    });
  }
  console.log(`✅ ${anunciantes.length} anunciantes criados (${NEGOCIOS_REAIS.length} com nome de empresa real conhecida da cidade, ${anunciantes.length - NEGOCIOS_REAIS.length} fictícios de época/estilo local)`);

  // ============================================
  // 3. 100 ANÚNCIOS (com 2-3 fotos cada)
  // ============================================
  console.log("\n📢 Criando 100 anúncios com fotos...");
  const TIPOS_POR_CATEGORIA: Record<string, string> = {
    "Aulas e Cursos": "aulas_cursos",
    "Eventos": "evento",
  };

  const anuncios = [];
  for (let i = 0; i < 100; i++) {
    const anunciante = anunciantes[i % anunciantes.length];
    const usuarioDono = usuarios[anunciantes.indexOf(anunciante) % usuarios.length];
    const tipo = TIPOS_POR_CATEGORIA[anunciante.categoria] || "produto";
    const imagens = imagensPorCategoria(anunciante.categoria);
    const titulo = `${faker.commerce.productAdjective()} ${faker.commerce.product()} - ${anunciante.categoria}`.slice(0, 100);
    const permiteReservar = Math.random() > 0.6;

    const anuncio = await prisma.anuncios.create({
      data: {
        usuarioId: usuarioDono.id,
        anuncianteId: anunciante.id,
        titulo,
        descricao: `${faker.commerce.productDescription()} Disponível em ${CIDADE}/${ESTADO}, oferecido por ${anunciante.nome}.`.slice(0, 500),
        imagem: imagens[0],
        preco: tipo === "produto" || tipo === "servico" ? parseFloat(faker.commerce.price({ min: 15, max: 800 })) : parseFloat(faker.commerce.price({ min: 30, max: 300 })),
        categoria: anunciante.categoria,
        status: "ativo",
        tipo,
        isDoacao: false,
        aCombinar: Math.random() > 0.85,
        destaque: Math.random() > 0.75,
        ordem: 10,
        statusPagamento: "aprovado",
        cidade: CIDADE,
        estado: ESTADO,
        permiteReservar,
        quantidadeMaximaReservas: permiteReservar ? faker.number.int({ min: 1, max: 10 }) : null,
        quantidade: faker.number.int({ min: 1, max: 20 }),
        dataAtualizacao: new Date(),
      },
    });
    anuncios.push(anuncio);

    const fotosDoAnuncio = faker.helpers.arrayElements(
      [...imagens, ...IMAGENS_POR_TEMA.generico],
      faker.number.int({ min: 2, max: 3 }),
    );
    await prisma.fotos_anuncio.createMany({
      data: fotosDoAnuncio.map((url, ordem) => ({
        anuncio_id: anuncio.id,
        url,
        ordem: ordem + 1,
        criado_por: usuarioDono.id,
      })),
    });

    if ((i + 1) % 25 === 0) console.log(`  Progresso: ${i + 1}/100 anúncios...`);
  }
  console.log(`✅ ${anuncios.length} anúncios criados, cada um com 2-3 fotos`);

  // ============================================
  // 4. VISUALIZAÇÕES (dados de interação)
  // ============================================
  console.log("\n👁️  Registrando visualizações de anúncios...");
  const visualizacoes: { anuncioId: number; usuarioId: number | null }[] = [];
  for (const anuncio of anuncios) {
    const totalViews = faker.number.int({ min: 0, max: 15 });
    for (let v = 0; v < totalViews; v++) {
      const logado = Math.random() > 0.4;
      visualizacoes.push({
        anuncioId: anuncio.id,
        usuarioId: logado ? faker.helpers.arrayElement(usuarios).id : null,
      });
    }
  }
  await prisma.anuncioVisualizados.createMany({ data: visualizacoes });
  console.log(`✅ ${visualizacoes.length} visualizações registradas`);

  // ============================================
  // 5. LISTAS DE DESEJOS (dados de interação)
  // ============================================
  console.log("\n❤️  Criando listas de desejos...");
  let totalItensDesejo = 0;
  const usuariosComLista = faker.helpers.arrayElements(usuarios, 20);
  for (const usuario of usuariosComLista) {
    const lista = await prisma.listas_desejos.create({
      data: {
        usuarioId: usuario.id,
        titulo: faker.helpers.arrayElement([
          "Lista de Compras", "Achados em Montenegro", "Para o fim de semana", "Presentes", "Favoritos",
        ]),
        status: "privado",
      },
    });

    const itens = faker.helpers.arrayElements(anuncios, faker.number.int({ min: 2, max: 5 }));
    for (const anuncio of itens) {
      await prisma.listas_desejos_itens.create({
        data: {
          listaId: lista.id,
          tipo: "anuncio",
          titulo: anuncio.titulo,
          preco: anuncio.preco,
          anuncioId: anuncio.id,
        },
      });
      totalItensDesejo++;
    }
  }
  console.log(`✅ ${usuariosComLista.length} listas de desejos criadas com ${totalItensDesejo} itens`);

  // ============================================
  // 6. RESERVAS (dados de interação)
  // ============================================
  console.log("\n📅 Criando reservas de anúncios...");
  const anunciosReservaveis = anuncios.filter((a) => a.permiteReservar);
  const reservasFeitas = new Set<string>();
  let totalReservas = 0;
  for (const anuncio of faker.helpers.arrayElements(anunciosReservaveis, Math.min(15, anunciosReservaveis.length))) {
    const usuario = faker.helpers.arrayElement(usuarios);
    const chave = `${anuncio.id}-${usuario.id}`;
    if (reservasFeitas.has(chave)) continue;
    reservasFeitas.add(chave);

    await prisma.reservas_anuncio.create({
      data: {
        anuncioId: anuncio.id,
        usuarioId: usuario.id,
        observacao: "Reserva de teste gerada pelo seed de Montenegro-RS.",
        status: faker.helpers.arrayElement(["ativa", "ativa", "cancelada"]),
      },
    });
    totalReservas++;
  }
  console.log(`✅ ${totalReservas} reservas criadas`);

  // ============================================
  // 7. PAGAMENTOS (dados de interação)
  // ============================================
  console.log("\n💳 Criando pagamentos de exemplo...");
  let totalPagamentos = 0;
  for (const anuncio of faker.helpers.arrayElements(anuncios, 10)) {
    await prisma.pagamentos.create({
      data: {
        anuncioId: anuncio.id,
        valor: anuncio.preco ?? 50,
        status: faker.helpers.arrayElement(["pendente", "aprovado", "comprovante_enviado"]),
        tipo: "pix",
      },
    });
    totalPagamentos++;
  }
  console.log(`✅ ${totalPagamentos} pagamentos criados`);

  // ============================================
  // 8. CONVERSAS E MENSAGENS (dados de interação)
  // ============================================
  console.log("\n💬 Criando conversas e mensagens...");
  let totalMensagens = 0;
  const anunciosParaConversa = faker.helpers.arrayElements(anuncios, 25);
  for (const anuncio of anunciosParaConversa) {
    const comprador = faker.helpers.arrayElement(usuarios.filter((u) => u.id !== anuncio.usuarioId));

    const conversa = await prisma.conversas.create({
      data: {
        usuarioId: comprador.id,
        anuncianteId: anuncio.anuncianteId,
        anuncioId: anuncio.id,
        assunto: anuncio.titulo,
        tipo: "privada",
      },
    });

    const trocas = faker.number.int({ min: 2, max: 4 });
    for (let m = 0; m < trocas; m++) {
      const doComprador = m % 2 === 0;
      await prisma.mensagens.create({
        data: {
          conversaId: conversa.id,
          usuarioId: doComprador ? comprador.id : null,
          anuncianteId: doComprador ? null : anuncio.anuncianteId,
          conteudo: doComprador
            ? faker.helpers.arrayElement([
                `Olá! Esse item ainda está disponível?`,
                `Bom dia, gostaria de saber mais sobre "${anuncio.titulo}".`,
                `Consigo retirar aí em ${CIDADE} essa semana?`,
              ])
            : faker.helpers.arrayElement([
                `Olá! Sim, ainda está disponível.`,
                `Bom dia! Pode passar na loja em ${CIDADE} de segunda a sábado.`,
                `Claro, qualquer dúvida estou à disposição.`,
              ]),
          status: "lida",
        },
      });
      totalMensagens++;
    }
  }
  console.log(`✅ ${anunciosParaConversa.length} conversas criadas com ${totalMensagens} mensagens`);

  console.log("\n✨ SEED DE MONTENEGRO-RS CONCLUÍDO ✨");
  console.log("\n📊 Resumo:");
  console.log(`  • Usuários: ${usuarios.length} (senha de teste: "${TEST_PASSWORD}")`);
  console.log(`  • Anunciantes: ${anunciantes.length}`);
  console.log(`  • Anúncios: ${anuncios.length} (com fotos)`);
  console.log(`  • Visualizações: ${visualizacoes.length}`);
  console.log(`  • Listas de desejos: ${usuariosComLista.length} (${totalItensDesejo} itens)`);
  console.log(`  • Reservas: ${totalReservas}`);
  console.log(`  • Pagamentos: ${totalPagamentos}`);
  console.log(`  • Conversas: ${anunciosParaConversa.length} (${totalMensagens} mensagens)`);
}

main()
  .catch((error) => {
    console.error("❌ Erro durante o seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
