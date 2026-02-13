import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getMensagensConversa(req: Request, res: Response) {
  try {
    const { conversaId } = req.params;
    const conversaIdNum = parseInt(conversaId, 10);

    const mensagens = await prisma.mensagens.findMany({
      where: {
        conversaId: conversaIdNum,
        excluido: false, // Soft delete: only get non-deleted messages
      },
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
            email: true,
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
    });

    res.json({ data: mensagens });
  } catch (error) {
    console.error("[getMensagensConversa] Error:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
}

export async function createMensagem(req: Request, res: Response) {
  try {
    const { conversaId, usuarioId, anuncianteId, conteudo } = req.body;

    if (!conversaId || !conteudo || (!usuarioId && !anuncianteId)) {
      return res.status(400).json({
        error: "conversaId, conteudo, e (usuarioId ou anuncianteId) são obrigatórios",
      });
    }

    const mensagem = await prisma.mensagens.create({
      data: {
        conversaId,
        usuarioId: usuarioId || null,
        anuncianteId: anuncianteId || null,
        conteudo,
        status: "nao_lida",
        excluido: false,
      },
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
            email: true,
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

    res.status(201).json({ data: mensagem });
  } catch (error) {
    console.error("[createMensagem] Error:", error);
    res.status(500).json({ error: "Erro ao criar mensagem" });
  }
}

export async function markMensagemAsRead(req: Request, res: Response) {
  try {
    const { mensagemId } = req.params;

    const mensagem = await prisma.mensagens.update({
      where: { id: parseInt(mensagemId, 10) },
      data: { status: "lida" },
      select: {
        id: true,
        conversaId: true,
        conteudo: true,
        status: true,
        dataCriacao: true,
      },
    });

    res.json({ data: mensagem });
  } catch (error) {
    console.error("[markMensagemAsRead] Error:", error);
    res.status(500).json({ error: "Erro ao marcar mensagem como lida" });
  }
}

export async function markConversaAsRead(req: Request, res: Response) {
  try {
    const { conversaId } = req.params;
    const conversaIdNum = parseInt(conversaId, 10);

    await prisma.mensagens.updateMany({
      where: {
        conversaId: conversaIdNum,
        status: { not: "lida" },
      },
      data: { status: "lida" },
    });

    res.json({ data: { message: "Conversa marcada como lida" } });
  } catch (error) {
    console.error("[markConversaAsRead] Error:", error);
    res.status(500).json({ error: "Erro ao marcar conversa como lida" });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
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

    // Count unread messages in conversations where:
    // 1. The user is the usuarioId, OR
    // 2. The anuncianteId is one of the anunciantes they manage
    const count = await prisma.mensagens.count({
      where: {
        status: "nao_lida",
        excluido: false,
        conversa: {
          OR: [
            { usuarioId: numUsuarioId },
            ...(anunciantesIds.length > 0
              ? [{ anuncianteId: { in: anunciantesIds } }]
              : []),
          ],
        },
      },
    });

    res.json({ data: { unreadCount: count } });
  } catch (error) {
    console.error("[getUnreadCount] Error:", error);
    res.status(500).json({ error: "Erro ao contar mensagens não lidas" });
  }
}

export async function deleteMensagem(req: Request, res: Response) {
  try {
    const { mensagemId } = req.params;
    const mensagemIdNum = parseInt(mensagemId, 10);

    // Soft delete: just mark as excluido = true
    const mensagem = await prisma.mensagens.update({
      where: { id: mensagemIdNum },
      data: { excluido: true },
      select: {
        id: true,
        conversaId: true,
        excluido: true,
      },
    });

    res.json({ data: mensagem });
  } catch (error) {
    console.error("[deleteMensagem] Error:", error);
    res.status(500).json({ error: "Erro ao deletar mensagem" });
  }
}
