import { RequestHandler } from "express";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { generatePixBRCode } from "../lib/pixBRCode";
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

const TIPOS_CONTRATO = ["Mensal", "Semanal", "Eventual", "Outros"];
const TIPOS_PAGAMENTO = ["dinheiro", "pix", "cartao", "deposito", "outros"];

function competenciaDeLancamento(lancamento: {
  competencia: string | null;
  vencimento: Date | null;
  dataCriacao: Date;
}): string {
  if (lancamento.competencia) return lancamento.competencia;
  const base = lancamento.vencimento || lancamento.dataCriacao;
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

async function isCompetenciaFechada(anuncianteId: number, competencia: string): Promise<boolean> {
  const ultimaAcao = await prisma.fechamentos_financeiros_log.findFirst({
    where: { anuncianteId, competencia },
    orderBy: { dataAcao: "desc" },
  });
  return ultimaAcao?.acao === "fechar";
}

// ============ CONTRATOS ============

export const listarContratos: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const { titulo, diaVencimentoDe, diaVencimentoAte } = req.query;
    const where: any = { anuncianteId, dataExclusao: null };
    if (titulo) where.titulo = { contains: titulo as string, mode: "insensitive" };
    if (diaVencimentoDe || diaVencimentoAte) {
      where.diaVencimento = {};
      if (diaVencimentoDe) where.diaVencimento.gte = parseInt(diaVencimentoDe as string);
      if (diaVencimentoAte) where.diaVencimento.lte = parseInt(diaVencimentoAte as string);
    }

    const contratos = await prisma.contratos_financeiros.findMany({
      where,
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
    const { anuncianteId, contatoId, titulo, descricao, tipoContrato, valorMensal, diaVencimento, dataInicio } = req.body;

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

    if (tipoContrato && !TIPOS_CONTRATO.includes(tipoContrato)) {
      return res.status(400).json({ error: `tipoContrato deve ser um de: ${TIPOS_CONTRATO.join(", ")}` });
    }

    const contrato = await prisma.contratos_financeiros.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        contatoId: parseInt(contatoId),
        titulo,
        descricao: descricao || null,
        tipoContrato: tipoContrato || "Mensal",
        valorMensal: parseFloat(valorMensal),
        diaVencimento: parseInt(diaVencimento),
        dataInicio: new Date(dataInicio),
        status: "ativo",
        criadoPor: req.userId!,
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
    const { titulo, descricao, tipoContrato, diaVencimento, dataFim } = req.body;

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    if (tipoContrato && !TIPOS_CONTRATO.includes(tipoContrato)) {
      return res.status(400).json({ error: `tipoContrato deve ser um de: ${TIPOS_CONTRATO.join(", ")}` });
    }

    const atualizado = await prisma.contratos_financeiros.update({
      where: { id },
      data: {
        titulo: titulo ?? contrato.titulo,
        descricao: descricao !== undefined ? descricao : contrato.descricao,
        tipoContrato: tipoContrato ?? contrato.tipoContrato,
        diaVencimento: diaVencimento ? parseInt(diaVencimento) : contrato.diaVencimento,
        dataFim: dataFim !== undefined ? (dataFim ? new Date(dataFim) : null) : contrato.dataFim,
        atualizadoPor: req.userId!,
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

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const atualizado = await prisma.contratos_financeiros.update({
      where: { id },
      data: { status, atualizadoPor: req.userId! },
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

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id: contratoId, dataExclusao: null } });
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
        data: { valorMensal: parseFloat(valorNovo), atualizadoPor: req.userId! },
      }),
    ]);

    res.status(201).json({ success: true, data: reajuste });
  } catch (error) {
    console.error("[criarReajuste]", error);
    res.status(500).json({ error: "Erro ao registrar reajuste" });
  }
};

const MAX_ANEXOS_CONTRATO = 5;
const MAX_ANEXOS_LANCAMENTO = 3;

export const anexarDocumentoContrato: RequestHandler = async (req, res) => {
  try {
    const contratoId = parseInt(req.params.id as string);
    const { nome, url, tipo } = req.body;

    if (!nome || !url) {
      return res.status(400).json({ error: "nome e url são obrigatórios" });
    }

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id: contratoId, dataExclusao: null } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const totalAtual = await prisma.contratos_documentos.count({ where: { contratoId } });
    if (totalAtual >= MAX_ANEXOS_CONTRATO) {
      return res.status(400).json({ error: `Máximo de ${MAX_ANEXOS_CONTRATO} anexos por contrato` });
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

export const removerDocumentoContrato: RequestHandler = async (req, res) => {
  try {
    const documentoId = parseInt(req.params.documentoId as string);

    const documento = await prisma.contratos_documentos.findUnique({
      where: { id: documentoId },
      include: { contrato: true },
    });
    if (!documento) return res.status(404).json({ error: "Anexo não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, documento.contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    await prisma.contratos_documentos.delete({ where: { id: documentoId } });

    res.json({ success: true, data: { message: "Anexo removido" } });
  } catch (error) {
    console.error("[removerDocumentoContrato]", error);
    res.status(500).json({ error: "Erro ao remover anexo" });
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
    const where: any = { anuncianteId, dataExclusao: null };
    if (status) where.status = status;
    if (origem) where.origem = origem;
    // Only recurring (contrato/mensalidade) lançamentos ever carry a competencia value —
    // one-off manual/agenda/anuncio charges have it null. An exact-match filter would hide
    // those permanently whenever a competencia filter is active, so always include nulls too.
    if (competencia) where.OR = [{ competencia }, { competencia: null }];
    if (contatoId) where.contatoId = parseInt(contatoId as string);

    const lancamentos = await prisma.lancamentos_financeiros.findMany({
      where,
      include: {
        contato: { select: { id: true, nome: true, email: true, celular: true } },
        evento: { select: { id: true, titulo: true, dataInicio: true } },
        documentos: { orderBy: { dataCriacao: "desc" } },
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

    const evento = await prisma.eventos_agenda_anunciante.findUnique({ where: { id: eventoId, dataExclusao: null } });
    if (!evento) return res.status(404).json({ error: "Evento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, evento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este evento" });
    }

    const lancamento = await prisma.lancamentos_financeiros.findFirst({
      where: { eventoId, status: { not: "cancelado" }, dataExclusao: null },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({ success: true, data: lancamento });
  } catch (error) {
    console.error("[obterLancamentoDoEvento]", error);
    res.status(500).json({ error: "Erro ao buscar lançamento do evento" });
  }
};

export const listarLancamentosDoAnuncio: RequestHandler = async (req, res) => {
  try {
    const anuncioId = parseInt(req.params.anuncioId as string);

    const anuncio = await prisma.anuncios.findUnique({ where: { id: anuncioId, dataExclusao: null } });
    if (!anuncio) return res.status(404).json({ error: "Anúncio não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncio.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anúncio" });
    }

    const lancamentos = await prisma.lancamentos_financeiros.findMany({
      where: { anuncioId, status: { not: "cancelado" }, dataExclusao: null },
      include: {
        contato: { select: { id: true, nome: true, email: true, celular: true } },
      },
      orderBy: { dataCriacao: "desc" },
    });

    res.json({ success: true, data: lancamentos });
  } catch (error) {
    console.error("[listarLancamentosDoAnuncio]", error);
    res.status(500).json({ error: "Erro ao buscar lançamentos do anúncio" });
  }
};

export const criarLancamento: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, eventoId, anuncioId, contatoId, origem, categoria, descricao, valor, vencimento, tipoPagamento, contaBanco } = req.body;

    if (!anuncianteId || !origem || !categoria || !valor) {
      return res.status(400).json({ error: "anuncianteId, origem, categoria e valor são obrigatórios" });
    }

    if (!["agenda", "avulso", "anuncio"].includes(origem)) {
      return res.status(400).json({ error: "origem deve ser 'agenda', 'avulso' ou 'anuncio' ao criar manualmente" });
    }

    if (tipoPagamento && !TIPOS_PAGAMENTO.includes(tipoPagamento)) {
      return res.status(400).json({ error: `tipoPagamento deve ser um de: ${TIPOS_PAGAMENTO.join(", ")}` });
    }

    if (origem === "anuncio" && !anuncioId) {
      return res.status(400).json({ error: "anuncioId é obrigatório para origem 'anuncio'" });
    }

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, parseInt(anuncianteId)))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    if (eventoId) {
      const evento = await prisma.eventos_agenda_anunciante.findUnique({ where: { id: parseInt(eventoId), dataExclusao: null } });
      if (!evento || evento.anuncianteId !== parseInt(anuncianteId)) {
        return res.status(400).json({ error: "Evento não pertence a este anunciante" });
      }
    }

    if (anuncioId) {
      const anuncio = await prisma.anuncios.findUnique({ where: { id: parseInt(anuncioId), dataExclusao: null } });
      if (!anuncio || anuncio.anuncianteId !== parseInt(anuncianteId)) {
        return res.status(400).json({ error: "Anúncio não pertence a este anunciante" });
      }
    }

    const lancamento = await prisma.lancamentos_financeiros.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        eventoId: eventoId ? parseInt(eventoId) : null,
        anuncioId: anuncioId ? parseInt(anuncioId) : null,
        contatoId: contatoId ? parseInt(contatoId) : null,
        origem,
        categoria,
        descricao: descricao || null,
        valor: parseFloat(valor),
        vencimento: vencimento ? new Date(vencimento) : null,
        status: "pendente",
        tipoPagamento: tipoPagamento || "pix",
        contaBanco: contaBanco || null,
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
    const { descricao, valor, vencimento, tipoPagamento, contaBanco } = req.body;

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (tipoPagamento && !TIPOS_PAGAMENTO.includes(tipoPagamento)) {
      return res.status(400).json({ error: `tipoPagamento deve ser um de: ${TIPOS_PAGAMENTO.join(", ")}` });
    }

    const competencia = competenciaDeLancamento(lancamento);
    if (await isCompetenciaFechada(lancamento.anuncianteId, competencia)) {
      return res.status(423).json({ error: `O mês ${competencia} está fechado e não pode ser alterado. Reabra o mês antes de editar.` });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        descricao: descricao !== undefined ? descricao : lancamento.descricao,
        valor: valor !== undefined ? parseFloat(valor) : lancamento.valor,
        vencimento: vencimento !== undefined ? (vencimento ? new Date(vencimento) : null) : lancamento.vencimento,
        tipoPagamento: tipoPagamento !== undefined ? tipoPagamento : lancamento.tipoPagamento,
        contaBanco: contaBanco !== undefined ? (contaBanco || null) : lancamento.contaBanco,
        atualizadoPor: req.userId!,
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
      where: { id, dataExclusao: null },
      include: { anunciante: { select: { chavePix: true, nome: true, cidade: true } } },
    });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (await isCompetenciaFechada(lancamento.anuncianteId, competenciaDeLancamento(lancamento))) {
      return res.status(423).json({ error: "O mês deste lançamento está fechado." });
    }

    if (!lancamento.anunciante.chavePix) {
      return res.status(400).json({
        error: "Este anunciante não possui Chave Pix cadastrada. Cadastre uma Chave Pix no cadastro do anunciante antes de gerar o Pix.",
      });
    }

    const pixId = `LF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const pixPayload = generatePixBRCode({
      chavePix: lancamento.anunciante.chavePix,
      valor: Number(lancamento.valor),
      nomeRecebedor: lancamento.anunciante.nome,
      cidadeRecebedor: lancamento.anunciante.cidade,
      txid: pixId,
    });
    const qrCode = pixPayload;
    const urlCopiaECola = pixPayload;
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
        atualizadoPor: req.userId!,
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

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (await isCompetenciaFechada(lancamento.anuncianteId, competenciaDeLancamento(lancamento))) {
      return res.status(423).json({ error: "O mês deste lançamento está fechado." });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        comprovanteUrl,
        dataComprovante: new Date(),
        status: "comprovante_enviado",
        atualizadoPor: req.userId!,
      },
    });

    res.json({ success: true, data: atualizado });
  } catch (error) {
    console.error("[anexarComprovanteLancamento]", error);
    res.status(500).json({ error: "Erro ao anexar comprovante" });
  }
};

export const anexarDocumentoLancamento: RequestHandler = async (req, res) => {
  try {
    const lancamentoId = parseInt(req.params.id as string);
    const { nome, url, tipo } = req.body;

    if (!nome || !url) {
      return res.status(400).json({ error: "nome e url são obrigatórios" });
    }

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id: lancamentoId, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const totalAtual = await prisma.lancamentos_documentos.count({ where: { lancamentoId } });
    if (totalAtual >= MAX_ANEXOS_LANCAMENTO) {
      return res.status(400).json({ error: `Máximo de ${MAX_ANEXOS_LANCAMENTO} anexos por lançamento` });
    }

    const documento = await prisma.lancamentos_documentos.create({
      data: {
        lancamentoId,
        nome,
        url,
        tipo: tipo || "anexo",
        criadoPor: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: documento });
  } catch (error) {
    console.error("[anexarDocumentoLancamento]", error);
    res.status(500).json({ error: "Erro ao anexar documento" });
  }
};

export const removerDocumentoLancamento: RequestHandler = async (req, res) => {
  try {
    const documentoId = parseInt(req.params.documentoId as string);

    const documento = await prisma.lancamentos_documentos.findUnique({
      where: { id: documentoId },
      include: { lancamento: true },
    });
    if (!documento) return res.status(404).json({ error: "Anexo não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, documento.lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    await prisma.lancamentos_documentos.delete({ where: { id: documentoId } });

    res.json({ success: true, data: { message: "Anexo removido" } });
  } catch (error) {
    console.error("[removerDocumentoLancamento]", error);
    res.status(500).json({ error: "Erro ao remover anexo" });
  }
};

export const marcarLancamentoPago: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (await isCompetenciaFechada(lancamento.anuncianteId, competenciaDeLancamento(lancamento))) {
      return res.status(423).json({ error: "O mês deste lançamento está fechado." });
    }

    const reciboToken = lancamento.reciboToken || crypto.randomBytes(32).toString("hex");

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: {
        status: "pago",
        dataPagamento: new Date(),
        reciboToken,
        atualizadoPor: req.userId!,
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

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (await isCompetenciaFechada(lancamento.anuncianteId, competenciaDeLancamento(lancamento))) {
      return res.status(423).json({ error: "O mês deste lançamento está fechado." });
    }

    const atualizado = await prisma.lancamentos_financeiros.update({
      where: { id },
      data: { status: "cancelado", atualizadoPor: req.userId! },
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
      where: { reciboToken: token, dataExclusao: null },
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
      where: { id, dataExclusao: null },
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
        dataExclusao: null,
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

// ============ LANÇAMENTO MANUAL DE CONTRATO (mês corrente) ============

// Shared by the single-contract and batch "lançar" endpoints below. Always targets the
// current month's competencia; relies on the same @@unique([contratoId, competencia])
// constraint gerarCobrancasMensais() uses, so a contract already billed this month
// (whether by the nightly job or a previous manual launch) is reported as "already exists"
// rather than double-charged.
async function gerarLancamentoDoContrato(
  contrato: { id: number; anuncianteId: number; contatoId: number; titulo: string; valorMensal: any; diaVencimento: number },
  criadoPor: number,
): Promise<"gerado" | "existente"> {
  const hoje = new Date();
  const competencia = competenciaDe(hoje);
  const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), contrato.diaVencimento);

  try {
    await prisma.lancamentos_financeiros.create({
      data: {
        anuncianteId: contrato.anuncianteId,
        contatoId: contrato.contatoId,
        contratoId: contrato.id,
        origem: "contrato",
        categoria: "mensalidade",
        descricao: contrato.titulo,
        valor: contrato.valorMensal,
        competencia,
        vencimento,
        status: "pendente",
        criadoPor,
      },
    });
    return "gerado";
  } catch (err: any) {
    if (err?.code === "P2002") return "existente";
    throw err;
  }
}

export const lancarMesContrato: RequestHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);

    const contrato = await prisma.contratos_financeiros.findUnique({ where: { id, dataExclusao: null } });
    if (!contrato) return res.status(404).json({ error: "Contrato não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este contrato" });
    }

    const resultado = await gerarLancamentoDoContrato(contrato, req.userId!);
    res.json({
      success: true,
      data: { resultado },
      message: resultado === "gerado" ? "Lançamento do mês gerado" : "Já existe um lançamento para este mês",
    });
  } catch (error) {
    console.error("[lancarMesContrato]", error);
    res.status(500).json({ error: "Erro ao lançar mês do contrato" });
  }
};

export const lancarLoteContratos: RequestHandler = async (req, res) => {
  try {
    const { contratoIds } = req.body;
    if (!Array.isArray(contratoIds) || contratoIds.length === 0) {
      return res.status(400).json({ error: "contratoIds deve ser uma lista não vazia" });
    }

    let gerados = 0;
    let jaExistentes = 0;
    let erros = 0;

    for (const rawId of contratoIds) {
      const id = parseInt(rawId);
      try {
        const contrato = await prisma.contratos_financeiros.findUnique({ where: { id, dataExclusao: null } });
        if (!contrato || !(await podeGerenciarAnunciante(req.userId!, req.userType, contrato.anuncianteId))) {
          erros++;
          continue;
        }

        const resultado = await gerarLancamentoDoContrato(contrato, req.userId!);
        if (resultado === "gerado") gerados++;
        else jaExistentes++;
      } catch (err) {
        console.error(`[lancarLoteContratos] Erro no contrato ${id}:`, err);
        erros++;
      }
    }

    res.json({ success: true, data: { gerados, jaExistentes, erros } });
  } catch (error) {
    console.error("[lancarLoteContratos]", error);
    res.status(500).json({ error: "Erro ao lançar lote de contratos" });
  }
};

// ============ FECHAMENTO MENSAL ============

export const listarFechamentos: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const logs = await prisma.fechamentos_financeiros_log.findMany({
      where: { anuncianteId },
      orderBy: { dataAcao: "desc" },
    });

    const estadoPorCompetencia = new Map<string, typeof logs[number]>();
    for (const log of logs) {
      if (!estadoPorCompetencia.has(log.competencia)) {
        estadoPorCompetencia.set(log.competencia, log);
      }
    }

    const fechamentos = Array.from(estadoPorCompetencia.values())
      .filter((log) => log.acao === "fechar")
      .map((log) => ({
        competencia: log.competencia,
        fechado: true,
        dataFechamento: log.dataAcao,
        fechadoPor: log.usuarioId,
      }));

    res.json({ success: true, data: fechamentos });
  } catch (error) {
    console.error("[listarFechamentos]", error);
    res.status(500).json({ error: "Erro ao buscar fechamentos" });
  }
};

export const fecharCompetencia: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, competencia } = req.body;
    if (!anuncianteId || !competencia) {
      return res.status(400).json({ error: "anuncianteId e competencia são obrigatórios" });
    }
    if (!/^\d{4}-\d{2}$/.test(competencia)) {
      return res.status(400).json({ error: "competencia deve estar no formato YYYY-MM" });
    }

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, parseInt(anuncianteId)))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const log = await prisma.fechamentos_financeiros_log.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        competencia,
        acao: "fechar",
        usuarioId: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error("[fecharCompetencia]", error);
    res.status(500).json({ error: "Erro ao fechar mês" });
  }
};

export const reabrirCompetencia: RequestHandler = async (req, res) => {
  try {
    const { anuncianteId, competencia } = req.body;
    if (!anuncianteId || !competencia) {
      return res.status(400).json({ error: "anuncianteId e competencia são obrigatórios" });
    }

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, parseInt(anuncianteId)))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const log = await prisma.fechamentos_financeiros_log.create({
      data: {
        anuncianteId: parseInt(anuncianteId),
        competencia,
        acao: "reabrir",
        usuarioId: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    console.error("[reabrirCompetencia]", error);
    res.status(500).json({ error: "Erro ao reabrir mês" });
  }
};

// ============ MENSAGENS DE COBRANÇA (histórico, via link do WhatsApp) ============

export const listarMensagensCobranca: RequestHandler = async (req, res) => {
  try {
    const lancamentoId = parseInt(req.params.id as string);

    const lancamento = await prisma.lancamentos_financeiros.findUnique({ where: { id: lancamentoId, dataExclusao: null } });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    const mensagens = await prisma.lancamentos_mensagens.findMany({
      where: { lancamentoId },
      orderBy: { dataEnvio: "desc" },
    });

    res.json({ success: true, data: mensagens });
  } catch (error) {
    console.error("[listarMensagensCobranca]", error);
    res.status(500).json({ error: "Erro ao buscar histórico de cobrança" });
  }
};

export const criarMensagemCobranca: RequestHandler = async (req, res) => {
  try {
    const lancamentoId = parseInt(req.params.id as string);
    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({ error: "texto é obrigatório" });
    }

    const lancamento = await prisma.lancamentos_financeiros.findUnique({
      where: { id: lancamentoId, dataExclusao: null },
      include: { contato: { select: { celular: true } } },
    });
    if (!lancamento) return res.status(404).json({ error: "Lançamento não encontrado" });

    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, lancamento.anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este lançamento" });
    }

    if (!lancamento.contato?.celular) {
      return res.status(400).json({ error: "Este lançamento não tem um contato com celular cadastrado" });
    }

    const registro = await prisma.lancamentos_mensagens.create({
      data: {
        lancamentoId,
        texto,
        enviadoPor: req.userId!,
      },
    });

    res.status(201).json({ success: true, data: registro });
  } catch (error) {
    console.error("[criarMensagemCobranca]", error);
    res.status(500).json({ error: "Erro ao registrar mensagem de cobrança" });
  }
};
