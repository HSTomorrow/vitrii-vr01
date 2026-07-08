import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Schema validation
const TabelaPrecoCreateSchema = z.object({
  productId: z.number().int().positive("Produto é obrigatório"),
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  preco: z.number().positive("Preço deve ser maior que zero"),
  precoCusto: z.number().optional(),
  tamanho: z.string().optional(),
  cor: z.string().optional(),
});

// GET all tabelas
export const getTabelas: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, productId } = req.query;

    const where: any = {};
    if (anuncianteId) where.lojaId = parseInt(anuncianteId as string);
    if (productId) where.productId = parseInt(productId as string);

    const tabelas = await prisma.tabelas_preco.findMany({
      where,
      include: {
        produto: {
          include: {
            grupo: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({
      success: true,
      data: tabelas,
      count: tabelas.length,
    });
  } catch (error) {
    console.error("Error fetching tabelas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar tabelas de preço",
    });
  }
};

// GET tabela by ID
export const getTabelaById: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const tabela = await prisma.tabelas_preco.findUnique({
      where: { id },
      include: {
        produto: {
          include: {
            grupo: true,
          },
        },
      },
    });

    if (!tabela) {
      return res.status(404).json({
        success: false,
        error: "Tabela de preço não encontrada",
      });
    }

    res.json({
      success: true,
      data: tabela,
    });
  } catch (error) {
    console.error("Error fetching tabela:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar tabela de preço",
    });
  }
};

// CREATE new tabela
export const createTabela: RequestHandler = async (req, res) => {
  try {
    const validatedData = TabelaPrecoCreateSchema.parse(req.body);

    // Verify that the product exists and belongs to a grupo in the specified anunciante
    const producto = await prisma.productos.findUnique({
      where: { id: validatedData.productId, dataExclusao: null },
      include: {
        grupo: true,
      },
    });

    if (!producto) {
      return res.status(400).json({
        success: false,
        error: "Produto não encontrado",
      });
    }

    if (producto.grupo.anuncianteId !== validatedData.anuncianteId) {
      return res.status(400).json({
        success: false,
        error: "Produto não pertence ao anunciante selecionado",
      });
    }

    // Check if price table already exists for this product/tamanho/cor in this anunciante
    const existingTabela = await prisma.tabelas_preco.findFirst({
      where: {
        productId: validatedData.productId,
        lojaId: validatedData.anuncianteId,
        tamanho: validatedData.tamanho || null,
        cor: validatedData.cor || null,
      },
    });

    if (existingTabela) {
      return res.status(400).json({
        success: false,
        error:
          "Já existe uma tabela de preço para este produto (com esse tamanho/cor) neste anunciante",
      });
    }

    const tabela = await prisma.tabelas_preco.create({
      data: {
        productId: validatedData.productId,
        lojaId: validatedData.anuncianteId,
        tamanho: validatedData.tamanho || null,
        cor: validatedData.cor || null,
        preco: new Decimal(validatedData.preco.toString()),
        precoCusto: validatedData.precoCusto
          ? new Decimal(validatedData.precoCusto.toString())
          : undefined,
        dataAtualizacao: new Date(),
      },
      include: {
        produto: {
          include: {
            grupo: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: tabela,
      message: "Tabela de preço criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating tabela:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar tabela de preço",
    });
  }
};

// UPDATE tabela
export const updateTabela: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const validatedData = TabelaPrecoCreateSchema.partial().parse(req.body);

    const updatePayload: any = { dataAtualizacao: new Date() };
    if (validatedData.preco !== undefined) {
      updatePayload.preco = new Decimal(validatedData.preco.toString());
    }
    if (validatedData.precoCusto !== undefined) {
      updatePayload.precoCusto = new Decimal(validatedData.precoCusto.toString());
    }
    if (validatedData.productId !== undefined) {
      updatePayload.productId = validatedData.productId;
    }
    if (validatedData.anuncianteId !== undefined) {
      updatePayload.lojaId = validatedData.anuncianteId;
    }
    if (validatedData.tamanho !== undefined) {
      updatePayload.tamanho = validatedData.tamanho || null;
    }
    if (validatedData.cor !== undefined) {
      updatePayload.cor = validatedData.cor || null;
    }

    const tabela = await prisma.tabelas_preco.update({
      where: { id },
      data: updatePayload,
      include: {
        produto: {
          include: {
            grupo: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: tabela,
      message: "Tabela de preço atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating tabela:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar tabela de preço",
    });
  }
};

// DELETE tabela
export const deleteTabela: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    await prisma.tabelas_preco.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Tabela de preço deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting tabela:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar tabela de preço",
    });
  }
};
