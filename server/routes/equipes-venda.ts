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
  nomeMembro: z
    .string()
    .min(1, "Nome do membro é obrigatório")
    .max(255, "Nome não pode ter mais de 255 caracteres"),
  email: z
    .string()
    .email("Email deve ser um endereço de email válido")
    .max(255, "Email não pode ter mais de 255 caracteres"),
  whatsapp: z.string().optional(),
  status: z
    .enum(["disponivel", "nao_disponivel", "cancelado"])
    .optional()
    .default("disponivel"),
});

const AtualizarMembroSchema = z.object({
  nomeMembro: z.string().min(1, "Nome do membro é obrigatório").optional(),
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
    const usuarioId = req.userId;

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(id) },
      include: {
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

    // Fetch members with permission check
    let membrosFilter: any = {};

    if (usuarioId) {
      const usuario = await prisma.usracesso.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, only show members created by this user
      if (usuario?.tipoUsuario !== "adm") {
        membrosFilter = { usuarioId };
      }
    }

    const membros = await prisma.membroEquipe.findMany({
      where: {
        equipeId: parseInt(id),
        ...membrosFilter,
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

    res.json({
      success: true,
      data: {
        ...equipe,
        membros,
      },
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
      const usuario = await prisma.usracesso.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if user is associated with this anunciante
      if (usuario?.tipoUsuario !== "adm") {
        const hasAccess = await prisma.usracessoAnunciante.findFirst({
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
      const usuario = await prisma.usracesso.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if user is associated with this anunciante
      if (usuario?.tipoUsuario !== "adm") {
        const hasAccess = await prisma.usracessoAnunciante.findFirst({
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
    const usuarioId = req.userId;

    // Verify user is authenticated
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

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
    const usuario = await prisma.usracesso.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    // If not admin, check if user is associated with this anunciante
    if (usuario?.tipoUsuario !== "adm") {
      const hasAccess = await prisma.usracessoAnunciante.findFirst({
        where: {
          usuarioId: usuarioId,
          anuncianteId: equipe.anuncianteId,
        },
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: "Você não tem permissão para adicionar membros a esta equipe",
        });
      }
    }

    // Check if email already exists in this equipe
    const existingMember = await prisma.membroEquipe.findFirst({
      where: {
        equipeId: parseInt(id),
        email: body.email,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        error: "Um membro com este email já existe nesta equipe",
      });
    }

    const membro = await prisma.membroEquipe.create({
      data: {
        equipeId: parseInt(id),
        usuarioId: usuarioId, // Preenchido automaticamente com o usuário autenticado
        nomeMembro: body.nomeMembro,
        email: body.email,
        whatsapp: body.whatsapp || null,
        status: body.status || "disponivel",
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
      // Format validation errors with field information
      const firstError = error.errors[0];
      const fieldName = firstError.path.join(".");
      const message = firstError.message;

      console.error(
        `Validation error adding team member - Field: ${fieldName}, Message: ${message}`,
      );

      return res.status(400).json({
        success: false,
        error: `Erro no campo ${fieldName}: ${message}`,
        field: fieldName,
        details: message,
      });
    }

    // Handle Prisma unique constraint errors
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      console.error("Unique constraint error adding team member:", error);
      return res.status(400).json({
        success: false,
        error:
          "Este membro já existe nesta equipe. Um email não pode ser duplicado na mesma equipe.",
        details: error.message,
      });
    }

    // Handle other database errors
    if (error instanceof Error && error.message.includes("prisma")) {
      console.error("Database error adding team member:", error);
      return res.status(500).json({
        success: false,
        error: "Erro ao salvar membro na base de dados",
        details: error.message,
      });
    }

    console.error("Unexpected error adding team member:", error);
    res.status(500).json({
      success: false,
      error: "Erro inesperado ao adicionar membro à equipe",
      details:
        error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// REMOVE member from team
export const removerMembro: RequestHandler = async (req, res) => {
  try {
    const { id, membroId } = req.params;
    const usuarioId = req.userId;

    const membro = await prisma.membroEquipe.findUnique({
      where: { id: parseInt(membroId) },
    });

    if (!membro || membro.equipeId !== parseInt(id)) {
      return res.status(404).json({
        success: false,
        error: "Membro não encontrado",
      });
    }

    // Check permissions - allow if user is admin or creator of this member
    if (usuarioId) {
      const usuario = await prisma.usracesso.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin and not the creator, deny access
      if (usuario?.tipoUsuario !== "adm" && membro.usuarioId !== usuarioId) {
        return res.status(403).json({
          success: false,
          error: "Você não tem permissão para remover este membro",
        });
      }
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

// UPDATE member details
export const atualizarMembro: RequestHandler = async (req, res) => {
  try {
    const { id, membroId } = req.params;
    const usuarioId = req.userId;
    const body = AtualizarMembroSchema.parse(req.body);

    const membro = await prisma.membroEquipe.findUnique({
      where: { id: parseInt(membroId) },
    });

    if (!membro || membro.equipeId !== parseInt(id)) {
      return res.status(404).json({
        success: false,
        error: "Membro não encontrado",
      });
    }

    // Check permissions - allow if user is admin or creator of this member
    if (usuarioId) {
      const usuario = await prisma.usracesso.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin and not the creator, deny access
      if (usuario?.tipoUsuario !== "adm" && membro.usuarioId !== usuarioId) {
        return res.status(403).json({
          success: false,
          error: "Você não tem permissão para atualizar este membro",
        });
      }
    }

    const updated = await prisma.membroEquipe.update({
      where: { id: parseInt(membroId) },
      data: body,
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

    res.json({
      success: true,
      data: updated,
      message: "Membro atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error updating team member:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar membro da equipe",
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
    const usuariosDisponiveis = await prisma.usracesso.findMany({
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

// GET available members for contacting (status = "disponivel")
export const getMembrosDisponiveis: RequestHandler = async (req, res) => {
  try {
    const { equipeId } = req.params;

    const equipe = await prisma.equipeDeVenda.findUnique({
      where: { id: parseInt(equipeId) },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
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

    // Get members with status = "disponivel"
    const membros = await prisma.membroEquipe.findMany({
      where: {
        equipeId: parseInt(equipeId),
        status: "disponivel",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        whatsapp: true,
        status: true,
      },
      orderBy: { dataCriacao: "asc" },
    });

    res.json({
      success: true,
      data: membros,
      equipe: {
        id: equipe.id,
        nome: equipe.nome,
        anunciante: equipe.anunciante,
      },
      count: membros.length,
    });
  } catch (error) {
    console.error("Error fetching available members:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar membros disponíveis",
    });
  }
};
