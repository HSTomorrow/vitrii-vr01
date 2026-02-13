import { RequestHandler } from "express";
import prisma from "../lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

// Schema validation
const PagamentoCreateSchema = z.object({
  anuncioId: z.number().int().positive("Anúncio é obrigatório"),
  valor: z.number().positive("Valor deve ser maior que zero"),
});

const PagamentoStatusUpdateSchema = z.object({
  status: z.enum(["pendente", "processando", "pago", "cancelado", "expirado"]),
  pixId: z.string().optional(),
  erroMsg: z.string().optional(),
  dataPagamento: z.string().optional(),
});

// GET payment by anuncio ID
export const getPagamentoByAnuncioId: RequestHandler = async (req, res) => {
  try {
    const { anuncioId } = req.params;

    const pagamento = await prisma.pagamento.findUnique({
      where: { anuncioId: parseInt(anuncioId) },
      include: {
        anuncio: true,
      },
    });

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: "Pagamento não encontrado",
      });
    }

    res.json({
      success: true,
      data: pagamento,
    });
  } catch (error) {
    console.error("Error fetching pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar pagamento",
    });
  }
};

// CREATE new payment (Pix QR Code generation)
export const createPagamento: RequestHandler = async (req, res) => {
  try {
    const validatedData = PagamentoCreateSchema.parse(req.body);

    // Verify that the anuncio exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: validatedData.anuncioId },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    // Check if payment already exists
    const existingPagamento = await prisma.pagamento.findUnique({
      where: { anuncioId: validatedData.anuncioId },
    });

    if (existingPagamento) {
      return res.status(400).json({
        success: false,
        error: "Já existe um pagamento para este anúncio",
      });
    }

    // Generate Pix data (in a real scenario, this would call Mercado Pago API)
    // For demo purposes, we'll create mock Pix data
    const pixId = `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const qrCodeData = generateMockQRCode(validatedData.valor, pixId);
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 30); // 30 minute expiration

    const pagamento = await prisma.pagamento.create({
      data: {
        anuncioId: validatedData.anuncioId,
        valor: new Decimal(validatedData.valor.toString()),
        tipo: "pix",
        status: "pendente",
        pixId,
        qrCode: qrCodeData.qrCode,
        urlCopiaECola: qrCodeData.urlCopiaECola,
        dataExpiracao: expirationTime,
      },
      include: {
        anuncio: true,
      },
    });

    // Update anuncio status to waiting for payment
    await prisma.anuncios.update({
      where: { id: validatedData.anuncioId },
      data: { status: "aguardando_pagamento" },
    });

    res.status(201).json({
      success: true,
      data: pagamento,
      message: "Código Pix gerado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error creating pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao gerar código Pix",
    });
  }
};

// UPDATE payment status (for webhook callbacks)
export const updatePagamentoStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = PagamentoStatusUpdateSchema.parse(req.body);

    const pagamento = await prisma.pagamento.update({
      where: { id: parseInt(id) },
      data: {
        status: validatedData.status,
        pixId: validatedData.pixId,
        erroMsg: validatedData.erroMsg,
        dataPagamento: validatedData.dataPagamento
          ? new Date(validatedData.dataPagamento)
          : undefined,
      },
      include: {
        anuncio: true,
      },
    });

    // If payment is confirmed, update anuncio status to "pago"
    if (validatedData.status === "pago") {
      await prisma.anuncios.update({
        where: { id: pagamento.anuncioId },
        data: { status: "pago" },
      });
    }

    // If payment is cancelled/expired, update anuncio status back to "em_edicao"
    if (
      validatedData.status === "cancelado" ||
      validatedData.status === "expirado"
    ) {
      await prisma.anuncios.update({
        where: { id: pagamento.anuncioId },
        data: { status: "em_edicao" },
      });
    }

    res.json({
      success: true,
      data: pagamento,
      message: "Pagamento atualizado com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }

    console.error("Error updating pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar pagamento",
    });
  }
};

// GET payment status (for polling)
export const getPagamentoStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const pagamento = await prisma.pagamento.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: "Pagamento não encontrado",
      });
    }

    // Check if payment has expired
    if (pagamento.status === "pendente" && pagamento.dataExpiracao) {
      if (new Date() > pagamento.dataExpiracao) {
        // Mark as expired
        await prisma.pagamento.update({
          where: { id: parseInt(id) },
          data: { status: "expirado" },
        });

        return res.json({
          success: true,
          data: { ...pagamento, status: "expirado" },
        });
      }
    }

    res.json({
      success: true,
      data: pagamento,
    });
  } catch (error) {
    console.error("Error fetching pagamento status:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar status do pagamento",
    });
  }
};

// Webhook handler for payment confirmations (from Mercado Pago or other providers)
export const handlePaymentWebhook: RequestHandler = async (req, res) => {
  try {
    const { action, data } = req.body;

    // Verify webhook signature (in production, verify with provider's signature)
    // For demo, we'll accept any webhook

    if (action === "payment.created" || action === "payment.updated") {
      const { id: externalId, status, transaction_id } = data;

      // Find pagamento by external ID
      const pagamento = await prisma.pagamento.findFirst({
        where: { idExterno: externalId },
      });

      if (pagamento) {
        let newStatus = "pendente";
        if (status === "approved") {
          newStatus = "pago";
        } else if (status === "rejected" || status === "failed") {
          newStatus = "cancelado";
        } else if (status === "processing") {
          newStatus = "processando";
        }

        await updatePagamentoStatus(
          {
            params: { id: pagamento.id.toString() },
            body: {
              status: newStatus,
              pixId: transaction_id,
              dataPagamento:
                newStatus === "pago" ? new Date().toISOString() : undefined,
            },
          } as any,
          res,
        );
        return;
      }
    }

    res.json({ success: true, message: "Webhook processado" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao processar webhook",
    });
  }
};

// CANCEL payment
export const cancelPagamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const pagamento = await prisma.pagamento.update({
      where: { id: parseInt(id) },
      data: {
        status: "cancelado",
      },
      include: {
        anuncio: true,
      },
    });

    // Update anuncio status back to "em_edicao"
    await prisma.anuncios.update({
      where: { id: pagamento.anuncioId },
      data: { status: "em_edicao" },
    });

    res.json({
      success: true,
      data: pagamento,
      message: "Pagamento cancelado",
    });
  } catch (error) {
    console.error("Error cancelling pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao cancelar pagamento",
    });
  }
};

// POST - Upload de comprovante de pagamento
export const uploadComprovantePagemento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { comprovantePagamento } = req.body;

    if (!comprovantePagamento) {
      return res.status(400).json({
        success: false,
        error: "Comprovante é obrigatório",
      });
    }

    // Atualizar pagamento com comprovante
    const pagamento = await prisma.pagamentos.update({
      where: { id: parseInt(id) },
      data: {
        status: "comprovante_enviado",
        comprovantePagamento,
        dataComprovante: new Date(),
      },
      include: {
        anuncio: true,
      },
    });

    // Atualizar status do anúncio
    await prisma.anuncios.update({
      where: { id: pagamento.anuncioId },
      data: { status: "em_analise" },
    });

    res.json({
      success: true,
      data: pagamento,
      message: "Comprovante enviado com sucesso! Análise em até 24 horas.",
    });
  } catch (error) {
    console.error("Erro ao fazer upload de comprovante:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao fazer upload do comprovante",
    });
  }
};

// POST - Confirmar pagamento manualmente (admin)
export const aprovarPagamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const pagamento = await prisma.pagamentos.update({
      where: { id: parseInt(id) },
      data: {
        status: "aprovado",
      },
      include: {
        anuncio: true,
      },
    });

    // Ativar o anúncio
    await prisma.anuncios.update({
      where: { id: pagamento.anuncioId },
      data: { status: "ativo", statusPagamento: "pago" },
    });

    res.json({
      success: true,
      data: pagamento,
      message: "Pagamento aprovado! Anúncio ativado.",
    });
  } catch (error) {
    console.error("Erro ao aprovar pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao aprovar pagamento",
    });
  }
};

// POST - Rejeitar pagamento (admin)
export const rejeitarPagamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const pagamento = await prisma.pagamentos.update({
      where: { id: parseInt(id) },
      data: {
        status: "rejeitado",
      },
      include: {
        anuncio: true,
      },
    });

    // Voltar anúncio para pendente
    await prisma.anuncios.update({
      where: { id: pagamento.anuncioId },
      data: { status: "em_edicao" },
    });

    res.json({
      success: true,
      data: pagamento,
      message: "Pagamento rejeitado",
    });
  } catch (error) {
    console.error("Erro ao rejeitar pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao rejeitar pagamento",
    });
  }
};

// Helper function to generate mock Pix QR Code data
// In production, this would call Mercado Pago API
function generateMockQRCode(valor: number, pixId: string) {
  // Mock Pix QR Code (in real scenario, call Mercado Pago API)
  const qrCode = `00020126580014br.gov.bcb.brcode0136123e4567-e12b-12d1-a456-426655440000520400005303986540510.005802BR5913Vitrii6009Sao Paulo62410503***63041D3D`;
  const urlCopiaECola = `00020126580014br.gov.bcb.brcode0136${pixId}520400005303986540510.005802BR5913Vitrii6009SaoPaulo62410503***63041D3D`;

  return {
    qrCode,
    urlCopiaECola,
  };
}
