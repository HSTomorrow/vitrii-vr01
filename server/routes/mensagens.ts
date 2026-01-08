import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const MensagemCreateSchema = z.object({
  conversaId: z.number().int().positive("Conversa é obrigatória"),
  remetentId: z.number().int().positive("Remetente é obrigatório"),
  tipoRemetente: z.enum(["usuario", "loja"]),
  conteudo: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(2000, "Mensagem muito longa"),
});

// GET messages for a conversation
export const getMensagensConversa: RequestHandler = async (req, res) => {
  try {
    const { conversaId } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    const conversaIdInt = parseInt(conversaId);
    const limitInt = Math.min(parseInt(limit as string), 100);
    const offsetInt = parseInt(offset as string);

    // Verify conversation exists
    const conversa = await prisma.conversa.findUnique({
      where: { id: conversaIdInt },
    });

    if (!conversa) {
      return res.status(404).json({
        success: false,
        error: "Conversa não encontrada",
      });
    }

    // Get messages
    const [mensagens, total] = await Promise.all([
      prisma.mensagem.findMany({
        where: {
          conversaId: conversaIdInt,
          isActive: true,
        },
        include: {
          remetente: {
            select: { id: true, nome: true },
          },
        },
        orderBy: { dataCriacao: "desc" },
        skip: offsetInt,
        take: limitInt,
      }),
      prisma.mensagem.count({
        where: {
          conversaId: conversaIdInt,
          isActive: true,
        },
      }),
    ]);

    // Reverse to get chronological order
    mensagens.reverse();

    res.json({
      success: true,
      data: mensagens,
      total,
      count: mensagens.length,
      hasMore: offsetInt + mensagens.length < total,
    });
  } catch (error) {
    console.error("Error fetching mensagens:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar mensagens",
    });
  }
};

// CREATE new message (with atomic transaction)
export const createMensagem: RequestHandler = async (req, res) => {
  try {
    const validatedData = MensagemCreateSchema.parse(req.body);

    // Verify conversation exists
    const conversa = await prisma.conversa.findUnique({
      where: { id: validatedData.conversaId },
    });

    if (!conversa) {
      return res.status(404).json({
        success: false,
        error: "Conversa não encontrada",
      });
    }

    // Use transaction to ensure atomicity (both operations succeed or both fail)
    // This prevents race conditions where multiple messages arrive simultaneously
    const [mensagem] = await prisma.$transaction([
      // Step 1: Create message
      prisma.mensagem.create({
        data: {
          ...validatedData,
        },
        include: {
          remetente: {
            select: { id: true, nome: true },
          },
        },
      }),
      // Step 2: Update conversation's last message metadata
      prisma.conversa.update({
        where: { id: validatedData.conversaId },
        data: {
          ultimaMensagem: validatedData.conteudo.substring(0, 100),
          dataUltimaMensagem: new Date(),
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: mensagem,
      message: "Mensagem enviada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating mensagem:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao enviar mensagem",
    });
  }
};

// MARK message as read
export const markMensagemAsRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const mensagem = await prisma.mensagem.update({
      where: { id: parseInt(id) },
      data: { lido: true },
      include: {
        remetente: { select: { id: true, nome: true } },
      },
    });

    res.json({
      success: true,
      data: mensagem,
    });
  } catch (error) {
    console.error("Error marking mensagem as read:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao marcar mensagem como lida",
    });
  }
};

// MARK all messages in conversation as read
export const markConversaAsRead: RequestHandler = async (req, res) => {
  try {
    const { conversaId } = req.params;

    await prisma.mensagem.updateMany({
      where: {
        conversaId: parseInt(conversaId),
        lido: false,
      },
      data: { lido: true },
    });

    res.json({
      success: true,
      message: "Mensagens marcadas como lidas",
    });
  } catch (error) {
    console.error("Error marking conversa as read:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao marcar mensagens como lidas",
    });
  }
};

// GET unread message count for user
export const getUnreadCount: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const conversas = await prisma.conversa.findMany({
      where: {
        usuarioId: parseInt(usuarioId),
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    const conversaIds = conversas.map((c) => c.id);

    const unreadCount = await prisma.mensagem.count({
      where: {
        conversaId: { in: conversaIds },
        lido: false,
        NOT: { tipoRemetente: "usuario" }, // Don't count user's own messages
      },
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar contagem de não lidas",
    });
  }
};

// DELETE/DEACTIVATE message
export const deleteMensagem: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const mensagem = await prisma.mensagem.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        remetente: { select: { id: true, nome: true } },
      },
    });

    res.json({
      success: true,
      data: mensagem,
      message: "Mensagem deletada",
    });
  } catch (error) {
    console.error("Error deleting mensagem:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar mensagem",
    });
  }
};
