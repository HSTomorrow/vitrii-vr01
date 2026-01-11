import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const EquipeCreateSchema = z.object({
  anuncianteId: z.number().int().positive("Anunciante inválido"),
  nome: z.string().min(1, "Nome da equipe é obrigatório"),
  descricao: z.string().optional(),
});

const EquipeUpdateSchema = EquipeCreateSchema.partial();

const AdicionarMembroSchema = z.object({
  usuarioId: z.number().int().positive("Usuário inválido"),
  nome: z.string().min(1, "Nome do membro é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().optional(),
  status: z.enum(["disponivel", "nao_disponivel", "cancelado"]).optional(),
});

const AtualizarMembroSchema = z.object({
  nome: z.string().min(1, "Nome do membro é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  whatsapp: z.string().optional(),
  status: z.enum(["disponivel", "nao_disponivel", "cancelado"]).optional(),
});

// GET all sales teams (filtered by anunciante if provided)
export const getEquipes: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.query;

    const where = anuncianteId
      ? { anuncianteId: parseInt(anuncianteId as string) }
      : {};

    const equipes = await prisma.equipeDeVenda.findMany({
      where,
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
      data: equipes,
      count: equipes.length,
    });
  } catch (error) {
    console.error("Error fetching sales teams:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar equipes de venda",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// GET sales team by ID
export const getEquipeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncios: {
          select: {
            id: true,
            titulo: true,
            status: true,
          },
        },
      },
    });

    if (!equipe) {
      return res.status(404).json({
        success: false,
        error: "Equipe de venda não encontrada",
      });
    }

    res.json({
      success: true,
      data: equipe,
    });
  } catch (error) {
    console.error("Error fetching sales team:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar equipe de venda",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// CREATE new sales team
export const createEquipe: RequestHandler = async (req, res) => {
  try {
    const body = EquipeCreateSchema.parse(req.body);
    const usuarioId = req.userId;

    // Verify anunciante exists
    const anunciante = await prisma.anunciante.findUnique({
      where: { id: body.anuncianteId },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Check permissions - allow if user is admin or owner of the anunciante
    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if user is associated with this anunciante
      if (usuario?.tipoUsuario !== "adm") {
        const hasAccess = await prisma.usuarioAnunciante.findFirst({
          where: {
            usuarioId: usuarioId,
            anuncianteId: body.anuncianteId,
          },
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: "Você não tem permissão para criar equipes neste anunciante",
          });
        }
      }
    }

    const equipe = await prisma.equipeDeVenda.create({
      data: {
        anuncianteId: body.anuncianteId,
        nome: body.nome,
        descricao: body.descricao,
      },
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
      data: equipe,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error creating sales team:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar equipe de venda",
    });
  }
};

// UPDATE sales team
export const updateEquipe: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userId;
    const body = EquipeUpdateSchema.parse(req.body);

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipe) {
      return res.status(404).json({
        success: false,
        error: "Equipe de venda não encontrada",
      });
    }

    // Check permissions - allow if user is admin or owner of the anunciante
    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if user is associated with this anunciante
      if (usuario?.tipoUsuario !== "adm") {
        const hasAccess = await prisma.usuarioAnunciante.findFirst({
          where: {
            usuarioId: usuarioId,
            anuncianteId: equipe.anuncianteId,
          },
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: "Você não tem permissão para atualizar esta equipe",
          });
        }
      }
    }

    const updated = await prisma.equipeDeVenda.update({
      where: { id: parseInt(id) },
      data: body,
      include: {
        membros: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
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
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error updating sales team:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar equipe de venda",
    });
  }
};

// DELETE sales team
export const deleteEquipe: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipe) {
      return res.status(404).json({
        success: false,
        error: "Equipe de venda não encontrada",
      });
    }

    await prisma.equipeDeVenda.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Equipe de venda deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting sales team:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar equipe de venda",
    });
  }
};

// ADD member to team
export const adicionarMembro: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body = AdicionarMembroSchema.parse(req.body);

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipe) {
      return res.status(404).json({
        success: false,
        error: "Equipe de venda não encontrada",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: body.usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if already a member
    const existingMember = await prisma.membroEquipe.findUnique({
      where: {
        equipeId_usuarioId: {
          equipeId: parseInt(id),
          usuarioId: body.usuarioId,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: "Usuário já é membro desta equipe",
      });
    }

    const membro = await prisma.membroEquipe.create({
      data: {
        equipeId: parseInt(id),
        usuarioId: body.usuarioId,
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
      data: membro,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error adding team member:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar membro à equipe",
    });
  }
};

// REMOVE member from team
export const removerMembro: RequestHandler = async (req, res) => {
  try {
    const { id, membroId } = req.params;

    const membro = await prisma.membroEquipe.findUnique({
      where: { id: parseInt(membroId) },
    });

    if (!membro || membro.equipeId !== parseInt(id)) {
      return res.status(404).json({
        success: false,
        error: "Membro não encontrado",
      });
    }

    await prisma.membroEquipe.delete({
      where: { id: parseInt(membroId) },
    });

    res.json({
      success: true,
      message: "Membro removido da equipe com sucesso",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover membro da equipe",
    });
  }
};

// GET available users for a team (users with access to the store)
export const getUsuariosDisponiveis: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
    });

    if (!equipe) {
      return res.status(404).json({
        success: false,
        error: "Equipe de venda não encontrada",
      });
    }

    // Get users who have access to this anunciante but are not members of this team
    const usuariosDisponiveis = await prisma.usuario.findMany({
      where: {
        usuarioAnunciantes: {
          some: {
            anuncianteId: equipe.anuncianteId,
          },
        },
        membrosEquipe: {
          none: {
            equipeId: parseInt(id),
          },
        },
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    res.json({
      success: true,
      data: usuariosDisponiveis,
      count: usuariosDisponiveis.length,
    });
  } catch (error) {
    console.error("Error fetching available users:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar usuários disponíveis",
    });
  }
};
