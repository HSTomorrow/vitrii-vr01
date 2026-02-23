import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";

// Schema validation for updating ordem
const UpdateOrdemSchema = z.object({
  ordem: z.number().int().positive("Ordem deve ser um número positivo"),
});

// UPDATE ad ordem (admin only)
export const updateAnuncioOrdem: RequestHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado",
      });
    }

    // Check if user is admin
    const user = await prisma.usracessos.findUnique({
      where: { id: userId },
      select: { tipoUsuario: true },
    });

    if (!user || user.tipoUsuario !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Apenas administradores podem alterar a ordem dos anúncios",
      });
    }

    console.log("[updateAnuncioOrdem] Updating ad ordem:", id, "with data:", req.body);

    const validatedData = UpdateOrdemSchema.parse(req.body);
    console.log("[updateAnuncioOrdem] Validated data:", validatedData);

    // Verify ad exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(id) },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Update ordem
    const updatedAnuncio = await prisma.anuncios.update({
      where: { id: parseInt(id) },
      data: {
        ordem: validatedData.ordem,
        dataAtualizacao: new Date(),
      },
      include: {
        anunciantes: true,
      },
    });

    console.log("[updateAnuncioOrdem] Ad ordem updated successfully:", updatedAnuncio.id);

    res.json({
      success: true,
      data: updatedAnuncio,
      message: "Ordem do anúncio atualizada com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      console.error("[updateAnuncioOrdem] Validation error:", errorMessages);
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: errorMessages,
      });
    }

    console.error("[updateAnuncioOrdem] Unexpected error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar ordem do anúncio",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// NOTE: getAnuncioByIdWithOrdem has been merged into getAnuncioById in anuncios.ts
// The fotos (with ordem) are now included by default in getAnuncioById
