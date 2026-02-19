import { useState, useMemo } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Calendar, User, Mail, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface FilaEspera {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  dataSolicitacao: string;
  motivo_rejeicao?: string;
  dataSugestao?: string;
  horaSugestao?: string;
  usuarioSolicitante: {
    id: number;
    nome: string;
    email: string;
    telefone?: string;
  };
}

interface FilaDeEsperaListProps {
  filas: FilaEspera[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function FilaDeEsperaList({
  filas,
  onRefresh,
  isLoading = false,
}: FilaDeEsperaListProps) {
  const { user } = useAuth();
  const [selectedFilaForReject, setSelectedFilaForReject] = useState<FilaEspera | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suggestedDate, setSuggestedDate] = useState("");
  const [suggestedTime, setSuggestedTime] = useState("");
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const filteredFilas = useMemo(() => {
    if (!filterStatus) return filas;
    return filas.filter((f) => f.status === filterStatus);
  }, [filas, filterStatus]);

  const pendingFilas = filteredFilas.filter((f) => f.status === "pendente");
  const processedFilas = filteredFilas.filter((f) => f.status !== "pendente");

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pendente: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pendente" },
      aprovada: { bg: "bg-green-100", text: "text-green-800", label: "Aprovada" },
      rejeitada: { bg: "bg-red-100", text: "text-red-800", label: "Rejeitada" },
      cancelada: { bg: "bg-gray-100", text: "text-gray-800", label: "Cancelada" },
    };
    const s = statusMap[status] || statusMap.pendente;
    return `${s.bg} ${s.text}`;
  };

  const handleApprove = async (fila: FilaEspera) => {
    setIsProcessing(fila.id);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(`/api/filas-espera/${fila.id}/aprovar`, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao aprovar fila de espera");
      }

      toast.success("Fila de espera aprovada! Evento criado com sucesso.");
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao aprovar fila de espera"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectClick = (fila: FilaEspera) => {
    setSelectedFilaForReject(fila);
    setRejectReason("");
    setSuggestedDate("");
    setSuggestedTime("");
  };

  const handleRejectSubmit = async () => {
    if (!selectedFilaForReject) return;

    if (!rejectReason.trim()) {
      toast.error("Motivo da rejeição é obrigatório");
      return;
    }

    setIsProcessing(selectedFilaForReject.id);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/filas-espera/${selectedFilaForReject.id}/rejeitar`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            motivo: rejectReason.trim(),
            dataSugestao: suggestedDate ? new Date(suggestedDate).toISOString() : null,
            horaSugestao: suggestedTime || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao rejeitar fila de espera");
      }

      toast.success("Fila de espera rejeitada. Usuário foi notificado.");
      setSelectedFilaForReject(null);
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao rejeitar fila de espera"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Carregando filas de espera...</div>
      </div>
    );
  }

  if (filas.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Nenhuma fila de espera</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterStatus(null)}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
            filterStatus === null
              ? "bg-vitrii-blue text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Todas ({filas.length})
        </button>
        <button
          onClick={() => setFilterStatus("pendente")}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
            filterStatus === "pendente"
              ? "bg-yellow-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Pendentes ({pendingFilas.length})
        </button>
        <button
          onClick={() => setFilterStatus("aprovada")}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
            filterStatus === "aprovada"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Aprovadas
        </button>
        <button
          onClick={() => setFilterStatus("rejeitada")}
          className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
            filterStatus === "rejeitada"
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Rejeitadas
        </button>
      </div>

      {/* Pending Filas */}
      {filterStatus === null || filterStatus === "pendente" ? (
        <div>
          {pendingFilas.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-vitrii-text mb-4">
                Aguardando Aprovação ({pendingFilas.length})
              </h3>
              <div className="space-y-4">
                {pendingFilas.map((fila) => (
                  <div
                    key={fila.id}
                    className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-vitrii-text">
                          {fila.titulo}
                        </h4>
                        {fila.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {fila.descricao}
                          </p>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(fila.status)}`}>
                        {fila.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Solicitante Info */}
                    <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{fila.usuarioSolicitante.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <a
                          href={`mailto:${fila.usuarioSolicitante.email}`}
                          className="text-vitrii-blue hover:underline"
                        >
                          {fila.usuarioSolicitante.email}
                        </a>
                      </div>
                      {fila.usuarioSolicitante.telefone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <a
                            href={`https://wa.me/${fila.usuarioSolicitante.telefone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-vitrii-blue hover:underline"
                          >
                            {fila.usuarioSolicitante.telefone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* DateTime Info */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          {new Date(fila.dataInicio).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(fila.dataInicio).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>
                          até{" "}
                          {new Date(fila.dataFim).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(fila)}
                        disabled={isProcessing === fila.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isProcessing === fila.id ? "Aprovando..." : "Aprovar"}
                      </button>
                      <button
                        onClick={() => handleRejectClick(fila)}
                        disabled={isProcessing === fila.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        {isProcessing === fila.id ? "Rejeitando..." : "Rejeitar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Processed Filas */}
      {processedFilas.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-vitrii-text mb-4">
            Histórico ({processedFilas.length})
          </h3>
          <div className="space-y-3">
            {processedFilas.map((fila) => (
              <div
                key={fila.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-vitrii-text">
                      {fila.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(fila.dataInicio).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(fila.dataInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      fila.status
                    )}`}
                  >
                    {fila.status.charAt(0).toUpperCase() +
                      fila.status.slice(1)}
                  </span>
                </div>

                {/* Rejection details */}
                {fila.status === "rejeitada" && fila.motivo_rejeicao && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 text-sm">
                    <p className="font-semibold text-red-800 mb-1">
                      Motivo da rejeição:
                    </p>
                    <p className="text-red-700 mb-2">{fila.motivo_rejeicao}</p>
                    {fila.dataSugestao && (
                      <p className="text-red-700">
                        <strong>Sugestão:</strong>{" "}
                        {new Date(fila.dataSugestao).toLocaleDateString(
                          "pt-BR"
                        )}{" "}
                        {fila.horaSugestao && `às ${fila.horaSugestao}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedFilaForReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-vitrii-text">
                Rejeitar Fila de Espera
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedFilaForReject.titulo}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Motivo da rejeição <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={isProcessing === selectedFilaForReject.id}
                  placeholder="Ex: Horário indisponível, serviço não oferecido, etc"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 resize-none"
                  rows={3}
                />
              </div>

              {/* Suggested date and time */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Sugerir nova data (opcional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={suggestedDate}
                    onChange={(e) => setSuggestedDate(e.target.value)}
                    disabled={isProcessing === selectedFilaForReject.id}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
                  />
                  <input
                    type="time"
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    disabled={isProcessing === selectedFilaForReject.id}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedFilaForReject(null)}
                  disabled={isProcessing === selectedFilaForReject.id}
                  className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={isProcessing === selectedFilaForReject.id}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {isProcessing === selectedFilaForReject.id
                    ? "Rejeitando..."
                    : "Rejeitar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
