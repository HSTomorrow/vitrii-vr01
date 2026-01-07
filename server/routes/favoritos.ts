import prisma from "../lib/prisma";
import { RequestHandler } from "express";

// GET all favoritos for a user
export const getFavoritos: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.query;

    if (!usuarioId) {
      return res.status(400).json({
        success: false,
        error: "usuarioId é obrigatório",
      });
    }

    const favoritos = await prisma.favorito.findMany({
      where: {
        usuarioId: parseInt(usuarioId as string),
      },
      include: {
        anuncio: {
          include: {
            loja: {
              select: {
                id: true,
                nome: true,
                fotoUrl: true,
                endereco: true,
              },
            },
            producto: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                tipo: true,
              },
            },
            tabelaDePreco: {
              select: {
                id: true,
                preco: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataCriacao: "desc",
      },
    });

    // Transform to return just the anuncios with a count
    const anuncios = favoritos.map((fav) => fav.anuncio);

    res.json({
      success: true,
      data: anuncios,
      count: anuncios.length,
    });
  } catch (error) {
    console.error("Error fetching favoritos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar favoritos",
    });
  }
};

// GET favoritos for ads (check if ad is favorited by user)
export const checkFavorito: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, anuncioId } = req.query;

    if (!usuarioId || !anuncioId) {
      return res.status(400).json({
        success: false,
        error: "usuarioId e anuncioId são obrigatórios",
      });
    }

    const favorito = await prisma.favorito.findUnique({
      where: {
        usuarioId_anuncioId: {
          usuarioId: parseInt(usuarioId as string),
          anuncioId: parseInt(anuncioId as string),
        },
      },
    });

    res.json({
      success: true,
      isFavorited: !!favorito,
    });
  } catch (error) {
    console.error("Error checking favorito:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar favorito",
    });
  }
};

// ADD/REMOVE favorito
export const toggleFavorito: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, anuncioId } = req.body;

    if (!usuarioId || !anuncioId) {
      return res.status(400).json({
        success: false,
        error: "usuarioId e anuncioId são obrigatórios",
      });
    }

    // Check if favorito exists
    const existingFavorito = await prisma.favorito.findUnique({
      where: {
        usuarioId_anuncioId: {
          usuarioId: parseInt(usuarioId as string),
          anuncioId: parseInt(anuncioId as string),
        },
      },
    });

    if (existingFavorito) {
      // Remove favorito
      await prisma.favorito.delete({
        where: {
          usuarioId_anuncioId: {
            usuarioId: parseInt(usuarioId as string),
            anuncioId: parseInt(anuncioId as string),
          },
        },
      });

      res.json({
        success: true,
        message: "Favorito removido com sucesso",
        isFavorited: false,
      });
    } else {
      // Add favorito
      await prisma.favorito.create({
        data: {
          usuarioId: parseInt(usuarioId as string),
          anuncioId: parseInt(anuncioId as string),
        },
      });

      res.json({
        success: true,
        message: "Favorito adicionado com sucesso",
        isFavorited: true,
      });
    }
  } catch (error) {
    console.error("Error toggling favorito:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar favorito",
    });
  }
};

// GET count of favoritos for an ad
export const getFavoritoCount: RequestHandler = async (req, res) => {
  try {
    const { anuncioId } = req.query;

    if (!anuncioId) {
      return res.status(400).json({
        success: false,
        error: "anuncioId é obrigatório",
      });
    }

    const count = await prisma.favorito.count({
      where: {
        anuncioId: parseInt(anuncioId as string),
      },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching favorito count:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao contar favoritos",
    });
  }
};
