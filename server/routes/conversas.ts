import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getConversas(req: Request, res: Response) {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId é obrigatório" });
    }

    const numUsuarioId = parseInt(usuarioId as string, 10);

    // First, find all anunciantes this user manages
    const usuarioAnunciantes = await prisma.usuarios_anunciantes.findMany({
      where: { usuarioId: numUsuarioId },
      select: { anuncianteId: true },
    });

    const anunciantesIds = usuarioAnunciantes.map((ua) => ua.anuncianteId);

    // Get conversations where:
    // 1. The user is the usuarioId (conversations they initiated), OR
    // 2. The anuncianteId is one of the anunciantes they manage (messages sent to their business)
    const conversas = await prisma.conversas.findMany({
      where: {
        OR: [
          { usuarioId: numUsuarioId },
          ...(anunciantesIds.length > 0
            ? [{ anuncianteId: { in: anunciantesIds } }]
            : []),
        ],
        // Cleared (dataLimpeza set) conversations are gone from the UI for good, even
        // in the "Deletadas" tab — kept in the DB for audit only. Soft-deleted-but-not-
        // cleared ones are still returned here; the client splits them into the
        // "Deletadas" tab by dataExclusao instead of a separate query.
        dataLimpeza: null,
      },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
        anuncioId: true,
        assunto: true,
        tipo: true,
        dataCriacao: true,
        dataAtualizacao: true,
        dataExclusao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
          },
        },
        mensagens: {
          where: { excluido: false },
          select: {
            id: true,
            conteudo: true,
            dataCriacao: true,
            status: true,
          },
          orderBy: { dataCriacao: "desc" },
          take: 1,
        },
      },
      orderBy: { dataAtualizacao: "desc" },
      take: 200,
    });

    // Format response with last message
    const formattedConversas = conversas.map((conversa) => ({
      ...conversa,
      ultimaMensagem: conversa.mensagens[0]?.conteudo || "",
      dataUltimaMensagem:
        conversa.mensagens[0]?.dataCriacao || conversa.dataCriacao,
    }));

    res.json({ data: formattedConversas });
  } catch (error) {
    console.error("[getConversas] Error:", error);
    res.status(500).json({ error: "Erro ao buscar conversas" });
  }
}

export async function getConversaById(req: Request, res: Response) {
  try {
    const { conversaId } = req.params;
    const conversaIdNum = parseInt(conversaId, 10);

    const conversa = await prisma.conversas.findUnique({
      where: { id: conversaIdNum },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
        anuncioId: true,
        assunto: true,
        tipo: true,
        dataCriacao: true,
        dataAtualizacao: true,
        dataExclusao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
          },
        },
        mensagens: {
          where: { excluido: false },
          select: {
            id: true,
            conversaId: true,
            conteudo: true,
            status: true,
            dataCriacao: true,
            usuarioId: true,
            anuncianteId: true,
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
            anunciante: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: { dataCriacao: "asc" },
        },
      },
    });

    if (!conversa) {
      return res.status(404).json({ error: "Conversa não encontrada" });
    }

    res.json({ data: conversa });
  } catch (error) {
    console.error("[getConversaById] Error:", error);
    res.status(500).json({ error: "Erro ao buscar conversa" });
  }
}

export async function createConversa(req: Request, res: Response) {
  try {
    const { usuarioId, anuncianteId, anuncioId, assunto, tipo } = req.body;

    if (!usuarioId || !anuncianteId || !assunto) {
      return res.status(400).json({
        error: "usuarioId, anuncianteId, e assunto são obrigatórios",
      });
    }

    const conversa = await prisma.conversas.create({
      data: {
        usuarioId,
        anuncianteId,
        anuncioId: anuncioId || null,
        assunto,
        tipo: tipo || "privada",
      },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
        anuncioId: true,
        assunto: true,
        tipo: true,
        dataCriacao: true,
        dataAtualizacao: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json({ data: conversa });
  } catch (error) {
    console.error("[createConversa] Error:", error);
    res.status(500).json({ error: "Erro ao criar conversa" });
  }
}

export async function deleteConversa(req: Request, res: Response) {
  try {
    const { conversaId } = req.params;
    const conversaIdNum = parseInt(conversaId, 10);

    // Soft delete: the conversation and its messages stay in the DB for audit,
    // they just move to the "Deletadas" tab instead of vanishing.
    await prisma.conversas.update({
      where: { id: conversaIdNum },
      data: { dataExclusao: new Date(), excluidoPor: req.userId ?? null },
    });

    res.json({ data: { message: "Conversa deletada com sucesso" } });
  } catch (error) {
    console.error("[deleteConversa] Error:", error);
    res.status(500).json({ error: "Erro ao deletar conversa" });
  }
}

// Permanently hides already-deleted conversations from the UI (both tabs) while
// keeping their rows in the DB for audit — the "limpar" action from the Deletadas tab.
export async function limparConversasDeletadas(req: Request, res: Response) {
  try {
    const userId = req.userId!;

    const usuarioAnunciantes = await prisma.usuarios_anunciantes.findMany({
      where: { usuarioId: userId },
      select: { anuncianteId: true },
    });
    const anunciantesIds = usuarioAnunciantes.map((ua) => ua.anuncianteId);

    const result = await prisma.conversas.updateMany({
      where: {
        dataExclusao: { not: null },
        dataLimpeza: null,
        OR: [
          { usuarioId: userId },
          ...(anunciantesIds.length > 0
            ? [{ anuncianteId: { in: anunciantesIds } }]
            : []),
        ],
      },
      data: { dataLimpeza: new Date() },
    });

    res.json({ data: { count: result.count } });
  } catch (error) {
    console.error("[limparConversasDeletadas] Error:", error);
    res.status(500).json({ error: "Erro ao limpar conversas deletadas" });
  }
}
