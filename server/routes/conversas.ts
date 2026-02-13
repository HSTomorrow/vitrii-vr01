import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getConversas(req: Request, res: Response) {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId é obrigatório" });
    }

    const conversas = await prisma.conversas.findMany({
      where: {
        usuarioId: parseInt(usuarioId as string, 10),
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

    await prisma.conversas.delete({
      where: { id: conversaIdNum },
    });

    res.json({ data: { message: "Conversa deletada com sucesso" } });
  } catch (error) {
    console.error("[deleteConversa] Error:", error);
    res.status(500).json({ error: "Erro ao deletar conversa" });
  }
}
