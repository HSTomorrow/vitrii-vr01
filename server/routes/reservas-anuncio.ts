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
    
    // Verify ad exists and allows reservations
    const anuncio = await prisma.anuncios.findUnique({
      where: { id },
    });

    if (!anuncio) {
      return res.status(404).json({ error: "Anúncio não encontrado" });
    }

    if (!anuncio.permiteReservar) {
      return res.status(400).json({ error: "Este anúncio não permite reservas" });
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

    // Check reservation limit
    if (anuncio.quantidadeMaximaReservas) {
      const activeReservas = await prisma.reservas_anuncio.count({
        where: {
          anuncioId: id,
          status: "ativa",
        },
      });

      if (activeReservas >= anuncio.quantidadeMaximaReservas) {
        return res.status(400).json({ 
          error: "Limite de reservas para este anúncio foi atingido" 
        });
      }
    }

    // Create reservation
    const reserva = await prisma.reservas_anuncio.create({
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

    res.status(201).json({
      success: true,
      data: reserva,
      message: "Reserva criada com sucesso",
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

    // Get the reservation
    const reserva = await prisma.reservas_anuncio.findUnique({
      where: { id: rId },
    });

    if (!reserva) {
      return res.status(404).json({ error: "Reserva não encontrada" });
    }

    // Check permissions: user who made the reservation or admin
    const user = await prisma.usracessos.findUnique({
      where: { id: usuarioId },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    if (reserva.usuarioId !== usuarioId && user.tipoUsuario !== "adm") {
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

// Register routes
router.post("/anuncios/:anuncioId/reservas", extractUserId, criarReserva);
router.get("/anuncios/:anuncioId/reservas", extractUserId, listarReservasAnuncio);
router.get("/anuncios/:anuncioId/minha-reserva", extractUserId, obterMinhaReserva);
router.get("/anuncios/:anuncioId/reservas/count", contarReservasAtivas);
router.delete("/anuncios/:anuncioId/reservas/:reservaId", extractUserId, cancelarReserva);
router.patch("/reservas/:reservaId", extractUserId, atualizarReserva);

export default router;
