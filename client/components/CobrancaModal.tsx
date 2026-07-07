import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, MessageCircle, Clock } from "lucide-react";

interface MensagemCobranca {
  id: number;
  texto: string;
  dataEnvio: string;
}

interface CobrancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lancamentoId: number;
  contatoNome: string;
  contatoCelular: string;
  textoInicial: string;
}

export default function CobrancaModal({
  isOpen,
  onClose,
  lancamentoId,
  contatoNome,
  contatoCelular,
  textoInicial,
}: CobrancaModalProps) {
  const queryClient = useQueryClient();
  const [texto, setTexto] = useState(textoInicial);

  const { data: historico = [] } = useQuery<MensagemCobranca[]>({
    queryKey: ["lancamento-mensagens", lancamentoId],
    queryFn: async () => {
      const response = await fetch(`/api/lancamentos-financeiros/${lancamentoId}/mensagens`);
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    },
    enabled: isOpen,
  });

  const registrarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/lancamentos-financeiros/${lancamentoId}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Erro ao registrar mensagem");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamento-mensagens", lancamentoId] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao registrar mensagem"),
  });

  if (!isOpen) return null;

  const handleEnviar = () => {
    if (!texto.trim()) {
      toast.error("Escreva uma mensagem antes de enviar");
      return;
    }
    const celular = contatoCelular.replace(/\D/g, "");
    const url = `https://wa.me/55${celular}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    registrarMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full mx-4 sm:mx-0 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="pr-8">
          <h2 className="text-xl font-bold text-vitrii-text">Histórico de Cobrança</h2>
          <p className="text-sm text-vitrii-text-secondary mt-1">{contatoNome}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Mensagem</label>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
          />
        </div>

        <button
          onClick={handleEnviar}
          disabled={registrarMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar via WhatsApp
        </button>

        {historico.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-vitrii-text-secondary mb-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Envios anteriores
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {historico.map((m) => (
                <div key={m.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                  <p className="text-xs text-vitrii-text-secondary mb-1">
                    {new Date(m.dataEnvio).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-vitrii-text break-words">{m.texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
