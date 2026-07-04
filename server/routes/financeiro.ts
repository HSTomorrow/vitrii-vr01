import { RequestHandler } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { generateMockQRCode } from "../lib/mockPix";
import { sendReceiptEmail } from "../lib/emailService";

async function podeGerenciarAnunciante(userId: number, userType: string | undefined, anuncianteId: number): Promise<boolean> {
  if (userType === "adm") return true;
  const membership = await prisma.usuarios_anunciantes.findFirst({
    where: { usuarioId: userId, anuncianteId },
  });
  return !!membership;
}

function getAppUrl(): string {
  return process.env.APP_URL || "https://app.vitrii.com.br";
}

// ============ CONTRATOS ============

export const listarContratos: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const contratos = await prisma.contratos_financeiros.findMany({
      where: { anuncianteId },
      include: {
        contato: { select: { id: true, nome: true, email: true, celular: true } },
        reajustes: { orderBy: { dataCriacao: "desc" } },
        documentos: { orderBy: { dataCriacao: "desc" } },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({ success: true, data: contratos });
  } catch (error) {
    console.error("[listarContratos]", error);
    res.status(500).json({ error: "Erro ao buscar contratos" });
  }
};

export const criarContrato: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, contatoId, titulo, descricao, valorMensal, diaVencimento, dataInicio } = req.body;

    if (!anuncianteId || !contatoId || !titulo || !valorMensal || !diaVencimento || !dataInicio) {
      return res.status(400).json({
        error: "anuncianteId, contatoId, titulo, valorMensal, diaVencimento e dataInicio são obrigatórios",
      });
    }

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, parseInt(anuncianteId)))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    if (diaVencimento < 1 || diaVencimento > 28) {
      return res.status(400).json({ error: "Dia de vencimento deve ser entre 1 e 28" });
    }

    const contrato = await prisma.contratos_financeiros.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        contatoId: parseInt(contatoId),
        titulo,
        descricao: descricao || null,
        valorMensal: parseFloat(valorMensal),
        diaVencimento: parseInt(diaVencimento),
        dataInicio: new Date(dataInicio),
        status: "ativo",
      },
      include: { contato: { select: { id: true, nome: true } } },
    });

    res.status(201).json({ success: true, data: contrato });
  } catch (error) {
    console.error("[criarContrato]", error);
    res.status(500).json({ error: "Erro ao criar contrato" });
  }
};

export const atualizarContrato: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { titulo, descricao, diaVencimento, dataFim } = req.body;

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const atualizado = await prisma.contratos_financeiros.update({
      where: { id },
      data: {
        titulo: titulo ?? contrato.titulo,
        descricao: descricao !== undefined ? descricao : contrato.descricao,
        diaVencimento: diaVencimento ? parseInt(diaVencimento) : contrato.diaVencimento,
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : contrato.dataFim,
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[atualizarContrato]", error);
    res.status(500).json({ error: "Erro ao atualizar contrato" });
  }
};

export const atualizarStatusContrato: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { status } = req.body;

    if (!["ativo", "suspenso", "encerrado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const atualizado = await prisma.contratos_financeiros.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[atualizarStatusContrato]", error);
    res.status(500).json({ error: "Erro ao atualizar status do contrato" });
  }
};

export const criarReajuste: RequestHandler = async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id as string);
    const { valorNovo, motivo, dataVigencia } = req.body;

    if (!valorNovo) {
      return res.status(400).json({ error: "valorNovo é obrigatório" });
    }

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id: contratoId } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const [reajuste] = await prisma.$transaction([
      prisma.contratos_reajustes.create({
        data: {
          contratoId,
          valorAnterior: contrato.valorMensal,
          valorNovo: parseFloat(valorNovo),
          motivo: motivo || null,
          dataVigencia: dataVigencia ? new Date(dataVigencia) : new Date(),
          criadoPor: req.userId!,
        },
      }),
      prisma.contratos_financeiros.update({
        where: { id: contratoId },
        data: { valorMensal: parseFloat(valorNovo) },
      }),
    ]);

    res.status(201).json({ success: true, data: reajuste });
  } catch (error) {
    console.error("[criarReajuste]", error);
    res.status(500).json({ error: "Erro ao registrar reajuste" });
  }
};

export const anexarDocumentoContrato: RequestHandler = async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id as string);
    const { nome, url, tipo } = req.body;

    if (!nome || !url) {
      return res.status(400).json({ error: "nome e url são obrigatórios" });
    }

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id: contratoId } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const documento = await prisma.contratos_documentos.create({
      data: {
        contratoId,
        nome,
        url,
        tipo: tipo || "contrato",
        criadoPor: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: documento });
  } catch (error) {
    console.error("[anexarDocumentoContrato]", error);
    res.status(500).json({ error: "Erro ao anexar documento" });
  }
};

// ============ LANÇAMENTOS ============

export const listarLancamentos: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const { status, origem, competencia, contatoId } = req.query;
    const where: any = { anuncianteId };
    if (status) where.status = status;
    if (origem) where.origem = origem;
    if (competencia) where.competencia = competencia;
    if (contatoId) where.contatoId = parseInt(contatoId as string);

    const lancamentos = await prisma.lancamentos_financeiros.findMany({
      where,
      include: {
        contato: { select: { id: true, nome: true, email: true, celular: true } },
        evento: { select: { id: true, titulo: true, dataInicio: true } },
      },
      orderBy: { dataCriacao: "desc" },
      take: 300,
    });

    res.json({ success: true, data: lancamentos });
  } catch (error) {
    console.error("[listarLancamentos]", error);
    res.status(500).json({ error: "Erro ao buscar lançamentos" });
  }
};

export const obterLancamentoDoEvento: RequestHandler = async (req, res) => {
  try {
    const eventoId = parseInt(req.params.eventoId as string);

    const evento = await prisma.eventos_agenda_anunciante.findUnique({ where: { id: eventoId } });
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, evento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este evento" });
    }

    const lancamento = await prisma.lancamentos_financeiros.findFirst({
      where: { eventoId, status: { not: "cancelado" } },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({ success: true, data: lancamento });
  } catch (error) {
    console.error("[obterLancamentoDoEvento]", error);
    res.status(500).json({ error: "Erro ao buscar lançamento do evento" });
  }
};

export const criarLancamento: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, eventoId, contatoId, origem, categoria, descricao, valor, vencimento } = req.body;

    if (!anuncianteId || !origem || !categoria || !valor) {
      return res.status(400).json({ error: "anuncianteId, origem, categoria e valor são obrigatórios" });
    }

    if (!["agenda", "avulso"].includes(origem)) {
      return res.status(400).json({ error: "origem deve ser 'agenda' ou 'avulso' ao criar manualmente" });
    }

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, parseInt(anuncianteId)))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    if (eventoId) {
      const evento = await prisma.eventos_agenda_anunciante.findUnique({ where: { id: parseInt(eventoId) } });
      if (!evento || evento.anuncianteId !== parseInt(anuncianteId)) {
        return res.status(400).json({ error: "Evento não pertence a este anunciante" });
      }
    }

    const lancamento = await prisma.lancamentos_financeiros.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        eventoId: eventoId ? parseInt(eventoId) : null,
        contatoId: contatoId ? parseInt(contatoId) : null,
        origem,
        categoria,
        descricao: descricao || null,
        valor: parseFloat(valor),
        vencimento: vencimento ? new Date(vencimento) : null,
        status: "pendente",
        criadoPor: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: lancamento });
  } catch (error) {
    console.error("[criarLancamento]", error);
    res.status(500).json({ error: "Erro ao criar lançamento" });
  }
};

export const atualizarLancamento: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { descricao, valor, vencimento } = req.body;

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (lancamento.status !== "pendente") {
      return res.status(400).json({ error: "Só é possível editar lançamentos pendentes" });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        descricao: descricao !== undefined ? descricao : lancamento.descricao,
        valor: valor !== undefined ? parseFloat(valor) : lancamento.valor,
        vencimento: vencimento !== undefined ? (vencimento ? new Date(vencimento) : null) : lancamento.vencimento,
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[atualizarLancamento]", error);
    res.status(500).json({ error: "Erro ao atualizar lançamento" });
  }
};

export const gerarPixLancamento: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({
      where: { id },
      include: { anunciante: { select: { chavePix: true } } },
    });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const pixId = `LF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const { qrCode, urlCopiaECola } = generateMockQRCode(
      Number(lancamento.valor),
      pixId,
      lancamento.anunciante.chavePix,
    );
    const dataExpiracaoPix = new Date();
    dataExpiracaoPix.setMinutes(dataExpiracaoPix.getMinutes() + 30);

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        pixId,
        qrCode,
        urlCopiaECola,
        dataExpiracaoPix,
        status: lancamento.status === "pendente" ? "pix_gerado" : lancamento.status,
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[gerarPixLancamento]", error);
    res.status(500).json({ error: "Erro ao gerar Pix" });
  }
};

export const anexarComprovanteLancamento: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const { comprovanteUrl } = req.body;

    if (!comprovanteUrl) {
      return res.status(400).json({ error: "comprovanteUrl é obrigatório" });
    }

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        comprovanteUrl,
        dataComprovante: new Date(),
        status: "comprovante_enviado",
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[anexarComprovanteLancamento]", error);
    res.status(500).json({ error: "Erro ao anexar comprovante" });
  }
};

export const marcarLancamentoPago: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const reciboToken = lancamento.reciboToken || crypto.randomBytes(32).toString("hex");

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        status: "pago",
        dataPagamento: new Date(),
        reciboToken,
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[marcarLancamentoPago]", error);
    res.status(500).json({ error: "Erro ao marcar lançamento como pago" });
  }
};

export const cancelarLancamento: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: { status: "cancelado" },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[cancelarLancamento]", error);
    res.status(500).json({ error: "Erro ao cancelar lançamento" });
  }
};

// ============ RECIBO ============

export const obterReciboPublico: RequestHandler = async (req, res) => {
  try {
    const token = req.params.token as string;

    const lancamento = await prisma.lancamentos_financeiros.findUnique({
      where: { reciboToken: token },
      include: {
        anunciante: { select: { nome: true, cnpj: true, telefone: true, email: true } },
        contato: { select: { nome: true } },
      },
    });

    if (!lancamento || lancamento.status !== "pago") {
      return res.status(404).json({ error: "Recibo não encontrado" });
    }

    res.json({
      success: true,
      data: {
        anuncianteNome: lancamento.anunciante.nome,
        contatoNome: lancamento.contato?.nome || "Cliente",
        valor: lancamento.valor,
        descricao: lancamento.descricao,
        categoria: lancamento.categoria,
        dataPagamento: lancamento.dataPagamento,
      },
    });
  } catch (error) {
    console.error("[obterReciboPublico]", error);
    res.status(500).json({ error: "Erro ao buscar recibo" });
  }
};

export const enviarReciboPorEmail: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({
      where: { id },
      include: {
        anunciante: { select: { nome: true } },
        contato: { select: { nome: true, email: true } },
      },
    });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (lancamento.status !== "pago" || !lancamento.reciboToken) {
      return res.status(400).json({ error: "Só é possível enviar recibo de um lançamento pago" });
    }

    if (!lancamento.contato?.email) {
      return res.status(400).json({ error: "Este cliente não tem email cadastrado" });
    }

    const reciboUrl = `${getAppUrl()}/recibo/${lancamento.reciboToken}`;
    const enviado = await sendReceiptEmail(
      lancamento.contato.email,
      lancamento.contato.nome,
      lancamento.anunciante.nome,
      Number(lancamento.valor),
      lancamento.dataPagamento || new Date(),
      lancamento.descricao,
      reciboUrl,
    );

    if (!enviado) {
      return res.status(500).json({ error: "Erro ao enviar email do recibo" });
    }

    res.json({ success: true, message: "Recibo enviado por email" });
  } catch (error) {
    console.error("[enviarReciboPorEmail]", error);
    res.status(500).json({ error: "Erro ao enviar recibo" });
  }
};

// ============ ADMIN ============

export const adminListarLancamentos: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, status, origem } = req.query;
    const where: any = {};
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (status) where.status = status;
    if (origem) where.origem = origem;

    const lancamentos = await prisma.lancamentos_financeiros.findMany({
      where,
      include: {
        anunciante: { select: { id: true, nome: true } },
        contato: { select: { id: true, nome: true } },
      },
      orderBy: { dataCriacao: "desc" },
      take: 300,
    });

    res.json({ success: true, data: lancamentos });
  } catch (error) {
    console.error("[adminListarLancamentos]", error);
    res.status(500).json({ error: "Erro ao buscar lançamentos" });
  }
};

export const adminListarContratos: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, status } = req.query;
    const where: any = {};
    if (anuncianteId) where.anuncianteId = parseInt(anuncianteId as string);
    if (status) where.status = status;

    const contratos = await prisma.contratos_financeiros.findMany({
      where,
      include: {
        anunciante: { select: { id: true, nome: true } },
        contato: { select: { id: true, nome: true } },
      },
      orderBy: { dataCriacao: "desc" },
      take: 300,
    });

    res.json({ success: true, data: contratos });
  } catch (error) {
    console.error("[adminListarContratos]", error);
    res.status(500).json({ error: "Erro ao buscar contratos" });
  }
};

// ============ GERAÇÃO AUTOMÁTICA DE MENSALIDADE ============

function competenciaDe(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(data: Date, meses: number): Date {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d;
}

// Called daily by server/lib/scheduler.ts. Idempotent and self-healing: walks forward
// from the last generated competencia (or contract start) to the current month, so a
// server outage spanning the due date (or several months) still catches up correctly.
export async function gerarCobrancasMensais() {
  const hoje = new Date();
  let gerados = 0;

  try {
    const contratos = await prisma.contratos_financeiros.findMany({
      where: {
        status: "ativo",
        OR: [{ dataFim: null }, { dataFim: { gte: hoje } }],
      },
      include: {
        lancamentos: {
          where: { origem: "mensalidade" },
          orderBy: { competencia: "desc" },
          take: 1,
        },
      },
    });

    for (const contrato of contratos) {
      let cursor = contrato.lancamentos[0]
        ? addMonths(new Date(`${contrato.lancamentos[0].competencia}-01T00:00:00`), 1)
        : new Date(contrato.dataInicio);

      while (cursor <= hoje) {
        const noMesCorrente = cursor.getFullYear() === hoje.getFullYear() && cursor.getMonth() === hoje.getMonth();
        // For the current month, only generate once we've actually reached the due day
        if (noMesCorrente && hoje.getDate() < contrato.diaVencimento) break;

        const competencia = competenciaDe(cursor);
        const vencimento = new Date(cursor.getFullYear(), cursor.getMonth(), contrato.diaVencimento);

        try {
          await prisma.lancamentos_financeiros.create({
            data: {
              anuncianteId: contrato.anuncianteId,
              contatoId: contrato.contatoId,
              contratoId: contrato.id,
              origem: "mensalidade",
              categoria: "mensalidade",
              descricao: contrato.titulo,
              valor: contrato.valorMensal,
              competencia,
              vencimento,
              status: "pendente",
              criadoPor: null, // system-generated
            },
          });
          gerados++;
        } catch (err: any) {
          // Unique constraint violation on (contratoId, competencia) - already generated, skip
          if (err?.code !== "P2002") {
            console.error(`[gerarCobrancasMensais] Erro ao gerar cobrança do contrato ${contrato.id}:`, err);
          }
        }

        cursor = addMonths(cursor, 1);
      }
    }

    console.log(`[gerarCobrancasMensais] ${gerados} cobrança(s) de mensalidade gerada(s)`);
    return { success: true, gerados };
  } catch (error) {
    console.error("[gerarCobrancasMensais] Erro:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
