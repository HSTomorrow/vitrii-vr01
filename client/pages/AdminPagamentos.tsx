import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  X,
} from "lucide-react";
import { useState } from "react";

interface Pagamento {
  id: number;
  anuncioId: number;
  valor: number;
  status: string;
  dataCriacao: string;
  dataPagamento?: string;
  anuncio?: {
    id: number;
    titulo: string;
    imagem?: string;
    anunciantes?: { nome: string };
  };
}

export default function AdminPagamentos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("pendente");
  const [expandedPayment, setExpandedPayment] = useState<number | null>(null);

  // Check if user is admin
  const isAdmin = user?.tipoUsuario === "adm";

  // Fetch pagamentos with filtering
  const { data: pagamentosData, isLoading } = useQuery({
    queryKey: ["admin-pagamentos", filterStatus],
    queryFn: async () => {
      const response = await fetch(
        `/api/pagamentos?status=${filterStatus || "all"}`,
      );
      if (!response.ok) throw new Error("Erro ao buscar pagamentos");
      return response.json();
    },
    enabled: isAdmin,
  });

  const pagamentos: Pagamento[] = pagamentosData?.data || [];

  // Confirm payment mutation
  const confirmarPagamentoMutation = useMutation({
    mutationFn: async (pagamentoId: number) => {
      const response = await fetch(`/api/pagamentos/${pagamentoId}/confirmar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao confirmar pagamento");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success("✓ Pagamento confirmado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-pagamentos"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao confirmar pagamento",
      );
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 inline-block">
            <p className="text-vitrii-text">
              Você não tem permissão para acessar essa página.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vitrii-text mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-vitrii-blue" />
            Gerenciar Pagamentos
          </h1>
          <p className="text-vitrii-text-secondary">
            Confirme os pagamentos pendentes dos anúncios
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {[
            { value: "pendente", label: "Pendentes", icon: Clock },
            { value: "comprovante_enviado", label: "Comprovante Enviado", icon: AlertCircle },
            { value: "aguardando_confirmacao_pagamento", label: "Aguardando Confirmação", icon: Clock },
            { value: "aprovado", label: "Aprovados", icon: CheckCircle },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 font-semibold flex items-center gap-2 border-b-2 transition-colors ${
                filterStatus === value
                  ? "text-vitrii-blue border-vitrii-blue"
                  : "text-vitrii-text-secondary border-transparent hover:text-vitrii-text"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin">
              <div className="w-8 h-8 border-4 border-vitrii-blue border-t-transparent rounded-full" />
            </div>
            <p className="text-vitrii-text-secondary mt-4">
              Carregando pagamentos...
            </p>
          </div>
        )}

        {/* Pagamentos List */}
        {!isLoading && pagamentos.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-vitrii-text-secondary text-lg">
              Nenhum pagamento encontrado neste filtro
            </p>
          </div>
        )}

        {!isLoading && pagamentos.length > 0 && (
          <div className="space-y-4">
            {pagamentos.map((pagamento) => (
              <div
                key={pagamento.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div
                  onClick={() =>
                    setExpandedPayment(
                      expandedPayment === pagamento.id ? null : pagamento.id,
                    )
                  }
                  className="cursor-pointer"
                >
                  {/* Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Anuncio Image */}
                      {pagamento.anuncio?.imagem && (
                        <img
                          src={pagamento.anuncio.imagem}
                          alt={pagamento.anuncio.titulo}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}

                      {/* Anuncio Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-vitrii-text mb-1">
                          {pagamento.anuncio?.titulo || "Anúncio"}
                        </h3>
                        <p className="text-sm text-vitrii-text-secondary">
                          {pagamento.anuncio?.anunciantes?.nome || "Anunciante desconhecido"}
                        </p>
                        <p className="text-xs text-vitrii-text-secondary mt-1">
                          ID Pagamento: #{pagamento.id} | ID Anúncio: #{pagamento.anuncioId}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {pagamento.status === "pendente" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            Pendente
                          </div>
                        )}
                        {pagamento.status === "comprovante_enviado" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                            <AlertCircle className="w-4 h-4" />
                            Comprovante Enviado
                          </div>
                        )}
                        {pagamento.status === "aguardando_confirmacao_pagamento" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                            <Clock className="w-4 h-4" />
                            Aguardando Confirmação
                          </div>
                        )}
                        {pagamento.status === "aprovado" && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Aprovado
                          </div>
                        )}
                      </div>

                      {/* Valor */}
                      <div className="text-right min-w-[120px]">
                        <p className="text-2xl font-bold text-vitrii-blue">
                          R$ {Number(pagamento.valor).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <button className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      {expandedPayment === pagamento.id ? (
                        <X className="w-5 h-5 text-gray-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-vitrii-blue" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedPayment === pagamento.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-vitrii-text-secondary">
                          Data de Criação
                        </p>
                        <p className="font-semibold text-vitrii-text">
                          {new Date(pagamento.dataCriacao).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>

                      {pagamento.dataPagamento && (
                        <div>
                          <p className="text-sm text-vitrii-text-secondary">
                            Data de Pagamento
                          </p>
                          <p className="font-semibold text-vitrii-text">
                            {new Date(pagamento.dataPagamento).toLocaleDateString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm text-vitrii-text-secondary">
                          Status Atual
                        </p>
                        <p className="font-semibold text-vitrii-text capitalize">
                          {pagamento.status.replace(/_/g, " ")}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-vitrii-text-secondary">
                          Valor
                        </p>
                        <p className="font-bold text-vitrii-blue">
                          R$ {Number(pagamento.valor).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {pagamento.status !== "aprovado" && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() =>
                            confirmarPagamentoMutation.mutate(pagamento.id)
                          }
                          disabled={confirmarPagamentoMutation.isPending}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          {confirmarPagamentoMutation.isPending
                            ? "Confirmando..."
                            : "Confirmar Pagamento"}
                        </button>
                      </div>
                    )}

                    {pagamento.status === "aprovado" && (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-sm text-green-800 font-semibold">
                          Pagamento confirmado e anúncio ativado
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
