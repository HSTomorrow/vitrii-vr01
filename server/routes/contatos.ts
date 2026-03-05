import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema para criar contato
const ContatoCreateSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  celular: z.string().min(1, "Celular/WhatsApp é obrigatório"),
  telefone: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  status: z.enum(["ativo", "inativo", "analise"]).default("ativo"),
  tipoContato: z.string().min(1, "Tipo de contato é obrigatório"),
  observacoes: z.string().optional().nullable(),
  imagem: z.string().optional().nullable(),
  anuncianteId: z.number().optional().nullable(), // Optional: specific announcer or null for all
});

// Schema para atualizar contato
const ContatoUpdateSchema = ContatoCreateSchema.partial();

// GET all contatos for a user (admin sees all, users see only their own)
export const getContatosByUsuario: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    const isAdmin = usuario.tipoUsuario === "adm";

    // Build filter: admin sees all, regular users see only their own
    const contatosFilter: any = {};

    if (!isAdmin) {
      // Regular users only see contacts they created
      contatosFilter.usuarioId = usuarioId;
    }

    const contatos = await prisma.contatos.findMany({
      where: contatosFilter,
      include: {
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
      orderBy: { dataCriacao: "desc" },
    });

    res.json({
      success: true,
      data: contatos,
    });
  } catch (error) {
    console.error("Error fetching contatos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar contatos",
    });
  }
};

// CREATE new contato
export const createContato: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const validatedData = ContatoCreateSchema.parse(req.body);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // If anuncianteId is provided, verify it exists
    if (validatedData.anuncianteId) {
      const anunciante = await prisma.anunciantes.findUnique({
        where: { id: validatedData.anuncianteId },
        select: { id: true },
      });

      if (!anunciante) {
        return res.status(404).json({
          success: false,
          error: "Anunciante não encontrado",
        });
      }
    }

    // Create contact
    const contato = await prisma.contatos.create({
      data: {
        usuarioId,
        anuncianteId: validatedData.anuncianteId || null,
        nome: validatedData.nome,
        celular: validatedData.celular,
        telefone: validatedData.telefone || null,
        email: validatedData.email || null,
        status: validatedData.status || "ativo",
        tipoContato: validatedData.tipoContato,
        observacoes: validatedData.observacoes || null,
        imagem: validatedData.imagem || null,
      },
      include: {
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

    res.status(201).json({
      success: true,
      data: contato,
      message: "Contato criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar contato",
    });
  }
};

// UPDATE contato
export const updateContato: RequestHandler = async (req, res) => {
  try {
    const { contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const validatedData = ContatoUpdateSchema.parse(req.body);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Get the contact to verify ownership
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
      select: {
        usuarioId: true,
        anuncianteId: true,
      },
    });

    if (!contato) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    // Check if user is the creator or admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = contato.usuarioId === usuarioId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para editar este contato",
      });
    }

    // If anuncianteId is provided, verify it exists
    if (validatedData.anuncianteId) {
      const anunciante = await prisma.anunciantes.findUnique({
        where: { id: validatedData.anuncianteId },
        select: { id: true },
      });

      if (!anunciante) {
        return res.status(404).json({
          success: false,
          error: "Anunciante não encontrado",
        });
      }
    }

    const updatedContato = await prisma.contatos.update({
      where: { id: parseInt(contatoId) },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.celular && { celular: validatedData.celular }),
        ...(validatedData.telefone !== undefined && {
          telefone: validatedData.telefone,
        }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.tipoContato && { tipoContato: validatedData.tipoContato }),
        ...(validatedData.observacoes !== undefined && {
          observacoes: validatedData.observacoes,
        }),
        ...(validatedData.imagem !== undefined && { imagem: validatedData.imagem }),
        ...(validatedData.anuncianteId !== undefined && {
          anuncianteId: validatedData.anuncianteId,
        }),
      },
      include: {
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

    res.json({
      success: true,
      data: updatedContato,
      message: "Contato atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar contato",
    });
  }
};

// DELETE contato
export const deleteContato: RequestHandler = async (req, res) => {
  try {
    const { contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Get the contact to verify ownership
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
      select: {
        usuarioId: true,
      },
    });

    if (!contato) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    // Check if user is the creator or admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = contato.usuarioId === usuarioId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar este contato",
      });
    }

    await prisma.contatos.delete({
      where: { id: parseInt(contatoId) },
    });

    res.json({
      success: true,
      message: "Contato deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar contato",
    });
  }
};

// For backwards compatibility: GET contatos by announcer (now calls getContatosByUsuario)
export const getContatosByAnunciante: RequestHandler = async (req, res) => {
  // This route is deprecated, but kept for backwards compatibility
  // Just calls the user-based endpoint
  return getContatosByUsuario(req, res);
};
