import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import QRCode from "qrcode";
import { z } from "zod";

// Schema validation for QR code creation
const QRCodeCreateSchema = z.object({
  anuncioId: z.number().int().positive("Anúncio é obrigatório"),
  descricao: z.string().optional().nullable(),
});

// Generate QR Code for an ad
export const generateQRCode: RequestHandler = async (req, res) => {
  try {
    const { anuncioId } = req.body;

    // Verify the ad exists
    const anuncio = await prisma.anuncio.findUnique({
      where: { id: anuncioId },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Generate unique code
    const codigo = `ad-${anuncioId}-${Date.now()}`;
    
    // Create direct link to ad
    const adLink = `${process.env.BASE_URL || "http://localhost:5173"}/anuncio/${anuncioId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(adLink, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // Save QR code to database (using tabelaDePrecoId if available, otherwise null)
    const tabelaDePrecoId = anuncio.tabelaDePrecoId || null;

    // Store the data URL as the codigo for now
    const qrCode = await prisma.qRCode.create({
      data: {
        codigo: qrCodeDataUrl, // Store the data URL for easy retrieval
        tabelaDePrecoId: tabelaDePrecoId ? tabelaDePrecoId : undefined,
        descricao: req.body.descricao,
      },
    });

    // Return QR code data
    res.json({
      success: true,
      data: {
        id: qrCode.id,
        codigo: qrCodeDataUrl, // Return the data URL directly
        descricao: qrCode.descricao,
        directLink: adLink,
        anuncioId,
      },
      message: "QR Code gerado com sucesso",
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar QR Code",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// Get QR codes for an ad
export const getQRCodesForAd: RequestHandler = async (req, res) => {
  try {
    const { anuncioId } = req.params;

    const qrCodes = await prisma.qRCode.findMany({
      where: {
        // Join through tabelaDePreco -> anuncio
        tabelaDePreco: {
          anuncios: {
            some: {
              id: parseInt(anuncioId),
            },
          },
        },
      },
      include: {
        chamadas: {
          select: {
            id: true,
            dataChamada: true,
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Alternative simpler approach - get by direct query
    const alternativeQRCodes = await prisma.qRCode.findMany({
      where: {
        tabelaDePreco: {
          anuncios: {
            some: {
              id: parseInt(anuncioId),
            },
          },
        },
      },
      include: {
        chamadas: true,
      },
    });

    res.json({
      success: true,
      data: alternativeQRCodes.length > 0 ? alternativeQRCodes : qrCodes,
      count: (alternativeQRCodes.length > 0 ? alternativeQRCodes : qrCodes).length,
    });
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar QR Codes",
    });
  }
};

// Track QR code scan
export const trackQRCodeScan: RequestHandler = async (req, res) => {
  try {
    const { qrCodeId } = req.params;
    const { usuarioId } = req.body;

    // Verify QR code exists
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: parseInt(qrCodeId) },
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: "QR Code não encontrado",
      });
    }

    // Record the scan
    const chamada = await prisma.qRCodeChamada.create({
      data: {
        qrCodeId: parseInt(qrCodeId),
        usuarioId: usuarioId || null,
        dataChamada: new Date(),
      },
    });

    res.json({
      success: true,
      data: chamada,
      message: "QR Code scan registrado",
    });
  } catch (error) {
    console.error("Error tracking QR code:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao registrar QR Code scan",
    });
  }
};

// Get QR code statistics
export const getQRCodeStats: RequestHandler = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    const qrCode = await prisma.qRCode.findUnique({
      where: { id: parseInt(qrCodeId) },
      include: {
        chamadas: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        error: "QR Code não encontrado",
      });
    }

    // Calculate statistics
    const stats = {
      totalScans: qrCode.chamadas.length,
      uniqueUsers: new Set(qrCode.chamadas.map((c) => c.usuarioId)).size,
      firstScan: qrCode.chamadas.length > 0 ? qrCode.chamadas[0].dataChamada : null,
      lastScan: qrCode.chamadas.length > 0 
        ? qrCode.chamadas[qrCode.chamadas.length - 1].dataChamada 
        : null,
    };

    res.json({
      success: true,
      data: {
        qrCode,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching QR code stats:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas do QR Code",
    });
  }
};

// Delete QR code
export const deleteQRCode: RequestHandler = async (req, res) => {
  try {
    const { qrCodeId } = req.params;

    await prisma.qRCode.delete({
      where: { id: parseInt(qrCodeId) },
    });

    res.json({
      success: true,
      message: "QR Code deletado com sucesso",
    });
  } catch (error) {
    console.error("Error deleting QR code:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao deletar QR Code",
    });
  }
};
