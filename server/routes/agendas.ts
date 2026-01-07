import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for creating/updating agenda
const AgendaCreateSchema = z.object({
  lojaId: z.number().int().positive("Loja é obrigatória"),
  productId: z.number().int().positive("Produto é obrigatório"),
  dataHora: z.string().datetime("Data e hora devem estar em formato ISO"),
  descricao: z.string().optional().nullable(),
  usuarioId: z.number().int().positive().optional().nullable(),
  status: z
    .enum(["disponivel", "ocupado", "cancelado"])
    .optional()
    .default("disponivel"),
  isActive: z.boolean().optional().default(true),
});

// GET all agenda slots for a store
export const getAgendas: RequestHandler = async (req, res) => {
  try {
    const { lojaId, productId, dataInicio, dataFim, status } = req.query;

    const where: any = { isActive: true };

    if (lojaId) where.lojaId = parseInt(lojaId as string);
    if (productId) where.productId = parseInt(productId as string);
    if (status) where.status = status;

    // Date range filter
    if (dataInicio || dataFim) {
      where.dataHora = {};
      if (dataInicio) where.dataHora.gte = new Date(dataInicio as string);
      if (dataFim) where.dataHora.lte = new Date(dataFim as string);
    }

    const agendas = await prisma.agenda.findMany({
      where,
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: { dataHora: "asc" },
    });

    res.json({
      success: true,
      data: agendas,
      count: agendas.length,
    });
  } catch (error) {
    console.error("Error fetching agendas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar agendas",
    });
  }
};

// GET single agenda by ID
export const getAgendaById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(id) },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
          },
        },
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

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    res.json({
      success: true,
      data: agenda,
    });
  } catch (error) {
    console.error("Error fetching agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar agenda",
    });
  }
};

// CREATE new agenda slot
export const createAgenda: RequestHandler = async (req, res) => {
  try {
    const validatedData = AgendaCreateSchema.parse(req.body);

    // Check if the time slot is already occupied
    const existingAgenda = await prisma.agenda.findFirst({
      where: {
        lojaId: validatedData.lojaId,
        productId: validatedData.productId,
        dataHora: new Date(validatedData.dataHora),
        isActive: true,
        status: { not: "cancelado" },
      },
    });

    if (existingAgenda) {
      return res.status(400).json({
        success: false,
        error: "Este horário já está ocupado. Consulte a lista de espera.",
      });
    }

    const agenda = await prisma.agenda.create({
      data: {
        lojaId: validatedData.lojaId,
        productId: validatedData.productId,
        dataHora: new Date(validatedData.dataHora),
        descricao: validatedData.descricao,
        usuarioId: validatedData.usuarioId,
        status: validatedData.status || "disponivel",
        isActive: validatedData.isActive !== false,
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: agenda,
      message: "Horário adicionado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("Error creating agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar horário",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// UPDATE agenda status
export const updateAgendaStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, usuarioId } = req.body;

    const validStatuses = ["disponivel", "ocupado", "cancelado"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
      });
    }

    const agenda = await prisma.agenda.update({
      where: { id: parseInt(id) },
      data: {
        status,
        usuarioId: status === "ocupado" ? usuarioId || undefined : null,
      },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: agenda,
      message: `Horário ${status === "ocupado" ? "reservado" : "atualizado"} com sucesso`,
    });
  } catch (error) {
    console.error("Error updating agenda status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar status da agenda",
    });
  }
};

// DELETE agenda (logical deletion)
export const deleteAgenda: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agenda = await prisma.agenda.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
          },
        },
        producto: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Horário cancelado com sucesso",
      data: agenda,
    });
  } catch (error) {
    console.error("Error deleting agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao cancelar horário",
    });
  }
};

// ============================================================================
// WAITLIST MANAGEMENT
// ============================================================================

// Schema for waitlist entry (using Agenda model with status "fila_espera")
const WaitlistEntrySchema = z.object({
  agendaOcupadaId: z.number().int().positive("Agenda ocupada é obrigatória"),
  usuarioId: z.number().int().positive("Usuário é obrigatório"),
  telefone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

// ADD user to waitlist for an occupied time slot
export const addToWaitlist: RequestHandler = async (req, res) => {
  try {
    const validatedData = WaitlistEntrySchema.parse(req.body);

    // Get the occupied agenda
    const agendaOcupada = await prisma.agenda.findUnique({
      where: { id: validatedData.agendaOcupadaId },
    });

    if (!agendaOcupada) {
      return res.status(404).json({
        success: false,
        error: "Horário não encontrado",
      });
    }

    // Check if user is already in waitlist for this slot
    const existingWaitlist = await prisma.agenda.findFirst({
      where: {
        lojaId: agendaOcupada.lojaId,
        productId: agendaOcupada.productId,
        dataHora: agendaOcupada.dataHora,
        usuarioId: validatedData.usuarioId,
        status: "fila_espera",
        isActive: true,
      },
    });

    if (existingWaitlist) {
      return res.status(400).json({
        success: false,
        error: "Este usuário já está na lista de espera para este horário",
      });
    }

    // Create waitlist entry using Agenda model
    const waitlistEntry = await prisma.agenda.create({
      data: {
        lojaId: agendaOcupada.lojaId,
        productId: agendaOcupada.productId,
        dataHora: agendaOcupada.dataHora,
        usuarioId: validatedData.usuarioId,
        status: "fila_espera", // Custom status for waitlist
        descricao: `Fila de espera para ${agendaOcupada.dataHora.toLocaleDateString("pt-BR")}`,
        isActive: true,
      },
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

    res.status(201).json({
      success: true,
      data: waitlistEntry,
      message: "Adicionado à lista de espera com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("Error adding to waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar à lista de espera",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// GET waitlist for a specific time slot
export const getWaitlist: RequestHandler = async (req, res) => {
  try {
    const { agendaId } = req.params;

    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(agendaId) },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Get all waitlist entries for this occupied slot
    const waitlist = await prisma.agenda.findMany({
      where: {
        lojaId: agenda.lojaId,
        productId: agenda.productId,
        dataHora: agenda.dataHora,
        status: "fila_espera",
        isActive: true,
      },
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
      orderBy: { dataCriacao: "asc" }, // First in, first out
    });

    res.json({
      success: true,
      data: waitlist,
      count: waitlist.length,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar lista de espera",
    });
  }
};

// REMOVE user from waitlist
export const removeFromWaitlist: RequestHandler = async (req, res) => {
  try {
    const { waitlistId } = req.params;

    const waitlistEntry = await prisma.agenda.update({
      where: { id: parseInt(waitlistId) },
      data: { isActive: false },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Usuário removido da lista de espera",
      data: waitlistEntry,
    });
  } catch (error) {
    console.error("Error removing from waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover da lista de espera",
    });
  }
};

// PROMOTE first person from waitlist to booked slot
export const promoteFromWaitlist: RequestHandler = async (req, res) => {
  try {
    const { agendaId } = req.params;

    const agenda = await prisma.agenda.findUnique({
      where: { id: parseInt(agendaId) },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Get first person in waitlist
    const firstInWaitlist = await prisma.agenda.findFirst({
      where: {
        lojaId: agenda.lojaId,
        productId: agenda.productId,
        dataHora: agenda.dataHora,
        status: "fila_espera",
        isActive: true,
      },
      orderBy: { dataCriacao: "asc" },
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

    if (!firstInWaitlist) {
      return res.status(404).json({
        success: false,
        error: "Nenhum usuário na lista de espera",
      });
    }

    // Update the original agenda to available
    const updatedAgenda = await prisma.agenda.update({
      where: { id: parseInt(agendaId) },
      data: {
        status: "disponivel",
        usuarioId: null,
      },
    });

    // Remove the promoted person from waitlist
    await prisma.agenda.update({
      where: { id: firstInWaitlist.id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: `${firstInWaitlist.usuario?.nome} foi promovido da lista de espera`,
      data: {
        promotedUser: firstInWaitlist.usuario,
        updatedAgenda,
      },
    });
  } catch (error) {
    console.error("Error promoting from waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao promover da lista de espera",
    });
  }
};
