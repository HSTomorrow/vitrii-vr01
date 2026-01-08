import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const AnuncianteCreateSchema = z.object({
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

// GET all anunciantes (with pagination)
export const getAnunciantes: RequestHandler = async (req, res) => {
  try {
    const { limit = "20", offset = "0" } = req.query;

    // Validate pagination parameters
    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    // Get total count and paginated data in parallel
    const [anunciantes, total] = await Promise.all([
      prisma.anunciante.findMany({
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
      prisma.anunciante.count(),
    ]);

    res.json({
      success: true,
      data: anunciantes,
      pagination: {
        count: anunciantes.length,
        total,
        limit: pageLimit,
        offset: pageOffset,
        hasMore: pageOffset + pageLimit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching anunciantes:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anunciantes",
    });
  }
};

// GET anunciante by ID with full details (optimized)
export const getAnuncianteById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const anunciante = await prisma.anunciante.findUnique({
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
        usuarioAnunciantes: {
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

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    res.json({
      success: true,
      data: anunciante,
    });
  } catch (error) {
    console.error("Error fetching anunciante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anunciante",
    });
  }
};

// CREATE new anunciante
export const createAnunciante: RequestHandler = async (req, res) => {
  try {
    const validatedData = AnuncianteCreateSchema.parse(req.body);

    // Check if anunciante already exists
    const existingAnunciante = await prisma.anunciante.findUnique({
      where: { cnpjOuCpf: validatedData.cnpjOuCpf },
    });

    if (existingAnunciante) {
      return res.status(400).json({
        success: false,
        error: "Anunciante com este CNPJ/CPF já cadastrado",
        details: [
          {
            path: ["cnpjOuCpf"],
            message: "CNPJ/CPF já cadastrado no sistema",
          },
        ],
      });
    }

    const anunciante = await prisma.anunciante.create({
      data: {
        ...validatedData,
        status: "ativa",
      },
    });

    res.status(201).json({
      success: true,
      data: anunciante,
      message: "Anunciante criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    console.error("Error creating anunciante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar anunciante",
    });
  }
};

// Schema for updating anunciante (whitelist safe fields)
const AnuncianteUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  endereco: z.string().min(1, "Endereço é obrigatório").optional(),
  descricao: z.string().min(1, "Descrição é obrigatória").optional(),
  email: z.string().email("Email inválido").optional(),
  site: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  fotoUrl: z.string().optional(),
});

// UPDATE anunciante (only safe fields allowed)
export const updateAnunciante: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input - only allow safe fields
    const validatedData = AnuncianteUpdateSchema.parse(req.body);

    const anunciante = await prisma.anunciante.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    res.json({
      success: true,
      data: anunciante,
      message: "Anunciante atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    console.error("Error updating anunciante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar anunciante",
    });
  }
};

// Schema for adding user to anunciante
const AdicionarUsuarioAnuncianteSchema = z.object({
  anuncianteId: z.number().int().positive("ID do anunciante é obrigatório"),
  usuarioId: z.number().int().positive("ID do usuário é obrigatório"),
  tipoUsuario: z.enum(["gerente", "vendedor", "operador"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
});

// Add user to anunciante with role
export const adicionarUsuarioAnunciante: RequestHandler = async (req, res) => {
  try {
    // Validate input
    const validatedData = AdicionarUsuarioAnuncianteSchema.parse(req.body);

    const usuarioAnunciante = await prisma.usuarioAnunciante.create({
      data: validatedData,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true },
        },
        anunciante: {
          select: { id: true, nome: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: usuarioAnunciante,
      message: "Usuário adicionado ao anunciante com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors.map((err) => ({
          path: err.path,
          message: err.message,
        })),
      });
    }

    console.error("Error adding user to anunciante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar usuário ao anunciante",
    });
  }
};

// Get anunciante staff
export const getEquipeAnunciante: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.params;

    const equipe = await prisma.usuarioAnunciante.findMany({
      where: { anuncianteId: parseInt(anuncianteId) },
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
    console.error("Error fetching anunciante staff:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar equipe do anunciante",
    });
  }
};

// Delete anunciante
export const deleteAnunciante: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.anunciante.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Anunciante deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting anunciante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar anunciante",
    });
  }
};

// Backward compatibility: export old function names that call new ones
export const getLojas = getAnunciantes;
export const getLojaById = getAnuncianteById;
export const createLoja = createAnunciante;
export const updateLoja = updateAnunciante;
export const adicionarUsuarioLoja = adicionarUsuarioAnunciante;
export const getEquipeLoja = getEquipeAnunciante;
export const deleteLoja = deleteAnunciante;
