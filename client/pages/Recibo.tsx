import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

interface ReciboData {
  anuncianteNome: string;
  contatoNome: string;
  valor: number;
  descricao?: string;
  categoria: string;
  dataPagamento: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  servico: "Serviço",
  multa: "Multa",
  venda_material: "Venda de Material",
  hora_extra: "Hora Extra",
  mensalidade: "Mensalidade",
  outro: "Outro",
};

export default function Recibo() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery<ReciboData>({
    queryKey: ["recibo", token],
    queryFn: async () => {
      const response = await fetch(`/api/lancamentos-financeiros/recibo/${token}`);
      if (!response.ok) throw new Error("Recibo não encontrado");
      const result = await response.json();
      return result.data;
    },
    enabled: !!token,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-vitrii-gray-light flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8 print:shadow-none">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-vitrii-blue">Vitrii</h1>
          <p className="text-sm text-vitrii-text-secondary">Recibo de Pagamento</p>
        </div>

        {isLoading && <p className="text-center text-vitrii-text-secondary py-8">Carregando...</p>}

        {isError && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-vitrii-red mx-auto mb-3" />
            <p className="text-vitrii-text">Recibo não encontrado.</p>
          </div>
        )}

        {data && (
          <>
            <div className="text-center mb-6">
              <CheckCircle className="w-14 h-14 text-vitrii-green mx-auto mb-3" />
              <p className="text-3xl font-bold text-vitrii-text">{formatCurrencyDisplay(data.valor)}</p>
              <p className="text-sm text-vitrii-text-secondary mt-1">Pagamento confirmado</p>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-vitrii-text-secondary">Recebido por</span>
                <span className="font-semibold text-vitrii-text">{data.anuncianteNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-vitrii-text-secondary">Pago por</span>
                <span className="font-semibold text-vitrii-text">{data.contatoNome}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-vitrii-text-secondary">Categoria</span>
                <span className="font-semibold text-vitrii-text">
                  {CATEGORIA_LABELS[data.categoria] || data.categoria}
                </span>
              </div>
              {data.descricao && (
                <div className="flex justify-between text-sm">
                  <span className="text-vitrii-text-secondary">Descrição</span>
                  <span className="font-semibold text-vitrii-text text-right">{data.descricao}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-vitrii-text-secondary">Data</span>
                <span className="font-semibold text-vitrii-text">
                  {new Date(data.dataPagamento).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full mt-6 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-vitrii-text hover:bg-gray-50 transition-colors print:hidden"
            >
              Imprimir
            </button>
          </>
        )}
      </div>
    </div>
  );
}
