import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const nomes = [
  "João Silva", "Maria Santos", "José Oliveira", "Ana Costa", "Carlos Mendes",
  "Paula Sousa", "Pedro Martins", "Fernanda Rocha", "Ricardo Alves", "Juliana Dias",
  "André Ferreira", "Beatriz Cardoso", "Bruno Gomes", "Camila Pereira", "Daniel Ribeiro",
  "Eduarda Teixeira", "Eduardo Vaz", "Fabiana Matos", "Felipe Nascimento", "Francisca Barros",
  "Gabriel Barbosa", "Gabriela Lopes", "Gustavo Ramos", "Helena Freitas", "Henrique Monteiro",
  "Isabela Lourenço", "Igor Neves", "Ivana Soares", "Jair Carvalho", "Jasmine Leite",
  "Jefferson Magalhães", "Jéssica Araújo", "João Paulo", "Joana Machado", "Joceline Bastos",
  "Jorge Maia", "Joséfina Câmara", "Josué Cavalcante", "Jover Clemente", "Jovita Peixoto",
  "Juan Morales", "Jucilene Silva", "Judite Rosa", "Judson Félix", "Julieta Correia",
  "Júlio Monteiro", "Junot Vieira", "Juraci Tavares", "Jurema Campos", "Jurenilson Carpes",
  "Juracy Gusso", "Jurandi Leandro", "Jurandir Goulart", "Jurandy Souto", "Jurão Melo",
  "Jurará Mattos", "Jurassis Trindade", "Jure Cintra", "Jurema Lira", "Juremildo Dantas",
  "Kátia Souza", "Kaio Leandro", "Kamila Rocha", "Karol Dias", "Karla Pimentel",
  "Kassandra Faria", "Katiana Barbosa", "Kaue Mendes", "Kayky Siqueira", "Keila Medeiros",
  "Kelson Vinagre", "Kelvin Brito", "Kemilly Araújo", "Kenan Caldas", "Kendall Cristo",
  "Kenndy Costa", "Keno Simas", "Kenzo Martins", "Kepler Rodrígues", "Kercia Vieira",
  "Kerliane Silva", "Kermit Flores", "Keron Barbosa", "Kerryn Perez", "Kerson Peixoto",
  "Kestrel Campos", "Ketley Ribeiro", "Keuze Bastos", "Keva Couto", "Kevanice Prado",
  "Keven Sousa", "Keverson Costa", "Kevin Oliveira", "Kevlin Carvalho", "Keyna Belém",
  "Keyra Freitas", "Kezia Gomes", "Kherola Paes", "Khloe Brasil", "Kian Neves",
  "Kiara Lemos", "Kibby Monteiro", "Kiele Machado", "Kieran Macedo", "Kieria Brito",
  "Kiesco Rocha", "Kiezo Dias", "Kif Oliveira", "Kifa Maia", "Kiffer Cabral",
  "Kiguel Duarte", "Kihan Magalhães", "Kilas Marques", "Kilian Assis", "Kiliane Silva",
  "Killian Cezar", "Kilobyte Alves", "Kilômetro Santos", "Kiltina Rocha", "Kima Souza",
  "Kimberely Gomes", "Kimberly Dantas", "Kimbrian Ferreira", "Kimidri Oliveira", "Kimitri Ribeiro",
  "Kina Bastos", "Kinaldo Campos", "Kinallen Couto", "Kinara Neves", "Kinarco Rocha",
  "Kinarcy Maia", "Kinard Pereira", "Kinari Duarte", "Kinaris Assis", "Kinaro Siqueira",
  "Kinassa Silva", "Kinata Costa", "Kinavane Marques", "Kinaya Barbosa", "Kinaza Brites",
  "Kincade Lourenço", "Kincanal Santos", "Kincela Costa", "Kincey Mendes", "Kinchul Gomes",
  "Kinda Tavares", "Kindara Monteiro", "Kindarcy Dantas", "Kindarla Dias", "Kinday Carvalho",
  "Kinde Ramos", "Kindea Silva", "Kindell Costa", "Kinder Ferreira", "Kinderson Oliveira",
  "Kinderyl Bastos", "Kindeson Campos", "Kindessy Rocha", "Kindiana Pereira", "Kindiara Maia",
  "Kindiase Duarte", "Kindiberto Assis", "Kindiby Siqueira", "Kindic Silva", "Kindico Costa",
  "Kindifa Marques", "Kindigem Barbosa", "Kindigu Brites", "Kindiley Lourenço", "Kindilo Santos",
  "Kindilson Costa", "Kindilyn Mendes", "Kindim Gomes", "Kindina Tavares", "Kindio Monteiro",
  "Kindiof Dantas", "Kindion Silva", "Kindire Costa", "Kindirley Ferreira", "Kindisa Oliveira",
  "Kindisena Bastos", "Kindison Campos", "Kindissy Rocha", "Kindita Pereira", "Kinditala Maia",
  "Kinditana Silva", "Kinditandy Costa", "Kinditania Duarte", "Kinditania Assis", "Kinditanis Siqueira",
  "Kinditalba Silva", "Kinditânia Costa", "Kindite Marques", "Kindité Barbosa", "Kinditeo Brites",
  "Kinditéo Lourenço", "Kinditércia Santos", "Kinditéres Costa", "Kinditérfio Mendes", "Kinditérgio Gomes",
  "Kinditéria Tavares", "Kindith Monteiro", "Kindithá Dantas", "Kindithã Silva", "Kinditháci Costa",
  "Kindithacio Ferreira", "Kindithal Oliveira", "Kindithan Bastos", "Kindithane Campos", "Kindithani Rocha",
  "Kindithanie Pereira", "Kindithanio Maia", "Kindithanita Duarte", "Kindithanna Assis", "Kindithanny Siqueira",
  "Kindithano Silva", "Kindithanor Costa", "Kindithanos Marques", "Kindithansa Barbosa", "Kindithansea Brites",
  "Kindithanese Lourenço", "Kindithansela Santos", "Kindithanselia Costa", "Kindithansina Mendes", "Kindithansio Gomes",
  "Kindithanson Tavares", "Kindithansons Monteiro", "Kindithansy Dantas", "Kindithanta Silva", "Kindithantais Costa",
  "Kindithantala Ferreira", "Kindithantale Oliveira", "Kindithantali Bastos", "Kindithantalia Campos", "Kindithantalo Rocha",
];

const tiposContato = [
  "Cliente",
  "Fornecedor",
  "Parceiro",
  "Representante",
  "Consultor",
  "Outro",
];

const statusOptions = ["ativo", "inativo", "analise"];

function gerarCelular(): string {
  return `11 9${Math.floor(Math.random() * 80000000)
    .toString()
    .padStart(8, "0")}`;
}

function gerarEmail(nome: string): string {
  const [primeiro, ...resto] = nome.toLowerCase().split(" ");
  const sobrenome = resto.join("").substring(0, 5);
  const numero = Math.floor(Math.random() * 999);
  return `${primeiro}${sobrenome}${numero}@email.com`;
}

function gerarTelefone(): string {
  return `11 ${Math.floor(3000 + Math.random() * 6000)}-${Math.floor(1000 + Math.random() * 8999)}`;
}

async function main() {
  console.log("🌱 Iniciando seed de 300 contatos fictícios para usuário ID 2...");

  const contatos = [];
  const usuarioId = 2;

  // Gerar 300 contatos
  for (let i = 0; i < 300; i++) {
    const nome = nomes[i % nomes.length] + (i > nomes.length ? ` ${i}` : "");
    const tipoContato = tiposContato[Math.floor(Math.random() * tiposContato.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    contatos.push({
      usuarioId,
      nome,
      celular: gerarCelular(),
      telefone: gerarTelefone(),
      email: gerarEmail(nome),
      tipoContato,
      status: status as "ativo" | "inativo" | "analise",
      observacoes: `Contato fictício para teste de paginação - #${i + 1}`,
      anuncianteId: null,
      imagem: null,
    });
  }

  try {
    const resultado = await prisma.contatos.createMany({
      data: contatos,
      skipDuplicates: true,
    });

    console.log(
      `✅ Seed concluído! ${resultado.count} contatos foram criados com sucesso.`
    );
  } catch (error) {
    console.error("❌ Erro ao criar contatos:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
