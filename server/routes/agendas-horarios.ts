import { RequestHandler } from "express";
import prisma from "../lib/prisma";

// Get schedule for an announcer
export const getHorariosAgenda: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.query;

    if (!anuncianteId) {
      return res.status(400).json({ error: "anuncianteId is required" });
    }

    const anuncianteId_num = parseInt(anuncianteId as string);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    // Check if announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: anuncianteId_num },
    });

    if (!anunciante) {
      return res.status(404).json({ error: "Announcer not found" });
    }

    const horarios = await prisma.agendas_horarios.findMany({
      where: {
        anuncianteId: anuncianteId_num,
        ativo: true,
      },
      orderBy: {
        diaSemana: "asc",
      },
    });

    res.json({ data: horarios });
  } catch (error) {
    console.error("[getHorariosAgenda]", error);
    res.status(500).json({ error: "Erro ao buscar horários da agenda" });
  }
};

// Save or update schedule for an announcer
export const saveHorariosAgenda: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, horarios } = req.body;

    if (!anuncianteId || !Array.isArray(horarios)) {
      return res.status(400).json({ error: "anuncianteId and horarios array are required" });
    }

    const anuncianteId_num = parseInt(anuncianteId);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    // Check if announcer exists
    const anunciante = await prisma.anunciantes.findUnique({
      where: { id: anuncianteId_num },
    });

    if (!anunciante) {
      return res.status(404).json({ error: "Announcer not found" });
    }

    // First, delete all existing schedule entries for this announcer
    await prisma.agendas_horarios.deleteMany({
      where: {
        anuncianteId: anuncianteId_num,
      },
    });

    // If horarios is empty, return success (means deactivating all)
    if (horarios.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Create new schedule entries
    const createdHorarios = await Promise.all(
      horarios.map((horario) =>
        prisma.agendas_horarios.create({
          data: {
            anuncianteId: anuncianteId_num,
            diaSemana: parseInt(horario.diaSemana),
            horaInicio: horario.horaInicio,
            horaFim: horario.horaFim,
            ativo: true,
          },
        })
      )
    );

    res.json({ success: true, data: createdHorarios });
  } catch (error) {
    console.error("[saveHorariosAgenda]", error);
    res.status(500).json({ error: "Erro ao salvar horários da agenda" });
  }
};

// Check if a specific time/day falls within the schedule
export const isTimeWithinSchedule: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, dataInicio } = req.query;

    if (!anuncianteId || !dataInicio) {
      return res.status(400).json({ error: "anuncianteId and dataInicio are required" });
    }

    const anuncianteId_num = parseInt(anuncianteId as string);
    if (isNaN(anuncianteId_num)) {
      return res.status(400).json({ error: "Invalid announcer ID" });
    }

    const data = new Date(dataInicio as string);
    const diaSemana = data.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const hora = `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;

    const horario = await prisma.agendas_horarios.findFirst({
      where: {
        anuncianteId: anuncianteId_num,
        diaSemana: diaSemana,
        ativo: true,
      },
    });

    if (!horario) {
      return res.json({ isWithinSchedule: false });
    }

    const isWithin =
      hora >= horario.horaInicio && hora < horario.horaFim;

    res.json({ isWithinSchedule: isWithin });
  } catch (error) {
    console.error("[isTimeWithinSchedule]", error);
    res.status(500).json({ error: "Erro ao verificar horário" });
  }
};
