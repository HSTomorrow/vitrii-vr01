import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Validation schemas
const LocalidadeCreateSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  municipio: z.string().min(1, "Município é obrigatório"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  descricao: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).default("ativo"),
});

const LocalidadeUpdateSchema = LocalidadeCreateSchema.partial();

// GET all localidades with optional filters
export const getLocalidades: RequestHandler = async (req, res) => {
  try {
    const { status, estado, municipio, limit = "100", offset = "0" } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (estado) where.estado = (estado as string).toUpperCase();
    if (municipio)
      where.municipio = { contains: municipio as string, mode: "insensitive" };

    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 100, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    const [localidades, total] = await Promise.all([
      prisma.localidades.findMany({
        where,
        select: {
          id: true,
          codigo: true,
          municipio: true,
          estado: true,
          descricao: true,
          observacao: true,
          status: true,
          dataCriacao: true,
        },
        orderBy: { municipio: "asc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.localidades.count({ where }),
    ]);

    res.json({
      success: true,
      data: localidades,
      pagination: {
        count: localidades.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching localidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar localidades",
    });
  }
};

// GET localidade by ID
export const getLocalidadeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const localidade = await prisma.localidades.findUnique({
      where: { id: parseInt(id) },
      include: {
        anunciantes: {
          select: {
            anunciante: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!localidade) {
      return res.status(404).json({
        success: false,
        error: "Localidade não encontrada",
      });
    }

    res.json({
      success: true,
      data: localidade,
    });
  } catch (error) {
    console.error("Error fetching localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar localidade",
    });
  }
};

// CREATE localidade (admin only)
export const createLocalidade: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
    const user = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem criar localidades",
      });
    }

    console.log("[createLocalidade] Request body:", req.body);

    const validatedData = LocalidadeCreateSchema.parse(req.body);
    console.log("[createLocalidade] Validated data:", validatedData);

    const localidade = await prisma.localidades.create({
      data: {
        ...validatedData,
        estado: validatedData.estado.toUpperCase(),
      },
      select: {
        id: true,
        codigo: true,
        municipio: true,
        estado: true,
        descricao: true,
        observacao: true,
        status: true,
        dataCriacao: true,
      },
    });

    console.log("[createLocalidade] Localidade created successfully:", localidade);

    res.status(201).json({
      success: true,
      data: localidade,
      message: "Localidade criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[createLocalidade] Validation error:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return res.status(409).json({
        success: false,
        error: "Código ou combinação de município/estado já existe",
      });
    }

    console.error("[createLocalidade] Error creating localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar localidade",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// UPDATE localidade (admin only)
export const updateLocalidade: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
    const user = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem atualizar localidades",
      });
    }

    const validatedData = LocalidadeUpdateSchema.parse(req.body);

    const localidade = await prisma.localidades.update({
      where: { id: parseInt(id) },
      data: {
        ...validatedData,
        estado: validatedData.estado?.toUpperCase(),
      },
      select: {
        id: true,
        codigo: true,
        municipio: true,
        estado: true,
        descricao: true,
        observacao: true,
        status: true,
        dataCriacao: true,
      },
    });

    res.json({
      success: true,
      data: localidade,
      message: "Localidade atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar localidade",
    });
  }
};

// DELETE localidade (admin only)
export const deleteLocalidade: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
    const user = await prisma.usracessos.findUnique({
      where: { id: userId },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem deletar localidades",
      });
    }

    await prisma.localidades.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Localidade deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar localidade",
    });
  }
};

// GET anunciantes for a localidade
export const getAnunciantesForLocalidade: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const localidade = await prisma.localidades.findUnique({
      where: { id: parseInt(id) },
      include: {
        anunciantes: {
          include: {
            anunciante: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!localidade) {
      return res.status(404).json({
        success: false,
        error: "Localidade não encontrada",
      });
    }

    res.json({
      success: true,
      data: localidade.anunciantes.map((al) => al.anunciante),
    });
  } catch (error) {
    console.error("Error fetching anunciantes for localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anunciantes da localidade",
    });
  }
};

// ADD anunciante to localidade
export const addAnuncianteToLocalidade: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id: localidadeId } = req.params;
    const { anuncianteId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    if (!anuncianteId) {
      return res.status(400).json({
        success: false,
        error: "anuncianteId é obrigatório",
      });
    }

    // Verify localidade exists
    const localidade = await prisma.localidades.findUnique({
      where: { id: parseInt(localidadeId) },
    });

    if (!localidade) {
      return res.status(404).json({
        success: false,
        error: "Localidade não encontrada",
      });
    }

    // Verify anunciante exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: anuncianteId },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Create relationship
    const relationship = await prisma.anunciantes_x_localidades.upsert({
      where: {
        anuncianteId_localidadeId: {
          anuncianteId,
          localidadeId: parseInt(localidadeId),
        },
      },
      update: {},
      create: {
        anuncianteId,
        localidadeId: parseInt(localidadeId),
      },
    });

    res.status(201).json({
      success: true,
      data: relationship,
      message: "Anunciante vinculado à localidade",
    });
  } catch (error) {
    console.error("Error adding anunciante to localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao vincular anunciante à localidade",
    });
  }
};

// REMOVE anunciante from localidade
export const removeAnuncianteFromLocalidade: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = req.userId;
    const { id: localidadeId, anuncianteId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    await prisma.anunciantes_x_localidades.delete({
      where: {
        anuncianteId_localidadeId: {
          anuncianteId: parseInt(anuncianteId),
          localidadeId: parseInt(localidadeId),
        },
      },
    });

    res.json({
      success: true,
      message: "Anunciante removido da localidade",
    });
  } catch (error) {
    console.error("Error removing anunciante from localidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover anunciante da localidade",
    });
  }
};
