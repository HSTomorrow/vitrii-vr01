import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

const MAX_BANNERS = 10;

const BannerSchema = z.object({
  titulo: z
    .string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título não pode ter mais de 100 caracteres"),
  descricao: z.string().optional().nullable(),
  imagemUrl: z.string()
    .min(1, "Imagem é obrigatória")
    .refine(
      (url) => url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"),
      "A imagem deve ser uma URL válida ou uma imagem codificada em base64"
    ),
  link: z.string()
    .min(1, "Link é obrigatório")
    .url("URL do link inválida"),
  ordem: z.number().int().nonnegative().default(0),
  ativo: z.boolean().default(true),
  corFonte: z.enum(["amarelo", "branco", "preto"]).default("amarelo").optional(),
  mostrarTitulo: z.boolean().default(true).optional(),
});

const BannerUpdateSchema = z.object({
  titulo: z
    .string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título não pode ter mais de 100 caracteres")
    .optional(),
  descricao: z.string().optional().nullable(),
  imagemUrl: z.string()
    .refine(
      (url) => !url || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image/"),
      "A imagem deve ser uma URL válida ou uma imagem codificada em base64"
    )
    .optional(),
  link: z.string()
    .refine(
      (url) => {
        // If empty or not provided, that's OK for update
        if (!url || url === "") return true;
        // If provided, must be valid URL
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      },
      "URL do link inválida"
    )
    .optional()
    .nullable(),
  ordem: z.number().int().nonnegative().optional(),
  ativo: z.boolean().optional(),
  corFonte: z.enum(["amarelo", "branco", "preto"]).optional(),
  mostrarTitulo: z.boolean().optional(),
}).strict();

// GET all banners
export const getBanners: RequestHandler = async (req, res) => {
  try {
    const { ativo } = req.query;

    const where: any = {};
    if (ativo === "true") {
      where.ativo = true;
    } else if (ativo === "false") {
      where.ativo = false;
    }

    const banners = await prisma.banners.findMany({
      where,
      orderBy: { ordem: "asc" },
    });

    // An edit in /admin/banners must show up immediately on refetch - no caching layer
    // (browser or intermediary) should ever serve a pre-edit list here.
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");

    console.log("[getBanners] ✓ Recuperados", banners.length, "banners", {
      filtro: ativo ? `ativo=${ativo}` : "nenhum",
      ativos: banners.filter((b) => b.ativo).length,
      inativos: banners.filter((b) => !b.ativo).length,
    });

    res.json({
      success: true,
      data: banners,
      count: banners.length,
    });
  } catch (error) {
    console.error("[getBanners] 🔴 Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar banners",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// GET banner by ID
export const getBannerById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await prisma.banners.findUnique({
      where: { id: parseInt(id) },
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        error: "Banner não encontrado",
      });
    }

    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("[getBannerById] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar banner",
    });
  }
};

// CREATE banner
export const createBanner: RequestHandler = async (req, res) => {
  try {
    console.log("[createBanner] Validando dados:", {
      titulo: req.body.titulo,
      ativo: req.body.ativo,
      imageType: req.body.imagemUrl?.substring(0, 50),
    });

    const validatedData = BannerSchema.parse(req.body);
    console.log("[createBanner] ✓ Validação bem-sucedida");

    if (validatedData.ativo) {
      const activeCount = await prisma.banners.count({ where: { ativo: true } });
      if (activeCount >= MAX_BANNERS) {
        console.warn("[createBanner] ❌ Limite de banners ativos atingido:", activeCount);
        return res.status(400).json({
          success: false,
          error: "Limite de banners ativos atingido",
          details: `Máximo de ${MAX_BANNERS} banners ativos. Desative ou delete um banner existente, ou salve este como inativo.`,
        });
      }
    }

    // Get the maximum order and add 1
    const maxBanner = await prisma.banners.findFirst({
      orderBy: { ordem: "desc" },
    });
    const nextOrder = (maxBanner?.ordem || 0) + 1;

    const banner = await prisma.banners.create({
      data: {
        ...validatedData,
        ordem: validatedData.ordem || nextOrder,
      },
    });

    console.log("[createBanner] ✓ Banner criado com sucesso:", {
      id: banner.id,
      titulo: banner.titulo,
      ativo: banner.ativo,
    });

    res.status(201).json({
      success: true,
      data: banner,
      message: "Banner criado com sucesso",
      details: {
        id: banner.id,
        titulo: banner.titulo,
        ativo: banner.ativo,
        ordem: banner.ordem,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      const errorSummary = fieldErrors
        .map((e) => `${e.field}: ${e.message}`)
        .join(" | ");

      console.warn("[createBanner] ❌ Validação falhou:", fieldErrors);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos do banner",
        details: errorSummary,
        validation_errors: fieldErrors,
      });
    }

    console.error("[createBanner] 🔴 Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
  }
};

// UPDATE banner
export const updateBanner: RequestHandler = async (req, res) => {
  const { id } = req.params;
  try {
    console.log("[updateBanner] Atualizando banner ID:", id, {
      titulo: req.body.titulo,
      ativo: req.body.ativo,
    });

    const validatedData = BannerUpdateSchema.parse(req.body);

    if (validatedData.ativo) {
      const existing = await prisma.banners.findUnique({
        where: { id: parseInt(id) },
        select: { ativo: true },
      });
      if (existing && !existing.ativo) {
        const activeCount = await prisma.banners.count({ where: { ativo: true } });
        if (activeCount >= MAX_BANNERS) {
          console.warn("[updateBanner] ❌ Limite de banners ativos atingido:", activeCount);
          return res.status(400).json({
            success: false,
            error: "Limite de banners ativos atingido",
            details: `Máximo de ${MAX_BANNERS} banners ativos. Desative ou delete um banner existente antes de ativar este.`,
          });
        }
      }
    }

    const banner = await prisma.banners.update({
      where: { id: parseInt(id) },
      data: validatedData,
    });

    console.log("[updateBanner] ✓ Banner atualizado com sucesso:", {
      id: banner.id,
      titulo: banner.titulo,
      ativo: banner.ativo,
    });

    res.json({
      success: true,
      data: banner,
      message: "Banner atualizado com sucesso",
      details: {
        id: banner.id,
        titulo: banner.titulo,
        ativo: banner.ativo,
        ordem: banner.ordem,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      const errorSummary = fieldErrors
        .map((e) => `${e.field}: ${e.message}`)
        .join(" | ");

      console.warn("[updateBanner] ❌ Validação falhou para ID", id, ":", fieldErrors);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos do banner",
        details: errorSummary,
        validation_errors: fieldErrors,
      });
    }

    console.error("[updateBanner] 🔴 Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
  }
};

// DELETE banner
export const deleteBanner: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const bannerId = parseInt(id);

    console.log("[deleteBanner] Deletando banner ID:", bannerId);

    const deletedBanner = await prisma.banners.delete({
      where: { id: bannerId },
    });

    console.log("[deleteBanner] ✓ Banner deletado com sucesso:", {
      id: deletedBanner.id,
      titulo: deletedBanner.titulo,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Banner deletado com sucesso",
      details: {
        id: deletedBanner.id,
        titulo: deletedBanner.titulo,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[deleteBanner] 🔴 Erro ao deletar:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString(),
    });
  }
};

// REORDER banners
export const reorderBanners: RequestHandler = async (req, res) => {
  try {
    const { banners: bannerOrders } = req.body;

    if (!Array.isArray(bannerOrders)) {
      return res.status(400).json({
        success: false,
        error: "banners deve ser um array com formato: [{id, ordem}, ...]",
      });
    }

    // Update each banner's order
    const results = await Promise.all(
      bannerOrders.map((item) =>
        prisma.banners.update({
          where: { id: item.id },
          data: { ordem: item.ordem },
        })
      )
    );

    res.json({
      success: true,
      data: results,
      message: "Ordem dos banners atualizada com sucesso",
    });
  } catch (error) {
    console.error("[reorderBanners] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao reordenar banners",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};
