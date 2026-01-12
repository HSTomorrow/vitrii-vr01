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
    .nonnegative("Preço do anúncio deve ser maior ou igual a 0")
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
  tipo: z
    .enum(["produto", "servico", "evento", "agenda_recorrente", "oportunidade"])
    .optional()
    .default("produto"),
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
              fotoUrl: true,
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
      include: {
        anunciantes: {
          select: {
            id: true,
            nome: true,
            endereco: true,
            email: true,
            cnpj: true,
            telefone: true,
            whatsapp: true,
            fotoUrl: true,
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

    // Validate user contract and active ads limit
    const usuario = await prisma.usracessos.findUnique({
      where: { id: validatedData.usuarioId },
      select: {
        dataVigenciaContrato: true,
        numeroAnunciosAtivos: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if contract is still valid
    const today = new Date();
    if (usuario.dataVigenciaContrato < today) {
      return res.status(403).json({
        success: false,
        error: "Contrato vencido. Entre em contato com o suporte.",
      });
    }

    // Check if user has reached the limit of 3 active ads
    if ((usuario.numeroAnunciosAtivos || 0) >= 3) {
      return res.status(403).json({
        success: false,
        error:
          "Limite de 3 anúncios ativos atingido. Aguarde a expiração de anúncios antigos.",
      });
    }

    // Only validate product if one is provided (product is optional)
    if (validatedData.productId && validatedData.productId > 0) {
      // Verify that the product belongs to the anunciante
      const producto = await prisma.productos.findUnique({
        where: { id: validatedData.productId },
      });

      if (!producto || producto.lojaId !== validatedData.anuncianteId) {
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

    // For free items: automatically set status to "ativo", set statusPagamento to "aprovado", and mark as featured
    const isDoacao = validatedData.isDoacao || false;
    const precoAnuncio = isDoacao ? 0 : validatedData.precoAnuncio;
    const status = isDoacao ? "ativo" : "em_edicao";
    const statusPagamento = isDoacao ? "aprovado" : "pendente";
    const destaque = isDoacao ? true : false;

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
        statusPagamento,
        destaque,
        isDoacao,
        tipo: "produto",
        dataAtualizacao: new Date(),
      },
      include: {
        anunciantes: true,
      },
    });

    // Increment active ads counter for the user
    if (status === "ativo" || status === "pago") {
      // Only count as active if donation (ativo) or paid (pago)
      await prisma.usracessos.update({
        where: { id: validatedData.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            increment: 1,
          },
        },
      });
    }

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

    // If updating to donation, automatically set status to "ativo", statusPagamento to "aprovado", and mark as featured
    if (updateData.isDoacao === true) {
      updateData.status = "ativo";
      updateData.precoAnuncio = 0;
    }

    // Map field names to schema
    const mappedData: any = {};
    if (updateData.titulo !== undefined) mappedData.titulo = updateData.titulo;
    if (updateData.descricao !== undefined)
      mappedData.descricao = updateData.descricao;
    if (updateData.fotoUrl !== undefined)
      mappedData.imagem = updateData.fotoUrl;
    if (updateData.precoAnuncio !== undefined)
      mappedData.preco = updateData.precoAnuncio;
    if (updateData.categoria !== undefined)
      mappedData.categoria = updateData.categoria;
    if (updateData.cidade !== undefined) mappedData.cidade = updateData.cidade;
    if (updateData.estado !== undefined) mappedData.estado = updateData.estado;
    if (updateData.status !== undefined) mappedData.status = updateData.status;
    if (updateData.isDoacao !== undefined) mappedData.isDoacao = updateData.isDoacao;
    if (updateData.destaque !== undefined) mappedData.destaque = updateData.destaque;

    // When updating to donation, automatically approve and feature it
    if (updateData.isDoacao === true) {
      mappedData.statusPagamento = "aprovado";
      mappedData.destaque = true;
    }

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: {
        ...mappedData,
        dataAtualizacao: new Date(),
      },
      include: {
        anunciantes: true,
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

    // Get current status before update
    const currentAd = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
      select: {
        status: true,
        usuarioId: true,
      },
    });

    if (!currentAd) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    const anuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: {
        status,
        dataAtualizacao: new Date(),
      },
      include: {
        anunciantes: true,
      },
    });

    // Update active ads counter if status is changing
    const wasActive = currentAd.status === "pago";
    const isNowActive = status === "pago";

    if (wasActive && !isNowActive) {
      // Transitioning from active to inactive
      await prisma.usracessos.update({
        where: { id: currentAd.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            decrement: 1,
          },
        },
      });
    } else if (!wasActive && isNowActive) {
      // Transitioning from inactive to active
      await prisma.usracessos.update({
        where: { id: currentAd.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            increment: 1,
          },
        },
      });
    }

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
      select: {
        status: true,
        usuarioId: true,
      },
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
        anunciantes: true,
      },
    });

    // Update active ads counter if status is changing
    const wasActive = anuncio.status === "pago" || anuncio.status === "ativo";
    const isNowActive = status === "pago" || status === "ativo";

    if (wasActive && !isNowActive) {
      // Transitioning from active to inactive
      await prisma.usracessos.update({
        where: { id: anuncio.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            decrement: 1,
          },
        },
      });
    } else if (!wasActive && isNowActive) {
      // Transitioning from inactive to active
      await prisma.usracessos.update({
        where: { id: anuncio.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            increment: 1,
          },
        },
      });
    }

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

    // Get ad details before deletion to check status
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
      select: {
        status: true,
        usuarioId: true,
      },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Delete the ad
    await prisma.anuncios.delete({
      where: { id: parseInt(id) },
    });

    // Decrement active ads counter if ad was active
    if (anuncio.status === "pago") {
      await prisma.usracessos.update({
        where: { id: anuncio.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            decrement: 1,
          },
        },
      });
    }

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

    // Get current status before inactivation
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
      select: {
        status: true,
        usuarioId: true,
      },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    const updated = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        anunciantes: true,
      },
    });

    // Decrement active ads counter if ad was active
    if (anuncio.status === "pago") {
      await prisma.usracessos.update({
        where: { id: anuncio.usuarioId },
        data: {
          numeroAnunciosAtivos: {
            decrement: 1,
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Anúncio inativado com sucesso",
      data: updated,
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
        anunciantes: true,
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

// TOGGLE featured status of an ad (destaque)
export const toggleDestaqueAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current destaque status
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
      select: { destaque: true },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Toggle the destaque value
    const updated = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: { destaque: !anuncio.destaque },
      include: {
        anunciantes: true,
      },
    });

    res.json({
      success: true,
      message: `Anúncio ${updated.destaque ? "adicionado ao" : "removido do"} destaque com sucesso`,
      data: updated,
    });
  } catch (error) {
    console.error("Error toggling featured status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao alternar status de destaque",
    });
  }
};

// GET user's ads (my ads)
export const getAnunciosDUsuario: RequestHandler = async (req, res) => {
  try {
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const { status, limit = "20", offset = "0" } = req.query;

    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    // Get all ads created by this user's advertisers
    const usuarioAnunciantes = await prisma.usuarios_anunciantes.findMany({
      where: { usuarioId },
      select: { anuncianteId: true },
    });

    const anuncianteIds = usuarioAnunciantes.map((ua) => ua.anuncianteId);

    // If user has no advertisers, return empty list
    if (anuncianteIds.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          count: 0,
          total: 0,
          limit: pageLimit,
          offset: pageOffset,
          hasMore: false,
        },
      });
    }

    const where: any = {
      anuncianteId: {
        in: anuncianteIds,
      },
    };

    if (status) {
      where.status = status;
    }

    // Get total count and paginated data in parallel
    const [anuncios, total] = await Promise.all([
      prisma.anuncios.findMany({
        where,
        include: {
          anunciantes: {
            select: {
              id: true,
              nome: true,
              fotoUrl: true,
            },
          },
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.anuncios.count({ where }),
    ]);

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
    console.error("[getAnunciosDUsuario] Error fetching user ads:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar seus anúncios",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// RECORD ad view
export const recordAnuncioView: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = (req as any).userId; // From extractUserId middleware, optional for non-logged-in users

    const anuncioId = parseInt(id);

    // Verify ad exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: anuncioId },
      select: { id: true },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Record the view in anuncioVisualizados
    await prisma.anuncioVisualizados.create({
      data: {
        anuncioId,
        usuarioId: usuarioId || null, // null if not logged in
      },
    });

    // Increment visualizacoes counter
    await prisma.anuncios.update({
      where: { id: anuncioId },
      data: {
        visualizacoes: {
          increment: 1,
        },
      },
    });

    res.json({
      success: true,
      message: "Visualização registrada com sucesso",
    });
  } catch (error) {
    console.error("Error recording ad view:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao registrar visualização",
    });
  }
};

// GET all photos for an ad
export const getAnuncioFotos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const anuncioId = parseInt(id);

    // Verify ad exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: anuncioId },
      select: { id: true },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Get all photos ordered by priority
    const fotos = await prisma.fotos_anuncio.findMany({
      where: { anuncio_id: anuncioId },
      select: {
        id: true,
        url: true,
        ordem: true,
        criado_por: true,
        data_criacao: true,
      },
      orderBy: { ordem: "asc" },
    });

    res.json({
      success: true,
      data: fotos,
      count: fotos.length,
    });
  } catch (error) {
    console.error("Error fetching ad photos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar fotos do anúncio",
    });
  }
};

// POST new photo to an ad
export const addAnuncioFoto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        success: false,
        error: "URL da foto é obrigatória",
      });
    }

    const anuncioId = parseInt(id);

    // Verify ad exists and get its details
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: anuncioId },
      select: {
        id: true,
        usuarioId: true,
        anuncianteId: true,
      },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Check if user has permission (owner or admin)
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = anuncio.usuarioId === usuarioId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Permissão negada para adicionar fotos a este anúncio",
      });
    }

    // Check photo limit (max 5 photos)
    const photoCount = await prisma.fotos_anuncio.count({
      where: { anuncio_id: anuncioId },
    });

    if (photoCount >= 5) {
      return res.status(400).json({
        success: false,
        error: "Limite de 5 fotos por anúncio atingido",
      });
    }

    // Calculate next ordem value (priority)
    const nextOrdem =
      photoCount === 0
        ? 1
        : (await prisma.fotos_anuncio.findFirst({
            where: { anuncio_id: anuncioId },
            orderBy: { ordem: "desc" },
            select: { ordem: true },
          })
          )?.ordem! + 1 || photoCount + 1;

    // Create photo
    const foto = await prisma.fotos_anuncio.create({
      data: {
        anuncio_id: anuncioId,
        url,
        ordem: nextOrdem,
        criado_por: usuarioId,
      },
      select: {
        id: true,
        url: true,
        ordem: true,
        criado_por: true,
        data_criacao: true,
      },
    });

    res.status(201).json({
      success: true,
      data: foto,
      message: "Foto adicionada com sucesso",
    });
  } catch (error) {
    console.error("Error adding ad photo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar foto",
    });
  }
};

// DELETE a photo from an ad
export const deleteAnuncioFoto: RequestHandler = async (req, res) => {
  try {
    const { id, fotoId } = req.params;
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const anuncioId = parseInt(id);
    const photoId = parseInt(fotoId);

    // Verify ad exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: anuncioId },
      select: {
        id: true,
        usuarioId: true,
      },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Get photo details
    const foto = await prisma.fotos_anuncio.findUnique({
      where: { id: photoId },
      select: {
        id: true,
        anuncio_id: true,
        criado_por: true,
        ordem: true,
      },
    });

    if (!foto) {
      return res.status(404).json({
        success: false,
        error: "Foto não encontrada",
      });
    }

    // Verify photo belongs to the ad
    if (foto.anuncio_id !== anuncioId) {
      return res.status(404).json({
        success: false,
        error: "Foto não pertence a este anúncio",
      });
    }

    // Check permissions (only owner and admin can delete)
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = anuncio.usuarioId === usuarioId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Permissão negada para deletar fotos deste anúncio",
      });
    }

    // Delete the photo
    await prisma.fotos_anuncio.delete({
      where: { id: photoId },
    });

    // Reorganize remaining photos' ordem values
    const remainingFotos = await prisma.fotos_anuncio.findMany({
      where: { anuncio_id: anuncioId },
      orderBy: { ordem: "asc" },
      select: { id: true },
    });

    // Update ordem for each remaining photo
    for (let i = 0; i < remainingFotos.length; i++) {
      await prisma.fotos_anuncio.update({
        where: { id: remainingFotos[i].id },
        data: { ordem: i + 1 },
      });
    }

    res.json({
      success: true,
      message: "Foto deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting ad photo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar foto",
    });
  }
};

// REORDER photos for an ad
export const reorderAnuncioFotos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { fotosOrder } = req.body; // Array of { id, ordem }
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    if (!Array.isArray(fotosOrder)) {
      return res.status(400).json({
        success: false,
        error: "fotosOrder deve ser um array de { id, ordem }",
      });
    }

    const anuncioId = parseInt(id);

    // Verify ad exists and permissions
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: anuncioId },
      select: { usuarioId: true },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Check permissions
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = anuncio.usuarioId === usuarioId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Permissão negada para reordenar fotos",
      });
    }

    // Update ordem for each photo
    for (const { id: fotoId, ordem } of fotosOrder) {
      const foto = await prisma.fotos_anuncio.findUnique({
        where: { id: fotoId },
        select: { anuncio_id: true },
      });

      if (!foto || foto.anuncio_id !== anuncioId) {
        return res.status(400).json({
          success: false,
          error: `Foto ${fotoId} não pertence a este anúncio`,
        });
      }

      await prisma.fotos_anuncio.update({
        where: { id: fotoId },
        data: { ordem },
      });
    }

    // Get updated photos
    const fotos = await prisma.fotos_anuncio.findMany({
      where: { anuncio_id: anuncioId },
      select: {
        id: true,
        url: true,
        ordem: true,
      },
      orderBy: { ordem: "asc" },
    });

    res.json({
      success: true,
      message: "Fotos reordenadas com sucesso",
      data: fotos,
    });
  } catch (error) {
    console.error("Error reordering ad photos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao reordenar fotos",
    });
  }
};
