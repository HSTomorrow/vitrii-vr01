import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const ConversaCreateSchema = z.object({
  usuarioId: z.number().int().positive("Usuário é obrigatório"),
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  anuncioId: z.number().int().optional(),
  assunto: z.string().min(1, "Assunto é obrigatório"),
  tipo: z.enum(["publica", "privada"]).default("privada"),
});

const MensagemCreateSchema = z.object({
  conteudo: z
    .string()
    .min(1, "Mensagem não pode estar vazia")
    .max(2000, "Mensagem muito longa"),
  tipoRemetente: z.enum(["usuario", "loja"]),
});

// GET all conversations for a user/anunciante
export const getConversas: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, anuncianteId, tipo } = req.query;

    const where: any = {};
    if (usuarioId) where.usuarioId = parseInt(usuarioId as string);
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (tipo) where.tipo = tipo;
    where.isActive = true;

    const conversas = await prisma.conversa.findMany({
      where,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        anunciante: {
          select: { id: true, nome: true },
        },
        anuncio: {
          select: { id: true, titulo: true },
        },
        mensagens: {
          orderBy: { dataCriacao: "desc" },
          take: 1,
        },
      },
      orderBy: { dataUltimaMensagem: "desc" },
    });

    res.json({
      success: true,
      data: conversas,
      count: conversas.length,
    });
  } catch (error) {
    console.error("Error fetching conversas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar conversas",
    });
  }
};

// GET conversation by ID with messages
export const getConversaById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const conversa = await prisma.conversa.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, telefone: true },
        },
        anunciante: {
          select: { id: true, nome: true },
        },
        anuncio: {
          select: { id: true, titulo: true, fotoUrl: true },
        },
        mensagens: {
          orderBy: { dataCriacao: "asc" },
          include: {
            remetente: {
              select: { id: true, nome: true },
            },
          },
        },
      },
    });

    if (!conversa) {
      return res.status(404).json({
        success: false,
        error: "Conversa não encontrada",
      });
    }

    res.json({
      success: true,
      data: conversa,
    });
  } catch (error) {
    console.error("Error fetching conversa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar conversa",
    });
  }
};

// CREATE new conversation
export const createConversa: RequestHandler = async (req, res) => {
  try {
    const validatedData = ConversaCreateSchema.parse(req.body);

    // Check if conversation already exists
    const existingConversa = await prisma.conversa.findUnique({
      where: {
        usuarioId_anuncianteId_anuncioId: {
          usuarioId: validatedData.usuarioId,
          anuncianteId: validatedData.anuncianteId,
          anuncioId: validatedData.anuncioId || null,
        },
      },
    });

    if (existingConversa && existingConversa.isActive) {
      return res.status(400).json({
        success: false,
        error: "Conversa já existe",
        data: existingConversa,
      });
    }

    // If conversation was deleted, reactivate it
    if (existingConversa && !existingConversa.isActive) {
      const reactivated = await prisma.conversa.update({
        where: { id: existingConversa.id },
        data: { isActive: true },
        include: {
          usuario: { select: { id: true, nome: true } },
          anunciante: { select: { id: true, nome: true } },
          anuncio: { select: { id: true, titulo: true } },
        },
      });

      return res.status(201).json({
        success: true,
        data: reactivated,
        message: "Conversa reativada",
      });
    }

    const conversa = await prisma.conversa.create({
      data: validatedData,
      include: {
        usuario: { select: { id: true, nome: true } },
        anunciante: { select: { id: true, nome: true } },
        anuncio: { select: { id: true, titulo: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: conversa,
      message: "Conversa criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating conversa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar conversa",
    });
  }
};

// DELETE/DEACTIVATE conversation
export const deleteConversa: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const conversa = await prisma.conversa.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: conversa,
      message: "Conversa deletada",
    });
  } catch (error) {
    console.error("Error deleting conversa:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar conversa",
    });
  }
};
