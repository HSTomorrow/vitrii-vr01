import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Base schema for ads (without refinement)
const AnuncioBaseSchema = z.object({
  usuarioId: z.number().int().positive("Usuário é obrigatório"),
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  productId: z.number().int().nonnegative().optional().nullable(), // Allow 0 since product is optional
  tabelaDePrecoId: z.number().int().optional().nullable(),
  titulo: z
    .string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(50, "Título não pode ter mais de 50 caracteres"),
  descricao: z.string().optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
  precoAnuncio: z
    .number()
    .positive("Preço do anúncio deve ser maior que 0")
    .optional()
    .nullable(),
  dataValidade: z.string().optional().nullable(),
  equipeDeVendaId: z.number().int().positive().optional().nullable(),
  endereco: z
    .string()
    .max(100, "Endereço não pode ter mais de 100 caracteres")
    .optional()
    .nullable(),
  cidade: z
    .string()
    .max(100, "Cidade não pode ter mais de 100 caracteres")
    .optional()
    .nullable(),
  estado: z
    .string()
    .length(2, "Estado deve ter 2 caracteres")
    .optional()
    .nullable(),
  isDoacao: z.boolean().optional().default(false),
  destaque: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  status: z
    .enum(["em_edicao", "aguardando_pagamento", "pago", "historico"])
    .optional(),
  categoria: z.enum(["roupas", "carros", "imoveis"]).optional().nullable(),
  dadosCategoria: z.string().optional().nullable(), // JSON string
});

// Schema validation for creating ad (with refinement)
const AnuncioCreateSchema = AnuncioBaseSchema.refine(
  (data) => {
    // Either precoAnuncio must be provided OR isDoacao must be true
    const hasPrice = data.precoAnuncio && data.precoAnuncio > 0;
    const isFree = data.isDoacao === true;
    return hasPrice || isFree;
  },
  {
    message:
      "Você deve preencher o Valor do anúncio ou marcar como gratuito/doação",
    path: ["precoAnuncio"], // Point to the field with the error
  },
);

// Schema for updating ad (partial fields, no refinement for flexibility)
const AnuncioUpdateSchema = AnuncioBaseSchema.partial();

// GET all ads
export const getAnuncios: RequestHandler = async (req, res) => {
  try {
    console.log("[getAnuncios] Starting request...");

    const {
      anuncianteId,
      status,
      includeInactive,
      isDoacao,
      limit = "20",
      offset = "0",
    } = req.query;

    // Validate pagination parameters
    // Allow up to 500 items for admin requests, 100 for regular users
    const maxLimit = 500; // Admin can request more
    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      maxLimit,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    console.log("[getAnuncios] Query parameters:", {
      anuncianteId,
      status,
      includeInactive,
      pageLimit,
      pageOffset,
    });

    const where: any = { status: "ativo" }; // Default: only active ads
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (status) where.status = status;
    if (includeInactive === "true") delete where.status; // Override to include inactive
    // Note: isDoacao filtering not supported in current schema

    console.log("[getAnuncios] Where clause:", where);

    // Get total count and paginated data in parallel
    const [anuncios, total] = await Promise.all([
      prisma.anuncios.findMany({
        where,
        include: {
          anunciantes: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.anuncios.count({ where }),
    ]);

    console.log(
      "[getAnuncios] Success! Fetched",
      anuncios.length,
      "ads out of",
      total,
      "with limit:",
      pageLimit,
      "offset:",
      pageOffset,
    );

    res.json({
      success: true,
      data: anuncios,
      pagination: {
        count: anuncios.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("[getAnuncios] Error fetching ads:", error);
    console.error("[getAnuncios] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anúncios",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// GET ad by ID with full details (optimized query)
export const getAnuncioById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        fotoUrl: true,
        precoAnuncio: true,
        isDoacao: true,
        destaque: true,
        isActive: true,
        status: true,
        dataCriacao: true,
        dataValidade: true,
        anuncianteId: true,
        productId: true,
        tabelaDePrecoId: true,
        anunciante: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
            endereco: true,
            email: true,
            cnpjOuCpf: true,
            site: true,
            instagram: true,
            facebook: true,
            whatsapp: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            tipo: true,
            grupoId: true,
            grupo: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        tabelaDePreco: {
          select: {
            id: true,
            preco: true,
            tamanho: true,
            cor: true,
          },
        },
      },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    res.json({
      success: true,
      data: anuncio,
    });
  } catch (error) {
    console.error("Error fetching ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anúncio",
    });
  }
};

// CREATE new ad
export const createAnuncio: RequestHandler = async (req, res) => {
  try {
    console.log("[createAnuncio] Starting ad creation with payload:", req.body);
    const validatedData = AnuncioCreateSchema.parse(req.body);
    console.log("[createAnuncio] Data validated successfully:", validatedData);

    let tabelaDePrecoId: number | null = null;

    // Only validate product if one is provided (product is optional)
    if (validatedData.productId && validatedData.productId > 0) {
      // Verify that the product belongs to the anunciante
      const producto = await prisma.productos.findUnique({
        where: { id: validatedData.productId },
      });

      if (
        !producto ||
        producto.lojaId !== validatedData.anuncianteId
      ) {
        return res.status(400).json({
          success: false,
          error: "Produto não pertence ao anunciante selecionado",
        });
      }

      // Verify that the price table belongs to the product if provided
      if (validatedData.tabelaDePrecoId && validatedData.tabelaDePrecoId > 0) {
        const tabelaDePreco = await prisma.tabelas_preco.findUnique({
          where: { id: validatedData.tabelaDePrecoId },
        });

        if (
          !tabelaDePreco ||
          tabelaDePreco.productId !== validatedData.productId
        ) {
          return res.status(400).json({
            success: false,
            error: "Tabela de preço não pertence ao produto selecionado",
          });
        }

        tabelaDePrecoId = validatedData.tabelaDePrecoId;
      }
    }
    // Note: tabelaDePrecoId can now be null for events, schedules, or when using manual price

    // Set validity: default to 7 days from now if not provided
    const dataValidade = validatedData.dataValidade
      ? new Date(validatedData.dataValidade)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // For free items: automatically set status to "pago" and zero out price
    const isDoacao = validatedData.isDoacao || false;
    const precoAnuncio = isDoacao ? null : validatedData.precoAnuncio;
    const status = isDoacao ? "pago" : "em_edicao";

    const anuncio = await prisma.anuncios.create({
      data: {
        usuarioId: validatedData.usuarioId,
        anuncianteId: validatedData.anuncianteId,
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        imagem: validatedData.fotoUrl || null,
        preco: precoAnuncio,
        categoria: validatedData.categoria,
        cidade: validatedData.cidade,
        estado: validatedData.estado,
        status,
        tipo: "produto",
        dataAtualizacao: new Date(),
      },
      include: {
        anunciantes: true,
      },
    });

    console.log("[createAnuncio] Ad created successfully!");
    console.log("[createAnuncio] Ad details:", {
      id: anuncio.id,
      titulo: anuncio.titulo,
      anuncianteId: anuncio.anuncianteId,
      status: anuncio.status,
      isActive: anuncio.isActive,
      precoAnuncio: anuncio.precoAnuncio,
      isDoacao: anuncio.isDoacao,
    });

    res.status(201).json({
      success: true,
      data: anuncio,
      message: "Anúncio criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      console.error("[createAnuncio] Validation error:", errorMessages);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("[createAnuncio] Unexpected error:", error);
    console.error("[createAnuncio] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      error: "Erro ao criar anúncio",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// UPDATE ad
export const updateAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[updateAnuncio] Updating ad:", id, "with data:", req.body);
    let updateData = AnuncioUpdateSchema.parse(req.body);
    console.log("[updateAnuncio] Validated data:", updateData);

    // If updating to donation, automatically set status to "pago" and zero price
    if (updateData.isDoacao === true) {
      updateData.status = "pago";
      updateData.precoAnuncio = null;
    }

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        dataAtualizacao: new Date(),
      },
      include: {
        anunciante: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

    console.log("[updateAnuncio] Ad updated successfully:", anuncio.id);
    res.json({
      success: true,
      data: anuncio,
      message: "Anúncio atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      console.error("[updateAnuncio] Validation error:", errorMessages);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("[updateAnuncio] Unexpected error:", error);
    console.error("[updateAnuncio] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar anúncio",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// UPDATE ad status
export const updateAnuncioStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "em_edicao",
      "aguardando_pagamento",
      "pago",
      "historico",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
      });
    }

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: {
        status,
        dataAtualizacao: new Date(),
      },
      include: {
        anunciante: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

    res.json({
      success: true,
      data: anuncio,
      message: `Anúncio ${status === "pago" ? "publicado" : "atualizado"} com sucesso`,
    });
  } catch (error) {
    console.error("Error updating ad status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar status do anúncio",
    });
  }
};

// UPDATE ad status by ADM (force status without payment verification)
export const overrideAnuncioStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = [
      "em_edicao",
      "aguardando_pagamento",
      "pago",
      "ativo",
      "historico",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
        details: `Status deve ser um dos seguintes: ${validStatuses.join(", ")}`,
      });
    }

    // Check if ad exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Update status
    const updatedAnuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        anunciante: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

    res.json({
      success: true,
      data: updatedAnuncio,
      message: `Status do anúncio alterado para "${status}" com sucesso (ADM override)`,
    });
  } catch (error) {
    console.error("Error overriding ad status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao alterar status do anúncio",
    });
  }
};

// DELETE ad (physical deletion)
export const deleteAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.anuncios.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Anúncio deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar anúncio",
    });
  }
};

// INACTIVATE ad (logical deletion)
export const inactivateAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        anunciante: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

    res.json({
      success: true,
      message: "Anúncio inativado com sucesso",
      data: anuncio,
    });
  } catch (error) {
    console.error("Error inactivating ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao inativar anúncio",
    });
  }
};

// ACTIVATE ad (reactivate inactive ad)
export const activateAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: { isActive: true },
      include: {
        anunciante: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

    res.json({
      success: true,
      message: "Anúncio reativado com sucesso",
      data: anuncio,
    });
  } catch (error) {
    console.error("Error activating ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao reativar anúncio",
    });
  }
};

// GET products and prices by anunciante for ad creation
export const getProdutosParaAnuncio: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.params;

    // Fetch products for the given loja/anunciante
    const productos = await prisma.productos.findMany({
      where: {
        lojaId: parseInt(anuncianteId),
      },
    });

    // Fetch price tables for all these products
    const tabelasDePreco = await prisma.tabelas_preco.findMany({
      where: {
        lojaId: parseInt(anuncianteId),
        productId: {
          in: productos.map((p) => p.id),
        },
      },
    });

    // Combine products with their price tables
    const productosComPrecos = productos.map((p) => ({
      ...p,
      tabelasDePreco: tabelasDePreco.filter((t) => t.productId === p.id),
    }));

    res.json({
      success: true,
      data: productosComPrecos,
      count: productosComPrecos.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos",
    });
  }
};

// CHECK if user can edit/delete an ad
export const canEditAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // Try to get userId from different sources
    let usuarioId = req.userId;

    if (!usuarioId) {
      // Try to get from query parameter or header
      usuarioId = parseInt(
        (req.query.usuarioId as string) ||
          (req.headers["x-user-id"] as string) ||
          "0",
        10,
      );
    }

    // If still no userId, return not authenticated
    if (!usuarioId || usuarioId === 0) {
      return res.json({
        success: true,
        canEdit: false,
      });
    }

    // Get current user and ad
    const [usuario, anuncio] = await Promise.all([
      prisma.usracessos.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      }),
      prisma.anuncios.findUnique({
        where: { id: parseInt(id) },
        select: { anuncianteId: true },
      }),
    ]);

    if (!usuario || !anuncio) {
      return res.json({
        success: true,
        canEdit: false,
      });
    }

    // ADM can edit any ad
    if (usuario.tipoUsuario === "adm") {
      return res.json({
        success: true,
        canEdit: true,
      });
    }

    // Check if user is associated with the advertiser (anunciante)
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findUnique({
      where: {
        usuarioId_anuncianteId: {
          usuarioId: usuarioId,
          anuncianteId: anuncio.anuncianteId,
        },
      },
    });

    const canEdit = !!usuarioAnunciante;

    res.json({
      success: true,
      canEdit,
    });
  } catch (error) {
    console.error("Error checking ad edit permissions:", error);
    res.json({
      success: false,
      canEdit: false,
      error: "Erro ao verificar permissões",
    });
  }
};
