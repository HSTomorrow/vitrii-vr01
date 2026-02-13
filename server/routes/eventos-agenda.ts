import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Get all events for an announcer (only for the announcer)
export const getEventosByAnunciante: RequestHandler = async (req, res) => {
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

    const eventos = await prisma.eventos_agenda_anunciante.findMany({
      where: {
        anuncianteId: anuncianteId_num,
      },
      include: {
        permissoes: {
          select: {
            usuarioId: true,
          },
        },
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    res.json({ data: eventos });
  } catch (error) {
    console.error("[getEventosByAnunciante]", error);
    res.status(500).json({ error: "Erro ao buscar eventos da agenda" });
  }
};

// Get events visible to a user (public + user-specific private events)
export const getEventosVisivelsPara: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.params;
    const userId = (req as any).userId;

    const anuncianteId_num = parseInt(anuncianteId);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    // Get public events
    const publicEvents = await prisma.eventos_agenda_anunciante.findMany({
      where: {
        anuncianteId: anuncianteId_num,
        privacidade: "publico",
      },
      select: {
        id: true,
        titulo: true,
        dataInicio: true,
        dataFim: true,
        privacidade: true,
        cor: true,
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    // If user is not logged in, return only public events
    if (!userId) {
      return res.json({ data: publicEvents });
    }

    // Get private events where user has permission
    const privateEventosComPermissao = await prisma.eventos_agenda_anunciante.findMany({
      where: {
        anuncianteId: anuncianteId_num,
        privacidade: "privado_usuarios",
        permissoes: {
          some: {
            usuarioId: userId,
          },
        },
      },
      select: {
        id: true,
        titulo: true,
        descricao: true,
        dataInicio: true,
        dataFim: true,
        privacidade: true,
        cor: true,
      },
      orderBy: {
        dataInicio: "asc",
      },
    });

    const allVisibleEvents = [
      ...publicEvents,
      ...privateEventosComPermissao,
    ].sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());

    res.json({ data: allVisibleEvents });
  } catch (error) {
    console.error("[getEventosVisivelsPara]", error);
    res.status(500).json({ error: "Erro ao buscar eventos visíveis" });
  }
};

// Create a new event
export const createEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const {
      anuncianteId,
      titulo,
      descricao,
      dataInicio,
      dataFim,
      privacidade,
      cor,
      usuariosPermitidos,
    } = req.body;

    // Validate required fields
    if (!titulo || !dataInicio || !dataFim) {
      return res.status(400).json({ error: "Título, data início e fim são obrigatórios" });
    }

    // Check if user is the announcer
    const usuarioAnunciante = await prisma.usuarios_anunciantes.findFirst({
      where: {
        usuarioId: userId,
        anuncianteId: parseInt(anuncianteId),
      },
    });

    if (!usuarioAnunciante) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não é responsável por este anunciante." });
    }

    // Validate dates
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    if (inicio >= fim) {
      return res.status(400).json({ error: "Data de início deve ser antes da data de fim" });
    }

    // Create event
    const evento = await prisma.eventos_agenda_anunciante.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        titulo,
        descricao: descricao || null,
        dataInicio: inicio,
        dataFim: fim,
        privacidade: privacidade || "privado",
        cor: cor || "#3B82F6",
      },
      include: {
        permissoes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    // Add permissions if privado_usuarios
    if (privacidade === "privado_usuarios" && usuariosPermitidos && Array.isArray(usuariosPermitidos)) {
      for (const usuarioId of usuariosPermitidos) {
        await prisma.eventos_agenda_permissoes.create({
          data: {
            eventoId: evento.id,
            usuarioId: parseInt(usuarioId),
          },
        });
      }

      // Refetch evento with updated permissions
      const eventoAtualizado = await prisma.eventos_agenda_anunciante.findUnique({
        where: { id: evento.id },
        include: {
          permissoes: {
            select: {
              usuarioId: true,
            },
          },
        },
      });

      return res.status(201).json({ data: eventoAtualizado });
    }

    res.status(201).json({ data: evento });
  } catch (error) {
    console.error("[createEvento]", error);
    res.status(500).json({ error: "Erro ao criar evento" });
  }
};

// Update an event
export const updateEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const {
      titulo,
      descricao,
      dataInicio,
      dataFim,
      privacidade,
      cor,
      usuariosPermitidos,
    } = req.body;

    const eventoId = parseInt(id);
    if (isNaN(eventoId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event and verify ownership
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode editar este evento." });
    }

    // Validate dates if provided
    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      if (inicio >= fim) {
        return res.status(400).json({ error: "Data de início deve ser antes da data de fim" });
      }
    }

    // Update event
    const eventoAtualizado = await prisma.eventos_agenda_anunciante.update({
      where: { id: eventoId },
      data: {
        titulo: titulo || evento.titulo,
        descricao: descricao !== undefined ? descricao : evento.descricao,
        dataInicio: dataInicio ? new Date(dataInicio) : evento.dataInicio,
        dataFim: dataFim ? new Date(dataFim) : evento.dataFim,
        privacidade: privacidade || evento.privacidade,
        cor: cor || evento.cor,
      },
      include: {
        permissoes: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    // Update permissions if privado_usuarios
    if (privacidade === "privado_usuarios" && usuariosPermitidos && Array.isArray(usuariosPermitidos)) {
      // Delete old permissions
      await prisma.eventos_agenda_permissoes.deleteMany({
        where: { eventoId: eventoId },
      });

      // Add new permissions
      for (const usuarioId of usuariosPermitidos) {
        await prisma.eventos_agenda_permissoes.create({
          data: {
            eventoId: eventoId,
            usuarioId: parseInt(usuarioId),
          },
        });
      }

      // Refetch evento with updated permissions
      const eventoFinal = await prisma.eventos_agenda_anunciante.findUnique({
        where: { id: eventoId },
        include: {
          permissoes: {
            select: {
              usuarioId: true,
            },
          },
        },
      });

      return res.json({ data: eventoFinal });
    }

    res.json({ data: eventoAtualizado });
  } catch (error) {
    console.error("[updateEvento]", error);
    res.status(500).json({ error: "Erro ao atualizar evento" });
  }
};

// Delete an event
export const deleteEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const eventoId = parseInt(id);
    if (isNaN(eventoId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event and verify ownership
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode deletar este evento." });
    }

    // Delete event (permissões são deletadas automaticamente por CASCADE)
    await prisma.eventos_agenda_anunciante.delete({
      where: { id: eventoId },
    });

    res.json({ message: "Evento deletado com sucesso" });
  } catch (error) {
    console.error("[deleteEvento]", error);
    res.status(500).json({ error: "Erro ao deletar evento" });
  }
};

// Add permission for a user to see a private event
export const addPermissao: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { usuarioId } = req.body;

    const eventoId = parseInt(id);
    if (isNaN(eventoId) || !usuarioId) {
      return res.status(400).json({ error: "Invalid event ID or user ID" });
    }

    // Get event and verify ownership
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode modificar permissões deste evento." });
    }

    // Create permission
    try {
      const permissao = await prisma.eventos_agenda_permissoes.create({
        data: {
          eventoId: eventoId,
          usuarioId: parseInt(usuarioId),
        },
      });

      res.status(201).json({ data: permissao });
    } catch {
      return res.status(400).json({ error: "Usuário já possui permissão ou não existe" });
    }
  } catch (error) {
    console.error("[addPermissao]", error);
    res.status(500).json({ error: "Erro ao adicionar permissão" });
  }
};

// Remove permission for a user
export const removePermissao: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id, usuarioId } = req.params;

    const eventoId = parseInt(id);
    if (isNaN(eventoId) || !usuarioId) {
      return res.status(400).json({ error: "Invalid event ID or user ID" });
    }

    // Get event and verify ownership
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode modificar permissões deste evento." });
    }

    // Delete permission
    await prisma.eventos_agenda_permissoes.deleteMany({
      where: {
        eventoId: eventoId,
        usuarioId: parseInt(usuarioId),
      },
    });

    res.json({ message: "Permissão removida com sucesso" });
  } catch (error) {
    console.error("[removePermissao]", error);
    res.status(500).json({ error: "Erro ao remover permissão" });
  }
};

// Get all users linked to an event
export const getEventoUsers: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    const eventoId = parseInt(id);
    if (isNaN(eventoId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Get event
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode ver os usuários deste evento." });
    }

    // Get all permissions for this event
    const permissoes = await prisma.eventos_agenda_permissoes.findMany({
      where: { eventoId: eventoId },
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

    const usuarios = permissoes.map((p) => ({
      id: p.usuario.id,
      nome: p.usuario.nome,
      email: p.usuario.email,
      permissaoId: p.id,
    }));

    res.json({ data: usuarios });
  } catch (error) {
    console.error("[getEventoUsers]", error);
    res.status(500).json({ error: "Erro ao buscar usuários do evento" });
  }
};

// Search for users by name or email (for linking)
export const searchUsers: RequestHandler = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return res.status(400).json({ error: "Query deve ter pelo menos 2 caracteres" });
    }

    const usuarios = await prisma.usracessos.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
      take: 10,
    });

    res.json({ data: usuarios });
  } catch (error) {
    console.error("[searchUsers]", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};

// Add user to event
export const addUserToEvento: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { usuarioId } = req.body;

    const eventoId = parseInt(id);
    const novoUsuarioId = parseInt(usuarioId);

    if (isNaN(eventoId) || isNaN(novoUsuarioId)) {
      return res.status(400).json({ error: "IDs inválidos" });
    }

    // Get event
    const evento = await prisma.eventos_agenda_anunciante.findUnique({
      where: { id: eventoId },
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
        .json({ error: "Acesso negado. Você não pode adicionar usuários a este evento." });
    }

    // Check if user exists
    const usuarioParaAdicionar = await prisma.usracessos.findUnique({
      where: { id: novoUsuarioId },
    });

    if (!usuarioParaAdicionar) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Add permission (or ignore if already exists)
    const permissao = await prisma.eventos_agenda_permissoes.upsert({
      where: {
        eventoId_usuarioId: {
          eventoId: eventoId,
          usuarioId: novoUsuarioId,
        },
      },
      update: {},
      create: {
        eventoId: eventoId,
        usuarioId: novoUsuarioId,
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

    res.json({
      data: {
        id: permissao.usuario.id,
        nome: permissao.usuario.nome,
        email: permissao.usuario.email,
        permissaoId: permissao.id,
      },
      message: "Usuário adicionado com sucesso",
    });
  } catch (error) {
    console.error("[addUserToEvento]", error);
    res.status(500).json({ error: "Erro ao adicionar usuário ao evento" });
  }
};
