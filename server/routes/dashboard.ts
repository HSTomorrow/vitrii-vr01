import { RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

async function podeGerenciarAnunciante(userId: number, userType: string | undefined, anuncianteId: number): Promise<boolean> {
  if (userType === "adm") return true;
  const membership = await prisma.usuarios_anunciantes.findFirst({
    where: { usuarioId: userId, anuncianteId },
  });
  return !!membership;
}

const PERIODOS = [7, 30, 90, 365];
const PENDENTE_STATUSES = ["pendente", "pix_gerado", "comprovante_enviado"];

function mesKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function ultimosMeses(n: number): { key: string; label: string; start: Date; end: Date }[] {
  const out = [];
  const hoje = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const end = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
    out.push({
      key: mesKey(start),
      label: start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      start,
      end,
    });
  }
  return out;
}

async function calcularSerieMensal(anuncianteId: number) {
  const meses = ultimosMeses(6);
  const desde = meses[0].start;

  // Sequential, not Promise.all: this project's DB connection is a pooler with only
  // 3 connections available (confirmed in production — parallelizing the ~17 queries
  // gerarDashboardCache needs blows through that pool and every query times out).
  const publicados = await prisma.anuncios.findMany({
    where: { anuncianteId, dataCriacao: { gte: desde } },
    select: { dataCriacao: true },
  });
  const vendidos = await prisma.anuncios.findMany({
    where: { anuncianteId, status: "vendido", dataAtualizacao: { gte: desde } },
    select: { dataAtualizacao: true },
  });
  const pagos = await prisma.lancamentos_financeiros.findMany({
    where: { anuncianteId, status: "pago", dataPagamento: { gte: desde } },
    select: { dataPagamento: true, valor: true },
  });
  const pendentes = await prisma.lancamentos_financeiros.findMany({
    where: { anuncianteId, status: { in: PENDENTE_STATUSES }, dataCriacao: { gte: desde } },
    select: { dataCriacao: true, valor: true },
  });

  return meses.map((m) => ({
    mes: m.label,
    anunciosPublicados: publicados.filter((a) => a.dataCriacao >= m.start && a.dataCriacao < m.end).length,
    anunciosConcluidos: vendidos.filter((a) => a.dataAtualizacao >= m.start && a.dataAtualizacao < m.end).length,
    financeiroRecebido: pagos
      .filter((l) => l.dataPagamento && l.dataPagamento >= m.start && l.dataPagamento < m.end)
      .reduce((sum, l) => sum + Number(l.valor), 0),
    financeiroPendente: pendentes
      .filter((l) => l.dataCriacao >= m.start && l.dataCriacao < m.end)
      .reduce((sum, l) => sum + Number(l.valor), 0),
  }));
}

async function calcularJanela(anuncianteId: number, dias: number) {
  const fimAtual = new Date();
  const inicioAtual = new Date(fimAtual.getTime() - dias * 86400000);
  const inicioAnterior = new Date(inicioAtual.getTime() - dias * 86400000);

  // Sequential — see the note in calcularSerieMensal about the 3-connection pool.
  const novosAtual = await prisma.anuncios.count({ where: { anuncianteId, dataCriacao: { gte: inicioAtual, lt: fimAtual } } });
  const novosAnterior = await prisma.anuncios.count({ where: { anuncianteId, dataCriacao: { gte: inicioAnterior, lt: inicioAtual } } });
  const visAtual = await prisma.anuncioVisualizados.count({ where: { anuncio: { anuncianteId }, dataCriacao: { gte: inicioAtual, lt: fimAtual } } });
  const visAnterior = await prisma.anuncioVisualizados.count({ where: { anuncio: { anuncianteId }, dataCriacao: { gte: inicioAnterior, lt: inicioAtual } } });
  const vendasAtual = await prisma.reservas_anuncio.count({ where: { status: "ativa", anuncio: { anuncianteId }, dataReserva: { gte: inicioAtual, lt: fimAtual } } });
  const vendasAnterior = await prisma.reservas_anuncio.count({ where: { status: "ativa", anuncio: { anuncianteId }, dataReserva: { gte: inicioAnterior, lt: inicioAtual } } });
  const fatAtual = await prisma.lancamentos_financeiros.aggregate({ _sum: { valor: true }, where: { anuncianteId, status: "pago", dataPagamento: { gte: inicioAtual, lt: fimAtual } } });
  const fatAnterior = await prisma.lancamentos_financeiros.aggregate({ _sum: { valor: true }, where: { anuncianteId, status: "pago", dataPagamento: { gte: inicioAnterior, lt: inicioAtual } } });
  const anunciosAtivos = await prisma.anuncios.count({ where: { anuncianteId, isActive: true } });
  const porCategoriaQtd = await prisma.anuncios.groupBy({
    by: ["categoria"],
    where: { anuncianteId, dataCriacao: { gte: inicioAtual, lt: fimAtual } },
    _count: { _all: true },
  });
  const porCategoriaValor = await prisma.anuncios.groupBy({
    by: ["categoria"],
    where: { anuncianteId, status: "vendido", dataAtualizacao: { gte: inicioAtual, lt: fimAtual } },
    _sum: { preco: true },
  });
  const topVistosRaw = await prisma.anuncioVisualizados.groupBy({
    by: ["anuncioId"],
    where: { anuncio: { anuncianteId }, dataCriacao: { gte: inicioAtual, lt: fimAtual } },
    _count: { _all: true },
    orderBy: { _count: { anuncioId: "desc" } },
    take: 5,
  });
  const topVendidosRaw = await prisma.reservas_anuncio.groupBy({
    by: ["anuncioId"],
    where: { status: "ativa", anuncio: { anuncianteId }, dataReserva: { gte: inicioAtual, lt: fimAtual } },
    _count: { _all: true },
    orderBy: { _count: { anuncioId: "desc" } },
    take: 5,
  });

  const anuncioIds = Array.from(new Set([
    ...topVistosRaw.map((r) => r.anuncioId),
    ...topVendidosRaw.map((r) => r.anuncioId),
  ]));
  const titulos = anuncioIds.length
    ? await prisma.anuncios.findMany({ where: { id: { in: anuncioIds } }, select: { id: true, titulo: true } })
    : [];
  const tituloDe = (id: number) => titulos.find((t) => t.id === id)?.titulo || "Anúncio removido";

  return {
    kpis: {
      novosAnuncios: novosAtual,
      novosAnunciosAnterior: novosAnterior,
      visualizacoes: visAtual,
      visualizacoesAnterior: visAnterior,
      vendas: vendasAtual,
      vendasAnterior: vendasAnterior,
      faturamentoRecebido: Number(fatAtual._sum.valor || 0),
      faturamentoRecebidoAnterior: Number(fatAnterior._sum.valor || 0),
      anunciosAtivos,
    },
    porCategoriaQtd: porCategoriaQtd
      .filter((c) => c.categoria)
      .map((c) => ({ categoria: c.categoria as string, quantidade: c._count._all })),
    porCategoriaValor: porCategoriaValor
      .filter((c) => c.categoria)
      .map((c) => ({ categoria: c.categoria as string, valor: Number(c._sum.preco || 0) })),
    topVistos: topVistosRaw.map((r) => ({ anuncioId: r.anuncioId, titulo: tituloDe(r.anuncioId), quantidade: r._count._all })),
    topVendidos: topVendidosRaw.map((r) => ({ anuncioId: r.anuncioId, titulo: tituloDe(r.anuncioId), quantidade: r._count._all })),
  };
}

export async function gerarDashboardCache(anuncianteId: number) {
  // Sequential — see the note in calcularSerieMensal about the 3-connection pool.
  const mensal = await calcularSerieMensal(anuncianteId);
  const porPeriodo: Record<string, unknown> = {};
  for (const dias of PERIODOS) {
    porPeriodo[String(dias)] = await calcularJanela(anuncianteId, dias);
  }

  const dados = { mensal, porPeriodo };
  const dadosJson = dados as unknown as Prisma.InputJsonValue;

  await prisma.dashboard_cache.upsert({
    where: { anuncianteId },
    update: { dados: dadosJson, geradoEm: new Date() },
    create: { anuncianteId, dados: dadosJson },
  });

  return dados;
}

export const obterDashboard: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    let cache = await prisma.dashboard_cache.findUnique({ where: { anuncianteId } });
    if (!cache) {
      const dados = await gerarDashboardCache(anuncianteId);
      cache = await prisma.dashboard_cache.findUnique({ where: { anuncianteId } });
    }

    res.json({ success: true, data: cache!.dados, geradoEm: cache!.geradoEm });
  } catch (error) {
    console.error("[obterDashboard]", error);
    res.status(500).json({ error: "Erro ao buscar dashboard" });
  }
};

export const reprocessarDashboard: RequestHandler = async (req, res) => {
  try {
    const anuncianteId = parseInt(req.params.anuncianteId as string);
    if (!(await podeGerenciarAnunciante(req.userId!, req.userType, anuncianteId))) {
      return res.status(403).json({ error: "Acesso negado a este anunciante" });
    }

    const dados = await gerarDashboardCache(anuncianteId);
    res.json({ success: true, data: dados, geradoEm: new Date() });
  } catch (error) {
    console.error("[reprocessarDashboard]", error);
    res.status(500).json({ error: "Erro ao reprocessar dashboard" });
  }
};

// Combines already-cached per-anunciante blobs for "Todos os meus anunciantes" — never
// touches anuncios/lancamentos_financeiros directly, so it stays cheap regardless of period.
export const obterDashboardSomatorio: RequestHandler = async (req, res) => {
  try {
    const idsParam = (req.query.anuncianteIds as string) || "";
    const anuncianteIds = idsParam.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));
    if (anuncianteIds.length === 0) {
      return res.status(400).json({ error: "anuncianteIds é obrigatório" });
    }

    for (const id of anuncianteIds) {
      if (!(await podeGerenciarAnunciante(req.userId!, req.userType, id))) {
        return res.status(403).json({ error: "Acesso negado a um dos anunciantes informados" });
      }
    }

    // Sequential — see the note in calcularSerieMensal about the 3-connection pool
    // (only matters when one or more of these anunciantes still needs a first-time generate).
    const caches: any[] = [];
    for (const id of anuncianteIds) {
      const existing = await prisma.dashboard_cache.findUnique({ where: { anuncianteId: id } });
      caches.push(existing ? (existing.dados as any) : await gerarDashboardCache(id));
    }

    const mesesBase = (caches[0]?.mensal || []).map((m: any) => m.mes);
    const mensal = mesesBase.map((mes: string, i: number) => ({
      mes,
      anunciosPublicados: caches.reduce((sum, c) => sum + (c.mensal[i]?.anunciosPublicados || 0), 0),
      anunciosConcluidos: caches.reduce((sum, c) => sum + (c.mensal[i]?.anunciosConcluidos || 0), 0),
      financeiroRecebido: caches.reduce((sum, c) => sum + (c.mensal[i]?.financeiroRecebido || 0), 0),
      financeiroPendente: caches.reduce((sum, c) => sum + (c.mensal[i]?.financeiroPendente || 0), 0),
    }));

    const porPeriodo: Record<string, unknown> = {};
    PERIODOS.forEach((dias) => {
      const key = String(dias);
      const janelas = caches.map((c) => c.porPeriodo[key]);
      const somaCategoria = (campo: "porCategoriaQtd" | "porCategoriaValor", valorCampo: "quantidade" | "valor") => {
        const mapa = new Map<string, number>();
        janelas.forEach((j) => (j[campo] || []).forEach((c: any) => mapa.set(c.categoria, (mapa.get(c.categoria) || 0) + c[valorCampo])));
        return Array.from(mapa.entries()).map(([categoria, v]) => ({ categoria, [valorCampo]: v }));
      };
      const somaTop = (campo: "topVistos" | "topVendidos") => {
        const mapa = new Map<number, { anuncioId: number; titulo: string; quantidade: number }>();
        janelas.forEach((j) => (j[campo] || []).forEach((t: any) => {
          const atual = mapa.get(t.anuncioId);
          mapa.set(t.anuncioId, { anuncioId: t.anuncioId, titulo: t.titulo, quantidade: (atual?.quantidade || 0) + t.quantidade });
        }));
        return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
      };

      porPeriodo[key] = {
        kpis: {
          novosAnuncios: janelas.reduce((s, j) => s + j.kpis.novosAnuncios, 0),
          novosAnunciosAnterior: janelas.reduce((s, j) => s + j.kpis.novosAnunciosAnterior, 0),
          visualizacoes: janelas.reduce((s, j) => s + j.kpis.visualizacoes, 0),
          visualizacoesAnterior: janelas.reduce((s, j) => s + j.kpis.visualizacoesAnterior, 0),
          vendas: janelas.reduce((s, j) => s + j.kpis.vendas, 0),
          vendasAnterior: janelas.reduce((s, j) => s + j.kpis.vendasAnterior, 0),
          faturamentoRecebido: janelas.reduce((s, j) => s + j.kpis.faturamentoRecebido, 0),
          faturamentoRecebidoAnterior: janelas.reduce((s, j) => s + j.kpis.faturamentoRecebidoAnterior, 0),
          anunciosAtivos: janelas.reduce((s, j) => s + j.kpis.anunciosAtivos, 0),
        },
        porCategoriaQtd: somaCategoria("porCategoriaQtd", "quantidade"),
        porCategoriaValor: somaCategoria("porCategoriaValor", "valor"),
        topVistos: somaTop("topVistos"),
        topVendidos: somaTop("topVendidos"),
      };
    });

    res.json({ success: true, data: { mensal, porPeriodo } });
  } catch (error) {
    console.error("[obterDashboardSomatorio]", error);
    res.status(500).json({ error: "Erro ao somar dashboards" });
  }
};

// Called periodically by server/lib/scheduler.ts to keep every active anunciante's
// cache fresh without any user having to open the dashboard first.
export async function atualizarDashboardCacheDeTodos() {
  try {
    const anunciantes = await prisma.anunciantes.findMany({
      where: { OR: [{ anuncios: { some: {} } }, { lancamentos_financeiros: { some: {} } }] },
      select: { id: true },
    });

    let atualizados = 0;
    for (const a of anunciantes) {
      try {
        await gerarDashboardCache(a.id);
        atualizados++;
      } catch (err) {
        console.error(`[atualizarDashboardCacheDeTodos] Erro no anunciante ${a.id}:`, err);
      }
    }

    console.log(`[atualizarDashboardCacheDeTodos] ${atualizados}/${anunciantes.length} cache(s) atualizado(s)`);
    return { success: true, atualizados };
  } catch (error) {
    console.error("[atualizarDashboardCacheDeTodos] Erro:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Usuarios (usracessos) section of /admin/dashboard. usracessos is a small table (unlike
// the anuncios/lancamentos data the per-anunciante dashboard aggregates), so a single
// findMany + in-memory bucketing is enough — no need for the dashboard_cache/sequential-query
// dance calcularSerieMensal uses.
export const obterEstatisticasUsuarios: RequestHandler = async (_req, res) => {
  try {
    const usuarios = await prisma.usracessos.findMany({
      select: { dataCriacao: true, status: true },
    });

    const meses = ultimosMeses(12);
    const inicioMesAtual = meses[meses.length - 1].start;

    const serieMensal = meses.map((m) => ({
      mes: m.label,
      novos: usuarios.filter((u) => u.dataCriacao >= m.start && u.dataCriacao < m.end).length,
    }));

    res.json({
      success: true,
      data: {
        total: usuarios.length,
        novosNoMes: usuarios.filter((u) => u.dataCriacao >= inicioMesAtual).length,
        ativos: usuarios.filter((u) => u.status === "ativo").length,
        bloqueados: usuarios.filter((u) => u.status === "bloqueado").length,
        serieMensal,
      },
    });
  } catch (error) {
    console.error("[obterEstatisticasUsuarios] Erro:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas de usuários" });
  }
}
