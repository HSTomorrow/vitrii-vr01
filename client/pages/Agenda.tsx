import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WaitlistModal from "../components/WaitlistModal";

interface AgendaSlot {
  id: number;
  lojaId: number;
  productId: number;
  dataHora: string;
  descricao?: string;
  usuarioId?: number;
  status: "disponivel" | "ocupado" | "cancelado" | "fila_espera";
  isActive: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  loja?: {
    id: number;
    nome: string;
    fotoUrl?: string;
  };
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

interface WaitlistEntry {
  id: number;
  usuarioId?: number;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

export default function Agenda() {
  const navigate = useNavigate();
  const { lojaId } = useParams<{ lojaId?: string }>();

  const [agendas, setAgendas] = useState<AgendaSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showNewSlotForm, setShowNewSlotForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AgendaSlot | null>(null);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    lojaId: lojaId ? parseInt(lojaId) : 0,
    productId: 0,
    dataHora: "",
    descricao: "",
  });

  // Load agendas
  useEffect(() => {
    loadAgendas();
  }, [selectedDate, lojaId]);

  const loadAgendas = async () => {
    try {
      setLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        dataInicio: startOfDay.toISOString(),
        dataFim: endOfDay.toISOString(),
      });

      if (lojaId) {
        params.append("lojaId", lojaId);
      }

      const response = await fetch(`/api/agendas?${params}`);
      const data = await response.json();

      if (data.success) {
        setAgendas(data.data);
      } else {
        toast.error(data.error || "Erro ao carregar agendas");
      }
    } catch (error) {
      console.error("Error loading agendas:", error);
      toast.error("Erro ao carregar agendas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lojaId || !formData.productId || !formData.dataHora) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const response = await fetch("/api/agendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Horário adicionado com sucesso");
        setShowNewSlotForm(false);
        setFormData({
          lojaId: lojaId ? parseInt(lojaId) : 0,
          productId: 0,
          dataHora: "",
          descricao: "",
        });
        loadAgendas();
      } else {
        toast.error(data.error || "Erro ao criar horário");
      }
    } catch (error) {
      console.error("Error creating slot:", error);
      toast.error("Erro ao criar horário");
    }
  };

  const handleBookSlot = async (agendaId: number) => {
    try {
      const response = await fetch(`/api/agendas/${agendaId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ocupado" }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Horário reservado com sucesso");
        loadAgendas();
      } else {
        toast.error(data.error || "Erro ao reservar horário");
      }
    } catch (error) {
      console.error("Error booking slot:", error);
      toast.error("Erro ao reservar horário");
    }
  };

  const handleCancelSlot = async (agendaId: number) => {
    if (!confirm("Tem certeza que deseja cancelar este horário?")) {
      return;
    }

    try {
      const response = await fetch(`/api/agendas/${agendaId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Horário cancelado com sucesso");
        loadAgendas();
      } else {
        toast.error(data.error || "Erro ao cancelar horário");
      }
    } catch (error) {
      console.error("Error canceling slot:", error);
      toast.error("Erro ao cancelar horário");
    }
  };

  const handleViewWaitlist = (slot: AgendaSlot) => {
    setSelectedSlot(slot);
    setWaitlistOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "disponivel":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "ocupado":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "cancelado":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case "fila_espera":
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      disponivel: "Disponível",
      ocupado: "Ocupado",
      cancelado: "Cancelado",
      fila_espera: "Fila de Espera",
    };
    return labels[status] || status;
  };

  const agendaByTime = agendas
    .filter((a) => a.isActive && a.status !== "cancelado")
    .sort(
      (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
    );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-500" />
                Agenda de Serviços
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie horários disponíveis e listas de espera
              </p>
            </div>
            <button
              onClick={() => setShowNewSlotForm(!showNewSlotForm)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
            >
              <Plus className="w-5 h-5" />
              Novo Horário
            </button>
          </div>

          {/* Date selector */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000),
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              ← Anterior
            </button>
            <input
              type="date"
              value={selectedDate.toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={() =>
                setSelectedDate(
                  new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000),
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Próximo →
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 ml-auto"
            >
              Hoje
            </button>
          </div>

          {/* New slot form */}
          {showNewSlotForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-orange-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Adicionar Novo Horário
              </h2>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loja
                    </label>
                    <input
                      type="number"
                      value={formData.lojaId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lojaId: parseInt(e.target.value),
                        })
                      }
                      placeholder="ID da loja"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Produto
                    </label>
                    <input
                      type="number"
                      value={formData.productId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          productId: parseInt(e.target.value),
                        })
                      }
                      placeholder="ID do produto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data e Hora
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dataHora}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataHora: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descricao: e.target.value,
                        })
                      }
                      placeholder="Descrição do serviço"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition font-medium"
                  >
                    Criar Horário
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewSlotForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Agenda slots */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="text-gray-600 mt-4">Carregando horários...</p>
            </div>
          ) : agendaByTime.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-lg">
                Nenhum horário disponível para{" "}
                {selectedDate.toLocaleDateString("pt-BR")}
              </p>
              <button
                onClick={() => setShowNewSlotForm(true)}
                className="mt-4 inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
              >
                <Plus className="w-5 h-5" />
                Criar Primeiro Horário
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {agendaByTime.map((slot) => (
                <div
                  key={slot.id}
                  className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition ${
                    slot.status === "disponivel"
                      ? "border-green-500 hover:shadow-lg"
                      : slot.status === "ocupado"
                        ? "border-red-500"
                        : "border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="mt-1">{getStatusIcon(slot.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900">
                            {slot.producto?.nome || "Serviço"}
                          </h3>
                          <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                            {getStatusLabel(slot.status)}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(slot.dataHora).toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                          {slot.usuario && (
                            <p className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Cliente: {slot.usuario.nome}
                            </p>
                          )}
                          {slot.descricao && <p>{slot.descricao}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {slot.status === "disponivel" && (
                        <button
                          onClick={() => handleBookSlot(slot.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm font-medium"
                        >
                          Reservar
                        </button>
                      )}
                      {slot.status === "ocupado" && (
                        <button
                          onClick={() => handleViewWaitlist(slot)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm font-medium"
                        >
                          <Users className="w-4 h-4 inline mr-1" />
                          Fila
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelSlot(slot.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Waitlist Modal */}
      {selectedSlot && (
        <WaitlistModal
          isOpen={waitlistOpen}
          onClose={() => {
            setWaitlistOpen(false);
            setSelectedSlot(null);
          }}
          slot={selectedSlot}
          onRefresh={loadAgendas}
        />
      )}

      <Footer />
    </div>
  );
}
