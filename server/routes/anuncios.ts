import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for creating/updating ad
const AnuncioCreateSchema = z.object({
  lojaId: z.number().int().positive("Loja é obrigatória"),
  productId: z.number().int().positive("Produto é obrigatório"),
  tabelaDePrecoId: z.number().int().positive("Tabela de preço é obrigatória"),
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(255),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres").optional(),
  fotoUrl: z.string().url("URL de foto inválida").optional(),
});

// GET all ads
export const getAnuncios: RequestHandler = async (req, res) => {
  try {
    const { lojaId, status } = req.query;

    const where: any = {};
    if (lojaId) where.lojaId = parseInt(lojaId as string);
    if (status) where.status = status;

    const anuncios = await prisma.anuncio.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
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
            tamanho: true,
            cor: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
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
                tamanho: true,
                cor: true,
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
    });

    if (!producto || producto.lojaId !== validatedData.lojaId) {
      return res.status(400).json({
        success: false,
        error: "Produto não pertence à loja selecionada",
      });
    }

    // Verify that the price table belongs to the product
    const tabelaDePreco = await prisma.tabelaDePreco.findUnique({
      where: { id: validatedData.tabelaDePrecoId },
    });

    if (!tabelaDePreco || tabelaDePreco.productId !== validatedData.productId) {
      return res.status(400).json({
        success: false,
        error: "Tabela de preço não pertence ao produto selecionado",
      });
    }

    const anuncio = await prisma.anuncio.create({
      data: {
        ...validatedData,
        status: "em_edicao",
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
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar anúncio",
    });
  }
};

// UPDATE ad
export const updateAnuncio: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = AnuncioCreateSchema.partial().parse(req.body);

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
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating ad:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar anúncio",
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

// DELETE ad
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

// GET products and prices by store for ad creation
export const getProdutosParaAnuncio: RequestHandler = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const productos = await prisma.producto.findMany({
      where: { lojaId: parseInt(lojaId) },
      include: {
        grupoDeProductos: true,
        tabelasDePreco: true,
        produtoEmEstoque: true,
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
