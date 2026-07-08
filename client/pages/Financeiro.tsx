import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { DollarSign, Plus, Check, X, Copy, FileText, Share2, Mail, Download, Zap, Lock, Unlock, Pencil, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContatoSelectorModal from "@/components/ContatoSelectorModal";
import ShareModal from "@/components/ShareModal";
import CobrancaModal from "@/components/CobrancaModal";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";
import { exportToCsv } from "@/utils/exportCsv";
import { exportToXlsx } from "@/utils/exportXlsx";

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
  tipoPagamento?: string;
  contaBanco?: string;
  dataCriacao: string;
  contato?: { id: number; nome: string; email?: string; celular?: string };
  evento?: { id: number; titulo: string };
}

interface Fechamento {
  competencia: string;
  fechado: boolean;
  dataFechamento: string;
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

const ORIGEM_LABELS: Record<string, string> = {
  avulso: "Manual",
  contrato: "Contrato",
  mensalidade: "Contrato",
  agenda: "Agenda",
  anuncio: "Anúncio",
};

const TIPOS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "deposito", label: "Depósito" },
  { value: "outros", label: "Outros" },
];

function competenciaDeLancamento(l: Lancamento): string {
  if (l.competencia) return l.competencia;
  const base = new Date(l.vencimento || l.dataCriacao);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}`;
}

function templateCobranca(l: Lancamento): string {
  const nome = l.contato?.nome || "Cliente";
  const valor = formatCurrencyDisplay(parseFloat(l.valor));
  const venc = l.vencimento ? new Date(l.vencimento).toLocaleDateString("pt-BR") : "não definido";
  return `Olá ${nome}, lembramos que o pagamento de ${valor} referente a "${l.descricao || CATEGORIA_LABELS[l.categoria] || l.categoria}" está pendente. Vencimento: ${venc}.`;
}

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
  const [cobrancaTarget, setCobrancaTarget] = useState<Lancamento | null>(null);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
  const [editForm, setEditForm] = useState({ descricao: "", valor: "", vencimento: "", tipoPagamento: "pix", contaBanco: "" });
  const [novoLancamento, setNovoLancamento] = useState({
    categoria: "multa",
    descricao: "",
    valor: "",
    contatoId: null as number | null,
    contatoNome: "",
    tipoPagamento: "pix",
    contaBanco: "",
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

  // The floating "+" button (PublishButton/BottomNavBar) dispatches this while on
  // /financeiro instead of navigating to ad creation — same pattern as MinhaAgenda's "addEvento".
  useEffect(() => {
    const handleNovoLancamentoEvent = () => {
      setActiveTab("lancamentos");
      setShowNovoLancamento(true);
    };
    window.addEventListener("novoLancamento", handleNovoLancamentoEvent);
    return () => window.removeEventListener("novoLancamento", handleNovoLancamentoEvent);
  }, []);

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

  const { data: fechamentos = [], refetch: refetchFechamentos } = useQuery<Fechamento[]>({
    queryKey: ["fechamentos-financeiros", selectedAnuncianteId],
    queryFn: async () => {
      if (!selectedAnuncianteId) return [];
      const response = await fetch(`/api/financeiro/fechamentos/${selectedAnuncianteId}`);
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: !!selectedAnuncianteId,
  });

  const competenciaFechada = !!filterCompetencia && fechamentos.some((f) => f.competencia === filterCompetencia);

  const isLancamentoFechado = (l: Lancamento) =>
    fechamentos.some((f) => f.competencia === competenciaDeLancamento(l));

  const fecharMesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/financeiro/fechamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncianteId: selectedAnuncianteId, competencia: filterCompetencia }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao fechar mês");
      return response.json();
    },
    onSuccess: () => {
      toast.success(`Mês ${filterCompetencia} fechado`);
      refetchFechamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao fechar mês"),
  });

  const reabrirMesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/financeiro/fechamentos/reabrir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncianteId: selectedAnuncianteId, competencia: filterCompetencia }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao reabrir mês");
      return response.json();
    },
    onSuccess: () => {
      toast.success(`Mês ${filterCompetencia} reaberto`);
      refetchFechamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao reabrir mês"),
  });

  const editarLancamentoMutation = useMutation({
    mutationFn: async () => {
      if (!editingLancamento) throw new Error("Nenhum lançamento selecionado");
      const response = await fetch(`/api/lancamentos-financeiros/${editingLancamento.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: editForm.descricao,
          valor: parseFloat(editForm.valor),
          vencimento: editForm.vencimento || null,
          tipoPagamento: editForm.tipoPagamento,
          contaBanco: editForm.contaBanco,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao editar lançamento");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento atualizado!");
      setEditingLancamento(null);
      refetchLancamentos();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao editar lançamento"),
  });

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
          tipoPagamento: novoLancamento.tipoPagamento,
          contaBanco: novoLancamento.contaBanco,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar lançamento");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento criado!");
      setShowNovoLancamento(false);
      setNovoLancamento({ categoria: "multa", descricao: "", valor: "", contatoId: null, contatoNome: "", tipoPagamento: "pix", contaBanco: "" });
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
            {/* Fechamento Mensal: deliberately its own full-width banner (not just another
                filter field) so the closing routine is easy to find, not buried among the
                other filters. */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 mb-4 p-4 rounded-lg border-2 ${
                competenciaFechada
                  ? "bg-vitrii-warning/10 border-vitrii-warning/30"
                  : "bg-blue-50 border-vitrii-blue/20"
              }`}
            >
              <div className="flex items-center gap-2">
                {competenciaFechada ? (
                  <Lock className="w-5 h-5 text-vitrii-warning flex-shrink-0" />
                ) : (
                  <Unlock className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
                )}
                <div>
                  <p className="font-bold text-vitrii-text">Fechamento Mensal</p>
                  <p className="text-sm text-vitrii-text-secondary">
                    {filterCompetencia
                      ? competenciaFechada
                        ? `O mês ${filterCompetencia} está fechado — os lançamentos não podem ser alterados.`
                        : `O mês ${filterCompetencia} está aberto para edição.`
                      : "Selecione uma competência no filtro abaixo para gerenciar o fechamento."}
                  </p>
                </div>
              </div>
              {filterCompetencia && (
                competenciaFechada ? (
                  <button
                    onClick={() => reabrirMesMutation.mutate()}
                    disabled={reabrirMesMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-vitrii-warning text-white rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    <Unlock className="w-4 h-4" /> Reabrir Mês
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (confirm(`Fechar o mês ${filterCompetencia}? Os lançamentos desta competência não poderão mais ser alterados até que o mês seja reaberto.`)) {
                        fecharMesMutation.mutate();
                      }
                    }}
                    disabled={fecharMesMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" /> Fechar Mês
                  </button>
                )
              )}
            </div>

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
              {(() => {
                const colunasExport = [
                  { header: "Data", value: (l: Lancamento) => (l.vencimento ? new Date(l.vencimento).toLocaleDateString("pt-BR") : "") },
                  { header: "Cliente", value: (l: Lancamento) => l.contato?.nome || "" },
                  { header: "Categoria", value: (l: Lancamento) => CATEGORIA_LABELS[l.categoria] || l.categoria },
                  { header: "Origem", value: (l: Lancamento) => ORIGEM_LABELS[l.origem] || l.origem },
                  { header: "Valor", value: (l: Lancamento) => l.valor },
                  { header: "Tipo de Pagamento", value: (l: Lancamento) => TIPOS_PAGAMENTO.find((t) => t.value === l.tipoPagamento)?.label || l.tipoPagamento || "" },
                  { header: "Conta/Banco", value: (l: Lancamento) => l.contaBanco || "" },
                  { header: "Status", value: (l: Lancamento) => STATUS_LABELS[l.status]?.label || l.status },
                ];
                return (
                  <>
                    <button
                      onClick={() => exportToCsv(`lancamentos-${selectedAnuncianteId}.csv`, lancamentosFiltrados, colunasExport)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={() => exportToXlsx(`lancamentos-${selectedAnuncianteId}.xlsx`, lancamentosFiltrados, colunasExport)}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Exportar XLS
                    </button>
                  </>
                );
              })()}
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
                  const fechado = isLancamentoFechado(l);
                  return (
                    <div key={l.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-vitrii-text">
                              {CATEGORIA_LABELS[l.categoria] || l.categoria}
                              {l.contato && <span className="text-vitrii-text-secondary"> · {l.contato.nome}</span>}
                            </p>
                            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-gray-100 text-vitrii-text-secondary font-semibold">
                              {ORIGEM_LABELS[l.origem] || l.origem}
                            </span>
                            {fechado && (
                              <span className="flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded-full bg-vitrii-warning/10 text-vitrii-warning font-semibold">
                                <Lock className="w-3 h-3" /> Mês Fechado
                              </span>
                            )}
                          </div>
                          {l.descricao && <p className="text-sm text-vitrii-text-secondary">{l.descricao}</p>}
                          {l.evento && <p className="text-xs text-vitrii-info">Agenda: {l.evento.titulo}</p>}
                          <p className="text-xs text-vitrii-text-secondary mt-0.5">
                            {TIPOS_PAGAMENTO.find((t) => t.value === l.tipoPagamento)?.label || "Pix"}
                            {l.contaBanco && ` · ${l.contaBanco}`}
                          </p>
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
                        <button
                          onClick={() => {
                            setEditingLancamento(l);
                            setEditForm({
                              descricao: l.descricao || "",
                              valor: l.valor,
                              vencimento: l.vencimento ? l.vencimento.slice(0, 10) : "",
                              tipoPagamento: l.tipoPagamento || "pix",
                              contaBanco: l.contaBanco || "",
                            });
                          }}
                          disabled={fechado}
                          title={fechado ? "Mês fechado" : undefined}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        {l.contato?.celular && (
                          <button
                            onClick={() => setCobrancaTarget(l)}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 border border-green-500 text-green-600 rounded-lg hover:bg-green-50"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Cobrança
                          </button>
                        )}
                        {["pendente", "pix_gerado"].includes(l.status) && (
                          <button
                            onClick={() => gerarPixMutation.mutate(l.id)}
                            disabled={fechado}
                            title={fechado ? "Mês fechado" : undefined}
                            className="text-xs px-3 py-1.5 border border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Gerar Pix
                          </button>
                        )}
                        {l.status !== "pago" && l.status !== "cancelado" && (
                          <>
                            <button
                              onClick={() => marcarPagoMutation.mutate(l.id)}
                              disabled={fechado}
                              title={fechado ? "Mês fechado" : undefined}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-vitrii-green text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Check className="w-3.5 h-3.5" /> Marcar Pago
                            </button>
                            <button
                              onClick={() => cancelarMutation.mutate(l.id)}
                              disabled={fechado}
                              title={fechado ? "Mês fechado" : undefined}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 border border-vitrii-red text-vitrii-red rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo de Pagamento</label>
              <select
                value={novoLancamento.tipoPagamento}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, tipoPagamento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {TIPOS_PAGAMENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Conta/Banco (opcional)</label>
              <input
                type="text"
                value={novoLancamento.contaBanco}
                onChange={(e) => setNovoLancamento({ ...novoLancamento, contaBanco: e.target.value })}
                placeholder="Ex: Banco do Brasil - CC 12345"
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

      {/* Modal: Editar Lançamento */}
      {editingLancamento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-vitrii-text">Editar Lançamento</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Descrição</label>
              <input
                type="text"
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={editForm.valor}
                onChange={(e) => setEditForm({ ...editForm, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Vencimento</label>
              <input
                type="date"
                value={editForm.vencimento}
                onChange={(e) => setEditForm({ ...editForm, vencimento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Tipo de Pagamento</label>
              <select
                value={editForm.tipoPagamento}
                onChange={(e) => setEditForm({ ...editForm, tipoPagamento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {TIPOS_PAGAMENTO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Conta/Banco (opcional)</label>
              <input
                type="text"
                value={editForm.contaBanco}
                onChange={(e) => setEditForm({ ...editForm, contaBanco: e.target.value })}
                placeholder="Ex: Banco do Brasil - CC 12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingLancamento(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => editarLancamentoMutation.mutate()}
                disabled={!editForm.valor || editarLancamentoMutation.isPending}
                className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold disabled:opacity-50"
              >
                Salvar
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

      {cobrancaTarget && (
        <CobrancaModal
          isOpen={!!cobrancaTarget}
          onClose={() => setCobrancaTarget(null)}
          lancamentoId={cobrancaTarget.id}
          contatoNome={cobrancaTarget.contato?.nome || "Cliente"}
          contatoCelular={cobrancaTarget.contato?.celular || ""}
          textoInicial={templateCobranca(cobrancaTarget)}
        />
      )}

      <Footer />
    </div>
  );
}
