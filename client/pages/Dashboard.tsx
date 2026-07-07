import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MessageCircle,
  Calendar,
  DollarSign,
  Package,
  Settings,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import {
  renderLineChart,
  renderPieChart,
  renderRankBars,
  fmtInt,
  fmtBRL,
  fmtCompact,
} from "@/lib/dashboardCharts";

interface Anunciante {
  id: number;
  nome: string;
}

interface MesDado {
  mes: string;
  anunciosPublicados: number;
  anunciosConcluidos: number;
  financeiroRecebido: number;
  financeiroPendente: number;
}

interface Janela {
  kpis: {
    novosAnuncios: number;
    novosAnunciosAnterior: number;
    visualizacoes: number;
    visualizacoesAnterior: number;
    vendas: number;
    vendasAnterior: number;
    faturamentoRecebido: number;
    faturamentoRecebidoAnterior: number;
    anunciosAtivos: number;
  };
  porCategoriaQtd: { categoria: string; quantidade: number }[];
  porCategoriaValor: { categoria: string; valor: number }[];
  topVistos: { anuncioId: number; titulo: string; quantidade: number }[];
  topVendidos: { anuncioId: number; titulo: string; quantidade: number }[];
}

interface DashboardData {
  mensal: MesDado[];
  porPeriodo: Record<string, Janela>;
}

const PERIODOS = [
  { dias: 7, label: "7 dias" },
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 365, label: "Este ano" },
];

const CAT_PALETTE = ["#0071CE", "#128C3F", "#B45309", "#9333EA", "#D92D20", "#EA580C"];
function corDaCategoria(idx: number) {
  return CAT_PALETTE[idx % CAT_PALETTE.length];
}

function pctDelta(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

function Delta({ atual, anterior, suffix }: { atual: number; anterior: number; suffix: string }) {
  const pct = pctDelta(atual, anterior);
  const up = pct >= 0;
  return (
    <div className={`text-xs font-semibold mt-1 ${up ? "text-vitrii-green" : "text-vitrii-red"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% {suffix}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState(30);
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<number | "all" | null>(null);

  const { data: anunciantes = [] } = useQuery<Anunciante[]>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch("/api/anunciantes/do-usuario/listar");
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (anunciantes.length > 0 && selectedAnuncianteId === null) {
      setSelectedAnuncianteId(anunciantes.length > 1 ? "all" : anunciantes[0].id);
    }
  }, [anunciantes, selectedAnuncianteId]);

  const anuncianteIdsKey = anunciantes.map((a) => a.id).join(",");

  const { data: dashboardResp, isLoading: dashboardLoading, refetch } = useQuery<{
    data: DashboardData;
    geradoEm: string | null;
  }>({
    queryKey: ["dashboard-data", selectedAnuncianteId, anuncianteIdsKey],
    queryFn: async () => {
      if (selectedAnuncianteId === "all") {
        const response = await fetch(`/api/dashboard/somatorio?anuncianteIds=${anuncianteIdsKey}`);
        if (!response.ok) throw new Error("Erro ao buscar dashboard");
        const result = await response.json();
        return { data: result.data, geradoEm: null };
      }
      const response = await fetch(`/api/dashboard/${selectedAnuncianteId}`);
      if (!response.ok) throw new Error("Erro ao buscar dashboard");
      const result = await response.json();
      return { data: result.data, geradoEm: result.geradoEm };
    },
    enabled: selectedAnuncianteId !== null && (selectedAnuncianteId !== "all" || anunciantes.length > 0),
  });

  const reprocessarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnuncianteId || selectedAnuncianteId === "all") return;
      const response = await fetch(`/api/dashboard/${selectedAnuncianteId}/reprocessar`, { method: "POST" });
      if (!response.ok) throw new Error("Erro ao reprocessar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Dashboard atualizado!");
      refetch();
    },
    onError: () => toast.error("Erro ao reprocessar dashboard"),
  });

  // Lightweight, always-live counts (unrelated to the heavy cached aggregation above —
  // these are cheap single-row lookups, not anuncios/lancamentos aggregation).
  const { data: messagesData } = useQuery<{ data: { unreadCount: number } }>({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/mensagens/unread-count", { headers: { "X-User-Id": user?.id?.toString() || "" } });
      if (!response.ok) throw new Error("Erro ao buscar mensagens");
      return response.json();
    },
    enabled: !!user?.id,
  });
  const { data: appointmentsData } = useQuery<{ data: { count: number } }>({
    queryKey: ["pending-appointments", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/reservas-evento/pending-count", { headers: { "X-User-Id": user?.id?.toString() || "" } });
      if (!response.ok) throw new Error("Erro ao buscar agendamentos");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const janela = dashboardResp?.data?.porPeriodo?.[String(periodo)];
  const mensal = dashboardResp?.data?.mensal || [];

  const [resizeTick, setResizeTick] = useState(0);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setResizeTick((n) => n + 1), 150); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);

  const lineAnunciosRef = useRef<HTMLDivElement>(null);
  const lineFinanceiroRef = useRef<HTMLDivElement>(null);
  const pieQtdRef = useRef<HTMLDivElement>(null);
  const pieValorRef = useRef<HTMLDivElement>(null);
  const rankVistosRef = useRef<HTMLDivElement>(null);
  const rankVendidosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mensal.length) return;
    if (lineAnunciosRef.current) {
      renderLineChart(
        lineAnunciosRef.current,
        mensal.map((m) => m.mes),
        [
          { name: "Publicados", color: "#0071CE", values: mensal.map((m) => m.anunciosPublicados) },
          { name: "Concluídos", color: "#128C3F", values: mensal.map((m) => m.anunciosConcluidos) },
        ],
        fmtInt,
      );
    }
    if (lineFinanceiroRef.current) {
      renderLineChart(
        lineFinanceiroRef.current,
        mensal.map((m) => m.mes),
        [
          { name: "Recebido", color: "#0071CE", values: mensal.map((m) => m.financeiroRecebido) },
          { name: "Pendente", color: "#B45309", values: mensal.map((m) => m.financeiroPendente) },
        ],
        fmtBRL,
      );
    }
  }, [mensal, resizeTick]);

  useEffect(() => {
    if (!janela) return;
    if (pieQtdRef.current) {
      renderPieChart(
        pieQtdRef.current,
        janela.porCategoriaQtd.map((c, i) => ({ name: c.categoria, value: c.quantidade, color: corDaCategoria(i) })),
        fmtInt,
      );
    }
    if (pieValorRef.current) {
      renderPieChart(
        pieValorRef.current,
        janela.porCategoriaValor.map((c, i) => ({ name: c.categoria, value: c.valor, color: corDaCategoria(i) })),
        fmtBRL,
      );
    }
    if (rankVistosRef.current) {
      renderRankBars(
        rankVistosRef.current,
        janela.topVistos.map((t) => ({ name: t.titulo, value: t.quantidade })),
        "#0071CE",
        fmtInt,
      );
    }
    if (rankVendidosRef.current) {
      renderRankBars(
        rankVendidosRef.current,
        janela.topVendidos.map((t) => ({ name: t.titulo, value: t.quantidade })),
        "#128C3F",
        fmtInt,
      );
    }
  }, [janela, resizeTick]);

  const geradoEmLabel = dashboardResp?.geradoEm
    ? `Atualizado ${new Date(dashboardResp.geradoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-vitrii-text">Olá, {user?.nome}! 👋</h1>
          <p className="text-vitrii-text-secondary mt-1">
            Visão geral de agenda, financeiro e anúncios num só lugar.
          </p>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 mb-6 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-vitrii-text-secondary">Período</span>
          <div className="flex gap-1.5 flex-wrap">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                onClick={() => setPeriodo(p.dias)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  periodo === p.dias
                    ? "bg-vitrii-blue text-white"
                    : "text-vitrii-text-secondary border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {anunciantes.length > 1 && (
            <>
              <div className="w-px self-stretch bg-gray-200 mx-1" />
              <span className="text-xs font-bold uppercase tracking-wide text-vitrii-text-secondary">Anunciante</span>
              <select
                value={selectedAnuncianteId === "all" ? "all" : selectedAnuncianteId || ""}
                onChange={(e) => setSelectedAnuncianteId(e.target.value === "all" ? "all" : parseInt(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold"
              >
                <option value="all">Todos os meus anunciantes</option>
                {anunciantes.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </>
          )}

          <div className="flex-1" />
          {geradoEmLabel && <span className="text-xs text-vitrii-text-secondary">{geradoEmLabel}</span>}
          {selectedAnuncianteId !== "all" && (
            <button
              onClick={() => reprocessarMutation.mutate()}
              disabled={reprocessarMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-vitrii-text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reprocessarMutation.isPending ? "animate-spin" : ""}`} />
              Reprocessar agora
            </button>
          )}
        </div>

        {dashboardLoading || !janela ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vitrii-blue" />
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-vitrii-text-secondary mb-1">Anúncios ativos</p>
                <p className="text-2xl font-bold text-vitrii-text">{fmtInt(janela.kpis.anunciosAtivos)}</p>
                <Delta atual={janela.kpis.novosAnuncios} anterior={janela.kpis.novosAnunciosAnterior} suffix="novos no período" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-vitrii-text-secondary mb-1">Visualizações</p>
                <p className="text-2xl font-bold text-vitrii-text">{fmtCompact(janela.kpis.visualizacoes)}</p>
                <Delta atual={janela.kpis.visualizacoes} anterior={janela.kpis.visualizacoesAnterior} suffix="vs período anterior" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-vitrii-text-secondary mb-1">Vendas</p>
                <p className="text-2xl font-bold text-vitrii-text">{fmtInt(janela.kpis.vendas)}</p>
                <Delta atual={janela.kpis.vendas} anterior={janela.kpis.vendasAnterior} suffix="vs período anterior" />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <p className="text-xs font-semibold text-vitrii-text-secondary mb-1">Faturamento recebido</p>
                <p className="text-2xl font-bold text-vitrii-text">{fmtBRL(janela.kpis.faturamentoRecebido)}</p>
                <Delta atual={janela.kpis.faturamentoRecebido} anterior={janela.kpis.faturamentoRecebidoAnterior} suffix="vs período anterior" />
              </div>
            </div>

            {/* Quick access */}
            <h2 className="text-sm font-bold text-vitrii-text mb-3">Acessar</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Link to="/minha-agenda" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="font-bold text-sm text-vitrii-text">Agenda</h3>
                <p className="text-xs text-vitrii-text-secondary mt-0.5">
                  {appointmentsData?.data?.count ?? 0} agendamento(s) pendente(s)
                </p>
              </Link>
              <Link to="/financeiro" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                  <DollarSign className="w-4 h-4 text-vitrii-blue" />
                </div>
                <h3 className="font-bold text-sm text-vitrii-text">Financeiro</h3>
                <p className="text-xs text-vitrii-text-secondary mt-0.5">
                  {fmtBRL(janela.kpis.faturamentoRecebido)} recebidos no período
                </p>
              </Link>
              <Link to="/meus-anuncios" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center mb-2">
                  <Package className="w-4 h-4 text-vitrii-green" />
                </div>
                <h3 className="font-bold text-sm text-vitrii-text">Anúncios</h3>
                <p className="text-xs text-vitrii-text-secondary mt-0.5">
                  {fmtInt(janela.kpis.anunciosAtivos)} ativos
                </p>
              </Link>
              <Link to="/cadastro-contatos" className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-2">
                  <Settings className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-bold text-sm text-vitrii-text">Cadastros</h3>
                <p className="text-xs text-vitrii-text-secondary mt-0.5">Contatos, produtos, equipe</p>
              </Link>
            </div>

            {/* Line charts */}
            <h2 className="text-sm font-bold text-vitrii-text mb-3">
              Ao longo do tempo <span className="font-normal text-vitrii-text-secondary">— últimos 6 meses</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Anúncios</h3>
                <p className="text-xs text-vitrii-text-secondary mb-2">Publicados × concluídos por mês</p>
                <div className="flex gap-4 text-xs text-vitrii-text-secondary mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vitrii-blue inline-block" />Publicados</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vitrii-green inline-block" />Concluídos</span>
                </div>
                <div ref={lineAnunciosRef} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Financeiro</h3>
                <p className="text-xs text-vitrii-text-secondary mb-2">Recebido × pendente por mês (R$)</p>
                <div className="flex gap-4 text-xs text-vitrii-text-secondary mb-1">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vitrii-blue inline-block" />Recebido</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-vitrii-warning inline-block" />Pendente</span>
                </div>
                <div ref={lineFinanceiroRef} />
              </div>
            </div>

            {/* Pie charts */}
            <h2 className="text-sm font-bold text-vitrii-text mb-3">Anúncios × Produtos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Anúncios por categoria</h3>
                <p className="text-xs text-vitrii-text-secondary mb-2">Participação em quantidade</p>
                <div ref={pieQtdRef} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Valor por categoria</h3>
                <p className="text-xs text-vitrii-text-secondary mb-2">Anúncios vendidos no período, por categoria</p>
                <div ref={pieValorRef} />
              </div>
            </div>

            {/* Rankings */}
            <h2 className="text-sm font-bold text-vitrii-text mb-3">
              Visitas × Vendas <span className="font-normal text-vitrii-text-secondary">— top 5 anúncios no período</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Mais visualizados</h3>
                <div ref={rankVistosRef} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-sm text-vitrii-text mb-1">Mais vendidos</h3>
                <div ref={rankVendidosRef} />
              </div>
            </div>

            <Link to="/chat" className="inline-flex items-center gap-1.5 text-sm text-vitrii-blue font-semibold hover:underline">
              <MessageCircle className="w-4 h-4" />
              {messagesData?.data?.unreadCount ?? 0} mensagem(ns) não lida(s)
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
