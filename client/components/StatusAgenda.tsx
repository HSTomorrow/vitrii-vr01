import { useState, useMemo } from "react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Clock, CheckCircle, AlertCircle, Repeat2, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  cor?: string;
  dataCriacao: string;
}

interface StatusAgendaProps {
  eventos: Evento[];
  onStatusChange: () => void;
  isLoading?: boolean;
}

const STATUS_OPTIONS = [
  {
    value: "pendente",
    label: "Pendente",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    borderColor: "border-yellow-300",
  },
  {
    value: "realizado",
    label: "Realizado",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-300",
  },
  {
    value: "pendente_pagamento",
    label: "Pendente de Pagamento",
    icon: AlertCircle,
    color: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-300",
  },
  {
    value: "substituicao",
    label: "Substituição",
    icon: Repeat2,
    color: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-300",
  },
];

export default function StatusAgenda({
  eventos,
  onStatusChange,
  isLoading = false,
}: StatusAgendaProps) {
  const { user } = useAuth();
  const [expandedEventoId, setExpandedEventoId] = useState<number | null>(null);
  const [updatingEventoId, setUpdatingEventoId] = useState<number | null>(null);

  const sortedEventos = useMemo(() => {
    return [...eventos].sort(
      (a, b) =>
        new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime()
    );
  }, [eventos]);

  const getStatusIcon = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.icon || Clock;
  };

  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.color || "";
  };

  const getStatusBorderColor = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.borderColor || "border-gray-300";
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.label || status;
  };

  const handleStatusChange = async (eventoId: number, newStatus: string) => {
    setUpdatingEventoId(eventoId);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(`/api/eventos-agenda/${eventoId}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar status");
      }

      toast.success("Status atualizado com sucesso");
      onStatusChange();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar status"
      );
    } finally {
      setUpdatingEventoId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Carregando eventos...</div>
      </div>
    );
  }

  if (eventos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Nenhum evento para gerenciar</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-vitrii-text">
          Status da Agenda ({eventos.length})
        </h3>
      </div>

      {sortedEventos.map((evento) => {
        const isExpanded = expandedEventoId === evento.id;
        const isUpdating = updatingEventoId === evento.id;
        const StatusIcon = getStatusIcon(evento.status);

        return (
          <div
            key={evento.id}
            className={`border-2 rounded-lg overflow-hidden transition-all ${getStatusBorderColor(
              evento.status
            )}`}
          >
            {/* Header */}
            <button
              onClick={() =>
                setExpandedEventoId(isExpanded ? null : evento.id)
              }
              className={`w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity ${getStatusColor(
                evento.status
              )}`}
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <StatusIcon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-base">{evento.titulo}</h4>
                  <p className="text-xs opacity-75">
                    {new Date(evento.dataInicio).toLocaleDateString("pt-BR")} às{" "}
                    {new Date(evento.dataInicio).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white bg-opacity-30">
                  {getStatusLabel(evento.status)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Details */}
            {isExpanded && (
              <div className="border-t-2 border-inherit p-4 bg-gray-50 space-y-4">
                {/* Evento Info */}
                {evento.descricao && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      Descrição:
                    </p>
                    <p className="text-sm text-gray-700">{evento.descricao}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">
                      Data/Hora de Início:
                    </p>
                    <p className="text-gray-700">
                      {new Date(evento.dataInicio).toLocaleDateString("pt-BR")}{" "}
                      às{" "}
                      {new Date(evento.dataInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600 mb-1">
                      Data/Hora de Fim:
                    </p>
                    <p className="text-gray-700">
                      {new Date(evento.dataFim).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(evento.dataFim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Change Options */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    Alterar Status:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() =>
                            handleStatusChange(evento.id, option.value)
                          }
                          disabled={
                            isUpdating || evento.status === option.value
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            evento.status === option.value
                              ? `${option.color} ring-2 ring-offset-2`
                              : "border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-100"
                          } disabled:opacity-50`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isUpdating && (
                  <p className="text-sm text-blue-600 font-medium">
                    Atualizando status...
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Calendar() {
  return <Clock className="w-12 h-12 text-gray-300" />;
}
