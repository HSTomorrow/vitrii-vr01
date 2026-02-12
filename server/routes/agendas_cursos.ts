import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema para criar agenda
const AgendaCreateSchema = z.object({
  anuncioId: z.number().int().positive("Anúncio é obrigatório"),
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(255),
  descricao: z.string().optional().nullable(),
  tipo: z.enum(["aula", "curso", "servico"]),
  duracao_minutos: z.number().int().positive().default(60),
  preco: z.number().nonnegative().optional().nullable(),
  capacidade: z.number().int().min(1).default(1),
});

// Schema para atualizar agenda
const AgendaUpdateSchema = AgendaCreateSchema.partial();

// Schema para criar slot
const SlotCreateSchema = z.object({
  agendaId: z.number().int().positive("Agenda é obrigatória"),
  data_hora_inicio: z.string().datetime(),
  data_hora_fim: z.string().datetime(),
  vagas_disponiveis: z.number().int().min(1),
});

// Schema para fazer reserva
const ReservaCreateSchema = z.object({
  slotId: z.number().int().positive("Slot é obrigatório"),
});

// GET agendas (com filtros)
export const getAgendas: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, tipo, status, limite = "20", offset = "0" } = req.query;

    const where: any = {};
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const [agendas, total] = await Promise.all([
      prisma.agendas.findMany({
        where,
        include: {
          anuncio: {
            select: {
              titulo: true,
              categoria: true,
            },
          },
          anunciante: {
            select: {
              id: true,
              nome: true,
            },
          },
          slots: {
            select: {
              id: true,
              data_hora_inicio: true,
              data_hora_fim: true,
              vagas_disponiveis: true,
              vagas_preenchidas: true,
              status: true,
            },
          },
        },
        orderBy: { dataCriacao: "desc" },
        take: parseInt(limite as string) || 20,
        skip: parseInt(offset as string) || 0,
      }),
      prisma.agendas.count({ where }),
    ]);

    res.json({
      success: true,
      data: agendas,
      total,
    });
  } catch (error) {
    console.error("Error fetching agendas:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar agendas",
    });
  }
};

// GET single agenda with all slots
export const getAgendaById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agenda = await prisma.agendas.findUnique({
      where: { id: parseInt(id) },
      include: {
        anuncio: true,
        anunciante: true,
        slots: {
          include: {
            reservas: {
              select: {
                usuarioId: true,
              },
            },
          },
        },
        lista_espera: true,
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

// CREATE agenda
export const createAgenda: RequestHandler = async (req, res) => {
  try {
    const validatedData = AgendaCreateSchema.parse(req.body);

    // Verify announcement exists and belongs to the correct teacher/provider
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: validatedData.anuncioId },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    const agenda = await prisma.agendas.create({
      data: {
        ...validatedData,
        anuncianteId: anuncio.anuncianteId,
      },
      include: {
        anuncio: true,
        anunciante: true,
      },
    });

    res.status(201).json({
      success: true,
      data: agenda,
      message: "Agenda criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar agenda",
    });
  }
};

// UPDATE agenda
export const updateAgenda: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = AgendaUpdateSchema.parse(req.body);

    const agenda = await prisma.agendas.update({
      where: { id: parseInt(id) },
      data: validatedData,
      include: {
        anuncio: true,
        anunciante: true,
      },
    });

    res.json({
      success: true,
      data: agenda,
      message: "Agenda atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar agenda",
    });
  }
};

// DELETE agenda
export const deleteAgenda: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.agendas.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Agenda deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting agenda:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar agenda",
    });
  }
};

// CREATE slot (horário disponível)
export const createSlot: RequestHandler = async (req, res) => {
  try {
    const validatedData = SlotCreateSchema.parse(req.body);

    // Verify agenda exists
    const agenda = await prisma.agendas.findUnique({
      where: { id: validatedData.agendaId },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Validate that vagas_disponiveis doesn't exceed agenda capacity
    if (validatedData.vagas_disponiveis > agenda.capacidade) {
      return res.status(400).json({
        success: false,
        error: `Vagas não podem exceder a capacidade da agenda (${agenda.capacidade})`,
      });
    }

    const slot = await prisma.slots_agenda.create({
      data: validatedData,
    });

    res.status(201).json({
      success: true,
      data: slot,
      message: "Horário criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating slot:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar horário",
    });
  }
};

// GET available slots for an agenda
export const getSlots: RequestHandler = async (req, res) => {
  try {
    const { agendaId } = req.params;

    const slots = await prisma.slots_agenda.findMany({
      where: {
        agendaId: parseInt(agendaId),
        status: "disponivel",
      },
      include: {
        reservas: {
          select: {
            usuarioId: true,
            usuario: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: { data_hora_inicio: "asc" },
    });

    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar horários",
    });
  }
};

// MAKE RESERVATION
export const makeReservation: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string);
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const validatedData = ReservaCreateSchema.parse(req.body);

    // Check if slot exists and has available spots
    const slot = await prisma.slots_agenda.findUnique({
      where: { id: validatedData.slotId },
      include: {
        agenda: true,
        reservas: true,
      },
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: "Horário não encontrado",
      });
    }

    if (slot.status !== "disponivel") {
      return res.status(400).json({
        success: false,
        error: "Este horário não está mais disponível",
      });
    }

    if (slot.vagas_preenchidas >= slot.vagas_disponiveis) {
      // Add to waitlist instead
      const posicao = await prisma.lista_espera_agenda.count({
        where: { agendaId: slot.agendaId },
      });

      const waitlistItem = await prisma.lista_espera_agenda.create({
        data: {
          agendaId: slot.agendaId,
          usuarioId,
          posicao: posicao + 1,
        },
      });

      return res.status(200).json({
        success: true,
        data: waitlistItem,
        message: `Nenhuma vaga disponível. Você foi adicionado à lista de espera na posição ${posicao + 1}`,
        waitlisted: true,
      });
    }

    // Check if user already has a reservation in this slot
    const existingReservation = await prisma.reservas_agenda.findFirst({
      where: {
        slotId: validatedData.slotId,
        usuarioId,
      },
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        error: "Você já tem uma reserva neste horário",
      });
    }

    // Create reservation
    const reserva = await prisma.reservas_agenda.create({
      data: {
        slotId: validatedData.slotId,
        usuarioId,
        agendaId: slot.agendaId,
      },
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

    // Update slot vagas_preenchidas
    await prisma.slots_agenda.update({
      where: { id: validatedData.slotId },
      data: {
        vagas_preenchidas: {
          increment: 1,
        },
        status:
          slot.vagas_preenchidas + 1 >= slot.vagas_disponiveis
            ? "preenchido"
            : "disponivel",
      },
    });

    res.status(201).json({
      success: true,
      data: reserva,
      message: "Reserva confirmada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error making reservation:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer reserva",
    });
  }
};

// CANCEL RESERVATION
export const cancelReservation: RequestHandler = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const reserva = await prisma.reservas_agenda.findUnique({
      where: { id: parseInt(reservaId) },
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        error: "Reserva não encontrada",
      });
    }

    if (reserva.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para cancelar esta reserva",
      });
    }

    // Cancel reservation
    await prisma.reservas_agenda.update({
      where: { id: parseInt(reservaId) },
      data: { status: "cancelado" },
    });

    // Free up the slot
    const slot = await prisma.slots_agenda.findUnique({
      where: { id: reserva.slotId },
    });

    if (slot) {
      const newVagasPreenchidas = Math.max(0, slot.vagas_preenchidas - 1);
      await prisma.slots_agenda.update({
        where: { id: reserva.slotId },
        data: {
          vagas_preenchidas: newVagasPreenchidas,
          status: newVagasPreenchidas < slot.vagas_disponiveis ? "disponivel" : "preenchido",
        },
      });

      // Check if there's anyone in the waitlist to notify
      const nextInWaitlist = await prisma.lista_espera_agenda.findFirst({
        where: {
          agendaId: reserva.agendaId,
          status: "aguardando",
        },
        orderBy: { posicao: "asc" },
      });

      if (nextInWaitlist) {
        // Update their status to notified
        await prisma.lista_espera_agenda.update({
          where: { id: nextInWaitlist.id },
          data: { status: "notificado" },
        });
      }
    }

    res.json({
      success: true,
      message: "Reserva cancelada com sucesso",
    });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao cancelar reserva",
    });
  }
};

// GET user reservations
export const getUserReservations: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const reservas = await prisma.reservas_agenda.findMany({
      where: {
        usuarioId,
        status: "confirmado",
      },
      include: {
        slot: true,
        agenda: {
          include: {
            anuncio: true,
            anunciante: true,
          },
        },
      },
      orderBy: { slot: { data_hora_inicio: "asc" } },
    });

    res.json({
      success: true,
      data: reservas,
    });
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar reservas",
    });
  }
};

// GET waitlist for an agenda
export const getWaitlist: RequestHandler = async (req, res) => {
  try {
    const { agendaId } = req.params;

    const waitlist = await prisma.lista_espera_agenda.findMany({
      where: {
        agendaId: parseInt(agendaId),
        status: {
          in: ["aguardando", "notificado"],
        },
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
      orderBy: { posicao: "asc" },
    });

    res.json({
      success: true,
      data: waitlist,
    });
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar lista de espera",
    });
  }
};

// ADD to waitlist
export const addToWaitlist: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string);
    const { agendaId } = req.body;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    if (!agendaId) {
      return res.status(400).json({
        success: false,
        error: "agendaId é obrigatório",
      });
    }

    // Verify agenda exists
    const agenda = await prisma.agendas.findUnique({
      where: { id: agendaId },
    });

    if (!agenda) {
      return res.status(404).json({
        success: false,
        error: "Agenda não encontrada",
      });
    }

    // Check if already in waitlist
    const existing = await prisma.lista_espera_agenda.findUnique({
      where: {
        agendaId_usuarioId: {
          agendaId,
          usuarioId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Você já está na lista de espera desta agenda",
      });
    }

    const posicao = await prisma.lista_espera_agenda.count({
      where: { agendaId },
    });

    const waitlistItem = await prisma.lista_espera_agenda.create({
      data: {
        agendaId,
        usuarioId,
        posicao: posicao + 1,
      },
    });

    res.status(201).json({
      success: true,
      data: waitlistItem,
      message: `Você foi adicionado à lista de espera na posição ${posicao + 1}`,
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar à lista de espera",
    });
  }
};

// REMOVE from waitlist
export const removeFromWaitlist: RequestHandler = async (req, res) => {
  try {
    const { waitlistId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const waitlistItem = await prisma.lista_espera_agenda.findUnique({
      where: { id: parseInt(waitlistId) },
    });

    if (!waitlistItem) {
      return res.status(404).json({
        success: false,
        error: "Item da lista de espera não encontrado",
      });
    }

    if (waitlistItem.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para remover este item",
      });
    }

    await prisma.lista_espera_agenda.update({
      where: { id: parseInt(waitlistId) },
      data: { status: "cancelado" },
    });

    res.json({
      success: true,
      message: "Você foi removido da lista de espera",
    });
  } catch (error) {
    console.error("Error removing from waitlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover da lista de espera",
    });
  }
};
