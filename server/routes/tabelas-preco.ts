import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Schema validation
const TabelaPrecoCreateSchema = z.object({
  productId: z.number().int().positive("Produto é obrigatório"),
  lojaId: z.number().int().positive("Loja é obrigatória"),
  preco: z.number().positive("Preço deve ser maior que zero"),
  precoCusto: z.number().optional(),
  tamanho: z.string().optional(),
  cor: z.string().optional(),
});

// GET all tabelas
export const getTabelas: RequestHandler = async (req, res) => {
  try {
    const { lojaId, productId } = req.query;

    const where: any = {};
    if (lojaId) where.lojaId = parseInt(lojaId as string);
    if (productId) where.productId = parseInt(productId as string);

    const tabelas = await prisma.tabelaDePreco.findMany({
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
    const { id } = req.params;

    const tabela = await prisma.tabelaDePreco.findUnique({
      where: { id: parseInt(id) },
      include: {
        produto: {
          include: {
            grupo: true,
          },
        },
        qrCodes: true,
        anuncios: true,
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

    // Verify that the product exists and belongs to a grupo in the specified store
    const producto = await prisma.producto.findUnique({
      where: { id: validatedData.productId },
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

    if (producto.grupo.lojaId !== validatedData.lojaId) {
      return res.status(400).json({
        success: false,
        error: "Produto não pertence à loja selecionada",
      });
    }

    // Check if price table already exists for this product in this store
    const existingTabela = await prisma.tabelaDePreco.findFirst({
      where: {
        productId: validatedData.productId,
        lojaId: validatedData.lojaId,
      },
    });

    if (existingTabela) {
      return res.status(400).json({
        success: false,
        error: "Já existe uma tabela de preço para este produto nesta loja",
      });
    }

    const tabela = await prisma.tabelaDePreco.create({
      data: {
        productId: validatedData.productId,
        lojaId: validatedData.lojaId,
        preco: new Decimal(validatedData.preco.toString()),
        precoCusto: validatedData.precoCusto
          ? new Decimal(validatedData.precoCusto.toString())
          : undefined,
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
    const { id } = req.params;
    const validatedData = TabelaPrecoCreateSchema.partial().parse(req.body);

    const updatePayload: any = {};
    if (validatedData.preco !== undefined) {
      updatePayload.preco = new Decimal(validatedData.preco.toString());
    }
    if (validatedData.precoCusto !== undefined) {
      updatePayload.precoCusto = new Decimal(validatedData.precoCusto.toString());
    }
    if (validatedData.productId !== undefined) {
      updatePayload.productId = validatedData.productId;
    }
    if (validatedData.lojaId !== undefined) {
      updatePayload.lojaId = validatedData.lojaId;
    }

    const tabela = await prisma.tabelaDePreco.update({
      where: { id: parseInt(id) },
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
    const { id } = req.params;

    await prisma.tabelaDePreco.delete({
      where: { id: parseInt(id) },
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
