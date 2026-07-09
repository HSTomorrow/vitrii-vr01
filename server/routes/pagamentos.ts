import { RequestHandler } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { z } from "zod";
import { Decimal } from "@prisma/client/runtime/library";
import { generatePixBRCode } from "../lib/pixBRCode";

// Vitrii's own Pix key, used to receive ad-listing payments (as opposed to Financeiro's
// anunciante-to-contato billing, which uses each anunciante's own chavePix).
const PLATAFORMA_CHAVE_PIX = "contato@herestomorrow.com";
const PLATAFORMA_NOME = "HERES TOMORROW";
const PLATAFORMA_CIDADE = "SAO PAULO";

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

    const pagamento = await prisma.pagamentos.findUnique({
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

    if (pagamento.anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para ver este pagamento",
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

    if (anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para gerar pagamento para este anúncio",
      });
    }

    // Check if payment already exists
    const existingPagamento = await prisma.pagamentos.findUnique({
      where: { anuncioId: validatedData.anuncioId },
    });

    if (existingPagamento) {
      return res.status(400).json({
        success: false,
        error: "Já existe um pagamento para este anúncio",
      });
    }

    const pixId = `PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const pixPayload = generatePixBRCode({
      chavePix: PLATAFORMA_CHAVE_PIX,
      valor: validatedData.valor,
      nomeRecebedor: PLATAFORMA_NOME,
      cidadeRecebedor: PLATAFORMA_CIDADE,
      txid: pixId,
    });
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 30); // 30 minute expiration

    const pagamento = await prisma.pagamentos.create({
      data: {
        anuncioId: validatedData.anuncioId,
        valor: new Decimal(validatedData.valor.toString()),
        tipo: "pix",
        status: "pendente",
        pixId,
        qrCode: pixPayload,
        urlCopiaECola: pixPayload,
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

    // req.userId is only set for real HTTP requests (extractUserId middleware) - the
    // webhook handler below calls this function directly with a bare {params, body}
    // object, so it's absent there and this check is skipped for that internal path.
    if (req.userId !== undefined) {
      const existing = await prisma.pagamentos.findUnique({
        where: { id: parseInt(id) },
        include: { anuncio: { select: { usuarioId: true } } },
      });

      if (!existing) {
        return res.status(404).json({ success: false, error: "Pagamento não encontrado" });
      }

      const isOwner = existing.anuncio.usuarioId === req.userId;
      const isAdmin = req.userType === "adm";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: "Você não tem permissão para alterar este pagamento",
        });
      }

      // Owners may only cancel their own pending payment - marking it "pago"/"aprovado"
      // is reserved for admin approval or the payment provider's webhook.
      if (!isAdmin && validatedData.status !== "cancelado") {
        return res.status(403).json({
          success: false,
          error: "Apenas administradores podem confirmar pagamentos",
        });
      }
    }

    const pagamento = await prisma.pagamentos.update({
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

    const pagamento = await prisma.pagamentos.findUnique({
      where: { id: parseInt(id) },
      include: { anuncio: { select: { usuarioId: true } } },
    });

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: "Pagamento não encontrado",
      });
    }

    if (pagamento.anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para ver este pagamento",
      });
    }

    // Check if payment has expired
    if (pagamento.status === "pendente" && pagamento.dataExpiracao) {
      if (new Date() > pagamento.dataExpiracao) {
        // Mark as expired
        await prisma.pagamentos.update({
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

// Verifies the `x-webhook-signature` header (hex HMAC-SHA256 of the raw body,
// keyed with PAYMENT_WEBHOOK_SECRET). Without this, anyone could POST a forged
// body to mark any payment as paid and activate the linked ad for free.
function isValidWebhookSignature(req: any): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[handlePaymentWebhook] PAYMENT_WEBHOOK_SECRET não configurado - recusando webhook");
    return false;
  }

  const signature = req.headers["x-webhook-signature"];
  const rawBody: Buffer | undefined = req.rawBody;
  if (!signature || typeof signature !== "string" || !rawBody) {
    return false;
  }

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");

  return (
    expectedBuf.length === signatureBuf.length &&
    crypto.timingSafeEqual(expectedBuf, signatureBuf)
  );
}

// Webhook handler for payment confirmations (from Mercado Pago or other providers)
export const handlePaymentWebhook: RequestHandler = async (req, res) => {
  try {
    if (!isValidWebhookSignature(req)) {
      console.warn("[handlePaymentWebhook] Assinatura inválida ou ausente");
      return res.status(401).json({ success: false, error: "Assinatura inválida" });
    }

    const { action, data } = req.body;

    if (action === "payment.created" || action === "payment.updated") {
      const { id: externalId, status, transaction_id } = data;

      // Find pagamento by external ID
      const pagamento = await prisma.pagamentos.findFirst({
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

    const existing = await prisma.pagamentos.findUnique({
      where: { id: parseInt(id) },
      include: { anuncio: { select: { usuarioId: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Pagamento não encontrado" });
    }

    if (existing.anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para cancelar este pagamento",
      });
    }

    const pagamento = await prisma.pagamentos.update({
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

    const existing = await prisma.pagamentos.findUnique({
      where: { id: parseInt(id) },
      include: { anuncio: { select: { usuarioId: true } } },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Pagamento não encontrado" });
    }

    if (existing.anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para enviar comprovante para este pagamento",
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
      data: {
        status: "em_analise",
        statusPagamento: "aguardando_confirmacao_pagamento"
      },
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

// GET all pagamentos (for admin)
export const getPagamentos: RequestHandler = async (req, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const pagamentos = await prisma.pagamentos.findMany({
      where,
      include: {
        anuncio: {
          include: {
            anunciantes: {
              select: { nome: true },
            },
          },
        },
      },
      orderBy: { dataCriacao: "desc" },
      take: 100,
    });

    res.json({
      success: true,
      data: pagamentos,
    });
  } catch (error) {
    console.error("[getPagamentos] Error:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao buscar pagamentos",
    });
  }
};

// ADMIN: Confirm payment and activate ad
export const confirmarPagamento: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the payment
    const pagamento = await prisma.pagamentos.findUnique({
      where: { id: parseInt(id) },
      include: { anuncio: true },
    });

    if (!pagamento) {
      return res.status(404).json({
        success: false,
        error: "Pagamento não encontrado",
      });
    }

    if (pagamento.status === "aprovado") {
      return res.status(400).json({
        success: false,
        error: "Pagamento já foi confirmado",
      });
    }

    // Calculate expiration date: today + 30 days
    const hoje = new Date();
    const dataValidade = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update payment status
    const pagamentoAtualizado = await prisma.pagamentos.update({
      where: { id: parseInt(id) },
      data: {
        status: "aprovado",
        dataPagamento: hoje,
      },
    });

    // Update anuncio status and expiration
    const anuncioAtualizado = await prisma.anuncios.update({
      where: { id: pagamento.anuncioId },
      data: {
        status: "ativo",
        statusPagamento: "aprovado",
        dataFim: dataValidade,
      },
    });

    res.json({
      success: true,
      message: "Pagamento confirmado com sucesso!",
      data: {
        pagamento: pagamentoAtualizado,
        anuncio: anuncioAtualizado,
      },
    });
  } catch (error) {
    console.error("[confirmarPagamento] Erro ao confirmar pagamento:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao confirmar pagamento",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
};

// POST - Mark payment as realized (from MeusAnuncios modal)
// This function updates ad status immediately when user clicks "Pagamento Realizado"
export const marcarPagamentoRealizado: RequestHandler = async (req, res) => {
  try {
    const { anuncioId } = req.body;

    if (!anuncioId) {
      return res.status(400).json({
        success: false,
        error: "anuncioId é obrigatório",
      });
    }

    // Verify that the anuncio exists
    const anuncio = await prisma.anuncios.findUnique({
      where: { id: parseInt(anuncioId) },
    });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        error: "Anúncio não encontrado",
      });
    }

    if (anuncio.usuarioId !== req.userId && req.userType !== "adm") {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para alterar este anúncio",
      });
    }

    // Update ad status to "em_analise" and statusPagamento to "aguardando_confirmacao_pagamento"
    const anuncioAtualizado = await prisma.anuncios.update({
      where: { id: parseInt(anuncioId) },
      data: {
        status: "em_analise",
        statusPagamento: "aguardando_confirmacao_pagamento",
      },
    });

    res.json({
      success: true,
      data: anuncioAtualizado,
      message: "Pagamento marcado como realizado. Aguardando análise.",
    });
  } catch (error) {
    console.error("Erro ao marcar pagamento como realizado:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao marcar pagamento como realizado",
    });
  }
};

