import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { DollarSign, Plus, Check, X, Copy, FileText, Share2, Mail, Download, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContatoSelectorModal from "@/components/ContatoSelectorModal";
import ShareModal from "@/components/ShareModal";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";
import { exportToCsv } from "@/utils/exportCsv";

interface Anunciante {
  id: number;
  nome: string;
}

interface Lancamento {
  id: number;
  origem: string;
  categoria: string;
  descricao?: string;
  valor: string;
  status: string;
  competencia?: string;
  vencimento?: string;
  dataPagamento?: string;
  qrCode?: string;
  urlCopiaECola?: string;
  reciboToken?: string;
  contato?: { id: number; nome: string; email?: string; celular?: string };
  evento?: { id: number; titulo: string };
}

interface Contrato {
  id: number;
  titulo: string;
  descricao?: string;
  tipoContrato: string;
  valorMensal: string;
  diaVencimento: number;
  status: string;
  contato: { id: number; nome: string };
}

const TIPOS_CONTRATO = ["Mensal", "Semanal", "Eventual", "Outros"];

function currentMonthValue(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-vitrii-warning/10 text-vitrii-warning" },
  pix_gerado: { label: "Pix Gerado", className: "bg-vitrii-info/10 text-vitrii-info" },
  comprovante_enviado: { label: "Comprovante Enviado", className: "bg-vitrii-info/10 text-vitrii-info" },
  pago: { label: "Pago", className: "bg-vitrii-green/10 text-vitrii-green" },
  cancelado: { label: "Cancelado", className: "bg-vitrii-red/10 text-vitrii-red" },
};

const CATEGORIA_LABELS: Record<string, string> = {
  servico: "Serviço",
  multa: "Multa",
  venda_material: "Venda de Material",
  hora_extra: "Hora Extra",
  mensalidade: "Mensalidade",
  outro: "Outro",
};

export default function Financeiro() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAnuncianteId, setSelectedAnuncianteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"lancamentos" | "contratos">("lancamentos");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompetencia, setFilterCompetencia] = useState(currentMonthValue());
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");
  const [filterContatoId, setFilterContatoId] = useState<number | null>(null);
  const [showNovoLancamento, setShowNovoLancamento] = useState(false);
  const [showNovoContrato, setShowNovoContrato] = useState(false);
  const [showContatoSelector, setShowContatoSelector] = useState(false);
  const [shareTarget, setShareTarget] = useState<Lancamento | null>(null);
  const [novoLancamento, setNovoLancamento] = useState({
    categoria: "multa",
    descricao: "",
    valor: "",
    contatoId: null as number | null,
    contatoNome: "",
  });
  const [novoContrato, setNovoContrato] = useState({
    titulo: "",
    tipoContrato: "Mensal",
    valorMensal: "",
    diaVencimento: "10",
    contatoId: null as number | null,
    contatoNome: "",
    dataInicio: new Date().toISOString().split("T")[0],
  });
  const [loteMode, setLoteMode] = useState(false);
  const [selectedContratoIds, setSelectedContratoIds] = useState<number[]>([]);
  const [contratoFiltroTitulo, setContratoFiltroTitulo] = useState("");
  const [contratoFiltroDiaDe, setContratoFiltroDiaDe] = useState("");
  const [contratoFiltroDiaAte, setContratoFiltroDiaAte] = useState("");

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

  const { data: contatosDisponiveis = [] } = useQuery<Array<{ id: number; nome: string }>>({
    queryKey: ["contatos-financeiro", selectedAnuncianteId],
    queryFn: async () => {
      const response = await fetch("/api/contatos");
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId,
  });

  const nomeDoContato = (id: number | null) => contatosDisponiveis.find((c) => c.id === id)?.nome || "";

  useMemo(() => {
    if (anunciantes.length > 0 && !selectedAnuncianteId) {
      setSelectedAnuncianteId(anunciantes[0].id);
    }
  }, [anunciantes, selectedAnuncianteId]);

  const { data: lancamentos = [], refetch: refetchLancamentos } = useQuery<Lancamento[]>({
    queryKey: ["lancamentos-financeiros", selectedAnuncianteId, filterStatus, filterCompetencia],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterCompetencia) params.set("competencia", filterCompetencia);
      const response = await fetch(
        `/api/lancamentos-financeiros/anunciante/${selectedAnuncianteId}?${params}`,
      );
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId,
  });

  const lancamentosFiltrados = useMemo(() => {
    return lancamentos.filter((l) => {
      if (filterDataDe && (!l.vencimento || l.vencimento.slice(0, 10) < filterDataDe)) return false;
      if (filterDataAte && (!l.vencimento || l.vencimento.slice(0, 10) > filterDataAte)) return false;
      if (filterContatoId && l.contato?.id !== filterContatoId) return false;
      return true;
    });
  }, [lancamentos, filterDataDe, filterDataAte, filterContatoId]);

  const limparFiltrosLancamentos = () => {
    setFilterStatus("");
    setFilterCompetencia("");
    setFilterDataDe("");
    setFilterDataAte("");
    setFilterContatoId(null);
  };

  const { data: contratos = [], refetch: refetchContratos } = useQuery<Contrato[]>({
    queryKey: ["contratos-financeiros", selectedAnuncianteId, contratoFiltroTitulo, contratoFiltroDiaDe, contratoFiltroDiaAte],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const params = new URLSearchParams();
      if (contratoFiltroTitulo) params.set("titulo", contratoFiltroTitulo);
      if (contratoFiltroDiaDe) params.set("diaVencimentoDe", contratoFiltroDiaDe);
      if (contratoFiltroDiaAte) params.set("diaVencimentoAte", contratoFiltroDiaAte);
      const response = await fetch(`/api/contratos-financeiros/anunciante/${selectedAnuncianteId}?${params}`);
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId,
  });

  const resumo = useMemo(() => {
    const pendente = lancamentosFiltrados
      .filter((l) => ["pendente", "pix_gerado", "comprovante_enviado"].includes(l.status))
      .reduce((sum, l) => sum + parseFloat(l.valor), 0);
    const hoje = new Date();
    const recebidoNoMes = lancamentosFiltrados
      .filter(
        (l) =>
          l.status === "pago" &&
          l.dataPagamento &&
          new Date(l.dataPagamento).getMonth() === hoje.getMonth() &&
          new Date(l.dataPagamento).getFullYear() === hoje.getFullYear(),
      )
      .reduce((sum, l) => sum + parseFloat(l.valor), 0);
    const vencido = lancamentosFiltrados.filter(
      (l) => l.status !== "pago" && l.status !== "cancelado" && l.vencimento && new Date(l.vencimento) < hoje,
    ).length;
    return { pendente, recebidoNoMes, vencido };
  }, [lancamentosFiltrados]);

  const criarLancamentoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/lancamentos-financeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncianteId: selectedAnuncianteId,
          origem: "avulso",
          categoria: novoLancamento.categoria,
          descricao: novoLancamento.descricao,
          valor: parseFloat(novoLancamento.valor),
          contatoId: novoLancamento.contatoId,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar lançamento");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento criado!");
      setShowNovoLancamento(false);
      setNovoLancamento({ categoria: "multa", descricao: "", valor: "", contatoId: null, contatoNome: "" });
      refetchLancamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar lançamento"),
  });

  const criarContratoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/contratos-financeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncianteId: selectedAnuncianteId,
          contatoId: novoContrato.contatoId,
          titulo: novoContrato.titulo,
          tipoContrato: novoContrato.tipoContrato,
          valorMensal: parseFloat(novoContrato.valorMensal),
          diaVencimento: parseInt(novoContrato.diaVencimento),
          dataInicio: novoContrato.dataInicio,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar contrato");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Contrato criado!");
      setShowNovoContrato(false);
      setNovoContrato({ titulo: "", tipoContrato: "Mensal", valorMensal: "", diaVencimento: "10", contatoId: null, contatoNome: "", dataInicio: new Date().toISOString().split("T")[0] });
      refetchContratos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar contrato"),
  });

  const lancarMesMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/contratos-financeiros/${id}/lancar`, { method: "POST" });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao lançar mês");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Lançamento processado");
      refetchLancamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao lançar mês"),
  });

  const lancarLoteMutation = useMutation({
    mutationFn: async (contratoIds: number[]) => {
      const response = await fetch("/api/contratos-financeiros/lancar-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contratoIds }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao lançar lote");
      return response.json();
    },
    onSuccess: (data) => {
      const { gerados, jaExistentes, erros } = data.data;
      toast.success(`${gerados} lançado(s), ${jaExistentes} já existente(s)${erros ? `, ${erros} erro(s)` : ""}`);
      setSelectedContratoIds([]);
      setLoteMode(false);
      refetchLancamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao lançar lote"),
  });

  const gerarPixMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/lancamentos-financeiros/${id}/pix`, { method: "POST" });
      if (!response.ok) throw new Error("Erro ao gerar Pix");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Código Pix gerado!");
      refetchLancamentos();
    },
    onError: () => toast.error("Erro ao gerar Pix"),
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/lancamentos-financeiros/${id}/pagar`, { method: "PATCH" });
      if (!response.ok) throw new Error("Erro ao marcar como pago");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento marcado como pago! Recibo disponível para compartilhar.");
      refetchLancamentos();
    },
    onError: () => toast.error("Erro ao marcar como pago"),
  });

  const cancelarMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/lancamentos-financeiros/${id}/cancelar`, { method: "PATCH" });
      if (!response.ok) throw new Error("Erro ao cancelar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento cancelado");
      refetchLancamentos();
    },
    onError: () => toast.error("Erro ao cancelar lançamento"),
  });

  const enviarReciboEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/lancamentos-financeiros/${id}/enviar-recibo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ via: "email" }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao enviar email");
      return response.json();
    },
    onSuccess: () => toast.success("Recibo enviado por email!"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao enviar recibo"),
  });

  const copiarPix = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Código Pix copiado!");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 py-12 text-center text-vitrii-text-secondary">
          Faça login para acessar o financeiro.
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-8 h-8 text-vitrii-blue" />
          <h1 className="text-3xl font-bold text-vitrii-text">Financeiro</h1>
        </div>

        {anunciantes.length > 1 && (
          <select
            value={selectedAnuncianteId || ""}
            onChange={(e) => setSelectedAnuncianteId(parseInt(e.target.value))}
            className="mb-6 px-4 py-2 border border-gray-300 rounded-lg"
          >
            {anunciantes.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-vitrii-warning/10 rounded-lg border border-vitrii-warning/20">
            <p className="text-sm text-vitrii-text-secondary">Pendente</p>
            <p className="text-2xl font-bold text-vitrii-warning">{formatCurrencyDisplay(resumo.pendente)}</p>
          </div>
          <div className="p-4 bg-vitrii-green/10 rounded-lg border border-vitrii-green/20">
            <p className="text-sm text-vitrii-text-secondary">Recebido no Mês</p>
            <p className="text-2xl font-bold text-vitrii-green">{formatCurrencyDisplay(resumo.recebidoNoMes)}</p>
          </div>
          <div className="p-4 bg-vitrii-red/10 rounded-lg border border-vitrii-red/20">
            <p className="text-sm text-vitrii-text-secondary">Vencidos</p>
            <p className="text-2xl font-bold text-vitrii-red">{resumo.vencido}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(["lancamentos", "contratos"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-vitrii-blue text-vitrii-blue"
                  : "border-transparent text-vitrii-text-secondary hover:text-vitrii-text"
              }`}
            >
              {tab === "lancamentos" ? "Lançamentos" : "Contratos"}
            </button>
          ))}
        </div>

        {activeTab === "lancamentos" && (
          <div>
            <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todos os status</option>
                  {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Competência</label>
                <input
                  type="month"
                  value={filterCompetencia}
                  onChange={(e) => setFilterCompetencia(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Vencimento de</label>
                <input
                  type="date"
                  value={filterDataDe}
                  onChange={(e) => setFilterDataDe(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">até</label>
                <input
                  type="date"
                  value={filterDataAte}
                  onChange={(e) => setFilterDataAte(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Cliente</label>
                <select
                  value={filterContatoId ?? ""}
                  onChange={(e) => setFilterContatoId(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Todos</option>
                  {contatosDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={limparFiltrosLancamentos}
                className="px-3 py-2 text-sm text-vitrii-text-secondary hover:text-vitrii-text underline"
              >
                Limpar filtros
              </button>
              <div className="flex-1" />
              <button
                onClick={() =>
                  exportToCsv(
                    `lancamentos-${selectedAnuncianteId}.csv`,
                    lancamentosFiltrados,
                    [
                      { header: "Data", value: (l) => new Date(l.vencimento || "").toLocaleDateString("pt-BR") || "" },
                      { header: "Cliente", value: (l) => l.contato?.nome || "" },
                      { header: "Categoria", value: (l) => CATEGORIA_LABELS[l.categoria] || l.categoria },
                      { header: "Origem", value: (l) => l.origem },
                      { header: "Valor", value: (l) => l.valor },
                      { header: "Status", value: (l) => STATUS_LABELS[l.status]?.label || l.status },
                    ],
                  )
                }
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <button
                onClick={() => setShowNovoLancamento(true)}
                className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Lançamento
              </button>
            </div>

            <div className="space-y-3">
              {lancamentosFiltrados.length === 0 ? (
                <p className="text-center text-vitrii-text-secondary py-12">Nenhum lançamento encontrado</p>
              ) : (
                lancamentosFiltrados.map((l) => {
                  const statusInfo = STATUS_LABELS[l.status] || STATUS_LABELS.pendente;
                  return (
                    <div key={l.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-vitrii-text">
                            {CATEGORIA_LABELS[l.categoria] || l.categoria}
                            {l.contato && <span className="text-vitrii-text-secondary"> · {l.contato.nome}</span>}
                          </p>
                          {l.descricao && <p className="text-sm text-vitrii-text-secondary">{l.descricao}</p>}
                          {l.evento && <p className="text-xs text-vitrii-info">Agenda: {l.evento.titulo}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                          <span className="font-bold text-vitrii-text">{formatCurrencyDisplay(parseFloat(l.valor))}</span>
                        </div>
                      </div>

                      {l.qrCode && l.status !== "pago" && l.status !== "cancelado" && (
                        <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="bg-white p-2 rounded border border-gray-200 flex-shrink-0">
                            <QRCodeSVG value={l.qrCode} size={96} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-vitrii-text-secondary mb-1">Escaneie ou copie o código Pix</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 truncate text-xs">{l.urlCopiaECola}</code>
                              <button onClick={() => copiarPix(l.urlCopiaECola!)} className="text-vitrii-blue flex-shrink-0">
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        {["pendente", "pix_gerado"].includes(l.status) && (
                          <button
                            onClick={() => gerarPixMutation.mutate(l.id)}
                            className="text-xs px-3 py-1.5 border border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50"
                          >
                            Gerar Pix
                          </button>
                        )}
                        {l.status !== "pago" && l.status !== "cancelado" && (
                          <>
                            <button
                              onClick={() => marcarPagoMutation.mutate(l.id)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-vitrii-green text-white rounded-lg hover:opacity-90"
                            >
                              <Check className="w-3.5 h-3.5" /> Marcar Pago
                            </button>
                            <button
                              onClick={() => cancelarMutation.mutate(l.id)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-vitrii-red text-vitrii-red rounded-lg hover:bg-red-50"
                            >
                              <X className="w-3.5 h-3.5" /> Cancelar
                            </button>
                          </>
                        )}
                        {l.status === "pago" && l.reciboToken && (
                          <>
                            <button
                              onClick={() => setShareTarget(l)}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-vitrii-info text-vitrii-info rounded-lg hover:bg-cyan-50"
                            >
                              <Share2 className="w-3.5 h-3.5" /> Compartilhar Recibo
                            </button>
                            {l.contato?.email && (
                              <button
                                onClick={() => enviarReciboEmailMutation.mutate(l.id)}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50"
                              >
                                <Mail className="w-3.5 h-3.5" /> Enviar por Email
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "contratos" && (
          <div>
            <div className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Título</label>
                <input
                  type="text"
                  value={contratoFiltroTitulo}
                  onChange={(e) => setContratoFiltroTitulo(e.target.value)}
                  placeholder="Buscar por título..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">Vencimento dia de</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={contratoFiltroDiaDe}
                  onChange={(e) => setContratoFiltroDiaDe(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-vitrii-text-secondary mb-1">até</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={contratoFiltroDiaAte}
                  onChange={(e) => setContratoFiltroDiaAte(e.target.value)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1" />
              <button
                onClick={() =>
                  exportToCsv(
                    `contratos-${selectedAnuncianteId}.csv`,
                    contratos,
                    [
                      { header: "Título", value: (c) => c.titulo },
                      { header: "Cliente", value: (c) => c.contato.nome },
                      { header: "Tipo", value: (c) => c.tipoContrato },
                      { header: "Valor Mensal", value: (c) => c.valorMensal },
                      { header: "Dia Vencimento", value: (c) => c.diaVencimento },
                      { header: "Status", value: (c) => c.status },
                    ],
                  )
                }
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
              <button
                onClick={() => {
                  setLoteMode(!loteMode);
                  setSelectedContratoIds([]);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  loteMode
                    ? "bg-vitrii-blue text-white"
                    : "border border-vitrii-blue text-vitrii-blue hover:bg-blue-50"
                }`}
              >
                <Zap className="w-4 h-4" />
                Lançamento em Lote
              </button>
              <button
                onClick={() => setShowNovoContrato(true)}
                className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Contrato
              </button>
            </div>

            {loteMode && (
              <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-blue-50 border border-vitrii-blue/20 rounded-lg">
                <p className="text-sm text-vitrii-text">
                  {selectedContratoIds.length} contrato(s) selecionado(s)
                </p>
                <button
                  onClick={() => lancarLoteMutation.mutate(selectedContratoIds)}
                  disabled={selectedContratoIds.length === 0 || lancarLoteMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  Lançar Selecionados
                </button>
              </div>
            )}

            <div className="space-y-3">
              {contratos.length === 0 ? (
                <p className="text-center text-vitrii-text-secondary py-12">Nenhum contrato cadastrado</p>
              ) : (
                contratos.map((c) => (
                  <div key={c.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        {loteMode && (
                          <input
                            type="checkbox"
                            className="mt-1.5"
                            checked={selectedContratoIds.includes(c.id)}
                            onChange={(e) => {
                              setSelectedContratoIds((prev) =>
                                e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                              );
                            }}
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-vitrii-text">{c.titulo}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-vitrii-info/10 text-vitrii-info">
                              {c.tipoContrato}
                            </span>
                          </div>
                          <p className="text-sm text-vitrii-text-secondary">Cliente: {c.contato.nome}</p>
                          <p className="text-sm text-vitrii-text-secondary">Vencimento: dia {c.diaVencimento}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-vitrii-text">{formatCurrencyDisplay(parseFloat(c.valorMensal))}/mês</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-vitrii-green/10 text-vitrii-green">
                          {c.status}
                        </span>
                      </div>
                    </div>
                    {!loteMode && (
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => lancarMesMutation.mutate(c.id)}
                          disabled={lancarMesMutation.isPending}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Zap className="w-3.5 h-3.5" /> Lançar Mês
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Novo Lançamento */}
      {showNovoLancamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-vitrii-text">Novo Lançamento</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Categoria</label>
              <select
                value={novoLancamento.categoria}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="multa">Multa</option>
                <option value="venda_material">Venda de Material</option>
                <option value="hora_extra">Hora Extra</option>
                <option value="servico">Serviço</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Cliente (opcional)</label>
              <button
                type="button"
                onClick={() => setShowContatoSelector(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm"
              >
                {novoLancamento.contatoNome || "Selecionar cliente..."}
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Descrição</label>
              <input
                type="text"
                value={novoLancamento.descricao}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={novoLancamento.valor}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNovoLancamento(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarLancamentoMutation.mutate()}
                disabled={!novoLancamento.valor || criarLancamentoMutation.isPending}
                className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Contrato */}
      {showNovoContrato && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-vitrii-text">Novo Contrato</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Cliente</label>
              <button
                type="button"
                onClick={() => setShowContatoSelector(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm"
              >
                {novoContrato.contatoNome || "Selecionar cliente..."}
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Título</label>
              <input
                type="text"
                value={novoContrato.titulo}
                onChange={(e) => setNovoContrato({ ...novoContrato, titulo: e.target.value })}
                placeholder="Ex: Mensalidade academia"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo de Contrato</label>
              <select
                value={novoContrato.tipoContrato}
                onChange={(e) => setNovoContrato({ ...novoContrato, tipoContrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {TIPOS_CONTRATO.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Valor Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                value={novoContrato.valorMensal}
                onChange={(e) => setNovoContrato({ ...novoContrato, valorMensal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="28"
                value={novoContrato.diaVencimento}
                onChange={(e) => setNovoContrato({ ...novoContrato, diaVencimento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Início</label>
              <input
                type="date"
                value={novoContrato.dataInicio}
                onChange={(e) => setNovoContrato({ ...novoContrato, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNovoContrato(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarContratoMutation.mutate()}
                disabled={!novoContrato.titulo || !novoContrato.valorMensal || !novoContrato.contatoId || criarContratoMutation.isPending}
                className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      <ContatoSelectorModal
        isOpen={showContatoSelector}
        onClose={() => setShowContatoSelector(false)}
        onSelect={(contatoId) => {
          // Both modals share the selector; whichever is open receives the pick.
          if (showNovoContrato) {
            setNovoContrato({ ...novoContrato, contatoId, contatoNome: nomeDoContato(contatoId) });
          } else {
            setNovoLancamento({ ...novoLancamento, contatoId, contatoNome: nomeDoContato(contatoId) });
          }
          setShowContatoSelector(false);
        }}
        selectedContatoIds={[]}
        anuncianteId={selectedAnuncianteId || undefined}
        userId={user?.id}
      />

      {shareTarget && (
        <ShareModal
          isOpen={!!shareTarget}
          onClose={() => setShareTarget(null)}
          title="Compartilhar Recibo"
          url={`${window.location.origin}/recibo/${shareTarget.reciboToken}`}
          whatsappPhone={shareTarget.contato?.celular}
          whatsappMessage={`Aqui está o recibo do seu pagamento de ${formatCurrencyDisplay(parseFloat(shareTarget.valor))}:`}
        />
      )}

      <Footer />
    </div>
  );
}
