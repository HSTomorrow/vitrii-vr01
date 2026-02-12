import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema para criar link de produto externo
const LinkProdutoExternoCreateSchema = z.object({
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  productId: z.number().int().positive().optional().nullable(),
  marketplace: z.enum(["mercado_livre", "shopee", "amazon", "b2Brasil", "outro"]),
  url: z.string().url("URL inválida"),
  preco: z.number().nonnegative().optional().nullable(),
  titulo_externo: z.string().max(255).optional().nullable(),
  descricao_externa: z.string().optional().nullable(),
});

// Schema para atualizar link
const LinkProdutoExternoUpdateSchema = LinkProdutoExternoCreateSchema.partial();

// Validar se anunciante é profissional
async function validateProfessionalAdvertiser(anuncianteId: number) {
  const anunciante = await prisma.anunciantes.findUnique({
    where: { id: anuncianteId },
    select: {
      id: true,
      tipo: true,
    },
  });

  if (!anunciante) {
    throw new Error("Anunciante não encontrado");
  }

  // Apenas "Profissional", "Premium", "Master" podem usar
  const tiposPermitidos = ["Profissional", "Premium", "Master", "Padrão"];
  if (!tiposPermitidos.includes(anunciante.tipo)) {
    throw new Error(
      "Apenas anunciantes profissionais podem criar links de produtos externos"
    );
  }

  return anunciante;
}

// GET all external product links for an advertiser
export const getLinksProdutosExternos: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, marketplace, status, limite = "20", offset = "0" } =
      req.query;

    if (!anuncianteId) {
      return res.status(400).json({
        success: false,
        error: "anuncianteId é obrigatório",
      });
    }

    const where: any = { anuncianteId: parseInt(anuncianteId as string) };
    if (marketplace) where.marketplace = marketplace;
    if (status) where.status = status;

    const [links, total] = await Promise.all([
      prisma.links_produtos_externos.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              nome: true,
              sku: true,
            },
          },
        },
        orderBy: { dataCriacao: "desc" },
        take: parseInt(limite as string) || 20,
        skip: parseInt(offset as string) || 0,
      }),
      prisma.links_produtos_externos.count({ where }),
    ]);

    res.json({
      success: true,
      data: links,
      total,
    });
  } catch (error) {
    console.error("Error fetching external product links:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar links de produtos externos",
    });
  }
};

// GET single external product link
export const getLinkProdutoExternoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await prisma.links_produtos_externos.findUnique({
      where: { id: parseInt(id) },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
            tipo: true,
          },
        },
        product: true,
      },
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Link de produto não encontrado",
      });
    }

    res.json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error("Error fetching external product link:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar link de produto",
    });
  }
};

// CREATE external product link
export const createLinkProdutoExterno: RequestHandler = async (req, res) => {
  try {
    const validatedData = LinkProdutoExternoCreateSchema.parse(req.body);

    // Validate professional advertiser
    try {
      await validateProfessionalAdvertiser(validatedData.anuncianteId);
    } catch (error: any) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    // Verify product exists if provided
    if (validatedData.productId) {
      const product = await prisma.productos.findUnique({
        where: { id: validatedData.productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Produto não encontrado",
        });
      }
    }

    const link = await prisma.links_produtos_externos.create({
      data: validatedData,
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        product: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: link,
      message: "Link de produto externo criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating external product link:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar link de produto externo",
    });
  }
};

// UPDATE external product link
export const updateLinkProdutoExterno: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = LinkProdutoExternoUpdateSchema.parse(req.body);

    const link = await prisma.links_produtos_externos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Link de produto não encontrado",
      });
    }

    // If changing anunciante, validate it's professional
    if (
      validatedData.anuncianteId &&
      validatedData.anuncianteId !== link.anuncianteId
    ) {
      try {
        await validateProfessionalAdvertiser(validatedData.anuncianteId);
      } catch (error: any) {
        return res.status(403).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Verify product exists if changing
    if (validatedData.productId && validatedData.productId !== link.productId) {
      const product = await prisma.productos.findUnique({
        where: { id: validatedData.productId },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Produto não encontrado",
        });
      }
    }

    const updatedLink = await prisma.links_produtos_externos.update({
      where: { id: parseInt(id) },
      data: validatedData,
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        product: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedLink,
      message: "Link de produto atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating external product link:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar link de produto",
    });
  }
};

// DELETE external product link
export const deleteLinkProdutoExterno: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await prisma.links_produtos_externos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Link de produto não encontrado",
      });
    }

    await prisma.links_produtos_externos.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Link de produto deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting external product link:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar link de produto",
    });
  }
};

// CHANGE status (ativo/inativo/removido)
export const updateLinkStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ativo", "inativo", "removido"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido. Use: ativo, inativo ou removido",
      });
    }

    const link = await prisma.links_produtos_externos.update({
      where: { id: parseInt(id) },
      data: { status },
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
      data: link,
      message: `Status do link alterado para ${status}`,
    });
  } catch (error) {
    console.error("Error updating link status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar status do link",
    });
  }
};

// GET marketplace statistics
export const getMarketplaceStats: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.query;

    if (!anuncianteId) {
      return res.status(400).json({
        success: false,
        error: "anuncianteId é obrigatório",
      });
    }

    const links = await prisma.links_produtos_externos.findMany({
      where: {
        anuncianteId: parseInt(anuncianteId as string),
      },
    });

    const stats = {
      total: links.length,
      porMarketplace: {} as Record<string, number>,
      porStatus: {
        ativo: 0,
        inativo: 0,
        removido: 0,
      },
    };

    links.forEach((link) => {
      // Count by marketplace
      stats.porMarketplace[link.marketplace] =
        (stats.porMarketplace[link.marketplace] || 0) + 1;

      // Count by status
      if (link.status === "ativo") stats.porStatus.ativo++;
      else if (link.status === "inativo") stats.porStatus.inativo++;
      else if (link.status === "removido") stats.porStatus.removido++;
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching marketplace stats:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas de marketplaces",
    });
  }
};
