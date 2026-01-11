import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const UsuarioXFuncionalidadeSchema = z.object({
  usuarioId: z.number().int().positive(),
  funcionalidadeId: z.number().int().positive(),
});

const GrantFuncionalidadesSchema = z.object({
  usuarioId: z.number().int().positive(),
  funcionalidadeIds: z.array(z.number().int().positive()),
});

const RevokeFuncionalidadesSchema = z.object({
  usuarioId: z.number().int().positive(),
  funcionalidadeIds: z.array(z.number().int().positive()),
});

// GRANT funcionalidade to user
export const grantFuncionalidade: RequestHandler = async (req, res) => {
  try {
    const validatedData = UsuarioXFuncionalidadeSchema.parse(req.body);

    // Check if user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: validatedData.usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if funcionalidade exists
    const funcionalidade = await prisma.funcionalidade.findUnique({
      where: { id: validatedData.funcionalidadeId },
    });

    if (!funcionalidade) {
      return res.status(404).json({
        success: false,
        error: "Funcionalidade não encontrada",
      });
    }

    // Check if user is ADM - ADM users already have all permissions
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Usuários ADM têm acesso automático a todas as funcionalidades",
      });
    }

    // Check if relationship already exists
    const existing = await prisma.usracessoXFuncionalidade.findUnique({
      where: {
        usuarioId_funcionalidadeId: {
          usuarioId: validatedData.usuarioId,
          funcionalidadeId: validatedData.funcionalidadeId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Usuário já tem acesso a essa funcionalidade",
      });
    }

    const relationship = await prisma.usracessoXFuncionalidade.create({
      data: validatedData,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        funcionalidade: {
          select: {
            id: true,
            chave: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: relationship,
      message: `Funcionalidade "${funcionalidade.nome}" concedida ao usuário`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error granting funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao conceder funcionalidade",
    });
  }
};

// GRANT multiple funcionalidades to user
export const grantFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const validatedData = GrantFuncionalidadesSchema.parse(req.body);

    // Check if user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: validatedData.usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is ADM
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Usuários ADM têm acesso automático a todas as funcionalidades",
      });
    }

    // Check all funcionalidades exist
    const funcionalidades = await prisma.funcionalidade.findMany({
      where: { id: { in: validatedData.funcionalidadeIds } },
    });

    if (funcionalidades.length !== validatedData.funcionalidadeIds.length) {
      return res.status(404).json({
        success: false,
        error: "Uma ou mais funcionalidades não foram encontradas",
      });
    }

    // Get existing relationships
    const existing = await prisma.usracessoXFuncionalidade.findMany({
      where: {
        usuarioId: validatedData.usuarioId,
        funcionalidadeId: { in: validatedData.funcionalidadeIds },
      },
    });

    // Filter out already granted funcionalidades
    const toGrant = validatedData.funcionalidadeIds.filter(
      (id) => !existing.some((e) => e.funcionalidadeId === id),
    );

    if (toGrant.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Usuário já tem acesso a todas essas funcionalidades",
      });
    }

    // Grant funcionalidades
    const created = await prisma.usracessoXFuncionalidade.createMany({
      data: toGrant.map((funcionalidadeId) => ({
        usuarioId: validatedData.usuarioId,
        funcionalidadeId,
      })),
    });

    res.status(201).json({
      success: true,
      data: {
        usuarioId: validatedData.usuarioId,
        funcionalidadesCount: created.count,
      },
      message: `${created.count} funcionalidade(s) concedida(s) ao usuário`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error granting funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao conceder funcionalidades",
    });
  }
};

// REVOKE funcionalidade from user
export const revokeFuncionalidade: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, funcionalidadeId } = req.params;

    // Check if user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is ADM
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Não é possível revogar funcionalidades de usuários ADM",
      });
    }

    // Find and delete relationship
    const relationship = await prisma.usracessoXFuncionalidade.findUnique({
      where: {
        usuarioId_funcionalidadeId: {
          usuarioId: parseInt(usuarioId),
          funcionalidadeId: parseInt(funcionalidadeId),
        },
      },
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        error: "Usuário não tem acesso a essa funcionalidade",
      });
    }

    await prisma.usracessoXFuncionalidade.delete({
      where: {
        usuarioId_funcionalidadeId: {
          usuarioId: parseInt(usuarioId),
          funcionalidadeId: parseInt(funcionalidadeId),
        },
      },
    });

    res.json({
      success: true,
      message: "Funcionalidade revogada com sucesso",
    });
  } catch (error) {
    console.error("Error revoking funcionalidade:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao revogar funcionalidade",
    });
  }
};

// REVOKE multiple funcionalidades from user
export const revokeFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const validatedData = RevokeFuncionalidadesSchema.parse(req.body);

    // Check if user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: validatedData.usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is ADM
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Não é possível revogar funcionalidades de usuários ADM",
      });
    }

    const deleted = await prisma.usracessoXFuncionalidade.deleteMany({
      where: {
        usuarioId: validatedData.usuarioId,
        funcionalidadeId: { in: validatedData.funcionalidadeIds },
      },
    });

    res.json({
      success: true,
      data: {
        usuarioId: validatedData.usuarioId,
        funcionalidadesCount: deleted.count,
      },
      message: `${deleted.count} funcionalidade(s) revogada(s) do usuário`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Error revoking funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao revogar funcionalidades",
    });
  }
};

// LIST all user-funcionalidade relationships (for admin panel)
export const listUserFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, funcionalidadeId } = req.query;

    const where: any = {};

    if (usuarioId) {
      where.usuarioId = parseInt(usuarioId as string);
    }

    if (funcionalidadeId) {
      where.funcionalidadeId = parseInt(funcionalidadeId as string);
    }

    const relationships = await prisma.usracessoXFuncionalidade.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            tipoUsuario: true,
          },
        },
        funcionalidade: {
          select: {
            id: true,
            chave: true,
            nome: true,
            categoria: true,
          },
        },
      },
      orderBy: [
        { usuario: { nome: "asc" } },
        { funcionalidade: { categoria: "asc" } },
      ],
    });

    res.json({
      success: true,
      data: relationships,
      count: relationships.length,
    });
  } catch (error) {
    console.error("Error listing user funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao listar relações de usuário-funcionalidade",
    });
  }
};

// GRANT all funcionalidades to user
export const grantAllFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Check if user exists
    const usuario = await prisma.usracesso.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is ADM
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Usuário já é ADM e tem acesso a todas as funcionalidades",
      });
    }

    // Get all active funcionalidades
    const allFuncionalidades = await prisma.funcionalidade.findMany({
      where: { isActive: true },
    });

    // Get existing relationships
    const existing = await prisma.usracessoXFuncionalidade.findMany({
      where: {
        usuarioId: parseInt(usuarioId),
      },
    });

    // Filter out already granted funcionalidades
    const toGrant = allFuncionalidades.filter(
      (func) => !existing.some((e) => e.funcionalidadeId === func.id),
    );

    if (toGrant.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Usuário já tem acesso a todas as funcionalidades",
      });
    }

    const created = await prisma.usracessoXFuncionalidade.createMany({
      data: toGrant.map((func) => ({
        usuarioId: parseInt(usuarioId),
        funcionalidadeId: func.id,
      })),
    });

    res.status(201).json({
      success: true,
      data: {
        usuarioId: parseInt(usuarioId),
        funcionalidadesCount: created.count,
      },
      message: `${created.count} funcionalidade(s) concedida(s) ao usuário`,
    });
  } catch (error) {
    console.error("Error granting all funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao conceder todas as funcionalidades",
    });
  }
};

// REVOKE all funcionalidades from user
export const revokeAllFuncionalidades: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Check if user exists
    const usuario = await prisma.usracesso.findUnique({
      where: { id: parseInt(usuarioId) },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    // Check if user is ADM
    if (usuario.tipoUsuario === "adm") {
      return res.status(400).json({
        success: false,
        error: "Não é possível revogar funcionalidades de usuários ADM",
      });
    }

    const deleted = await prisma.usracessoXFuncionalidade.deleteMany({
      where: {
        usuarioId: parseInt(usuarioId),
      },
    });

    res.json({
      success: true,
      data: {
        usuarioId: parseInt(usuarioId),
        funcionalidadesCount: deleted.count,
      },
      message: `${deleted.count} funcionalidade(s) revogada(s) do usuário`,
    });
  } catch (error) {
    console.error("Error revoking all funcionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao revogar todas as funcionalidades",
    });
  }
};
