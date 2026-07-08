import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation
const ProductoCreateSchema = z.object({
  grupoId: z.number().int().positive("Grupo é obrigatório"),
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  sku: z.string().optional(),
  tipo: z
    .enum(["anuncio_padrao", "produto", "servico", "evento", "aulas_cursos", "oportunidade"])
    .optional()
    .default("anuncio_padrao"),
});

// GET all productos
export const getProductos: RequestHandler = async (req, res) => {
  try {
    const { grupoId, status } = req.query;

    const where: any = { dataExclusao: null };
    if (grupoId) where.grupoId = parseInt(grupoId as string);
    // status filter: "ativo" (default), "inativo", or "todos"
    if (!status || status === "ativo") where.status = "ativo";
    else if (status === "inativo") where.status = "inativo";

    const productos = await prisma.productos.findMany({
      where,
      include: {
        grupo: {
          select: {
            id: true,
            nome: true,
            descricao: true,
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

    res.json({
      success: true,
      data: productos,
      count: productos.length,
    });
  } catch (error) {
    console.error("Error fetching productos:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos",
    });
  }
};

// GET producto by ID
export const getProductoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await prisma.productos.findUnique({
      where: { id: parseInt(id), dataExclusao: null },
      include: {
        grupo: {
          include: {
            anunciante: true,
          },
        },
        tabelasDePreco: true,
      },
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        error: "Produto não encontrado",
      });
    }

    res.json({
      success: true,
      data: producto,
    });
  } catch (error) {
    console.error("Error fetching producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar produto",
    });
  }
};

// CREATE new producto
export const createProducto: RequestHandler = async (req, res) => {
  try {
    const validatedData = ProductoCreateSchema.parse(req.body);

    // Verify that the grupo exists and get its lojaId (anuncianteId)
    const grupo = await prisma.grupos_produtos.findUnique({
      where: { id: validatedData.grupoId, dataExclusao: null },
    });

    if (!grupo) {
      return res.status(400).json({
        success: false,
        error: "Grupo não encontrado",
      });
    }

    const producto = await prisma.productos.create({
      data: {
        ...validatedData,
        lojaId: grupo.anuncianteId,
        dataAtualizacao: new Date(),
        criadoPor: req.userId ?? null,
      },
      include: {
        grupo: {
          include: {
            anunciante: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: producto,
      message: "Produto criado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar produto",
    });
  }
};

// UPDATE producto
export const updateProducto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = ProductoCreateSchema.partial().parse(req.body);

    const producto = await prisma.productos.update({
      where: { id: parseInt(id), dataExclusao: null },
      data: {
        ...updateData,
        dataAtualizacao: new Date(),
        atualizadoPor: req.userId ?? null,
      },
      include: {
        grupo: {
          include: {
            anunciante: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: producto,
      message: "Produto atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar produto",
    });
  }
};

// DELETE producto — blocked if the product is already referenced anywhere (price table,
// stock movement/entry, external link); the client should offer "desativar" instead.
export const deleteProducto: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const producto = await prisma.productos.findUnique({ where: { id, dataExclusao: null } });
    if (!producto) {
      return res.status(404).json({ success: false, error: "Produto não encontrado" });
    }

    const [tabelaPreco, movimentoEstoque, produtoEmEstoque, linkExterno] = await Promise.all([
      prisma.tabelas_preco.findFirst({ where: { productId: id } }),
      prisma.movimentos_estoque.findFirst({ where: { productId: id } }),
      prisma.produtos_em_estoque.findFirst({ where: { productId: id } }),
      prisma.links_produtos_externos.findFirst({ where: { productId: id } }),
    ]);

    if (tabelaPreco || movimentoEstoque || produtoEmEstoque || linkExterno) {
      return res.status(400).json({
        success: false,
        error: "Este produto já está em uso (tabela de preço, estoque ou link externo vinculado) e não pode ser excluído. Desative-o em vez de excluir.",
        podeDesativar: true,
      });
    }

    await prisma.productos.update({
      where: { id },
      data: { dataExclusao: new Date(), excluidoPor: req.userId ?? null },
    });

    res.json({
      success: true,
      message: "Produto deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting producto:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar produto",
    });
  }
};

// PATCH producto status — ativo/inativo toggle (the "desativar em vez de excluir" path)
export const atualizarStatusProducto: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!["ativo", "inativo"].includes(status)) {
      return res.status(400).json({ success: false, error: "status deve ser 'ativo' ou 'inativo'" });
    }

    const producto = await prisma.productos.update({
      where: { id, dataExclusao: null },
      data: { status, atualizadoPor: req.userId ?? null },
    });

    res.json({ success: true, data: producto });
  } catch (error) {
    console.error("Error updating producto status:", error);
    res.status(500).json({ success: false, error: "Erro ao atualizar status do produto" });
  }
};
