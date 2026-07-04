import { RequestHandler } from "express";
import prisma from "../lib/prisma";

function formatEventoDateTime(dataInicio: Date): string {
  const data = dataInicio.toLocaleDateString("pt-BR");
  const hora = dataInicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${data} às ${hora}`;
}

// Sends an automated in-app chat message from the anunciante to a client about
// their reservation. Guests (no usuarioId) have no chat inbox, so this is a
// no-op for them - only email/UI status would reach them.
async function notificarClienteViaChat(
  usuarioId: number,
  anuncianteId: number,
  conteudo: string,
) {
  try {
    let conversa = await prisma.conversas.findFirst({
      where: { usuarioId, anuncianteId },
      orderBy: { dataCriacao: "desc" },
    });

    if (!conversa) {
      conversa = await prisma.conversas.create({
        data: {
          usuarioId,
          anuncianteId,
          assunto: "Agendamentos",
          tipo: "privada",
        },
      });
    }

    await prisma.mensagens.create({
      data: {
        conversaId: conversa.id,
        anuncianteId,
        conteudo,
        status: "nao_lida",
      },
    });
  } catch (error) {
    console.error("[reservas-evento-agenda] Erro ao notificar cliente via chat:", error);
  }
}

// If a confirmed/pending reservation for a slot is cancelled or rejected, move the
// earliest waitlist entry for that same event into a pending reservation request -
// the announcer still has to confirm it, it just skips back of the line.
async function promoverProximoDaFila(eventoId: number) {
  try {
    const proximo = await prisma.reservas_evento_agenda.findFirst({
      where: {
        eventoId,
        tipo: "lista_espera",
        status: "pendente",
      },
      orderBy: [{ posicaoListaEspera: "asc" }, { dataSolicitacao: "asc" }],
      include: { evento: true },
    });

    if (!proximo) return;

    await prisma.reservas_evento_agenda.update({
      where: { id: proximo.id },
      data: {
        tipo: "reserva",
        posicaoListaEspera: null,
      },
    });

    if (proximo.usuarioId) {
      await notificarClienteViaChat(
        proximo.usuarioId,
        proximo.evento.anuncianteId,
        `Boa notícia! Uma vaga foi liberada para "${proximo.evento.titulo}" em ${formatEventoDateTime(proximo.evento.dataInicio)}. Você saiu da lista de espera e agora está como solicitação de reserva, aguardando confirmação do anunciante.`,
      );
    }
  } catch (error) {
    console.error("[reservas-evento-agenda] Erro ao promover fila de espera:", error);
  }
}

// Create a reservation or waitlist request
export const criarReservaOuListaEspera: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      eventoId,
      tipo,
      nomeSolicitante,
      emailSolicitante,
      telefoneSolicitante,
    } = req.body;

    // Validate required fields
    if (!eventoId || !tipo) {
      return res
        .status(400)
        .json({ error: "eventoId e tipo são obrigatórios" });
    }

    if (!["reserva", "lista_espera"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo deve ser 'reserva' ou 'lista_espera'" });
    }

    // Verify evento exists
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: parseInt(eventoId) },
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // For logged-in users, use userId
    // For non-logged-in users, use email
    if (!userId && !emailSolicitante) {
      return res.status(400).json({
        error: "Email é obrigatório para usuários não logados",
      });
    }

    // Check if already reserved
    if (userId) {
      const existingReserva = await prisma.reservas_evento_agenda.findFirst({
        where: {
          eventoId: parseInt(eventoId),
          usuarioId: userId,
          status: { in: ["pendente", "confirmada"] },
        },
      });

      if (existingReserva) {
        return res.status(400).json({
          error: "Você já possui uma reserva para este evento",
        });
      }
    }

    // Get current waitlist position
    let posicao = null;
    if (tipo === "lista_espera") {
      const ultimaPosicao = await prisma.reservas_evento_agenda.findFirst({
        where: {
          eventoId: parseInt(eventoId),
          tipo: "lista_espera",
          status: { in: ["pendente", "confirmada"] },
        },
        orderBy: {
          posicaoListaEspera: "desc",
        },
      });
      posicao = (ultimaPosicao?.posicaoListaEspera || 0) + 1;
    }

    // Create reservation
    const reserva = await prisma.reservas_evento_agenda.create({
      data: {
        eventoId: parseInt(eventoId),
        usuarioId: userId || undefined,
        nomeSolicitante: nomeSolicitante || (userId ? undefined : "Anônimo"),
        emailSolicitante: emailSolicitante || undefined,
        telefoneSolicitante: telefoneSolicitante || undefined,
        tipo,
        status: "pendente",
        posicaoListaEspera: posicao,
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

    res.status(201).json({ data: reserva });
  } catch (error) {
    console.error("[criarReservaOuListaEspera]", error);
    res.status(500).json({ error: "Erro ao criar reserva" });
  }
};

// Get reservations and waitlist for an event (for announcer)
export const getReservasDoEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { eventoId } = req.params;

    const eventoId_num = parseInt(eventoId);
    if (isNaN(eventoId_num)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event and verify ownership
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId_num },
    });

    if (!evento) {
      return res.status(404).json({ error: "Evento não encontrado" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: evento.anuncianteId,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é o responsável por este evento." });
    }

    // Get reservations and waitlist
    const reservas = await prisma.reservas_evento_agenda.findMany({
      where: { eventoId: eventoId_num },
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
      orderBy: [{ tipo: "asc" }, { posicaoListaEspera: "asc" }, { dataSolicitacao: "asc" }],
    });

    res.json({ data: reservas });
  } catch (error) {
    console.error("[getReservasDoEvento]", error);
    res.status(500).json({ error: "Erro ao buscar reservas" });
  }
};

// Confirm a reservation
export const confirmarReserva: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const reservaId = parseInt(id);
    if (isNaN(reservaId)) {
      return res.status(400).json({ error: "Invalid reservation ID" });
    }

    // Get reservation and verify ownership
    const reserva = await prisma.reservas_evento_agenda.findUnique({
      where: { id: reservaId },
      include: { evento: true },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: reserva.evento.anuncianteId,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é o responsável por este evento." });
    }

    // Update reservation status
    const reservaAtualizada = await prisma.reservas_evento_agenda.update({
      where: { id: reservaId },
      data: {
        status: "confirmada",
        dataConfirmacao: new Date(),
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

    if (reservaAtualizada.usuarioId) {
      await notificarClienteViaChat(
        reservaAtualizada.usuarioId,
        reserva.evento.anuncianteId,
        `Sua reserva para "${reserva.evento.titulo}" em ${formatEventoDateTime(reserva.evento.dataInicio)} foi CONFIRMADA! ✅`,
      );
    }

    res.json({ data: reservaAtualizada });
  } catch (error) {
    console.error("[confirmarReserva]", error);
    res.status(500).json({ error: "Erro ao confirmar reserva" });
  }
};

// Reject a reservation
export const rejeitarReserva: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { motivo } = req.body;

    const reservaId = parseInt(id);
    if (isNaN(reservaId)) {
      return res.status(400).json({ error: "Invalid reservation ID" });
    }

    // Get reservation and verify ownership
    const reserva = await prisma.reservas_evento_agenda.findUnique({
      where: { id: reservaId },
      include: { evento: true },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: reserva.evento.anuncianteId,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é o responsável por este evento." });
    }

    // Update reservation status
    const reservaAtualizada = await prisma.reservas_evento_agenda.update({
      where: { id: reservaId },
      data: {
        status: "rejeitada",
        motivo: motivo || null,
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

    if (reservaAtualizada.usuarioId) {
      const motivoTexto = motivo ? ` Motivo: ${motivo}` : "";
      await notificarClienteViaChat(
        reservaAtualizada.usuarioId,
        reserva.evento.anuncianteId,
        `Sua reserva para "${reserva.evento.titulo}" em ${formatEventoDateTime(reserva.evento.dataInicio)} foi recusada.${motivoTexto}`,
      );
    }

    // Rejecting a confirmed slot request frees it up for whoever is next in line
    if (reserva.tipo === "reserva") {
      await promoverProximoDaFila(reserva.eventoId);
    }

    res.json({ data: reservaAtualizada });
  } catch (error) {
    console.error("[rejeitarReserva]", error);
    res.status(500).json({ error: "Erro ao rejeitar reserva" });
  }
};

// Cancel a reservation
export const cancelarReserva: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const reservaId = parseInt(id);
    if (isNaN(reservaId)) {
      return res.status(400).json({ error: "Invalid reservation ID" });
    }

    // Get reservation
    const reserva = await prisma.reservas_evento_agenda.findUnique({
      where: { id: reservaId },
      include: { evento: true },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Check if user is the announcer or the reservation owner
    if (reserva.usuarioId !== userId) {
      const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
        where: {
          usuarioId: userId,
          anuncianteId: reserva.evento.anuncianteId,
        },
      });

      if (!usuarioAnunciante) {
        return res
          .status(403)
          .json({ error: "Acesso negado. Você não pode cancelar esta reserva." });
      }
    }

    // Update reservation status
    const reservaAtualizada = await prisma.reservas_evento_agenda.update({
      where: { id: reservaId },
      data: {
        status: "cancelada",
        dataCancelamento: new Date(),
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

    // Cancelling a confirmed/pending slot request frees it up for whoever is next in line
    if (reserva.tipo === "reserva") {
      await promoverProximoDaFila(reserva.eventoId);
    }

    res.json({ data: reservaAtualizada });
  } catch (error) {
    console.error("[cancelarReserva]", error);
    res.status(500).json({ error: "Erro ao cancelar reserva" });
  }
};

// Get reservation count for an event
export const getReservaCount: RequestHandler = async (req, res) => {
  try {
    const { eventoId } = req.params;

    const eventoId_num = parseInt(eventoId);
    if (isNaN(eventoId_num)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const totalReservas = await prisma.reservas_evento_agenda.count({
      where: {
        eventoId: eventoId_num,
        tipo: "reserva",
        status: { in: ["pendente", "confirmada"] },
      },
    });

    const totalListaEspera = await prisma.reservas_evento_agenda.count({
      where: {
        eventoId: eventoId_num,
        tipo: "lista_espera",
        status: { in: ["pendente", "confirmada"] },
      },
    });

    res.json({
      data: {
        totalReservas,
        totalListaEspera,
      },
    });
  } catch (error) {
    console.error("[getReservaCount]", error);
    res.status(500).json({ error: "Erro ao contar reservas" });
  }
};

// Get pending appointments count for current user
export const getPendingAppointmentsCount: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Count reservations/appointments where user is the creator and status is pending or pending_pagamento
    const count = await prisma.reservas_evento_agenda.count({
      where: {
        usuarioId: userId,
        status: { in: ["pendente", "pendente_pagamento"] },
      },
    });

    res.json({
      data: {
        count,
      },
    });
  } catch (error) {
    console.error("[getPendingAppointmentsCount]", error);
    res.status(500).json({ error: "Erro ao contar agendamentos pendentes" });
  }
};
