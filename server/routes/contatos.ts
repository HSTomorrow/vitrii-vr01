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
  usuariosIds: z.array(z.number()).optional(),
});

// Schema para atualizar contato
const ContatoUpdateSchema = ContatoCreateSchema.partial();

// GET all contatos for an announcer (only the announcer can see)
export const getContatosByAnunciante: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    // Verify user is the announcer
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        id: true,
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Check if user is linked to this announcer or is admin
    const isOwner = anunciante.usuarios_anunciantes.some(
      (ua) => ua.usuarioId === usuarioId
    );

    if (!isOwner && usuarioId !== 1) {
      // Assuming user ID 1 is admin
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const contatos = await prisma.contatos.findMany({
      where: { anuncianteId: parseInt(anuncianteId) },
      include: {
        usuarios: {
          select: {
            id: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
    const { anuncianteId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const validatedData = ContatoCreateSchema.parse(req.body);

    // Verify user is the announcer
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    const isOwner = anunciante.usuarios_anunciantes.some(
      (ua) => ua.usuarioId === usuarioId
    );

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: "Apenas o anunciante pode criar contatos",
      });
    }

    // Create contact with auto-linked creator user
    const usuariosParaAdicionar = new Set(validatedData.usuariosIds || []);
    usuariosParaAdicionar.add(usuarioId); // Auto-add creator

    const contato = await prisma.contatos.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        nome: validatedData.nome,
        celular: validatedData.celular,
        telefone: validatedData.telefone || null,
        email: validatedData.email || null,
        status: validatedData.status || "ativo",
        tipoContato: validatedData.tipoContato,
        observacoes: validatedData.observacoes || null,
        imagem: validatedData.imagem || null,
        usuarios:
          usuariosParaAdicionar.size > 0
            ? {
                create: Array.from(usuariosParaAdicionar).map((id) => ({
                  usuarioId: id,
                })),
              }
            : undefined,
      },
      include: {
        usuarios: {
          select: {
            id: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
    const { anuncianteId, contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const validatedData = ContatoUpdateSchema.parse(req.body);

    // Get user info to check if admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Only admins can edit contacts
    const isAdmin = usuario.tipoUsuario === "adm";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem editar contatos",
      });
    }

    // Verify announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Verify contato belongs to this announcer
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
    });

    if (!contato || contato.anuncianteId !== parseInt(anuncianteId)) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    const updatedContato = await prisma.contatos.update({
      where: { id: parseInt(contatoId) },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.celular && { celular: validatedData.celular }),
        ...(validatedData.telefone !== undefined && { telefone: validatedData.telefone }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.tipoContato && { tipoContato: validatedData.tipoContato }),
        ...(validatedData.observacoes !== undefined && { observacoes: validatedData.observacoes }),
        ...(validatedData.imagem !== undefined && { imagem: validatedData.imagem }),
      },
      include: {
        usuarios: {
          select: {
            id: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
    const { anuncianteId, contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    // Get user info to check if admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Only admins can delete contacts
    const isAdmin = usuario.tipoUsuario === "adm";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem deletar contatos",
      });
    }

    // Verify announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Verify contato belongs to this announcer
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
    });

    if (!contato || contato.anuncianteId !== parseInt(anuncianteId)) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
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

// ADD usuario to contato
export const addUsuarioToContato: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, contatoId } = req.params;
    const { usuarioId } = req.body;
    const userId = parseInt(req.headers["x-user-id"] as string || "0");

    // Get user info to check if admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Only admins can modify contact users
    const isAdmin = usuario.tipoUsuario === "adm";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem adicionar usuários a contatos",
      });
    }

    // Verify announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
    });

    if (!contato || contato.anuncianteId !== parseInt(anuncianteId)) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    const contatoUsuario = await prisma.contato_usuarios.create({
      data: {
        contatoId: parseInt(contatoId),
        usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: contatoUsuario,
      message: "Usuário adicionado com sucesso",
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        error: "Este usuário já está vinculado a este contato",
      });
    }

    console.error("Error adding usuario to contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar usuário",
    });
  }
};

// REMOVE usuario from contato
export const removeUsuarioFromContato: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, contatoId, usuarioId } = req.params;
    const userId = parseInt(req.headers["x-user-id"] as string || "0");

    // Get user info to check if admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: userId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Only admins can modify contact users
    const isAdmin = usuario.tipoUsuario === "adm";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem remover usuários de contatos",
      });
    }

    // Verify announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteId) },
      select: {
        usuarios_anunciantes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
    });

    if (!contato || contato.anuncianteId !== parseInt(anuncianteId)) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    await prisma.contato_usuarios.deleteMany({
      where: {
        contatoId: parseInt(contatoId),
        usuarioId: parseInt(usuarioId),
      },
    });

    res.json({
      success: true,
      message: "Usuário removido com sucesso",
    });
  } catch (error) {
    console.error("Error removing usuario from contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover usuário",
    });
  }
};
