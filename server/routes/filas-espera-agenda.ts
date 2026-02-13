import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Get all waiting queues for a user's agenda (for the announcer to manage)
export const getFilasEsperaParaAnunciante: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.params;
    const userId = (req as any).userId;

    const anuncianteId_num = parseInt(anuncianteId);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: anuncianteId_num,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é responsável por este anunciante." });
    }

    // Get all waiting queues for this announcer's calendar
    const filasEspera = await prisma.filas_espera_agenda.findMany({
      where: {
        anuncianteAlvoId: anuncianteId_num,
      },
      include: {
        usuarioSolicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        evento: {
          select: {
            id: true,
            titulo: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
      orderBy: {
        dataSolicitacao: "desc",
      },
    });

    res.json({ data: filasEspera });
  } catch (error) {
    console.error("[getFilasEsperaParaAnunciante]", error);
    res.status(500).json({ error: "Erro ao buscar filas de espera" });
  }
};

// Get all waiting queues created by a user
export const getFilasEsperaPorUsuario: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Get all waiting queues created by this user
    const filasEspera = await prisma.filas_espera_agenda.findMany({
      where: {
        usuarioSolicitanteId: userId,
      },
      include: {
        anuncianteAlvo: {
          select: {
            id: true,
            nome: true,
          },
        },
        evento: {
          select: {
            id: true,
            titulo: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
      orderBy: {
        dataSolicitacao: "desc",
      },
    });

    res.json({ data: filasEspera });
  } catch (error) {
    console.error("[getFilasEsperaPorUsuario]", error);
    res.status(500).json({ error: "Erro ao buscar filas de espera" });
  }
};

// Create a waiting queue entry
export const createFilaEspera: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      eventoId,
      anuncianteAlvoId,
      titulo,
      descricao,
      dataInicio,
      dataFim,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    // Validate required fields
    if (!titulo || !dataInicio || !dataFim || !anuncianteAlvoId) {
      return res.status(400).json({
        error: "Título, data início, fim e anunciante são obrigatórios",
      });
    }

    // Validate dates
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (inicio >= fim) {
      return res.status(400).json({
        error: "Data de início deve ser antes da data de fim",
      });
    }

    // Check if the target announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: parseInt(anuncianteAlvoId) },
    });

    if (!anunciante) {
      return res.status(404).json({ error: "Anunciante não encontrado" });
    }

    // Create waiting queue entry (without eventoId since it's not a real event yet)
    const fila = await prisma.filas_espera_agenda.create({
      data: {
        eventoId: parseInt(eventoId) || 0, // Use 0 as placeholder since it doesn't exist yet
        usuarioSolicitanteId: userId,
        anuncianteAlvoId: parseInt(anuncianteAlvoId),
        titulo,
        descricao: descricao || null,
        dataInicio: inicio,
        dataFim: fim,
        status: "pendente",
      },
      include: {
        usuarioSolicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });

    res.status(201).json({ data: fila });
  } catch (error) {
    console.error("[createFilaEspera]", error);
    res.status(500).json({ error: "Erro ao criar fila de espera" });
  }
};

// Approve a waiting queue entry (convert to real event)
export const aprovarFilaEspera: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { filaId } = req.params;

    const filaId_num = parseInt(filaId);
    if (isNaN(filaId_num)) {
      return res.status(400).json({ error: "Invalid waiting queue ID" });
    }

    // Get waiting queue entry
    const fila = await prisma.filas_espera_agenda.findUnique({
      where: { id: filaId_num },
      include: {
        evento: true,
      },
    });

    if (!fila) {
      return res.status(404).json({ error: "Fila de espera não encontrada" });
    }

    // Check if user is the target announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: fila.anuncianteAlvoId,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não pode aprovar esta fila." });
    }

    // Create the real event with privado_usuarios privacy
    const novoEvento = await prisma.eventos_agenda_anunciante.create({
      data: {
        anuncianteId: fila.anuncianteAlvoId,
        titulo: fila.titulo,
        descricao: fila.descricao,
        dataInicio: fila.dataInicio,
        dataFim: fila.dataFim,
        privacidade: "privado_usuarios",
        status: "pendente",
      },
    });

    // Add permissions for the requester user
    await prisma.eventos_agenda_permissoes.create({
      data: {
        eventoId: novoEvento.id,
        usuarioId: fila.usuarioSolicitanteId,
      },
    });

    // Update the waiting queue entry
    const filaAtualizada = await prisma.filas_espera_agenda.update({
      where: { id: filaId_num },
      data: {
        status: "aprovada",
        eventoId: novoEvento.id,
        dataResposta: new Date(),
      },
      include: {
        usuarioSolicitante: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        evento: {
          select: {
            id: true,
            titulo: true,
            dataInicio: true,
            dataFim: true,
          },
        },
      },
    });

    res.json({
      data: filaAtualizada,
      message: "Fila de espera aprovada e evento criado com sucesso",
    });
  } catch (error) {
    console.error("[aprovarFilaEspera]", error);
    res.status(500).json({ error: "Erro ao aprovar fila de espera" });
  }
};

// Reject a waiting queue entry
export const rejeitarFilaEspera: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { filaId } = req.params;
    const { motivo, dataSugestao, horaSugestao } = req.body;

    const filaId_num = parseInt(filaId);
    if (isNaN(filaId_num)) {
      return res.status(400).json({ error: "Invalid waiting queue ID" });
    }

    // Get waiting queue entry
    const fila = await prisma.filas_espera_agenda.findUnique({
      where: { id: filaId_num },
    });

    if (!fila) {
      return res.status(404).json({ error: "Fila de espera não encontrada" });
    }

    // Check if user is the target announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: fila.anuncianteAlvoId,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não pode rejeitar esta fila." });
    }

    // Update the waiting queue entry
    const filaAtualizada = await prisma.filas_espera_agenda.update({
      where: { id: filaId_num },
      data: {
        status: "rejeitada",
        motivo_rejeicao: motivo || null,
        dataSugestao: dataSugestao ? new Date(dataSugestao) : null,
        horaSugestao: horaSugestao || null,
        dataResposta: new Date(),
      },
      include: {
        usuarioSolicitante: {
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
      data: filaAtualizada,
      message: "Fila de espera rejeitada com sucesso",
    });
  } catch (error) {
    console.error("[rejeitarFilaEspera]", error);
    res.status(500).json({ error: "Erro ao rejeitar fila de espera" });
  }
};

// Cancel a waiting queue entry
export const cancelarFilaEspera: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { filaId } = req.params;

    const filaId_num = parseInt(filaId);
    if (isNaN(filaId_num)) {
      return res.status(400).json({ error: "Invalid waiting queue ID" });
    }

    // Get waiting queue entry
    const fila = await prisma.filas_espera_agenda.findUnique({
      where: { id: filaId_num },
    });

    if (!fila) {
      return res.status(404).json({ error: "Fila de espera não encontrada" });
    }

    // Check if user is the requester or the target announcer
    const isRequester = fila.usuarioSolicitanteId === userId;
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: fila.anuncianteAlvoId,
      },
    });

    if (!isRequester && !usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não pode cancelar esta fila." });
    }

    // Update the waiting queue entry
    const filaAtualizada = await prisma.filas_espera_agenda.update({
      where: { id: filaId_num },
      data: {
        status: "cancelada",
        dataResposta: new Date(),
      },
    });

    res.json({
      data: filaAtualizada,
      message: "Fila de espera cancelada com sucesso",
    });
  } catch (error) {
    console.error("[cancelarFilaEspera]", error);
    res.status(500).json({ error: "Erro ao cancelar fila de espera" });
  }
};

// Update event status
export const atualizarStatusEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { eventoId } = req.params;
    const { status } = req.body;

    const eventoId_num = parseInt(eventoId);
    if (isNaN(eventoId_num)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Validate status
    const statusValidos = ["pendente", "realizado", "pendente_pagamento", "substituicao"];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        error: `Status inválido. Valores válidos: ${statusValidos.join(", ")}`,
      });
    }

    // Get event
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
        .json({ error: "Acesso negado. Você não pode atualizar este evento." });
    }

    // Update event status
    const eventoAtualizado = await prisma.eventos_agenda_anunciante.update({
      where: { id: eventoId_num },
      data: {
        status: status,
      },
    });

    res.json({
      data: eventoAtualizado,
      message: "Status do evento atualizado com sucesso",
    });
  } catch (error) {
    console.error("[atualizarStatusEvento]", error);
    res.status(500).json({ error: "Erro ao atualizar status do evento" });
  }
};

// Delete an agenda/announcer (soft delete by deactivating)
export const deletarAgenda: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { anuncianteId } = req.params;

    const anuncianteId_num = parseInt(anuncianteId);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: anuncianteId_num,
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é responsável por esta agenda." });
    }

    // Delete all events for this announcer
    await prisma.eventos_agenda_anunciante.deleteMany({
      where: {
        anuncianteId: anuncianteId_num,
      },
    });

    // Delete all waiting queues for this announcer
    await prisma.filas_espera_agenda.deleteMany({
      where: {
        anuncianteAlvoId: anuncianteId_num,
      },
    });

    res.json({
      message: "Agenda deletada com sucesso. Todos os eventos foram removidos.",
    });
  } catch (error) {
    console.error("[deletarAgenda]", error);
    res.status(500).json({ error: "Erro ao deletar agenda" });
  }
};
