import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

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
  link: z.string().url("URL do link inválida").optional().nullable(),
  ordem: z.number().int().nonnegative().default(0),
  ativo: z.boolean().default(true),
});

const BannerUpdateSchema = BannerSchema.partial();

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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      console.warn("[createBanner] ❌ Validação falhou:", errorMessages);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("[createBanner] 🔴 Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao criar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// UPDATE banner
export const updateBanner: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("[updateBanner] Atualizando banner ID:", id, {
      titulo: req.body.titulo,
      ativo: req.body.ativo,
    });

    const validatedData = BannerUpdateSchema.parse(req.body);

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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      console.warn("[updateBanner] ❌ Validação falhou:", errorMessages);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("[updateBanner] 🔴 Erro:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// DELETE banner
export const deleteBanner: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.banners.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Banner deletado com sucesso",
    });
  } catch (error) {
    console.error("[deleteBanner] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar banner",
      details: error instanceof Error ? error.message : "Erro desconhecido",
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
