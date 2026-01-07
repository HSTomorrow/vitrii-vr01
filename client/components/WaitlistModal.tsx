import { useEffect, useState } from "react";
import { X, Users, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface WaitlistEntry {
  id: number;
  usuarioId?: number;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
  dataCriacao: string;
}

interface AgendaSlot {
  id: number;
  lojaId: number;
  productId: number;
  dataHora: string;
  descricao?: string;
  usuarioId?: number;
  status: "disponivel" | "ocupado" | "cancelado" | "fila_espera";
  isActive: boolean;
  producto?: {
    id: number;
    nome: string;
  };
  usuario?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: AgendaSlot;
  onRefresh: () => void;
}

export default function WaitlistModal({
  isOpen,
  onClose,
  slot,
  onRefresh,
}: WaitlistModalProps) {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    usuarioId: 0,
    telefone: "",
    email: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadWaitlist();
    }
  }, [isOpen, slot]);

  const loadWaitlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agendas/${slot.id}/waitlist`);
      const data = await response.json();

      if (data.success) {
        setWaitlist(data.data);
      } else {
        toast.error(data.error || "Erro ao carregar lista de espera");
      }
    } catch (error) {
      console.error("Error loading waitlist:", error);
      toast.error("Erro ao carregar lista de espera");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.usuarioId) {
      toast.error("Selecione um usuário");
      return;
    }

    try {
      const response = await fetch("/api/agendas/waitlist/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agendaOcupadaId: slot.id,
          usuarioId: formData.usuarioId,
          telefone: formData.telefone,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Usuário adicionado à lista de espera");
        setFormData({ usuarioId: 0, telefone: "", email: "" });
        setShowAddForm(false);
        loadWaitlist();
      } else {
        toast.error(data.error || "Erro ao adicionar à lista de espera");
      }
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      toast.error("Erro ao adicionar à lista de espera");
    }
  };

  const handleRemoveFromWaitlist = async (waitlistId: number) => {
    if (!confirm("Tem certeza que deseja remover esta pessoa da fila?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agendas/waitlist/${waitlistId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Pessoa removida da lista de espera");
        loadWaitlist();
      } else {
        toast.error(data.error || "Erro ao remover da lista de espera");
      }
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      toast.error("Erro ao remover da lista de espera");
    }
  };

  const handlePromoteFromWaitlist = async () => {
    if (!confirm("Deseja promover a próxima pessoa da fila?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agendas/${slot.id}/waitlist/promote`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        loadWaitlist();
        onRefresh();
      } else {
        toast.error(data.error || "Erro ao promover da fila");
      }
    } catch (error) {
      console.error("Error promoting from waitlist:", error);
      toast.error("Erro ao promover da fila");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Lista de Espera
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {slot.producto?.nome} -{" "}
              {new Date(slot.dataHora).toLocaleString("pt-BR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current occupant */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Ocupante Atual
            </h3>
            {slot.usuario ? (
              <div className="text-sm text-red-800">
                <p className="font-medium">{slot.usuario.nome}</p>
                <p>{slot.usuario.email}</p>
                <p>{slot.usuario.telefone}</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">
                Horário ocupado sem detalhe
              </p>
            )}
          </div>

          {/* Waitlist */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pessoas em Espera ({waitlist.length})
            </h3>

            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : waitlist.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma pessoa na fila
              </p>
            ) : (
              <div className="space-y-2">
                {waitlist.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                        {index + 1}
                      </span>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {entry.usuario?.nome || "Usuário"}
                        </p>
                        <p className="text-gray-600">{entry.usuario?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromWaitlist(entry.id)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded transition"
                      title="Remover da fila"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2 mb-6">
            {waitlist.length > 0 && (
              <button
                onClick={handlePromoteFromWaitlist}
                className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-medium"
              >
                <CheckCircle2 className="w-4 h-4" />
                Promover Próximo
              </button>
            )}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
            >
              {showAddForm ? "Cancelar" : "Adicionar à Fila"}
            </button>
          </div>

          {/* Add to waitlist form */}
          {showAddForm && (
            <div className="border-t border-gray-200 pt-4">
              <form onSubmit={handleAddToWaitlist} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID do Usuário
                  </label>
                  <input
                    type="number"
                    value={formData.usuarioId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usuarioId: parseInt(e.target.value),
                      })
                    }
                    placeholder="ID do usuário"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone (opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: e.target.value,
                      })
                    }
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Adicionar à Fila
                </button>
              </form>
            </div>
          )}

          {/* Footer info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
            <p>
              💡 Quando o horário ficar disponível, clique em "Promover Próximo"
              para mover o primeiro da fila.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
