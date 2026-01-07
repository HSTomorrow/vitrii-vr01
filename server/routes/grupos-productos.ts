import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const GrupoCreateSchema = z.object({
  lojaId: z.number().int().positive("Loja é obrigatória"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

// GET all grupos
export const getGrupos: RequestHandler = async (req, res) => {
  try {
    const { lojaId } = req.query;

    const where: any = {};
    if (lojaId) where.lojaId = parseInt(lojaId as string);

    const grupos = await prisma.grupoDeProductos.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: grupos,
      count: grupos.length,
    });
  } catch (error) {
    console.error("Error fetching grupos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar grupos de produtos",
    });
  }
};

// GET grupo by ID
export const getGrupoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const grupo = await prisma.grupoDeProductos.findUnique({
      where: { id: parseInt(id) },
      include: {
        loja: true,
        produtos: true,
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

// GET productos of a grupo
export const getProductosOfGrupo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const productos = await prisma.producto.findMany({
      where: { grupoId: parseInt(id) },
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
      error: "Erro ao buscar produtos do grupo",
    });
  }
};

// CREATE new grupo
export const createGrupo: RequestHandler = async (req, res) => {
  try {
    const validatedData = GrupoCreateSchema.parse(req.body);

    const grupo = await prisma.grupoDeProductos.create({
      data: validatedData,
      include: {
        loja: true,
      },
    });

    res.status(201).json({
      success: true,
      data: grupo,
      message: "Grupo de produtos criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating grupo:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar grupo de produtos",
    });
  }
};

// UPDATE grupo
export const updateGrupo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = GrupoCreateSchema.partial().parse(req.body);

    const grupo = await prisma.grupoDeProductos.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        loja: true,
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

// DELETE grupo
export const deleteGrupo: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.grupoDeProductos.delete({
      where: { id: parseInt(id) },
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
