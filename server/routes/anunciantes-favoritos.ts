import { RequestHandler } from "express";
import prisma from "../lib/prisma";

export const listarAnunciantesFavoritos: RequestHandler = async (req, res) => {
  try {
    const favoritos = await prisma.anunciantes_favoritos.findMany({
      where: { usuarioId: req.userId! },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            fotoUrl: true,
            tipo: true,
            cidade: true,
            estado: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({ success: true, data: favoritos.map((f) => f.anunciante) });
  } catch (error) {
    console.error("[listarAnunciantesFavoritos]", error);
    res.status(500).json({ error: "Erro ao buscar anunciantes favoritos" });
  }
};

export const favoritarAnunciante: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId } = req.body;
    if (!anuncianteId) {
      return res.status(400).json({ error: "anuncianteId é obrigatório" });
    }

    const anunciante = await prisma.anunciantes.findUnique({ where: { id: parseInt(anuncianteId) } });
    if (!anunciante) {
      return res.status(404).json({ error: "Anunciante não encontrado" });
    }

    const favorito = await prisma.anunciantes_favoritos.upsert({
      where: { usuarioId_anuncianteId: { usuarioId: req.userId!, anuncianteId: parseInt(anuncianteId) } },
      update: {},
      create: { usuarioId: req.userId!, anuncianteId: parseInt(anuncianteId) },
    });

    res.status(201).json({ success: true, data: favorito });
  } catch (error) {
    console.error("[favoritarAnunciante]", error);
    res.status(500).json({ error: "Erro ao favoritar anunciante" });
  }
};

export const desfavoritarAnunciante: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);

    await prisma.anunciantes_favoritos.deleteMany({
      where: { usuarioId: req.userId!, anuncianteId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[desfavoritarAnunciante]", error);
    res.status(500).json({ error: "Erro ao desfavoritar anunciante" });
  }
};
