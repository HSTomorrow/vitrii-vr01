import { useState } from "react";
import { Check, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

interface Reserva {
  id: number;
  eventoId: number;
  usuarioId?: number;
  nomeSolicitante?: string;
  emailSolicitante?: string;
  telefoneSolicitante?: string;
  tipo: string;
  status: string;
  posicaoListaEspera?: number;
  motivo?: string;
  dataSolicitacao: string;
  dataConfirmacao?: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface ReservasEventoListProps {
  reservas: Reserva[];
  onReservasChange?: () => void;
}

export default function ReservasEventoList({
  reservas,
  onReservasChange,
}: ReservasEventoListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const confirmarMutation = useMutation({
    mutationFn: async (reservaId: number) => {
      const response = await fetch(`/api/reservas-evento/${reservaId}/confirmar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erro ao confirmar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Reserva confirmada!");
      onReservasChange?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao confirmar");
    },
  });

  const rejeitarMutation = useMutation({
    mutationFn: async (reservaId: number) => {
      const response = await fetch(`/api/reservas-evento/${reservaId}/rejeitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo: "Rejeitado pelo anunciante" }),
      });
      if (!response.ok) throw new Error("Erro ao rejeitar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Reserva rejeitada!");
      onReservasChange?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao rejeitar");
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: async (reservaId: number) => {
      const response = await fetch(`/api/reservas-evento/${reservaId}/cancelar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Erro ao cancelar");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Reserva cancelada!");
      onReservasChange?.();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar");
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmada":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <Check className="w-4 h-4" />
            Confirmada
          </span>
        );
      case "pendente":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
            <Clock className="w-4 h-4" />
            Pendente
          </span>
        );
      case "rejeitada":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <X className="w-4 h-4" />
            Rejeitada
          </span>
        );
      case "cancelada":
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
            <X className="w-4 h-4" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const reservasTab = reservas.filter((r) => r.tipo === "reserva");
  const listaEsperaTab = reservas.filter((r) => r.tipo === "lista_espera");

  return (
    <div className="space-y-6">
      {/* Reservas */}
      {reservasTab.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-vitrii-text mb-4">
            Reservas ({reservasTab.length})
          </h3>
          <div className="space-y-2">
            {reservasTab.map((reserva) => (
              <div
                key={reserva.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <h4 className="font-semibold text-vitrii-text">
                          {reserva.usuario?.nome || reserva.nomeSolicitante || "Anônimo"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {reserva.usuario?.email || reserva.emailSolicitante || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {getStatusBadge(reserva.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(reserva.dataSolicitacao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === reserva.id ? null : reserva.id)
                    }
                    className="text-vitrii-blue hover:text-vitrii-blue-dark transition-colors"
                  >
                    {expandedId === reserva.id ? "▼" : "▶"}
                  </button>
                </div>

                {/* Expanded details */}
                {expandedId === reserva.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {reserva.telefoneSolicitante && (
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-semibold text-vitrii-text">
                          {reserva.telefoneSolicitante}
                        </p>
                      </div>
                    )}

                    {reserva.motivo && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm font-semibold text-red-700">Motivo</p>
                        <p className="text-sm text-red-600">{reserva.motivo}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {reserva.status === "pendente" && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => confirmarMutation.mutate(reserva.id)}
                          disabled={confirmarMutation.isPending}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {confirmarMutation.isPending ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => rejeitarMutation.mutate(reserva.id)}
                          disabled={rejeitarMutation.isPending}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {rejeitarMutation.isPending ? "..." : "Rejeitar"}
                        </button>
                      </div>
                    )}

                    {reserva.status === "confirmada" && (
                      <button
                        onClick={() => cancelarMutation.mutate(reserva.id)}
                        disabled={cancelarMutation.isPending}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50"
                      >
                        {cancelarMutation.isPending ? "..." : "Cancelar Reserva"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Espera */}
      {listaEsperaTab.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-vitrii-text mb-4">
            Lista de Espera ({listaEsperaTab.length})
          </h3>
          <div className="space-y-2">
            {listaEsperaTab.map((reserva) => (
              <div
                key={reserva.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {reserva.posicaoListaEspera && (
                        <div className="w-8 h-8 rounded-full bg-vitrii-blue text-white flex items-center justify-center font-bold text-sm">
                          {reserva.posicaoListaEspera}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-vitrii-text">
                          {reserva.usuario?.nome || reserva.nomeSolicitante || "Anônimo"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {reserva.usuario?.email || reserva.emailSolicitante || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(reserva.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(reserva.dataSolicitacao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === reserva.id ? null : reserva.id)
                    }
                    className="text-vitrii-blue hover:text-vitrii-blue-dark transition-colors"
                  >
                    {expandedId === reserva.id ? "▼" : "▶"}
                  </button>
                </div>

                {/* Expanded details */}
                {expandedId === reserva.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    {reserva.telefoneSolicitante && (
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-semibold text-vitrii-text">
                          {reserva.telefoneSolicitante}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {reserva.status === "pendente" && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => confirmarMutation.mutate(reserva.id)}
                          disabled={confirmarMutation.isPending}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {confirmarMutation.isPending ? "..." : "Confirmar"}
                        </button>
                        <button
                          onClick={() => rejeitarMutation.mutate(reserva.id)}
                          disabled={rejeitarMutation.isPending}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                        >
                          {rejeitarMutation.isPending ? "..." : "Rejeitar"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reservas.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p>Nenhuma reserva ou solicitação de lista de espera ainda</p>
        </div>
      )}
    </div>
  );
}
