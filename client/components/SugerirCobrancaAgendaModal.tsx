import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, DollarSign, FileText, Loader } from "lucide-react";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

const TIPOS_CONTRATO = ["Mensal", "Semanal", "Eventual", "Outros"];

interface SugerirCobrancaAgendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventoId: number;
  anuncianteId: number;
  contatoId: number;
  titulo: string;
  valor: number;
}

type Step = "choice" | "contrato";

export default function SugerirCobrancaAgendaModal({
  open,
  onOpenChange,
  eventoId,
  anuncianteId,
  contatoId,
  titulo,
  valor,
}: SugerirCobrancaAgendaModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("choice");

  const { data: contatoNome = "este cliente" } = useQuery({
    queryKey: ["contato-nome", contatoId],
    queryFn: async () => {
      const response = await fetch("/api/contatos");
      if (!response.ok) return "este cliente";
      const result = await response.json();
      const contato = (result.data || []).find((c: any) => c.id === contatoId);
      return contato?.nome || "este cliente";
    },
    enabled: open,
  });
  const [tipoContrato, setTipoContrato] = useState("Mensal");
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (open) {
      setStep("choice");
      setTipoContrato("Mensal");
      setDiaVencimento("10");
      setDataInicio(new Date().toISOString().split("T")[0]);
    }
  }, [open]);

  // If this event already has a linked lançamento (e.g. the user already used the
  // manual "Gerar Cobrança" button), the suggestion is moot — close immediately.
  const { data: lancamentoExistente, isLoading: isCheckingExistente } = useQuery({
    queryKey: ["lancamento-evento", eventoId],
    queryFn: async () => {
      const response = await fetch(`/api/lancamentos-financeiros/evento/${eventoId}`);
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    },
    enabled: open,
  });

  const criarLancamentoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/lancamentos-financeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncianteId,
          eventoId,
          contatoId,
          origem: "agenda",
          categoria: "servico",
          descricao: titulo,
          valor,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar lançamento");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Lançamento criado! Veja em Financeiro.");
      queryClient.invalidateQueries({ queryKey: ["lancamento-evento", eventoId] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar lançamento"),
  });

  const criarContratoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/contratos-financeiros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncianteId,
          contatoId,
          titulo,
          tipoContrato,
          valorMensal: valor,
          diaVencimento: parseInt(diaVencimento),
          dataInicio,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao criar contrato");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Contrato criado! Veja em Financeiro.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao criar contrato"),
  });

  if (!open || isCheckingExistente || lancamentoExistente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-vitrii-text">
            {step === "choice" ? "Cobrar por este evento?" : "Criar Contrato"}
          </h2>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-vitrii-text-secondary">
            "{titulo}" tem valor de {formatCurrencyDisplay(valor)} para{" "}
            <span className="font-semibold text-vitrii-text">{contatoNome}</span>. Deseja gerar uma
            cobrança no Financeiro?
          </p>

          {step === "choice" && (
            <div className="space-y-3">
              <button
                onClick={() => criarLancamentoMutation.mutate()}
                disabled={criarLancamentoMutation.isPending}
                className="w-full flex items-start gap-3 px-4 py-3 border-2 border-vitrii-blue/30 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 text-left"
              >
                <DollarSign className="w-5 h-5 text-vitrii-blue mt-0.5 flex-shrink-0" />
                <span>
                  <span className="block font-semibold text-vitrii-text">
                    {criarLancamentoMutation.isPending ? "Criando..." : "Lançamento Direto"}
                  </span>
                  <span className="block text-xs text-vitrii-text-secondary">
                    Gera uma cobrança avulsa só para este evento.
                  </span>
                </span>
              </button>

              <button
                onClick={() => setStep("contrato")}
                className="w-full flex items-start gap-3 px-4 py-3 border-2 border-vitrii-info/30 hover:bg-cyan-50 rounded-lg transition-colors text-left"
              >
                <FileText className="w-5 h-5 text-vitrii-info mt-0.5 flex-shrink-0" />
                <span>
                  <span className="block font-semibold text-vitrii-text">Criar Contrato</span>
                  <span className="block text-xs text-vitrii-text-secondary">
                    Para cobranças recorrentes deste cliente, todo mês.
                  </span>
                </span>
              </button>

              <button
                onClick={() => onOpenChange(false)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Agora não
              </button>
            </div>
          )}

          {step === "contrato" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Tipo de Contrato</label>
                <select
                  value={tipoContrato}
                  onChange={(e) => setTipoContrato(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {TIPOS_CONTRATO.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Dia do Vencimento</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={diaVencimento}
                  onChange={(e) => setDiaVencimento(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep("choice")}
                  disabled={criarContratoMutation.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  onClick={() => criarContratoMutation.mutate()}
                  disabled={criarContratoMutation.isPending}
                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {criarContratoMutation.isPending ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Contrato"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
