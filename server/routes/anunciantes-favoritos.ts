import { RequestHandler } from "express";
import prisma from "../lib/prisma";

export const listarAnunciantesFavoritos: RequestHandler = async (req, res) => {
  try {
    const favoritos = await prisma.anunciantes_favoritos.findMany({
      where: { usuarioId: req.userId! },
      orderBy: { dataCriacao: "desc" },
    });

    const anunciantes = await prisma.anunciantes.findMany({
      where: { id: { in: favoritos.map((f) => f.anuncianteId) } },
      select: {
        id: true,
        nome: true,
        descricao: true,
        fotoUrl: true,
        tipo: true,
        cidade: true,
        estado: true,
      },
    });
    const anuncianteById = new Map(anunciantes.map((a) => [a.id, a]));

    // A favorito can outlive its anunciante if the anunciante row was ever hard-deleted
    // without the FK cascade running - querying with `include` would 500 the whole list
    // in that case (Prisma treats the relation as required). Drop the orphan here and
    // clean it up so it stops showing up on future requests for this user.
    const orphanIds = favoritos
      .filter((f) => !anuncianteById.has(f.anuncianteId))
      .map((f) => f.id);
    if (orphanIds.length > 0) {
      await prisma.anunciantes_favoritos.deleteMany({
        where: { id: { in: orphanIds } },
      });
    }

    const data = favoritos
      .map((f) => anuncianteById.get(f.anuncianteId))
      .filter((a): a is NonNullable<typeof a> => !!a);

    res.json({ success: true, data });
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
