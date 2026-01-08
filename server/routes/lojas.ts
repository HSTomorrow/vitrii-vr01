import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const LojaCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpjOuCpf: z.string().regex(/^\d{11,18}$/, "CNPJ/CPF inválido"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  email: z.string().email("Email inválido"),
  site: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  fotoUrl: z.string().optional(),
});

// GET all stores (with pagination)
export const getLojas: RequestHandler = async (req, res) => {
  try {
    const { limit = "20", offset = "0" } = req.query;

    // Validate pagination parameters
    const pageLimit = Math.min(Math.max(parseInt(limit as string) || 20, 1), 100);
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    // Get total count and paginated data in parallel
    const [lojas, total] = await Promise.all([
      prisma.loja.findMany({
        select: {
          id: true,
          nome: true,
          fotoUrl: true,
          endereco: true,
          email: true,
          cnpjOuCpf: true,
          status: true,
          dataCriacao: true,
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.loja.count(),
    ]);

    res.json({
      success: true,
      data: lojas,
      pagination: {
        count: lojas.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar lojas",
    });
  }
};

// GET store by ID with full details (optimized)
export const getLojaById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const loja = await prisma.loja.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        endereco: true,
        email: true,
        cnpjOuCpf: true,
        descricao: true,
        site: true,
        instagram: true,
        facebook: true,
        status: true,
        dataCriacao: true,
        usuarioLojas: {
          select: {
            tipoUsuario: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          take: 10, // Limit to first 10 users
        },
      },
    });

    if (!loja) {
      return res.status(404).json({
        success: false,
        error: "Loja não encontrada",
      });
    }

    res.json({
      success: true,
      data: loja,
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar loja",
    });
  }
};

// CREATE new store
export const createLoja: RequestHandler = async (req, res) => {
  try {
    const validatedData = LojaCreateSchema.parse(req.body);

    // Check if store already exists
    const existingLoja = await prisma.loja.findUnique({
      where: { cnpjOuCpf: validatedData.cnpjOuCpf },
    });

    if (existingLoja) {
      return res.status(400).json({
        success: false,
        error: "Loja com este CNPJ/CPF já cadastrada",
      });
    }

    const loja = await prisma.loja.create({
      data: {
        ...validatedData,
        status: "ativa",
      },
    });

    res.status(201).json({
      success: true,
      data: loja,
      message: "Loja criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating store:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar loja",
    });
  }
};

// Schema for updating store (whitelist safe fields)
const LojaUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  endereco: z.string().min(1, "Endereço é obrigatório").optional(),
  descricao: z.string().min(1, "Descrição é obrigatória").optional(),
  email: z.string().email("Email inválido").optional(),
  site: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  fotoUrl: z.string().optional(),
});

// UPDATE store (only safe fields allowed)
export const updateLoja: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input - only allow safe fields
    const validatedData = LojaUpdateSchema.parse(req.body);

    const loja = await prisma.loja.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    res.json({
      success: true,
      data: loja,
      message: "Loja atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating store:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar loja",
    });
  }
};

// Schema for adding user to store
const AdicionarUsuarioLojaSchema = z.object({
  lojaId: z.number().int().positive("ID da loja é obrigatório"),
  usuarioId: z.number().int().positive("ID do usuário é obrigatório"),
  tipoUsuario: z.enum(["gerente", "vendedor", "operador"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
});

// Add user to store with role
export const adicionarUsuarioLoja: RequestHandler = async (req, res) => {
  try {
    // Validate input
    const validatedData = AdicionarUsuarioLojaSchema.parse(req.body);

    const usuarioLoja = await prisma.usuarioLoja.create({
      data: validatedData,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        loja: {
          select: { id: true, nome: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: usuarioLoja,
      message: "Usuário adicionado à loja com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error adding user to store:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar usuário à loja",
    });
  }
};

// Get store staff
export const getEquipeLoja: RequestHandler = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const equipe = await prisma.usuarioLoja.findMany({
      where: { lojaId: parseInt(lojaId) },
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
    });

    res.json({
      success: true,
      data: equipe,
      count: equipe.length,
    });
  } catch (error) {
    console.error("Error fetching store staff:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar equipe da loja",
    });
  }
};

// Delete store
export const deleteLoja: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.loja.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Loja deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar loja",
    });
  }
};
