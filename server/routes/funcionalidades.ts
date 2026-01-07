import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for funcionalidade creation
const FuncionalidadeCreateSchema = z.object({
  chave: z
    .string()
    .min(3, "Chave deve ter pelo menos 3 caracteres")
    .max(100)
    .regex(/^[A-Z_]+$/, "Chave deve conter apenas letras maiúsculas e underscore"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(255),
  descricao: z.string().min(3).max(1000).optional(),
  categoria: z.enum([
    "users",
    "ads",
    "stores",
    "chat",
    "payments",
    "reports",
  ]),
});

const FuncionalidadeUpdateSchema = FuncionalidadeCreateSchema.partial();

// GET all funcionalidades
export const getFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const { categoria, ativo } = req.query;

    const where: any = {};

    if (categoria) {
      where.categoria = categoria;
    }

    if (ativo !== undefined) {
      where.isActive = ativo === "true";
    }

    const funcionalidades = await prisma.funcionalidade.findMany({
      where,
      orderBy: [{ categoria: "asc" }, { nome: "asc" }],
    });

    res.json({
      success: true,
      data: funcionalidades,
      count: funcionalidades.length,
    });
  } catch (error) {
    console.error("Error fetching funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar funcionalidades",
    });
  }
};

// GET funcionalidade by ID
export const getFuncionalidadeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const funcionalidade = await prisma.funcionalidade.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuarioXFuncionalidades: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
                tipoUsuario: true,
              },
            },
          },
        },
      },
    });

    if (!funcionalidade) {
      return res.status(404).json({
        success: false,
        error: "Funcionalidade não encontrada",
      });
    }

    res.json({
      success: true,
      data: funcionalidade,
    });
  } catch (error) {
    console.error("Error fetching funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar funcionalidade",
    });
  }
};

// GET funcionalidades by user ID
export const getFuncionalidadesByUsuario: RequestHandler = async (
  req,
  res,
) => {
  try {
    const { usuarioId } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioId) },
      include: {
        usuarioXFuncionalidades: {
          include: {
            funcionalidade: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // If user is ADM, return all funcionalidades
    if (usuario.tipoUsuario === "adm") {
      const todasFuncionalidades =
        await prisma.funcionalidade.findMany({
          where: { isActive: true },
          orderBy: [{ categoria: "asc" }, { nome: "asc" }],
        });

      return res.json({
        success: true,
        data: {
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            tipoUsuario: usuario.tipoUsuario,
          },
          funcionalidades: todasFuncionalidades,
          isAdm: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          tipoUsuario: usuario.tipoUsuario,
        },
        funcionalidades: usuario.usuarioXFuncionalidades.map(
          (uxf) => uxf.funcionalidade,
        ),
        isAdm: false,
      },
    });
  } catch (error) {
    console.error("Error fetching user funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar funcionalidades do usuário",
    });
  }
};

// CREATE funcionalidade
export const createFuncionalidade: RequestHandler = async (req, res) => {
  try {
    const validatedData = FuncionalidadeCreateSchema.parse(req.body);

    // Check if funcionalidade already exists
    const existing = await prisma.funcionalidade.findUnique({
      where: { chave: validatedData.chave },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Funcionalidade com essa chave já existe",
      });
    }

    const funcionalidade = await prisma.funcionalidade.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      data: funcionalidade,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error creating funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar funcionalidade",
    });
  }
};

// UPDATE funcionalidade
export const updateFuncionalidade: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = FuncionalidadeUpdateSchema.parse(req.body);

    // Check if funcionalidade exists
    const funcionalidade = await prisma.funcionalidade.findUnique({
      where: { id: parseInt(id) },
    });

    if (!funcionalidade) {
      return res.status(404).json({
        success: false,
        error: "Funcionalidade não encontrada",
      });
    }

    // If updating chave, check if new chave is unique
    if (validatedData.chave && validatedData.chave !== funcionalidade.chave) {
      const existing = await prisma.funcionalidade.findUnique({
        where: { chave: validatedData.chave },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Funcionalidade com essa chave já existe",
        });
      }
    }

    const updated = await prisma.funcionalidade.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error updating funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar funcionalidade",
    });
  }
};

// DELETE funcionalidade (soft delete)
export const deleteFuncionalidade: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const funcionalidade = await prisma.funcionalidade.findUnique({
      where: { id: parseInt(id) },
    });

    if (!funcionalidade) {
      return res.status(404).json({
        success: false,
        error: "Funcionalidade não encontrada",
      });
    }

    const updated = await prisma.funcionalidade.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    res.json({
      success: true,
      data: updated,
      message: "Funcionalidade desativada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar funcionalidade",
    });
  }
};
