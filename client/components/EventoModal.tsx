import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
}

interface EventoModalProps {
  isOpen: boolean;
  evento?: Evento | null;
  defaultDate?: Date;
  anuncianteId?: number;
  onClose: () => void;
  onSave: (evento: Partial<Evento> & { usuariosPermitidos?: number[] }) => void;
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
    usuariosPermitidos: [] as number[],
  });

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
        usuariosPermitidos: [],
      });
    } else if (defaultDate) {
      const dateStr = defaultDate.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        dataInicio: dateStr,
        dataFimData: dateStr,
      }));
    }
  }, [evento, defaultDate, isOpen]);

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
      usuariosPermitidos:
        formData.privacidade === "privado_usuarios"
          ? formData.usuariosPermitidos
          : undefined,
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
              onChange={(e) =>
                setFormData({ ...formData, dataInicio: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, horaInicio: e.target.value })
              }
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
              Deletar Evento
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
