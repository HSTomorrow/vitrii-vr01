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
  privacidade?: string;
  contatos?: Array<{ contatoId: number }>;
}

interface Contato {
  id: number;
  nome: string;
}

interface StatusAgendaProps {
  eventos: Evento[];
  onStatusChange: () => void;
  isLoading?: boolean;
  anuncianteId?: number;
  onDeleteAgenda?: () => void;
  contatos?: Contato[];
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
  anuncianteId,
  onDeleteAgenda,
  contatos = [],
}: StatusAgendaProps) {
  const { user } = useAuth();
  const [expandedEventoId, setExpandedEventoId] = useState<number | null>(null);
  const [updatingEventoId, setUpdatingEventoId] = useState<number | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(["pendente", "pendente_pagamento", "realizado", "substituicao"])
  );
  const [selectedEventoIds, setSelectedEventoIds] = useState<Set<number>>(new Set());

  // Filters
  const [filterDataDe, setFilterDataDe] = useState("");
  const [filterDataAte, setFilterDataAte] = useState("");
  const [filterContatoId, setFilterContatoId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("");

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

  const toggleStatusFilter = (status: string) => {
    const newStatuses = new Set(selectedStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setSelectedStatuses(newStatuses);
  };

  const toggleEventoSelection = (eventoId: number) => {
    const newSelected = new Set(selectedEventoIds);
    if (newSelected.has(eventoId)) {
      newSelected.delete(eventoId);
    } else {
      newSelected.add(eventoId);
    }
    setSelectedEventoIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEventoIds.size === filteredEventos.length) {
      setSelectedEventoIds(new Set());
    } else {
      setSelectedEventoIds(new Set(filteredEventos.map((e) => e.id)));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedEventoIds.size === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      for (const eventoId of selectedEventoIds) {
        await fetch(`/api/eventos-agenda/${eventoId}/status`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: newStatus }),
        });
      }

      toast.success(`Status de ${selectedEventoIds.size} evento(s) alterado(s)`);
      setSelectedEventoIds(new Set());
      onStatusChange();
    } catch (error) {
      toast.error("Erro ao alterar status em lote");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEventoIds.size === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar ${selectedEventoIds.size} evento(s)?`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      for (const eventoId of selectedEventoIds) {
        await fetch(`/api/eventos-agenda/${eventoId}`, {
          method: "DELETE",
          headers,
        });
      }

      toast.success(`${selectedEventoIds.size} evento(s) deletado(s)`);
      setSelectedEventoIds(new Set());
      onStatusChange();
    } catch (error) {
      toast.error("Erro ao deletar eventos em lote");
    }
  };

  const filteredEventos = useMemo(() => {
    return sortedEventos.filter((evento) => {
      // Filter by selected statuses
      if (!selectedStatuses.has(evento.status)) return false;

      // Filter by date range (Data De)
      if (filterDataDe) {
        const eventoData = new Date(evento.dataInicio).toISOString().split("T")[0];
        if (eventoData < filterDataDe) return false;
      }

      // Filter by date range (Data Ate)
      if (filterDataAte) {
        const eventoData = new Date(evento.dataInicio).toISOString().split("T")[0];
        if (eventoData > filterDataAte) return false;
      }

      // Filter by contact
      if (filterContatoId) {
        const hasContato = (evento.contatos || []).some(
          (c: any) => c.contatoId === filterContatoId
        );
        if (!hasContato) return false;
      }

      // Filter by status text
      if (filterStatus && !evento.status.includes(filterStatus.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [sortedEventos, selectedStatuses, filterDataDe, filterDataAte, filterContatoId, filterStatus]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-vitrii-text">
          Status da Agenda ({filteredEventos.length})
        </h3>
        {onDeleteAgenda && (
          <button
            onClick={() => {
              if (
                confirm(
                  "Tem certeza que deseja deletar toda a agenda? Todos os eventos serão removidos e esta ação é irreversível."
                )
              ) {
                onDeleteAgenda();
              }
            }}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Deletar Agenda
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <p className="text-sm font-semibold text-vitrii-text mb-3">Filtros Avançados:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Data De */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data De</label>
            <input
              type="date"
              value={filterDataDe}
              onChange={(e) => setFilterDataDe(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Data Ate */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data Até</label>
            <input
              type="date"
              value={filterDataAte}
              onChange={(e) => setFilterDataAte(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Contato */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contato</label>
            <select
              value={filterContatoId || ""}
              onChange={(e) => setFilterContatoId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            >
              <option value="">Todos</option>
              {contatos.map((contato) => (
                <option key={contato.id} value={contato.id}>
                  {contato.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status do Evento</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            >
              <option value="">Todos</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterDataDe || filterDataAte || filterContatoId || filterStatus) && (
          <button
            onClick={() => {
              setFilterDataDe("");
              setFilterDataAte("");
              setFilterContatoId(null);
              setFilterStatus("");
            }}
            className="text-xs text-vitrii-blue hover:underline"
          >
            Limpar filtros avançados
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <p className="text-sm font-semibold text-vitrii-text mb-3">Filtrar por Status:</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const isSelected = selectedStatuses.has(option.value);
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => toggleStatusFilter(option.value)}
                className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? `${option.color} ring-2 ring-offset-1`
                    : "border border-gray-300 text-gray-700 hover:border-gray-400 bg-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center sm:text-left">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {filteredEventos.length > 0 && selectedEventoIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm font-medium text-blue-800">
            {selectedEventoIds.size} evento(s) selecionado(s)
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = "";
                }
              }}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            >
              <option value="">Alterar status para...</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleBulkDelete}
              className="w-full sm:w-auto px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Deletar
            </button>
          </div>
        </div>
      )}

      {/* Events List */}
      {filteredEventos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum evento com os filtros selecionados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEventos.map((evento) => {
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
            <div className={`w-full p-4 flex items-center justify-between hover:opacity-90 transition-opacity ${getStatusColor(evento.status)}`}>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedEventoIds.has(evento.id)}
                  onChange={() => toggleEventoSelection(evento.id)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <button
                  onClick={() =>
                    setExpandedEventoId(isExpanded ? null : evento.id)
                  }
                  className="flex items-center gap-3 flex-1 text-left hover:opacity-75"
                >
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
                </button>
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
            </div>

            {/* Details */}
            {isExpanded && (
              <div className="border-t-2 border-inherit p-4 bg-gray-50 space-y-4">
                {/* Evento Info */}
                {evento.descricao && (
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-600 mb-1">
                      Descrição:
                    </p>
                    <p className="text-sm text-gray-700 break-words">{evento.descricao}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-600 mb-1">
                      Data/Hora de Início:
                    </p>
                    <p className="text-gray-700 break-words">
                      {new Date(evento.dataInicio).toLocaleDateString("pt-BR")}{" "}
                      às{" "}
                      {new Date(evento.dataInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-600 mb-1">
                      Data/Hora de Fim:
                    </p>
                    <p className="text-gray-700 break-words">
                      {new Date(evento.dataFim).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(evento.dataFim).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Color and Privacidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-600 mb-1">Cor:</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: evento.cor || "#3B82F6" }}
                        title={evento.cor || "#3B82F6"}
                      />
                      <p className="text-gray-700">{evento.cor || "#3B82F6"}</p>
                    </div>
                  </div>
                  {evento.privacidade && (
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-600 mb-1">
                        Privacidade:
                      </p>
                      <p className="text-gray-700 break-words">
                        {evento.privacidade === "publico"
                          ? "🌍 Público"
                          : evento.privacidade === "privado_usuarios"
                            ? "👥 Restrito"
                            : "🔒 Privado"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Contatos Associated */}
                {evento.contatos && evento.contatos.length > 0 && (
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-600 mb-2">
                      Contatos ({evento.contatos.length}):
                    </p>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2 max-h-48 overflow-y-auto">
                      {evento.contatos.map((contato: any, index: number) => (
                        <div
                          key={`${contato.contatoId}-${index}`}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-100"
                        >
                          <div className="text-sm">
                            <p className="font-medium text-vitrii-text">
                              ID: {contato.contatoId}
                            </p>
                          </div>
                          <a
                            href={`/cadastros/contatos#contato-${contato.contatoId}`}
                            className="text-xs px-2 py-1 bg-vitrii-blue text-white rounded hover:bg-blue-600 transition-colors"
                            title="Ver contato"
                          >
                            Ver
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Change Options */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    Alterar Status:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
                          className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            evento.status === option.value
                              ? `${option.color} ring-2 ring-offset-2`
                              : "border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-100"
                          } disabled:opacity-50`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-center">{option.label}</span>
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
      )}
    </div>
  );
}

function Calendar() {
  return <Clock className="w-12 h-12 text-gray-300" />;
}
