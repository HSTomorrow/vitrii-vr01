import prisma from "./prisma";

// A usuario is linked to a contato when contatos_usuarios_links matched them by
// email/celular (server/routes/sync-contatos-usuarios.ts). This resolves that
// link down to the contato IDs the usuario is allowed to see under "Meus
// Compromissos", gated per-contato by visualizaAgenda/visualizaFinanceiro
// (server/routes/contatos.ts) so an anunciante must opt each contact in.
export async function getVisibleContatoIds(
  usuarioId: number,
  campo: "visualizaAgenda" | "visualizaFinanceiro",
): Promise<number[]> {
  const links = await prisma.contatos_usuarios_links.findMany({
    where: {
      usuario_id: usuarioId,
      ativo: true,
      contato: {
        dataExclusao: null,
        [campo]: true,
      },
    },
    select: { contato_id: true },
  });

  return links.map((link) => link.contato_id);
}
