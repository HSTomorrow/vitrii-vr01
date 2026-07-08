import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const GrupoCreateSchema = z.object({
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

// GET all grupos (with pagination and user filtering)
export const getGrupos: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, limit = "20", offset = "0", status } = req.query;
    const userId = req.userId;

    // Validate pagination parameters
    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    const where: any = { dataExclusao: null };
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    // status filter: "ativo" (default), "inativo", or "todos"
    if (!status || status === "ativo") where.status = "ativo";
    else if (status === "inativo") where.status = "inativo";

    // Filter by user who created the group
    if (userId) {
      const usuario = await prisma.usracessos.findUnique({
        where: { id: userId },
      });

      // If not admin, only show groups created by this user
      if (usuario && usuario.tipoUsuario !== "adm") {
        where.usuarioId = userId;
      }
      // If admin, show all groups (no userId filter)
    }

    // Get total count and paginated data in parallel
    const [grupos, total] = await Promise.all([
      prisma.grupos_produtos.findMany({
        where,
        select: {
          id: true,
          nome: true,
          descricao: true,
          anuncianteId: true,
          dataCriacao: true,
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.grupos_produtos.count({ where }),
    ]);

    res.json({
      success: true,
      data: grupos,
      pagination: {
        count: grupos.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching grupos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar grupos de produtos",
    });
  }
};

// GET grupo by ID (optimized)
export const getGrupoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const grupo = await prisma.grupos_produtos.findUnique({
      where: { id: parseInt(id), dataExclusao: null },
      select: {
        id: true,
        nome: true,
        descricao: true,
        anuncianteId: true,
        dataCriacao: true,
        anunciante: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
          },
        },
      },
    });

    if (!grupo) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado",
      });
    }

    res.json({
      success: true,
      data: grupo,
    });
  } catch (error) {
    console.error("Error fetching grupo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar grupo de produtos",
    });
  }
};

// GET productos of a grupo (with pagination)
export const getProductosOfGrupo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = "20", offset = "0" } = req.query;

    // Validate pagination parameters
    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    // Get total count and paginated data in parallel
    const [productos, total] = await Promise.all([
      prisma.productos.findMany({
        where: { grupoId: parseInt(id), dataExclusao: null },
        select: {
          id: true,
          nome: true,
          descricao: true,
          sku: true,
          grupoId: true,
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.productos.count({ where: { grupoId: parseInt(id), dataExclusao: null } }),
    ]);

    res.json({
      success: true,
      data: productos,
      pagination: {
        count: productos.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching productos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos do grupo",
    });
  }
};

// CREATE new grupo
export const createGrupo: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    console.log("[createGrupo] Request body:", req.body);
    console.log("[createGrupo] User ID:", userId);

    const validatedData = GrupoCreateSchema.parse(req.body);
    console.log("[createGrupo] Validated data:", validatedData);

    const grupo = await prisma.grupos_produtos.create({
      data: {
        ...validatedData,
        usuarioId: userId,
        criadoPor: userId,
      },
      include: {
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

    console.log("[createGrupo] Grupo created successfully:", grupo);

    res.status(201).json({
      success: true,
      data: grupo,
      message: "Grupo de produtos criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[createGrupo] Validation error:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("[createGrupo] Error creating grupo:", error);
    console.error("[createGrupo] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
      success: false,
      error: "Erro ao criar grupo de produtos",
      details: error instanceof Error ? error.message : String(error),
    });
  }
};

// UPDATE grupo
export const updateGrupo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = GrupoCreateSchema.partial().parse(req.body);

    const grupo = await prisma.grupos_produtos.update({
      where: { id: parseInt(id), dataExclusao: null },
      data: { ...updateData, atualizadoPor: req.userId ?? null },
      include: {
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
      data: grupo,
      message: "Grupo de produtos atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating grupo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar grupo de produtos",
    });
  }
};

// DELETE grupo — blocked if it still has any produto inside it (even inactive ones); the
// client should offer "desativar" instead.
export const deleteGrupo: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const grupo = await prisma.grupos_produtos.findUnique({ where: { id, dataExclusao: null } });
    if (!grupo) {
      return res.status(404).json({ success: false, error: "Grupo de produtos não encontrado" });
    }

    const produtoNoGrupo = await prisma.productos.findFirst({ where: { grupoId: id, dataExclusao: null } });
    if (produtoNoGrupo) {
      return res.status(400).json({
        success: false,
        error: "Este grupo possui produtos cadastrados e não pode ser excluído. Desative-o em vez de excluir.",
        podeDesativar: true,
      });
    }

    await prisma.grupos_produtos.update({
      where: { id },
      data: { dataExclusao: new Date(), excluidoPor: req.userId ?? null },
    });

    res.json({
      success: true,
      message: "Grupo de produtos deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting grupo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar grupo de produtos",
    });
  }
};

// PATCH grupo status — ativo/inativo toggle (the "desativar em vez de excluir" path)
export const atualizarStatusGrupo: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!["ativo", "inativo"].includes(status)) {
      return res.status(400).json({ success: false, error: "status deve ser 'ativo' ou 'inativo'" });
    }

    const grupo = await prisma.grupos_produtos.update({
      where: { id, dataExclusao: null },
      data: { status, atualizadoPor: req.userId ?? null },
    });

    res.json({ success: true, data: grupo });
  } catch (error) {
    console.error("Error updating grupo status:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar status do grupo" });
  }
};
