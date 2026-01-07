import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for creating/updating ad
const AnuncioCreateSchema = z.object({
  lojaId: z.number().int().positive("Loja é obrigatória"),
  productId: z.number().int().positive("Produto é obrigatório"),
  tabelaDePrecoId: z.number().int().optional().nullable(),
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(50, "Título não pode ter mais de 50 caracteres"),
  descricao: z.string().optional().nullable(),
  fotoUrl: z.string().optional().nullable(),
  precoAnuncio: z.number().positive("Preço do anúncio deve ser maior que 0").optional().nullable(),
  dataValidade: z.string().optional().nullable(),
  equipeDeVendaId: z.number().int().positive().optional().nullable(),
  isDoacao: z.boolean().optional().default(false),
  destaque: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  categoria: z.enum(["roupas", "carros", "imoveis"]).optional().nullable(),
  dadosCategoria: z.string().optional().nullable(), // JSON string
});

// GET all ads
export const getAnuncios: RequestHandler = async (req, res) => {
  try {
    const { lojaId, status, includeInactive, isDoacao } = req.query;

    const where: any = { isActive: true }; // Default: only active ads
    if (lojaId) where.lojaId = parseInt(lojaId as string);
    if (status) where.status = status;
    if (includeInactive === "true") delete where.isActive; // Override to include inactive
    // Handle isDoacao parameter
    if (isDoacao !== undefined) {
      where.isDoacao = isDoacao === "true";
    }

    const anuncios = await prisma.anuncio.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
            endereco: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          },
        },
        tabelaDePreco: {
          select: {
            id: true,
            preco: true,
          },
        },
      },
      orderBy: [{ destaque: "desc" }, { dataCriacao: "desc" }], // Featured ads first
    });

    res.json({
      success: true,
      data: anuncios,
      count: anuncios.length,
    });
  } catch (error) {
    console.error("Error fetching ads:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anúncios",
    });
  }
};

// GET ad by ID with full details
export const getAnuncioById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await prisma.anuncio.findUnique({
      where: { id: parseInt(id) },
      include: {
        loja: {
          include: {
            usuarioLojas: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    nome: true,
                    email: true,
                    telefone: true,
                  },
                },
              },
            },
          },
        },
        producto: {
          include: {
            grupoDeProductos: {
              select: {
                id: true,
                nome: true,
              },
            },
            tabelasDePreco: {
              select: {
                id: true,
                preco: true,
              },
            },
          },
        },
        tabelaDePreco: true,
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
    const validatedData = AnuncioCreateSchema.parse(req.body);

    // Verify that the product belongs to the store
    const producto = await prisma.producto.findUnique({
      where: { id: validatedData.productId },
      include: {
        grupo: true,
      },
    });

    if (!producto || producto.grupo.lojaId !== validatedData.lojaId) {
      return res.status(400).json({
        success: false,
        error: "Produto não pertence à loja selecionada",
      });
    }

    // Verify that the price table belongs to the product if provided
    let tabelaDePreco = null;
    if (validatedData.tabelaDePrecoId && validatedData.tabelaDePrecoId > 0) {
      tabelaDePreco = await prisma.tabelaDePreco.findUnique({
        where: { id: validatedData.tabelaDePrecoId },
      });

      if (!tabelaDePreco || tabelaDePreco.productId !== validatedData.productId) {
        return res.status(400).json({
          success: false,
          error: "Tabela de preço não pertence ao produto selecionado",
        });
      }
    } else {
      // If no table selected, get the first available price table for the product
      tabelaDePreco = await prisma.tabelaDePreco.findFirst({
        where: { productId: validatedData.productId },
      });

      if (!tabelaDePreco) {
        return res.status(400).json({
          success: false,
          error: "Nenhuma tabela de preços disponível para este produto. Por favor, crie pelo menos uma variante.",
        });
      }

      validatedData.tabelaDePrecoId = tabelaDePreco.id;
    }

    // Set validity: default to 7 days from now if not provided
    const dataValidade = validatedData.dataValidade
      ? new Date(validatedData.dataValidade)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // For donations: automatically set status to "pago" and zero out price
    const isDoacao = validatedData.isDoacao || false;
    const precoAnuncio = isDoacao ? null : validatedData.precoAnuncio;
    const status = isDoacao ? "pago" : "em_edicao";

    const anuncio = await prisma.anuncio.create({
      data: {
        lojaId: validatedData.lojaId,
        productId: validatedData.productId,
        tabelaDePrecoId: validatedData.tabelaDePrecoId,
        titulo: validatedData.titulo,
        descricao: validatedData.descricao,
        fotoUrl: validatedData.fotoUrl,
        precoAnuncio,
        dataValidade,
        equipeDeVendaId: validatedData.equipeDeVendaId,
        isDoacao,
        destaque: validatedData.destaque || false,
        isActive: validatedData.isActive !== false,
        categoria: validatedData.categoria,
        dadosCategoria: validatedData.dadosCategoria,
        status,
      },
      include: {
        loja: true,
        producto: true,
        tabelaDePreco: true,
      },
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
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("Error creating ad:", error);
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
    let updateData = AnuncioCreateSchema.partial().parse(req.body);

    // If updating to donation, automatically set status to "pago" and zero price
    if (updateData.isDoacao === true) {
      updateData.status = "pago";
      updateData.precoAnuncio = null;
    }

    const anuncio = await prisma.anuncio.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        loja: true,
        producto: true,
        tabelaDePreco: true,
      },
    });

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
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("Error updating ad:", error);
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

    const validStatuses = ["em_edicao", "aguardando_pagamento", "pago", "historico"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
      });
    }

    const anuncio = await prisma.anuncio.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        loja: true,
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
    const validStatuses = ["em_edicao", "aguardando_pagamento", "pago", "ativo", "historico"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
        details: `Status deve ser um dos seguintes: ${validStatuses.join(", ")}`,
      });
    }

    // Check if ad exists
    const anuncio = await prisma.anuncio.findUnique({
      where: { id: parseInt(id) },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Update status
    const updatedAnuncio = await prisma.anuncio.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        loja: true,
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

    await prisma.anuncio.delete({
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

    const anuncio = await prisma.anuncio.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        loja: true,
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

    const anuncio = await prisma.anuncio.update({
      where: { id: parseInt(id) },
      data: { isActive: true },
      include: {
        loja: true,
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

// GET products and prices by store for ad creation
export const getProdutosParaAnuncio: RequestHandler = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const productos = await prisma.producto.findMany({
      where: {
        grupo: {
          lojaId: parseInt(lojaId),
        },
      },
      include: {
        grupo: {
          select: {
            id: true,
            nome: true,
            lojaId: true,
          },
        },
        tabelasDePreco: {
          where: {
            lojaId: parseInt(lojaId),
          },
        },
      },
    });

    res.json({
      success: true,
      data: productos,
      count: productos.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos",
    });
  }
};
