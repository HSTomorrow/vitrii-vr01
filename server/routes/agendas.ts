import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for creating/updating agenda
const AgendaCreateSchema = z.object({
  anuncianteId: z.number().int().positive("Anunciante é obrigatório"),
  anuncioId: z.number().int().positive("Anúncio é obrigatório"),
  titulo: z.string().optional(),
  descricao: z.string().optional().nullable(),
  usuarioId: z.number().int().positive().optional().nullable(),
  status: z
    .enum(["disponivel", "ocupado", "cancelado"])
    .optional()
    .default("disponivel"),
});

// GET all agenda slots for an anunciante
export const getAgendas: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, anuncioId, dataInicio, dataFim, status } = req.query;

    const where: any = {};

    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (anuncioId) where.anuncioId = parseInt(anuncioId as string);
    if (status) where.status = status;

    // Note: Date range filtering is not supported on agendas table
    // Use slots_agenda table for date-based filtering instead

    const agendas = await prisma.agendas.findMany({
      where,
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
          },
        },
      },
      orderBy: { dataCriacao: "asc" },
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

    const agenda = await prisma.agendas.findUnique({
      where: { id: parseInt(id) },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
            fotoUrl: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
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

    // Check if agenda already exists for this anunciante and anuncio
    const existingAgenda = await prisma.agendas.findFirst({
      where: {
        anuncianteId: validatedData.anuncianteId,
        anuncioId: validatedData.anuncioId,
        status: { not: "cancelado" },
      },
    });

    if (existingAgenda) {
      return res.status(400).json({
        success: false,
        error: "Uma agenda já existe para este anúncio.",
      });
    }

    const agenda = await prisma.agendas.create({
      data: {
        anuncianteId: validatedData.anuncianteId,
        anuncioId: validatedData.anuncioId,
        titulo: validatedData.titulo || "Agenda",
        descricao: validatedData.descricao,
        status: validatedData.status || "disponivel",
      },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
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
    const { status } = req.body;

    const validStatuses = ["disponivel", "ocupado", "cancelado"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status inválido",
      });
    }

    const agenda = await prisma.agendas.update({
      where: { id: parseInt(id) },
      data: {
        status,
      },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
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

// DELETE agenda (logical deletion via status)
export const deleteAgenda: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agenda = await prisma.agendas.update({
      where: { id: parseInt(id) },
      data: { status: "cancelado" },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
        anuncio: {
          select: {
            id: true,
            titulo: true,
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
    const agendaOcupada = await prisma.agendas.findUnique({
      where: { id: validatedData.agendaOcupadaId },
    });

    if (!agendaOcupada) {
      return res.status(404).json({
        success: false,
        error: "Horário não encontrado",
      });
    }

    // Create waitlist entry using Agenda model
    const waitlistEntry = await prisma.agendas.create({
      data: {
        anuncianteId: agendaOcupada.anuncianteId,
        anuncioId: agendaOcupada.anuncioId,
        titulo: `Fila: ${agendaOcupada.titulo}`,
        status: "fila_espera", // Custom status for waitlist
        descricao: `Fila de espera para ${agendaOcupada.titulo}`,
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

    const agenda = await prisma.agendas.findUnique({
      where: { id: parseInt(agendaId) },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Get all waitlist entries for this occupied slot
    const waitlist = await prisma.agendas.findMany({
      where: {
        anuncianteId: agenda.anuncianteId,
        anuncioId: agenda.anuncioId,
        status: "fila_espera",
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

    const waitlistEntry = await prisma.agendas.update({
      where: { id: parseInt(waitlistId) },
      data: { status: "cancelado" },
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

    const agenda = await prisma.agendas.findUnique({
      where: { id: parseInt(agendaId) },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Get first person in waitlist
    const firstInWaitlist = await prisma.agendas.findFirst({
      where: {
        anuncianteId: agenda.anuncianteId,
        anuncioId: agenda.anuncioId,
        status: "fila_espera",
      },
      orderBy: { dataCriacao: "asc" },
    });

    if (!firstInWaitlist) {
      return res.status(404).json({
        success: false,
        error: "Nenhum usuário na lista de espera",
      });
    }

    // Update the original agenda to available
    const updatedAgenda = await prisma.agendas.update({
      where: { id: parseInt(agendaId) },
      data: {
        status: "disponivel",
      },
    });

    // Remove the promoted person from waitlist
    await prisma.agendas.update({
      where: { id: firstInWaitlist.id },
      data: { status: "cancelado" },
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
