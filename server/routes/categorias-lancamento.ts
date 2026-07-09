import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const CategoriaLancamentoCreateSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(50),
  descricao: z.string().min(1, "Descrição é obrigatória").max(255),
  status: z.enum(["ativo", "desativado"]).default("ativo"),
});

const CategoriaLancamentoUpdateSchema = CategoriaLancamentoCreateSchema.partial();

// GET all categorias (optionally filtered by status) - any authenticated user, used to
// populate the categoria dropdown on contrato/lançamento forms.
export const getCategoriasLancamento: RequestHandler = async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;

    const categorias = await prisma.categorias_lancamento.findMany({
      where,
      orderBy: { descricao: "asc" },
    });

    res.json({ success: true, data: categorias });
  } catch (error) {
    console.error("[getCategoriasLancamento] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar categorias de lançamento" });
  }
};

// CREATE categoria (admin only)
export const createCategoriaLancamento: RequestHandler = async (req, res) => {
  try {
    const validatedData = CategoriaLancamentoCreateSchema.parse(req.body);

    const categoria = await prisma.categorias_lancamento.create({
      data: {
        codigo: validatedData.codigo,
        descricao: validatedData.descricao,
        status: validatedData.status,
      },
    });

    res.status(201).json({
      success: true,
      data: categoria,
      message: "Categoria criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return res.status(409).json({
        success: false,
        error: "Já existe uma categoria com este código",
      });
    }

    console.error("[createCategoriaLancamento] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao criar categoria" });
  }
};

// UPDATE categoria (admin only) - includes codigo/descricao edits and status changes
export const updateCategoriaLancamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = CategoriaLancamentoUpdateSchema.parse(req.body);

    const categoria = await prisma.categorias_lancamento.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    res.json({
      success: true,
      data: categoria,
      message: "Categoria atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return res.status(409).json({
        success: false,
        error: "Já existe uma categoria com este código",
      });
    }

    console.error("[updateCategoriaLancamento] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar categoria" });
  }
};

// Toggle status (bloquear/desbloquear) - never a hard delete, since past contratos/
// lançamentos may still reference this category.
export const toggleStatusCategoriaLancamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const atual = await prisma.categorias_lancamento.findUnique({
      where: { id: parseInt(id) },
    });

    if (!atual) {
      return res.status(404).json({ success: false, error: "Categoria não encontrada" });
    }

    const novoStatus = atual.status === "ativo" ? "desativado" : "ativo";

    const categoria = await prisma.categorias_lancamento.update({
      where: { id: parseInt(id) },
      data: { status: novoStatus },
    });

    res.json({
      success: true,
      data: categoria,
      message: novoStatus === "ativo" ? "Categoria desbloqueada" : "Categoria bloqueada",
    });
  } catch (error) {
    console.error("[toggleStatusCategoriaLancamento] Error:", error);
    res.status(500).json({ success: false, error: "Erro ao alterar status da categoria" });
  }
};
