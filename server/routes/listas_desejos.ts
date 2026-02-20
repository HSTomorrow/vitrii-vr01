import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema para criar uma lista
const ListaDesejosCreateSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(255),
  descricao: z.string().optional().nullable(),
  status: z.enum(["publicado", "privado"]).default("privado"),
});

// Schema para atualizar lista
const ListaDesejosUpdateSchema = ListaDesejosCreateSchema.partial();

// Schema para criar item livre
const ItemLivreSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(255),
  descricao: z.string().optional().nullable(),
  preco: z.number().nonnegative().optional().nullable(),
  imagem: z.string().optional().nullable(),
});

// Schema para copiar anúncio
const ItemAnuncioSchema = z.object({
  anuncioId: z.number().int().positive("Anúncio é obrigatório"),
  preco_desejado: z.number().nonnegative().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

// Schema para atualizar item
const UpdateItemSchema = z.object({
  preco_desejado: z.number().nonnegative().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  titulo: z.string().optional(),
  descricao: z.string().optional().nullable(),
});

// GET all wishlists for logged user
export const getListasDesejos: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string);
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const listas = await prisma.listas_desejos.findMany({
      where: { usuarioId },
      include: {
        itens: {
          select: {
            id: true,
            titulo: true,
            tipo: true,
            preco: true,
            imagem: true,
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({
      success: true,
      data: listas,
    });
  } catch (error) {
    console.error("Error fetching wishlists:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar listas de desejos",
    });
  }
};

// GET single wishlist with all items
export const getListaDesejosById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string || "0");

    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(id) },
      include: {
        itens: true,
        permissoes: {
          select: {
            anuncianteId: true,
            anunciante: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!lista) {
      return res.status(404).json({
        success: false,
        error: "Lista de desejos não encontrada",
      });
    }

    // Check if user can view this list
    const canView =
      lista.usuarioId === usuarioId || lista.status === "publicado";

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    res.json({
      success: true,
      data: lista,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar lista de desejos",
    });
  }
};

// CREATE new wishlist
export const createListaDesejos: RequestHandler = async (req, res) => {
  try {
    const usuarioId = parseInt(req.headers["x-user-id"] as string);
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const validatedData = ListaDesejosCreateSchema.parse(req.body);

    const lista = await prisma.listas_desejos.create({
      data: {
        usuarioId,
        ...validatedData,
      },
      include: {
        itens: true,
      },
    });

    res.status(201).json({
      success: true,
      data: lista,
      message: "Lista de desejos criada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating wishlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar lista de desejos",
    });
  }
};

// UPDATE wishlist
export const updateListaDesejos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lista) {
      return res.status(404).json({
        success: false,
        error: "Lista de desejos não encontrada",
      });
    }

    if (lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para editar esta lista",
      });
    }

    const validatedData = ListaDesejosUpdateSchema.parse(req.body);

    const updatedLista = await prisma.listas_desejos.update({
      where: { id: parseInt(id) },
      data: validatedData,
      include: {
        itens: true,
      },
    });

    res.json({
      success: true,
      data: updatedLista,
      message: "Lista de desejos atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating wishlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar lista de desejos",
    });
  }
};

// DELETE wishlist
export const deleteListaDesejos: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lista) {
      return res.status(404).json({
        success: false,
        error: "Lista de desejos não encontrada",
      });
    }

    if (lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar esta lista",
      });
    }

    await prisma.listas_desejos.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Lista de desejos deletada com sucesso",
    });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar lista de desejos",
    });
  }
};

// ADD item livre to wishlist
export const addItemLivre: RequestHandler = async (req, res) => {
  try {
    const { listaId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const validatedData = ItemLivreSchema.parse(req.body);

    const item = await prisma.listas_desejos_itens.create({
      data: {
        listaId: parseInt(listaId),
        tipo: "livre",
        ...validatedData,
      },
    });

    res.status(201).json({
      success: true,
      data: item,
      message: "Item adicionado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error adding item:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar item",
    });
  }
};

// ADD item copied from announcement to wishlist
export const addItemAnuncio: RequestHandler = async (req, res) => {
  try {
    const { listaId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const validatedData = ItemAnuncioSchema.parse(req.body);

    // Get announcement to copy
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: validatedData.anuncioId },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Create item with snapshot of announcement
    const item = await prisma.listas_desejos_itens.create({
      data: {
        listaId: parseInt(listaId),
        tipo: "anuncio_copia",
        anuncioId: anuncio.id,
        titulo: anuncio.titulo,
        descricao: anuncio.descricao,
        preco: anuncio.preco,
        preco_desejado: validatedData.preco_desejado || null,
        observacoes: validatedData.observacoes || null,
        imagem: anuncio.imagem,
        dados_copiados: {
          anuncioId: anuncio.id,
          titulo: anuncio.titulo,
          descricao: anuncio.descricao,
          preco: anuncio.preco?.toString(),
          categoria: anuncio.categoria,
          imagem: anuncio.imagem,
          status: anuncio.status,
          tipo: anuncio.tipo,
          dataCopia: new Date().toISOString(),
        },
      },
    });

    res.status(201).json({
      success: true,
      data: item,
      message: "Anúncio adicionado à lista com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error adding announcement:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao adicionar anúncio",
    });
  }
};

// UPDATE item from wishlist
export const updateItemListaDesejos: RequestHandler = async (req, res) => {
  try {
    const { listaId, itemId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const item = await prisma.listas_desejos_itens.findUnique({
      where: { id: parseInt(itemId) },
    });

    if (!item || item.listaId !== parseInt(listaId)) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado",
      });
    }

    const validatedData = UpdateItemSchema.parse(req.body);

    const updatedItem = await prisma.listas_desejos_itens.update({
      where: { id: parseInt(itemId) },
      data: validatedData,
    });

    res.json({
      success: true,
      data: updatedItem,
      message: "Item atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar item",
    });
  }
};

// DELETE item from wishlist
export const deleteItemListaDesejos: RequestHandler = async (req, res) => {
  try {
    const { listaId, itemId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const item = await prisma.listas_desejos_itens.findUnique({
      where: { id: parseInt(itemId) },
    });

    if (!item || item.listaId !== parseInt(listaId)) {
      return res.status(404).json({
        success: false,
        error: "Item não encontrado",
      });
    }

    await prisma.listas_desejos_itens.delete({
      where: { id: parseInt(itemId) },
    });

    res.json({
      success: true,
      message: "Item removido com sucesso",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover item",
    });
  }
};

// MANAGE permissions for private wishlists
export const addPermissao: RequestHandler = async (req, res) => {
  try {
    const { listaId } = req.params;
    const { anuncianteId } = req.body;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    if (!anuncianteId) {
      return res.status(400).json({
        success: false,
        error: "anuncianteId é obrigatório",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    const permissao = await prisma.listas_desejos_permissoes.create({
      data: {
        listaId: parseInt(listaId),
        anuncianteId,
      },
      include: {
        anunciante: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: permissao,
      message: "Permissão concedida com sucesso",
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        error: "Este anunciante já tem acesso a esta lista",
      });
    }

    console.error("Error adding permission:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao conceder permissão",
    });
  }
};

// REMOVE permission
export const removePermissao: RequestHandler = async (req, res) => {
  try {
    const { listaId, permissaoId } = req.params;
    const usuarioId = parseInt(req.headers["x-user-id"] as string);

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Verify list ownership
    const lista = await prisma.listas_desejos.findUnique({
      where: { id: parseInt(listaId) },
    });

    if (!lista || lista.usuarioId !== usuarioId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    await prisma.listas_desejos_permissoes.delete({
      where: { id: parseInt(permissaoId) },
    });

    res.json({
      success: true,
      message: "Permissão removida com sucesso",
    });
  } catch (error) {
    console.error("Error removing permission:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao remover permissão",
    });
  }
};
