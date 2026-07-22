import { prisma } from "./prisma";

const SUPORTE_NOME = "Suporte Vitrii";

// Lazily creates (once) the reserved anunciante used as the "other side" of
// every support chat conversa, so no manual seed step is required.
export async function getOrCreateSuporteAnunciante() {
  const existente = await prisma.anunciantes.findFirst({
    where: { isSuporte: true },
  });
  if (existente) return existente;

  return prisma.anunciantes.create({
    data: {
      nome: SUPORTE_NOME,
      cidade: "-",
      estado: "BR",
      status: "Ativo",
      isSuporte: true,
      dataAtualizacao: new Date(),
    },
  });
}
