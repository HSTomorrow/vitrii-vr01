import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const ProductoCreateSchema = z.object({
  grupoId: z.number().int().positive("Grupo é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  sku: z.string().optional(),
});

// GET all productos
export const getProductos: RequestHandler = async (req, res) => {
  try {
    const { grupoId } = req.query;

    const where: any = {};
    if (grupoId) where.grupoId = parseInt(grupoId as string);

    const productos = await prisma.producto.findMany({
      where,
      include: {
        grupo: {
          include: {
            loja: {
              select: {
                id: true,
                nome: true,
              },
            },
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
    console.error("Error fetching productos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos",
    });
  }
};

// GET producto by ID
export const getProductoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await prisma.producto.findUnique({
      where: { id: parseInt(id) },
      include: {
        grupo: {
          include: {
            loja: true,
          },
        },
        tabelasDePreco: true,
      },
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        error: "Produto não encontrado",
      });
    }

    res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error("Error fetching producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produto",
    });
  }
};

// CREATE new producto
export const createProducto: RequestHandler = async (req, res) => {
  try {
    const validatedData = ProductoCreateSchema.parse(req.body);

    // Verify that the grupo exists
    const grupo = await prisma.grupoDeProductos.findUnique({
      where: { id: validatedData.grupoId },
    });

    if (!grupo) {
      return res.status(400).json({
        success: false,
        error: "Grupo não encontrado",
      });
    }

    const producto = await prisma.producto.create({
      data: validatedData,
      include: {
        grupo: {
          include: {
            loja: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: producto,
      message: "Produto criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar produto",
    });
  }
};

// UPDATE producto
export const updateProducto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = ProductoCreateSchema.partial().parse(req.body);

    const producto = await prisma.producto.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        grupo: {
          include: {
            loja: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: producto,
      message: "Produto atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar produto",
    });
  }
};

// DELETE producto
export const deleteProducto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.producto.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Produto deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar produto",
    });
  }
};
