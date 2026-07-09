import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, DollarSign, Plus, Copy, Check, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ContatoSelectorModal from "./ContatoSelectorModal";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

interface Lancamento {
  id: number;
  categoria: string;
  descricao?: string;
  valor: string;
  status: string;
  contato?: { id: number; nome: string };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-vitrii-warning/10 text-vitrii-warning" },
  pix_gerado: { label: "Pix Gerado", className: "bg-vitrii-info/10 text-vitrii-info" },
  comprovante_enviado: { label: "Comprovante Enviado", className: "bg-vitrii-info/10 text-vitrii-info" },
  pago: { label: "Pago", className: "bg-vitrii-green/10 text-vitrii-green" },
  cancelado: { label: "Cancelado", className: "bg-vitrii-red/10 text-vitrii-red" },
};

const CATEGORIAS = [
  { value: "servico", label: "Serviço" },
  { value: "venda_material", label: "Venda de Material" },
  { value: "multa", label: "Multa" },
  { value: "hora_extra", label: "Hora Extra" },
  { value: "outro", label: "Outro" },
];

interface AnuncioFinanceiroPanelProps {
  anuncioId: number;
  anuncioTitulo: string;
  anuncianteId: number;
  userId?: number;
  statusPagamento?: string | null;
  valorAnuncio?: number;
}

export default function AnuncioFinanceiroPanel({
  anuncioId,
  anuncioTitulo,
  anuncianteId,
  userId,
  statusPagamento,
  valorAnuncio,
}: AnuncioFinanceiroPanelProps) {
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);
  const [showNovaCobranca, setShowNovaCobranca] = useState(false);
  const [showContatoSelector, setShowContatoSelector] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [novaCobranca, setNovaCobranca] = useState({
    categoria: "servico",
    descricao: "",
    valor: "",
    contatoId: null as number | null,
    contatoNome: "",
  });

  // Payment owed TO Vitrii/HeresTomorrow for publishing this ad (separate from the
  // lançamentos below, which are the anunciante billing their own clients).
  const { data: pagamentoData, refetch: refetchPagamento } = useQuery({
    queryKey: ["pagamento-anuncio", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/pagamentos/anuncio/${anuncioId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Erro ao buscar pagamento");
      return response.json();
    },
    enabled: showPanel && statusPagamento === "pendente",
  });
  const pagamentoAnuncio = pagamentoData?.data;

  const gerarPixAnuncioMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anuncioId, valor: valorAnuncio || 19.9 }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao gerar Pix");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Pix gerado! Escaneie o QR Code ou copie o código.");
      refetchPagamento();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao gerar Pix"),
  });

  const { data: lancamentosData, isLoading } = useQuery({
    queryKey: ["anuncio-lancamentos", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/lancamentos-financeiros/anuncio/${anuncioId}`);
      if (!response.ok) throw new Error("Erro ao buscar lançamentos");
      return response.json();
    },
    enabled: showPanel,
  });

  const { data: contatosDisponiveis = [] } = useQuery<Array<{ id: number; nome: string }>>({
    queryKey: ["contatos-financeiro", anuncianteId],
    queryFn: async () => {
      const response = await fetch("/api/contatos");
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: showContatoSelector,
  });

  const criarCobrancaMutation = useMutation({
    mutationFn: async () => {
      if (!novaCobranca.contatoId) throw new Error("Selecione um cliente");
      const response = await fetch("/api/lancamentos-financeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncianteId,
          anuncioId,
          contatoId: novaCobranca.contatoId,
          origem: "anuncio",
          categoria: novaCobranca.categoria,
          descricao: novaCobranca.descricao || anuncioTitulo,
          valor: parseFloat(novaCobranca.valor),
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar cobrança");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Cobrança criada! Veja em Financeiro.");
      queryClient.invalidateQueries({ queryKey: ["anuncio-lancamentos", anuncioId] });
      setShowNovaCobranca(false);
      setNovaCobranca({ categoria: "servico", descricao: "", valor: "", contatoId: null, contatoNome: "" });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar cobrança"),
  });

  const lancamentos: Lancamento[] = lancamentosData?.data || [];

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className="flex items-center gap-2 px-4 py-2 border-2 border-vitrii-blue/30 text-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm"
      >
        <DollarSign className="w-4 h-4" />
        Gestão Financeira
      </button>

      {showPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-vitrii-blue" />
                <div>
                  <h2 className="text-xl font-bold text-vitrii-text">Gestão Financeira</h2>
                  <p className="text-sm text-gray-500">{anuncioTitulo}</p>
                </div>
              </div>
              <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {statusPagamento === "pendente" && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-yellow-700" />
                    <p className="font-semibold text-yellow-900 text-sm">
                      Pagamento da publicação pendente
                    </p>
                  </div>
                  {!pagamentoAnuncio ? (
                    <>
                      <p className="text-xs text-yellow-800">
                        Gere o Pix para pagar a publicação deste anúncio à HeresTomorrow
                        {valorAnuncio ? ` (${formatCurrencyDisplay(valorAnuncio)})` : ""}.
                      </p>
                      <button
                        onClick={() => gerarPixAnuncioMutation.mutate()}
                        disabled={gerarPixAnuncioMutation.isPending}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        {gerarPixAnuncioMutation.isPending ? "Gerando..." : "Gerar Pix"}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="bg-white p-3 rounded-lg border-2 border-yellow-300">
                          <QRCodeSVG value={pagamentoAnuncio.qrCode} size={160} />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(pagamentoAnuncio.urlCopiaECola);
                          setPixCopiado(true);
                          toast.success("Código Pix copiado!");
                          setTimeout(() => setPixCopiado(false), 2000);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-yellow-300 text-yellow-900 rounded-lg font-semibold hover:bg-yellow-100 transition-colors text-sm"
                      >
                        {pixCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {pixCopiado ? "Copiado!" : "Copiar Código Pix"}
                      </button>
                      <p className="text-xs text-yellow-800 text-center">
                        Após o pagamento, envie o comprovante na tela de Meus Anúncios para
                        ativação.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowNovaCobranca(true)}
                className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Nova Cobrança
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vitrii-blue" />
                </div>
              ) : lancamentos.length === 0 ? (
                <p className="text-center text-vitrii-text-secondary py-8">Nenhuma cobrança lançada para este anúncio</p>
              ) : (
                <div className="space-y-3">
                  {lancamentos.map((l) => {
                    const statusInfo = STATUS_LABELS[l.status] || STATUS_LABELS.pendente;
                    return (
                      <div key={l.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-vitrii-text">
                              {l.contato?.nome || "Cliente"}
                            </p>
                            {l.descricao && <p className="text-sm text-vitrii-text-secondary">{l.descricao}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                            <span className="font-bold text-vitrii-text">{formatCurrencyDisplay(parseFloat(l.valor))}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-vitrii-text-secondary text-center pt-2">
                    Gerencie Pix, pagamento e recibo em Financeiro.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showNovaCobranca && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-vitrii-text">Nova Cobrança</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Cliente</label>
              <button
                type="button"
                onClick={() => setShowContatoSelector(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm"
              >
                {novaCobranca.contatoNome || "Selecionar cliente..."}
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Categoria</label>
              <select
                value={novaCobranca.categoria}
                onChange={(e) => setNovaCobranca({ ...novaCobranca, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Descrição (opcional)</label>
              <input
                type="text"
                value={novaCobranca.descricao}
                onChange={(e) => setNovaCobranca({ ...novaCobranca, descricao: e.target.value })}
                placeholder={anuncioTitulo}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={novaCobranca.valor}
                onChange={(e) => setNovaCobranca({ ...novaCobranca, valor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNovaCobranca(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => criarCobrancaMutation.mutate()}
                disabled={!novaCobranca.valor || !novaCobranca.contatoId || criarCobrancaMutation.isPending}
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
          const nome = contatosDisponiveis.find((c) => c.id === contatoId)?.nome || "";
          setNovaCobranca({ ...novaCobranca, contatoId, contatoNome: nome });
          setShowContatoSelector(false);
        }}
        selectedContatoIds={[]}
        anuncianteId={anuncianteId}
        userId={userId}
      />
    </>
  );
}
