import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Trash2, CheckCircle, AlertCircle, Users, Package } from "lucide-react";

interface ReservationUser {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  whatsapp?: string;
}

interface Reservation {
  id: number;
  usuarioId: number;
  usuario: ReservationUser;
  status: "ativa" | "cancelada";
  dataReserva: string;
  dataCancelamento?: string;
  observacao?: string;
}

interface QuantidadeInfo {
  quantidade_total: number;
  reservas_ativas: number;
  quantidade_disponivel: number;
  reservado: boolean;
  status: string;
}

interface ReservationManagementPanelProps {
  anuncioId: number;
  anuncioTitulo: string;
  isAdmin: boolean;
  userId?: number;
}

export default function ReservationManagementPanel({
  anuncioId,
  anuncioTitulo,
  isAdmin,
  userId,
}: ReservationManagementPanelProps) {
  const queryClient = useQueryClient();
  const [showPanel, setShowPanel] = useState(false);

  // Fetch quantidade info
  const { data: quantidadeData, isLoading: quantidadeLoading } = useQuery({
    queryKey: ["anuncio-quantidade", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}/quantidade-info`);
      if (!response.ok) throw new Error("Erro ao buscar quantidade");
      return response.json();
    },
    enabled: showPanel,
  });

  // Fetch reservations
  const { data: reservasData, isLoading: reservasLoading } = useQuery({
    queryKey: ["anuncio-reservas", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}/reservas`, {
        headers: {
          "x-user-id": userId?.toString() || "",
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar reservas");
      return response.json();
    },
    enabled: showPanel,
  });

  // Cancel reservation mutation
  const cancelReservaMutation = useMutation({
    mutationFn: async (usuarioId: number) => {
      const response = await fetch(
        `/api/anuncios/${anuncioId}/reservas/${anuncioId}-${usuarioId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": userId?.toString() || "",
          },
        }
      );
      if (!response.ok) throw new Error("Erro ao cancelar reserva");
      return response.json();
    },
    onSuccess: (data, usuarioId) => {
      toast.success("Reserva cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["anuncio-reservas", anuncioId] });
      queryClient.invalidateQueries({ queryKey: ["anuncio-quantidade", anuncioId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar reserva");
    },
  });

  // Mark as sold mutation
  const markAsSoldMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId?.toString() || "",
        },
        body: JSON.stringify({
          status: "vendido",
        }),
      });
      if (!response.ok) throw new Error("Erro ao marcar como vendido");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio marcado como vendido");
      setShowPanel(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar anúncio");
    },
  });

  const quantidadeInfo: QuantidadeInfo | undefined = quantidadeData?.data;
  const reservas: Reservation[] = reservasData?.data || [];
  const ativasReservas = reservas.filter((r) => r.status === "ativa");

  return (
    <>
      {/* Button to open panel */}
      {(isAdmin || !isAdmin) && (
        <button
          onClick={() => setShowPanel(true)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm"
        >
          <Users className="w-4 h-4" />
          Gerenciar Reservas ({ativasReservas.length})
        </button>
      )}

      {/* Panel Modal */}
      {showPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-vitrii-text">Gerenciar Reservas</h2>
                  <p className="text-sm text-gray-500">{anuncioTitulo}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Quantity Info Card */}
              {quantidadeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : quantidadeInfo ? (
                <div className={`rounded-lg p-4 ${quantidadeInfo.reservado ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-vitrii-text flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Informações de Disponibilidade
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-vitrii-text">
                        {quantidadeInfo.quantidade_total}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Reservadas</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {quantidadeInfo.reservas_ativas}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Disponível</p>
                      <p className="text-2xl font-bold text-green-600">
                        {quantidadeInfo.quantidade_disponivel}
                      </p>
                    </div>
                  </div>

                  {quantidadeInfo.reservado && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-semibold">Produto totalmente reservado</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Reservations List */}
              <div>
                <h3 className="font-semibold text-vitrii-text mb-4">
                  Usuários que Reservaram ({ativasReservas.length})
                </h3>

                {reservasLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : ativasReservas.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Nenhuma reserva ativa</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ativasReservas.map((reserva) => (
                      <div
                        key={reserva.id}
                        className="p-4 border border-gray-200 rounded-lg flex items-start justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="font-semibold text-vitrii-text">
                              {reserva.usuario.nome}
                            </p>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>📧 {reserva.usuario.email}</p>
                            {reserva.usuario.telefone && (
                              <p>📱 {reserva.usuario.telefone}</p>
                            )}
                            {reserva.usuario.whatsapp && (
                              <p>💬 WhatsApp: {reserva.usuario.whatsapp}</p>
                            )}
                            <p className="text-xs text-gray-500">
                              Reservado em: {new Date(reserva.dataReserva).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          {reserva.observacao && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                              <p className="font-semibold">Observação:</p>
                              <p>{reserva.observacao}</p>
                            </div>
                          )}
                        </div>

                        {/* Cancel Button */}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deseja cancelar a reserva de ${reserva.usuario.nome}?`
                              )
                            ) {
                              cancelReservaMutation.mutate(reserva.usuarioId);
                            }
                          }}
                          disabled={cancelReservaMutation.isPending}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                          title="Cancelar reserva"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cancelled Reservations */}
              {reservas.filter((r) => r.status === "cancelada").length > 0 && (
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3 text-sm opacity-70">
                    Reservas Canceladas ({reservas.filter((r) => r.status === "cancelada").length})
                  </h3>
                  <div className="space-y-2">
                    {reservas
                      .filter((r) => r.status === "cancelada")
                      .map((reserva) => (
                        <div
                          key={reserva.id}
                          className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600"
                        >
                          <p>
                            <span className="line-through">{reserva.usuario.nome}</span> - Cancelado em{" "}
                            {reserva.dataCancelamento
                              ? new Date(reserva.dataCancelamento).toLocaleDateString("pt-BR")
                              : "N/A"}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowPanel(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition font-semibold"
              >
                Fechar
              </button>
              {quantidadeInfo?.reservado && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Marcar este anúncio como vendido/concluído? Não poderá ser revertido."
                      )
                    ) {
                      markAsSoldMutation.mutate();
                    }
                  }}
                  disabled={markAsSoldMutation.isPending}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50"
                >
                  {markAsSoldMutation.isPending ? "Salvando..." : "Marcar como Vendido"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
