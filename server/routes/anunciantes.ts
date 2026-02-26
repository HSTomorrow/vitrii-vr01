import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const AnuncianteCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["Padrão", "Profissional"]).default("Padrão"),
  cnpj: z
    .string()
    .regex(/^\d{11,14}$/, "CNPJ/CPF inválido"),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres (ex: MG, SP, RJ)"),
  cep: z.string().regex(/^\d{8}$/, "CEP deve conter 8 dígitos"),
  email: z.string().email("Email inválido"),
  descricao: z.string().optional(),
  telefone: z.string().optional(),
  site: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  chavePix: z.string().max(32, "Chave PIX deve ter no máximo 32 caracteres").optional(),
  fotoUrl: z.union([z.null(), z.string().max(500, "URL da foto muito longa")]).optional(),
  iconColor: z.enum(["azul", "verde", "rosa", "vermelho", "laranja"]).default("azul"),
  localidadeId: z.number().int().positive("Localidade inválida"),
  status: z.enum(["Ativo", "Desativado"]).default("Ativo"),
  temAgenda: z.boolean().default(false),
});

// GET all anunciantes (with pagination and user filtering)
export const getAnunciantes: RequestHandler = async (req, res) => {
  try {
    const { limit = "20", offset = "0", includeInactive = "false" } = req.query;
    const userId = req.userId;

    // Validate pagination parameters
    const pageLimit = Math.min(
      Math.max(parseInt(limit as string) || 20, 1),
      100,
    );
    const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

    const where: any = {};

    // Filter by status - only show Ativo unless explicitly requested otherwise
    if (includeInactive !== "true") {
      where.status = "Ativo";
    }

    // If user is not an admin, filter by their anunciantes
    if (userId) {
      const usuario = await prisma.usracessos.findUnique({
        where: { id: userId },
      });

      // If not admin, only show anunciantes the user is associated with
      if (usuario && usuario.tipoUsuario !== "adm") {
        const userAnunciantes = await prisma.usuarios_anunciantes.findMany({
          where: { usuarioId: userId },
          select: { anuncianteId: true },
        });

        const anuncianteIds = userAnunciantes.map((ua) => ua.anuncianteId);

        if (anuncianteIds.length === 0) {
          // User has no anunciantes, return empty list
          return res.json({
            success: true,
            data: [],
            pagination: {
              count: 0,
              total: 0,
              limit: pageLimit,
              offset: pageOffset,
              hasMore: false,
            },
          });
        }

        where.id = { in: anuncianteIds };
      }
    }

    // Get total count and paginated data in parallel
    const [anunciantes, total] = await Promise.all([
      prisma.anunciantes.findMany({
        where,
        select: {
          id: true,
          nome: true,
          tipo: true,
          descricao: true,
          cnpj: true,
          telefone: true,
          email: true,
          endereco: true,
          cidade: true,
          estado: true,
          cep: true,
          site: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          fotoUrl: true,
          iconColor: true,
          status: true,
          localidadeId: true,
          dataCriacao: true,
          dataAtualizacao: true,
        },
        orderBy: { dataCriacao: "desc" },
        take: pageLimit,
        skip: pageOffset,
      }),
      prisma.anunciantes.count(where ? { where } : undefined),
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

    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nome: true,
        tipo: true,
        fotoUrl: true,
        iconColor: true,
        telefone: true,
        endereco: true,
        cidade: true,
        estado: true,
        cep: true,
        email: true,
        cnpj: true,
        descricao: true,
        site: true,
        instagram: true,
        facebook: true,
        whatsapp: true,
        status: true,
        dataCriacao: true,
        usuarios_anunciantes: {
          select: {
            papel: true,
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
    console.log("[createAnunciante] 📝 Iniciando criação de anunciante com dados:", {
      nome: req.body.nome,
      cidade: req.body.cidade,
      estado: req.body.estado,
      iconColor: req.body.iconColor,
      localidadeId: req.body.localidadeId,
      status: req.body.status,
      temAgenda: req.body.temAgenda,
      fotoUrl: req.body.fotoUrl ? "✓ Foto fornecida" : "✗ Sem foto",
    });

    // Clean CEP - remove hyphen and spaces before validation
    if (req.body.cep) {
      req.body.cep = req.body.cep.replace(/[^\d]/g, '');
    }

    // Clean empty fotoUrl to null
    if (!req.body.fotoUrl || (typeof req.body.fotoUrl === 'string' && req.body.fotoUrl.trim() === '')) {
      req.body.fotoUrl = null;
    }

    console.log("[createAnunciante] 🧹 Dados após limpeza:", {
      cep: req.body.cep,
      fotoUrl: req.body.fotoUrl,
    });

    const validatedData = AnuncianteCreateSchema.parse(req.body);
    const { usuarioId } = req.body; // Optional userId to link the creator

    // Check if CNPJ/CPF is registered to a user (cross-validation)
    // Only prevent if it's for a regular user, allow admin exception
    if (validatedData.cnpj && usuarioId) {
      const requestingUser = await prisma.usracessos.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if this CPF/CNPJ is already a user
      if (requestingUser?.tipoUsuario !== "adm") {
        const cpfAsUser = await prisma.usracessos.findFirst({
          where: { cpf: validatedData.cnpj },
        });

        if (cpfAsUser) {
          return res.status(400).json({
            success: false,
            error: "Este CPF/CNPJ já está cadastrado como usuário no sistema",
            details: [
              {
                path: ["cnpj"],
                message:
                  "CPF/CNPJ não pode ser reutilizado para anunciante se já é usuário",
              },
            ],
          });
        }
      }
    }

    // Multiple anunciantes can have the same CNPJ (no restriction between anunciantes)
    // The restriction is only between user and anunciante

    // Log field lengths before creating
    console.log("[createAnunciante] 📏 Tamanho dos campos:", {
      nome: validatedData.nome ? validatedData.nome.length : 0,
      tipo: validatedData.tipo ? validatedData.tipo.length : 0,
      cnpj: validatedData.cnpj ? validatedData.cnpj.length : 0,
      endereco: validatedData.endereco ? validatedData.endereco.length : 0,
      cidade: validatedData.cidade ? validatedData.cidade.length : 0,
      estado: validatedData.estado ? validatedData.estado.length : 0,
      cep: validatedData.cep ? validatedData.cep.length : 0,
      email: validatedData.email ? validatedData.email.length : 0,
      telefone: validatedData.telefone ? validatedData.telefone.length : 0,
      site: validatedData.site ? validatedData.site.length : 0,
      instagram: validatedData.instagram ? validatedData.instagram.length : 0,
      facebook: validatedData.facebook ? validatedData.facebook.length : 0,
      whatsapp: validatedData.whatsapp ? validatedData.whatsapp.length : 0,
      chavePix: validatedData.chavePix ? validatedData.chavePix.length : 0,
      fotoUrl: validatedData.fotoUrl ? validatedData.fotoUrl.length : 0,
      iconColor: validatedData.iconColor ? validatedData.iconColor.length : 0,
      descricao: validatedData.descricao ? validatedData.descricao.length : 0,
    });

    // Create anunciante with required and optional fields
    const anunciante = await prisma.anunciantes.create({
      data: {
        nome: validatedData.nome,
        tipo: validatedData.tipo,
        cidade: validatedData.cidade,
        estado: validatedData.estado,
        cnpj: validatedData.cnpj,
        endereco: validatedData.endereco,
        email: validatedData.email,
        telefone: validatedData.telefone,
        cep: validatedData.cep,
        descricao: validatedData.descricao,
        site: validatedData.site,
        instagram: validatedData.instagram,
        facebook: validatedData.facebook,
        whatsapp: validatedData.whatsapp,
        chavePix: validatedData.chavePix,
        fotoUrl: validatedData.fotoUrl,
        iconColor: validatedData.iconColor,
        localidadeId: validatedData.localidadeId,
        status: validatedData.status,
        temAgenda: validatedData.temAgenda,
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
      },
    });

    // Link the creating user to this anunciante as admin/owner
    if (usuarioId) {
      try {
        await prisma.usuarios_anunciantes.create({
          data: {
            usuarioId: usuarioId,
            anuncianteId: anunciante.id,
            papel: "gerente",
          },
        });
      } catch (err) {
        // If linking fails, still return success with the anunciante
        console.error("Error linking user to anunciante:", err);
      }
    }

    console.log("[createAnunciante] ✅ Anunciante criado com sucesso:", {
      id: anunciante.id,
      nome: anunciante.nome,
      iconColor: anunciante.iconColor,
      status: anunciante.status,
      fotoUrl: anunciante.fotoUrl ? "✓" : "✗",
      localidadeId: anunciante.localidadeId,
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
  tipo: z.enum(["Padrão", "Profissional"]).optional(),
  cnpj: z
    .string()
    .regex(/^\d{11,14}$/, "CNPJ/CPF inválido")
    .optional(),
  endereco: z.string().min(1, "Endereço é obrigatório").optional(),
  cidade: z.string().min(1, "Cidade é obrigatória").optional(),
  estado: z.string().length(2, "Estado deve ter 2 caracteres").optional(),
  descricao: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().optional(),
  cep: z.string().optional(),
  site: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  whatsapp: z.string().optional(),
  chavePix: z.string().max(32, "Chave PIX deve ter no máximo 32 caracteres").optional(),
  fotoUrl: z.string().optional(),
  iconColor: z.enum(["azul", "verde", "rosa", "vermelho", "laranja"]).optional(),
  localidadeId: z.number().int().nullable().optional(),
  status: z.enum(["Ativo", "Desativado"]).optional(),
});

// UPDATE anunciante (only safe fields allowed)
export const updateAnunciante: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userId;

    // Validate input - only allow safe fields
    const validatedData = AnuncianteUpdateSchema.parse(req.body);

    // Convert empty strings to null for optional fields
    const cleanedData: Record<string, any> = {};
    const optionalStringFields = [
      "cnpj",
      "telefone",
      "email",
      "endereco",
      "descricao",
      "site",
      "instagram",
      "facebook",
      "whatsapp",
      "chavePix",
      "fotoUrl",
      "cep",
    ];

    for (const [key, value] of Object.entries(validatedData)) {
      if (
        optionalStringFields.includes(key) &&
        typeof value === "string" &&
        value.trim() === ""
      ) {
        cleanedData[key] = null;
      } else {
        cleanedData[key] = value;
      }
    }

    // Check if anunciante exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        nome: true,
        cnpj: true,
      },
    });

    if (!anunciante) {
      return res.status(404).json({
        success: false,
        error: "Anunciante não encontrado",
      });
    }

    // Check permissions - allow if user is admin or owner of the anunciante
    if (usuarioId) {
      const usuario = await prisma.usracessos.findUnique({
        where: { id: usuarioId },
        select: { tipoUsuario: true },
      });

      // If not admin, check if user is associated with this anunciante
      if (usuario?.tipoUsuario !== "adm") {
        const hasAccess = await prisma.usuarios_anunciantes.findFirst({
          where: {
            usuarioId: usuarioId,
            anuncianteId: parseInt(id),
          },
        });

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: "Você não tem permissão para atualizar este anunciante",
          });
        }
      }
    }

    const updatedAnunciante = await prisma.anunciantes.update({
      where: { id: parseInt(id) },
      data: {
        ...cleanedData,
        dataAtualizacao: new Date(),
      },
    });

    res.json({
      success: true,
      data: updatedAnunciante,
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

    // Log detailed error information for debugging
    console.error("Error updating anunciante:", {
      id: req.params.id,
      body: req.body,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode:
        error instanceof Error && "code" in error
          ? (error as any).code
          : undefined,
      errorMeta:
        error instanceof Error && "meta" in error
          ? (error as any).meta
          : undefined,
    });

    // Check for specific Prisma error types
    if (error instanceof Error) {
      const errorMessage = error.message;
      const errorName = error.name;
      const code = (error as any).code;

      // Handle unique constraint violations
      if (code === "P2002") {
        const field = (error as any).meta?.target?.[0];
        return res.status(409).json({
          success: false,
          error: `Este ${field || "valor"} já está cadastrado no sistema`,
          details: {
            type: "unique_constraint_violation",
            field: field,
          },
        });
      }

      // Handle record not found errors
      if (code === "P2025") {
        return res.status(404).json({
          success: false,
          error: "Anunciante não encontrado",
        });
      }

      // Return generic error with message for investigation
      return res.status(500).json({
        success: false,
        error: "Erro ao atualizar anunciante",
        details: {
          message: errorMessage,
          type: errorName,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: "Erro ao atualizar anunciante",
      details: {
        message: String(error),
      },
    });
  }
};

// Schema for adding user to anunciante
const AdicionarUsuarioAnuncianteSchema = z.object({
  anuncianteId: z.number().int().positive("ID do anunciante é obrigatório"),
  usuarioId: z.number().int().positive("ID do usuário é obrigatório"),
  papel: z.enum(["gerente", "vendedor", "operador"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
});

// Add user to anunciante with role
export const adicionarUsuarioAnunciante: RequestHandler = async (req, res) => {
  try {
    // Validate input
    const validatedData = AdicionarUsuarioAnuncianteSchema.parse(req.body);

    const usuarioAnunciante = await prisma.usuarios_anunciantes.create({
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

    const equipe = await prisma.usuarios_anunciantes.findMany({
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

    await prisma.anunciantes.delete({
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

// GET anunciantes filtered by user (ADM sees all, regular users see only theirs)
export const getAnunciantesByUsuario: RequestHandler = async (req, res) => {
  try {
    const usuarioId = req.userId;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Fetch user to check if is admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    let anunciantes;

    // If user is ADM, return all anunciantes
    if (usuario.tipoUsuario === "adm") {
      anunciantes = await prisma.anunciantes.findMany({
        select: {
          id: true,
          nome: true,
          tipo: true,
          descricao: true,
          cnpj: true,
          telefone: true,
          email: true,
          endereco: true,
          cidade: true,
          estado: true,
          cep: true,
          site: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          fotoUrl: true,
          status: true,
          dataCriacao: true,
          dataAtualizacao: true,
        },
        orderBy: { dataCriacao: "desc" },
      });
    } else {
      // For regular users, return only anunciantes where they are linked
      anunciantes = await prisma.anunciantes.findMany({
        where: {
          usuarios_anunciantes: {
            some: {
              usuarioId: usuarioId,
            },
          },
        },
        select: {
          id: true,
          nome: true,
          tipo: true,
          descricao: true,
          cnpj: true,
          telefone: true,
          email: true,
          endereco: true,
          cidade: true,
          estado: true,
          cep: true,
          site: true,
          instagram: true,
          facebook: true,
          whatsapp: true,
          fotoUrl: true,
          status: true,
          dataCriacao: true,
          dataAtualizacao: true,
        },
        orderBy: { dataCriacao: "desc" },
      });
    }

    res.json({
      success: true,
      data: anunciantes,
      count: anunciantes.length,
    });
  } catch (error) {
    console.error("Error fetching anunciantes by user:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar anunciantes",
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
