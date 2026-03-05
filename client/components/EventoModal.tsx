import { useState, useEffect } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import ContatoSelectorModal from "./ContatoSelectorModal";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
  contatos?: { contatoId: number }[];
}

interface Contato {
  id: number;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  tipoContato: string;
  imagem?: string;
}

interface EventoModalProps {
  isOpen: boolean;
  evento?: Evento | null;
  defaultDate?: Date;
  anuncianteId?: number;
  userId?: number;
  onClose: () => void;
  onSave: (evento: Partial<Evento> & { contatosPermitidos?: number[] }) => void;
  isLoading?: boolean;
}

const CORES = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
];

const PRIVACIDADES = [
  { value: "publico", label: "🌍 Público", desc: "Todos podem visualizar" },
  {
    value: "privado_usuarios",
    label: "👥 Restrita",
    desc: "Todos veem a disponibilidade, mas não o conteúdo",
  },
  { value: "privado", label: "🔒 Privado", desc: "Apenas você pode visualizar" },
];

export default function EventoModal({
  isOpen,
  evento,
  defaultDate,
  anuncianteId,
  userId,
  onClose,
  onSave,
  isLoading = false,
}: EventoModalProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFimData: "",
    horaInicio: "09:00",
    horaFim: "10:00",
    privacidade: "privado" as const,
    cor: "#3B82F6",
    contatosPermitidos: [] as number[],
  });
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);
  const [showContatoSelector, setShowContatoSelector] = useState(false);

  // Fetch contatos when modal opens
  useEffect(() => {
    const fetchContatos = async () => {
      if (!isOpen) return;

      setIsLoadingContatos(true);
      try {
        // Fetch user's contacts (optionally filtered by announcer)
        const response = await fetch("/api/contatos", {
          headers: {
            "X-User-Id": userId?.toString() || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          // Filter contacts: if anuncianteId is provided, show those OR contacts without a specific announcer
          const contatosList = (data.data || [])
            .filter((contato: any) => {
              if (!anuncianteId) return true; // Show all if no announcer selected
              // Show contacts for this announcer or contacts for all announcers
              return !contato.anuncianteId || contato.anuncianteId === anuncianteId;
            })
            .map((contato: any) => ({
              id: contato.id,
              nome: contato.nome,
              celular: contato.celular,
              telefone: contato.telefone,
              email: contato.email,
              tipoContato: contato.tipoContato,
              imagem: contato.imagem,
            })) || [];
          setContatos(contatosList);
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
      } finally {
        setIsLoadingContatos(false);
      }
    };

    fetchContatos();
  }, [isOpen, anuncianteId, userId]);

  useEffect(() => {
    if (evento) {
      const inicio = new Date(evento.dataInicio);
      const fim = new Date(evento.dataFim);

      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao || "",
        dataInicio: inicio.toISOString().split("T")[0],
        dataFimData: fim.toISOString().split("T")[0],
        horaInicio: inicio.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        horaFim: fim.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        privacidade: (evento.privacidade || "privado") as const,
        cor: evento.cor || "#3B82F6",
        contatosPermitidos: evento.contatos?.map((c) => c.contatoId) || [],
      });
    } else if (defaultDate) {
      const dateStr = defaultDate.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        dataInicio: dateStr,
        dataFimData: dateStr,
        horaInicio: "09:00",
        horaFim: "10:00",
      }));
    }
  }, [evento, defaultDate, isOpen]);

  // Helper function to calculate end time (+1 hour from start time)
  const calculateEndTime = (startHora: string, startData: string) => {
    if (!startHora) return { horaFim: "10:00", dataFimData: startData };

    const [hours, minutes] = startHora.split(':').map(Number);
    let endHours = hours + 1;
    let endMinutes = minutes;
    let endDateStr = startData;

    // If end time goes past 24:00, move to next day
    if (endHours >= 24) {
      endHours = endHours % 24;
      const nextDate = new Date(startData);
      nextDate.setDate(nextDate.getDate() + 1);
      endDateStr = nextDate.toISOString().split('T')[0];
    }

    const horaFim = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
    return { horaFim, dataFimData: endDateStr };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!formData.dataInicio || !formData.dataFimData) {
      toast.error("Datas são obrigatórias");
      return;
    }

    // Create DateTime objects
    const dataInicio = new Date(
      `${formData.dataInicio}T${formData.horaInicio}:00`,
    );
    const dataFim = new Date(`${formData.dataFimData}T${formData.horaFim}:00`);

    if (dataInicio >= dataFim) {
      toast.error("Hora de início deve ser anterior à hora de fim");
      return;
    }

    onSave({
      id: evento?.id,
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim() || undefined,
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      privacidade: formData.privacidade,
      cor: formData.cor,
      contatosPermitidos: formData.contatosPermitidos.length > 0 ? formData.contatosPermitidos : undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-vitrii-text">
            {evento ? "Editar Evento" : "Novo Evento"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              placeholder="Ex: Reunião com cliente"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue resize-none"
              placeholder="Detalhes do evento"
              rows={3}
            />
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Data Início *
            </label>
            <input
              type="date"
              required
              value={formData.dataInicio}
              onChange={(e) => {
                const newDataInicio = e.target.value;
                const { horaFim, dataFimData } = calculateEndTime(formData.horaInicio, newDataInicio);
                setFormData({ ...formData, dataInicio: newDataInicio, horaFim, dataFimData });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Hora Início */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Hora Início *
            </label>
            <input
              type="time"
              required
              value={formData.horaInicio}
              onChange={(e) => {
                const newHoraInicio = e.target.value;
                const { horaFim, dataFimData } = calculateEndTime(newHoraInicio, formData.dataInicio);
                setFormData({ ...formData, horaInicio: newHoraInicio, horaFim, dataFimData });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Data Fim *
            </label>
            <input
              type="date"
              required
              value={formData.dataFimData}
              onChange={(e) =>
                setFormData({ ...formData, dataFimData: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Hora Fim */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Hora Fim *
            </label>
            <input
              type="time"
              required
              value={formData.horaFim}
              onChange={(e) =>
                setFormData({ ...formData, horaFim: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Cor do Evento
            </label>
            <div className="flex gap-2 flex-wrap">
              {CORES.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setFormData({ ...formData, cor })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    formData.cor === cor
                      ? "border-gray-800 scale-110"
                      : "border-gray-300"
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>

          {/* Privacidade */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-2">
              Privacidade
            </label>
            <div className="space-y-2">
              {PRIVACIDADES.map((priv) => (
                <label
                  key={priv.value}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="privacidade"
                    value={priv.value}
                    checked={formData.privacidade === priv.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        privacidade: e.target.value as any,
                      })
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-vitrii-text">
                      {priv.label}
                    </div>
                    <div className="text-xs text-gray-600">{priv.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Contatos - Available for all privacy levels */}
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Contatos para este Evento
              </label>
              <p className="text-xs text-gray-600 mb-3">
                Selecione os contatos associados a este evento
              </p>
            </div>

            {/* Selected Contacts List */}
            {formData.contatosPermitidos.length > 0 ? (
              <div className="bg-white rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                {formData.contatosPermitidos.map((contatoId) => {
                  const contato = contatos.find((c) => c.id === contatoId);
                  if (!contato) return null;
                  return (
                    <div
                      key={contatoId}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                    >
                      <div className="text-sm">
                        <div className="font-medium text-vitrii-text">{contato.nome}</div>
                        <div className="text-xs text-gray-600">{contato.tipoContato}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            contatosPermitidos: formData.contatosPermitidos.filter(
                              (id) => id !== contatoId
                            ),
                          });
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">Nenhum contato selecionado</p>
            )}

            {/* Add Button */}
            <button
              type="button"
              onClick={() => setShowContatoSelector(true)}
              className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Contato
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {evento && (
            <button
              type="button"
              className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold"
            >
              Excluir Evento
            </button>
          )}
        </form>
      </div>

      {/* Contato Selector Modal */}
      <ContatoSelectorModal
        isOpen={showContatoSelector}
        onClose={() => setShowContatoSelector(false)}
        onSelect={(contatoId) => {
          if (!formData.contatosPermitidos.includes(contatoId)) {
            setFormData({
              ...formData,
              contatosPermitidos: [...formData.contatosPermitidos, contatoId],
            });
          }
        }}
        selectedContatoIds={formData.contatosPermitidos}
        anuncianteId={anuncianteId}
        userId={userId}
      />
    </div>
  );
}
