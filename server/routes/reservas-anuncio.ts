import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { extractUserId } from "../middleware/permissionGuard";

const router = Router();

// POST - Create a reservation for an ad
export const criarReserva = async (req: Request, res: Response) => {
  try {
    const { anuncioId } = req.params;
    const { observacao } = req.body;
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const id = parseInt(anuncioId);

    // Verify ad exists and get its details
    const anuncio = await prisma.anuncios.findUnique({
      where: { id },
      include: {
        anunciantes: {
          select: { nome: true, email: true },
        },
      },
    });

    if (!anuncio) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    // Check if user already has a reservation
    const existingReserva = await prisma.reservas_anuncio.findUnique({
      where: {
        anuncioId_usuarioId: { anuncioId: id, usuarioId },
      },
    });

    if (existingReserva && existingReserva.status === "ativa") {
      return res.status(409).json({ error: "Você já possui uma reserva ativa para este anúncio" });
    }

    // Check quantity available (quantidade - active reservations)
    const activeReservas = await prisma.reservas_anuncio.count({
      where: {
        anuncioId: id,
        status: "ativa",
      },
    });

    const quantidadeDisponivel = anuncio.quantidade - activeReservas;

    if (quantidadeDisponivel <= 0) {
      return res.status(400).json({
        error: "Este produto já foi totalmente reservado"
      });
    }

    // Create or reactivate reservation
    let reserva;
    if (existingReserva && existingReserva.status === "cancelada") {
      // Reactivate cancelled reservation
      reserva = await prisma.reservas_anuncio.update({
        where: { id: existingReserva.id },
        data: {
          status: "ativa",
          dataReserva: new Date(),
          dataCancelamento: null,
        },
        select: {
          id: true,
          anuncioId: true,
          usuarioId: true,
          dataReserva: true,
          observacao: true,
          status: true,
        },
      });
    } else {
      // Create new reservation
      reserva = await prisma.reservas_anuncio.create({
        data: {
          anuncioId: id,
          usuarioId,
          observacao: observacao || null,
          status: "ativa",
        },
        select: {
          id: true,
          anuncioId: true,
          usuarioId: true,
          dataReserva: true,
          observacao: true,
          status: true,
        },
      });
    }

    // Check if quantity reached 0 and update ad status to "Reservado"
    const novaQuantidadeDisponivel = quantidadeDisponivel - 1;
    if (novaQuantidadeDisponivel <= 0) {
      await prisma.anuncios.update({
        where: { id },
        data: { status: "Reservado" },
      });

      // TODO: Send notification to announcer when product is fully reserved
      console.log(
        `[reservas-anuncio] Produto ${anuncio.titulo} (ID: ${id}) foi totalmente reservado!`
      );
    }

    res.status(201).json({
      success: true,
      data: reserva,
      message: "Reserva criada com sucesso",
      quantidadeDisponivel: Math.max(0, novaQuantidadeDisponivel),
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error creating reservation:", error);
    res.status(500).json({
      error: "Erro ao criar reserva",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// GET - List all reservations for an ad (owner or admin only)
export const listarReservasAnuncio = async (req: Request, res: Response) => {
  try {
    const { anuncioId } = req.params;
    const usuarioId = (req as any).userId;

    const id = parseInt(anuncioId);

    // Verify ad exists and user can view reservations
    const anuncio = await prisma.anuncios.findUnique({
      where: { id },
    });

    if (!anuncio) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    // Check permissions: only owner or admin can view
    const user = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (anuncio.usuarioId !== usuarioId && user.tipoUsuario !== "adm") {
      return res.status(403).json({ error: "Você não tem permissão para ver estas reservas" });
    }

    // Get all reservations for the ad
    const reservas = await prisma.reservas_anuncio.findMany({
      where: { anuncioId: id },
      select: {
        id: true,
        anuncioId: true,
        usuarioId: true,
        dataReserva: true,
        dataCancelamento: true,
        observacao: true,
        status: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: { dataReserva: "desc" },
    });

    // Count active reservations
    const totalAtivas = reservas.filter((r) => r.status === "ativa").length;

    res.json({
      success: true,
      data: reservas,
      stats: {
        total: reservas.length,
        ativas: totalAtivas,
        canceladas: reservas.length - totalAtivas,
        limite: anuncio.quantidadeMaximaReservas || "Ilimitado",
      },
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error listing reservations:", error);
    res.status(500).json({ 
      error: "Erro ao listar reservas",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// GET - Get user's reservation for a specific ad
export const obterMinhaReserva = async (req: Request, res: Response) => {
  try {
    const { anuncioId } = req.params;
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const id = parseInt(anuncioId);

    const reserva = await prisma.reservas_anuncio.findUnique({
      where: {
        anuncioId_usuarioId: { anuncioId: id, usuarioId },
      },
      select: {
        id: true,
        anuncioId: true,
        usuarioId: true,
        dataReserva: true,
        dataCancelamento: true,
        observacao: true,
        status: true,
      },
    });

    if (!reserva) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: reserva });
  } catch (error) {
    console.error("[reservas-anuncio] Error fetching user reservation:", error);
    res.status(500).json({ 
      error: "Erro ao buscar sua reserva",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// DELETE - Cancel a reservation
export const cancelarReserva = async (req: Request, res: Response) => {
  try {
    const { anuncioId, reservaId } = req.params;
    const usuarioId = (req as any).userId;

    if (!usuarioId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const rId = parseInt(reservaId);
    const aId = parseInt(anuncioId);

    // Get the reservation
    const reserva = await prisma.reservas_anuncio.findUnique({
      where: { id: rId },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Check permissions: user who made the reservation, ad owner, or admin
    const user = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    // Get ad to check ownership
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: aId },
      select: { usuarioId: true, status: true, quantidade: true },
    });

    const isAdmin = user.tipoUsuario === "adm";
    const isReservationUser = reserva.usuarioId === usuarioId;
    const isAdOwner = anuncio?.usuarioId === usuarioId;

    if (!isAdmin && !isReservationUser && !isAdOwner) {
      return res.status(403).json({ error: "Você não tem permissão para cancelar esta reserva" });
    }

    // Cancel the reservation
    const updated = await prisma.reservas_anuncio.update({
      where: { id: rId },
      data: {
        status: "cancelada",
        dataCancelamento: new Date(),
      },
      select: {
        id: true,
        anuncioId: true,
        status: true,
        dataCancelamento: true,
      },
    });

    // If ad was "Reservado", check if it should be "ativo" again
    if (anuncio && anuncio.status === "Reservado") {
      const ativasReservas = await prisma.reservas_anuncio.count({
        where: {
          anuncioId: aId,
          status: "ativa",
        },
      });

      // If now there's available quantity, reactivate the ad
      if (ativasReservas < anuncio.quantidade) {
        await prisma.anuncios.update({
          where: { id: aId },
          data: { status: "ativo" },
        });
      }
    }

    res.json({
      success: true,
      data: updated,
      message: "Reserva cancelada com sucesso",
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error cancelling reservation:", error);
    res.status(500).json({
      error: "Erro ao cancelar reserva",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// PATCH - Update a reservation (admin only - edit notes)
export const atualizarReserva = async (req: Request, res: Response) => {
  try {
    const { reservaId } = req.params;
    const { observacao } = req.body;
    const usuarioId = (req as any).userId;

    // Verify user is admin
    const user = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({ error: "Apenas admins podem editar reservas" });
    }

    const rId = parseInt(reservaId);

    const updated = await prisma.reservas_anuncio.update({
      where: { id: rId },
      data: { observacao },
      select: {
        id: true,
        anuncioId: true,
        usuarioId: true,
        dataReserva: true,
        observacao: true,
        status: true,
      },
    });

    res.json({
      success: true,
      data: updated,
      message: "Reserva atualizada com sucesso",
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error updating reservation:", error);
    res.status(500).json({ 
      error: "Erro ao atualizar reserva",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// GET - Get count of active reservations for an ad
export const contarReservasAtivas = async (req: Request, res: Response) => {
  try {
    const { anuncioId } = req.params;
    const id = parseInt(anuncioId);

    const count = await prisma.reservas_anuncio.count({
      where: {
        anuncioId: id,
        status: "ativa",
      },
    });

    res.json({
      success: true,
      data: { anuncioId: id, totalReservas: count },
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error counting reservations:", error);
    res.status(500).json({
      error: "Erro ao contar reservas",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// GET - Get quantity info for an ad (quantidade, available, reserved count)
export const getQuantidadeInfo = async (req: Request, res: Response) => {
  try {
    const { anuncioId } = req.params;
    const id = parseInt(anuncioId);

    const anuncio = await prisma.anuncios.findUnique({
      where: { id },
      select: {
        id: true,
        quantidade: true,
        status: true,
      },
    });

    if (!anuncio) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    const reservasAtivas = await prisma.reservas_anuncio.count({
      where: {
        anuncioId: id,
        status: "ativa",
      },
    });

    const quantidadeDisponivel = Math.max(0, anuncio.quantidade - reservasAtivas);

    res.json({
      success: true,
      data: {
        quantidade_total: anuncio.quantidade,
        reservas_ativas: reservasAtivas,
        quantidade_disponivel: quantidadeDisponivel,
        status: anuncio.status,
        reservado: anuncio.status === "Reservado" || quantidadeDisponivel === 0,
      },
    });
  } catch (error) {
    console.error("[reservas-anuncio] Error getting quantity info:", error);
    res.status(500).json({
      error: "Erro ao obter informações de quantidade",
      details: error instanceof Error ? error.message : undefined,
    });
  }
};

// Register routes
router.post("/anuncios/:anuncioId/reservas", extractUserId, criarReserva);
router.get("/anuncios/:anuncioId/reservas", extractUserId, listarReservasAnuncio);
router.get("/anuncios/:anuncioId/minha-reserva", extractUserId, obterMinhaReserva);
router.get("/anuncios/:anuncioId/reservas/count", contarReservasAtivas);
router.get("/anuncios/:anuncioId/quantidade-info", getQuantidadeInfo);
router.delete("/anuncios/:anuncioId/reservas/:reservaId", extractUserId, cancelarReserva);
router.patch("/reservas/:reservaId", extractUserId, atualizarReserva);

export default router;
