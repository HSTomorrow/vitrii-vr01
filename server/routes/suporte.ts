import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { getOrCreateSuporteAnunciante } from "../lib/suporte";

// Gets (or starts) the current user's support conversa, reusing the same
// dedupe-then-create pattern as startChatWithAnunciante.ts / create-conversation.ts.
export async function getOrStartSuporteConversa(req: Request, res: Response) {
  try {
    const usuarioId = req.userId!;
    const suporte = await getOrCreateSuporteAnunciante();

    const existente = await prisma.conversas.findFirst({
      where: {
        usuarioId,
        anuncianteId: suporte.id,
        dataLimpeza: null,
      },
      select: { id: true },
    });

    if (existente) {
      return res.json({ data: { conversaId: existente.id } });
    }

    const conversa = await prisma.conversas.create({
      data: {
        usuarioId,
        anuncianteId: suporte.id,
        assunto: "Suporte",
        tipo: "privada",
      },
      select: { id: true },
    });

    res.json({ data: { conversaId: conversa.id } });
  } catch (error) {
    console.error("[getOrStartSuporteConversa] Error:", error);
    res.status(500).json({ error: "Erro ao iniciar chat com suporte" });
  }
}

// Admin inbox: every support conversa, from any user, so any admin can answer.
export async function getSuporteConversasAdmin(req: Request, res: Response) {
  try {
    const suporte = await getOrCreateSuporteAnunciante();

    const conversas = await prisma.conversas.findMany({
      where: {
        anuncianteId: suporte.id,
        dataLimpeza: null,
      },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
        assunto: true,
        tipo: true,
        dataCriacao: true,
        dataAtualizacao: true,
        dataExclusao: true,
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        mensagens: {
          where: { excluido: false },
          select: { id: true, conteudo: true, dataCriacao: true, status: true },
          orderBy: { dataCriacao: "desc" },
          take: 1,
        },
      },
      orderBy: { dataAtualizacao: "desc" },
      take: 200,
    });

    const formattedConversas = conversas.map((conversa) => ({
      ...conversa,
      ultimaMensagem: conversa.mensagens[0]?.conteudo || "",
      dataUltimaMensagem: conversa.mensagens[0]?.dataCriacao || conversa.dataCriacao,
    }));

    res.json({ data: formattedConversas });
  } catch (error) {
    console.error("[getSuporteConversasAdmin] Error:", error);
    res.status(500).json({ error: "Erro ao buscar conversas de suporte" });
  }
}
