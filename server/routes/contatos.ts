import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema para criar contato
const ContatoCreateSchema = z.object({
  nome: z.string()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(255, "Nome não pode ter mais de 255 caracteres"),
  celular: z.string()
    .min(1, "Celular/WhatsApp é obrigatório")
    .max(20, "Celular não pode ter mais de 20 caracteres"),
  telefone: z.string()
    .max(20, "Telefone não pode ter mais de 20 caracteres")
    .optional()
    .nullable(),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email não pode ter mais de 255 caracteres")
    .optional()
    .nullable(),
  status: z.enum(["ativo", "inativo", "analise"])
    .default("ativo"),
  tipoContato: z.string()
    .min(1, "Tipo de contato é obrigatório")
    .max(100, "Tipo de contato não pode ter mais de 100 caracteres"),
  observacoes: z.string()
    .max(1000, "Observações não podem ter mais de 1000 caracteres")
    .optional()
    .nullable(),
  imagem: z.string()
    .url("URL da imagem inválida")
    .max(500, "URL da imagem não pode ter mais de 500 caracteres")
    .optional()
    .nullable(),
  anuncianteId: z.number().optional().nullable(), // Optional: specific announcer or null for all
});

// Schema para atualizar contato
const ContatoUpdateSchema = ContatoCreateSchema.partial();

// GET all contatos for a user (admin sees all, users see only their own)
export const getContatosByUsuario: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
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

    const isAdmin = usuario.tipoUsuario === "adm";

    // Build filter: admin sees all, regular users see only their own
    const contatosFilter: any = {};

    if (!isAdmin) {
      // Regular users only see contacts they created
      contatosFilter.usuarioId = usuarioId;
    }

    const contatos = await prisma.contatos.findMany({
      where: contatosFilter,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({
      success: true,
      data: contatos,
    });
  } catch (error) {
    console.error("Error fetching contatos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar contatos",
    });
  }
};

// CREATE new contato
export const createContato: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    console.log("[createContato] ========== INICIANDO CRIAÇÃO DE CONTATO ==========");
    console.log("[createContato] usuarioId:", usuarioId);
    console.log("[createContato] Request headers:", req.headers);
    console.log("[createContato] Request body:", JSON.stringify(req.body, null, 2));

    console.log("[createContato] Iniciando validação com Zod...");
    let validatedData;
    try {
      validatedData = ContatoCreateSchema.parse(req.body);
      console.log("[createContato] ✅ Dados validados com sucesso:", JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.error("[createContato] ❌ ERRO DE VALIDAÇÃO:", validationError);
      throw validationError;
    }

    if (!usuarioId) {
      console.warn("[createContato] Usuário não autenticado");
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify user exists
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { id: true },
    });

    if (!usuario) {
      console.warn("[createContato] Usuário não encontrado, id:", usuarioId);
      return res.status(404).json({
        success: false,
        error: "Usuário não encontrado",
      });
    }

    console.log("[createContato] Usuário encontrado:", usuario.id);

    // If anuncianteId is provided, verify it exists
    if (validatedData.anuncianteId) {
      console.log("[createContato] Verificando anunciante:", validatedData.anuncianteId);
      const anunciante = await prisma.anunciantes.findUnique({
        where: { id: validatedData.anuncianteId },
        select: { id: true },
      });

      if (!anunciante) {
        console.warn("[createContato] Anunciante não encontrado, id:", validatedData.anuncianteId);
        return res.status(404).json({
          success: false,
          error: "Anunciante não encontrado",
        });
      }
      console.log("[createContato] Anunciante encontrado:", anunciante.id);
    }

    // Create contact
    console.log("[createContato] Criando contato no banco de dados...");
    const contato = await prisma.contatos.create({
      data: {
        usuarioId,
        anuncianteId: validatedData.anuncianteId || null,
        nome: validatedData.nome,
        celular: validatedData.celular,
        telefone: validatedData.telefone || null,
        email: validatedData.email || null,
        status: validatedData.status || "ativo",
        tipoContato: validatedData.tipoContato,
        observacoes: validatedData.observacoes || null,
        imagem: validatedData.imagem || null,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    console.log("[createContato] Contato criado com sucesso:", contato.id);
    res.status(201).json({
      success: true,
      data: contato,
      message: "Contato criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[createContato] Erro de validação:", error.errors);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    const errorObj = error as any;
    console.error("[createContato] ❌ ERRO AO CRIAR CONTATO:");
    console.error("[createContato] Error type:", errorObj?.constructor?.name);
    console.error("[createContato] Error message:", errorObj?.message);
    console.error("[createContato] Error code:", errorObj?.code);
    console.error("[createContato] Error meta:", JSON.stringify(errorObj?.meta, null, 2));
    console.error("[createContato] Error stack:", errorObj?.stack);
    console.error("[createContato] Full error object:", JSON.stringify(errorObj, null, 2));

    // Build detailed error response
    let errorResponse: any = {
      success: false,
      error: "Erro ao criar contato",
    };

    // Handle Prisma errors
    if (errorObj?.code) {
      // Prisma error codes
      const prismaErrorMap: Record<string, string> = {
        "P2002": "Campo duplicado ou violação de constraint único",
        "P2022": "Valor muito longo para o campo (excedeu o limite de caracteres)",
        "P2025": "Registro não encontrado",
        "P2003": "Referência estrangeira inválida",
      };

      const prismaMessage = prismaErrorMap[errorObj.code] || errorObj.message;
      errorResponse.error = `${prismaMessage} (${errorObj.code})`;

      // For P2022, provide field information
      if (errorObj.code === "P2022" && errorObj.meta?.column_name) {
        errorResponse.error += ` - Campo: ${errorObj.meta.column_name}`;
        console.error(`[createContato] ⚠️  Campo com problema: ${errorObj.meta.column_name}`);
      }

      errorResponse.details = {
        code: errorObj.code,
        message: errorObj.message,
        meta: errorObj.meta,
        prismaMessage: prismaMessage,
      };
    } else if (errorObj?.message) {
      errorResponse.error = errorObj.message;
      errorResponse.details = {
        message: errorObj.message,
        stack: errorObj.stack,
      };
    } else {
      errorResponse.error = "Erro desconhecido ao criar contato";
      errorResponse.details = JSON.stringify(errorObj);
    }

    console.error("[createContato] Resposta de erro:", JSON.stringify(errorResponse, null, 2));

    res.status(500).json(errorResponse);
  }
};

// UPDATE contato
export const updateContato: RequestHandler = async (req, res) => {
  try {
    const { contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const validatedData = ContatoUpdateSchema.parse(req.body);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Get the contact to verify ownership
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
      select: {
        usuarioId: true,
        anuncianteId: true,
      },
    });

    if (!contato) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    // Check if user is the creator or admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = contato.usuarioId === usuarioId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para editar este contato",
      });
    }

    // If anuncianteId is provided, verify it exists
    if (validatedData.anuncianteId) {
      const anunciante = await prisma.anunciantes.findUnique({
        where: { id: validatedData.anuncianteId },
        select: { id: true },
      });

      if (!anunciante) {
        return res.status(404).json({
          success: false,
          error: "Anunciante não encontrado",
        });
      }
    }

    const updatedContato = await prisma.contatos.update({
      where: { id: parseInt(contatoId) },
      data: {
        ...(validatedData.nome && { nome: validatedData.nome }),
        ...(validatedData.celular && { celular: validatedData.celular }),
        ...(validatedData.telefone !== undefined && {
          telefone: validatedData.telefone,
        }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.tipoContato && { tipoContato: validatedData.tipoContato }),
        ...(validatedData.observacoes !== undefined && {
          observacoes: validatedData.observacoes,
        }),
        ...(validatedData.imagem !== undefined && { imagem: validatedData.imagem }),
        ...(validatedData.anuncianteId !== undefined && {
          anuncianteId: validatedData.anuncianteId,
        }),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedContato,
      message: "Contato atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar contato",
    });
  }
};

// DELETE contato
export const deleteContato: RequestHandler = async (req, res) => {
  try {
    const { contatoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Get the contact to verify ownership
    const contato = await prisma.contatos.findUnique({
      where: { id: parseInt(contatoId) },
      select: {
        usuarioId: true,
      },
    });

    if (!contato) {
      return res.status(404).json({
        success: false,
        error: "Contato não encontrado",
      });
    }

    // Check if user is the creator or admin
    const usuario = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
      select: { tipoUsuario: true },
    });

    const isAdmin = usuario?.tipoUsuario === "adm";
    const isOwner = contato.usuarioId === usuarioId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar este contato",
      });
    }

    await prisma.contatos.delete({
      where: { id: parseInt(contatoId) },
    });

    res.json({
      success: true,
      message: "Contato deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting contato:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar contato",
    });
  }
};

// CHECK for duplicate contacts by email or phone
export const checkDuplicateContato: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");
    const { email, celular } = req.body;

    if (!usuarioId) {
      return res.status(401).json({
        error: "Usuário não autenticado",
      });
    }

    let field: "email" | "celular" | null = null;
    const where: any = { usuarioId };

    // Check by email if provided
    if (email) {
      const existingByEmail = await prisma.contatos.findFirst({
        where: {
          ...where,
          email,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (existingByEmail) {
        return res.json({
          duplicate: true,
          contatoId: existingByEmail.id,
          contatoNome: existingByEmail.nome,
          field: "email",
        });
      }
    }

    // Check by celular if provided
    if (celular) {
      const existingByCelular = await prisma.contatos.findFirst({
        where: {
          ...where,
          celular,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (existingByCelular) {
        return res.json({
          duplicate: true,
          contatoId: existingByCelular.id,
          contatoNome: existingByCelular.nome,
          field: "celular",
        });
      }
    }

    // No duplicates found
    res.json({
      duplicate: false,
    });
  } catch (error) {
    console.error("Error checking duplicate contato:", error);
    res.status(500).json({
      error: "Erro ao verificar duplicatas",
    });
  }
};

// For backwards compatibility: GET contatos by announcer (now calls getContatosByUsuario)
export const getContatosByAnunciante: RequestHandler = async (req, res) => {
  // This route is deprecated, but kept for backwards compatibility
  // Just calls the user-based endpoint
  return getContatosByUsuario(req, res);
};
