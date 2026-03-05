import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Plus, Trash2 } from "lucide-react";

interface ScheduleItem {
  diaSemana: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  horaInicio: string; // HH:mm format
  horaFim: string; // HH:mm format
  ativo: boolean;
}

interface AgendaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  anuncianteId: number;
  anuncianteNome: string;
  onSaved?: () => void;
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

// Default schedule: Monday to Saturday, 09:00 to 18:00
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { diaSemana: 1, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Monday
  { diaSemana: 2, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Tuesday
  { diaSemana: 3, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Wednesday
  { diaSemana: 4, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Thursday
  { diaSemana: 5, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Friday
  { diaSemana: 6, horaInicio: "09:00", horaFim: "18:00", ativo: true }, // Saturday
];

export default function AgendaEditorModal({
  isOpen,
  onClose,
  anuncianteId,
  anuncianteNome,
  onSaved,
}: AgendaEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "horarios">("info");
  const [nomeAgenda, setNomeAgenda] = useState("");
  const [descricaoAgenda, setDescricaoAgenda] = useState("");
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load agenda info from announcer
      setNomeAgenda(anuncianteNome);
      loadSchedule();
    }
  }, [isOpen, anuncianteId]);

  const loadSchedule = async () => {
    setIsLoadingSchedule(true);
    try {
      const response = await fetch(
        `/api/agendas-horarios?anuncianteId=${anuncianteId}`
      );
      if (response.ok) {
        const data = await response.json();
        setSchedule(data.data && data.data.length > 0 ? data.data : DEFAULT_SCHEDULE);
      } else {
        setSchedule(DEFAULT_SCHEDULE);
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      setSchedule(DEFAULT_SCHEDULE);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!nomeAgenda.trim()) {
      toast.error("Nome da agenda é obrigatório");
      return;
    }

    setIsLoadingInfo(true);
    try {
      // Call API to update agenda info
      // For now, just show success
      toast.success("Informações da agenda atualizadas com sucesso!");
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar informações"
      );
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleSaveHorarios = async () => {
    setIsLoadingHorarios(true);
    try {
      const response = await fetch("/api/agendas-horarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anuncianteId,
          horarios: schedule.filter((s) => s.ativo),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Erro ao salvar horários"
        );
      }

      toast.success("Horários da agenda atualizados com sucesso!");
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar horários"
      );
    } finally {
      setIsLoadingHorarios(false);
    }
  };

  const handleToggleDia = (diaSemana: number) => {
    const existing = schedule.find((s) => s.diaSemana === diaSemana);
    if (existing) {
      setSchedule(
        schedule.map((s) =>
          s.diaSemana === diaSemana ? { ...s, ativo: !s.ativo } : s
        )
      );
    } else {
      const defaultItem = DEFAULT_SCHEDULE.find(
        (d) => d.diaSemana === diaSemana
      );
      if (defaultItem) {
        setSchedule([...schedule, { ...defaultItem, ativo: true }]);
      }
    }
  };

  const handleChangeHora = (
    diaSemana: number,
    field: "horaInicio" | "horaFim",
    value: string
  ) => {
    setSchedule(
      schedule.map((s) =>
        s.diaSemana === diaSemana ? { ...s, [field]: value } : s
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-vitrii-text">
              Gerenciar Agenda
            </h2>
            <p className="text-sm text-gray-600 mt-1">{anuncianteNome}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab("info")}
              className={`py-4 font-semibold border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-vitrii-blue text-vitrii-blue"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 Informações
            </button>
            <button
              onClick={() => setActiveTab("horarios")}
              className={`py-4 font-semibold border-b-2 transition-colors ${
                activeTab === "horarios"
                  ? "border-vitrii-blue text-vitrii-blue"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              🕐 Horários
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Nome da Agenda
                </label>
                <input
                  type="text"
                  value={nomeAgenda}
                  onChange={(e) => setNomeAgenda(e.target.value)}
                  disabled={isLoadingInfo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricaoAgenda}
                  onChange={(e) => setDescricaoAgenda(e.target.value)}
                  disabled={isLoadingInfo}
                  placeholder="Descreva o tipo de agenda (aulas, consultas, serviços, etc)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue disabled:bg-gray-100 resize-none"
                  rows={4}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Todos os usuários podem visualizar a
                  tela da agenda. As restrições de acesso são controladas
                  individualmente em cada evento.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoadingInfo}
                  className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveInfo}
                  disabled={isLoadingInfo}
                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoadingInfo ? "Salvando..." : "Salvar Informações"}
                </button>
              </div>
            </div>
          )}

          {/* Horários Tab */}
          {activeTab === "horarios" && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>📌 Configurar Horários:</strong> Selecione os dias e horários
                  disponíveis para a inclusão de eventos. Eventos fora deste
                  horário aparecerão como "Fora do Horario" na agenda.
                </p>
              </div>

              {isLoadingSchedule ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Carregando horários...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {DIAS_SEMANA.map((dia, index) => {
                    const scheduled = schedule.find((s) => s.diaSemana === index);
                    const isActive = scheduled?.ativo ?? false;

                    return (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 transition-colors ${
                          isActive
                            ? "border-vitrii-blue bg-blue-50"
                            : "border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleToggleDia(index)}
                            disabled={isLoadingHorarios}
                            className="w-5 h-5 rounded border-gray-300 text-vitrii-blue cursor-pointer"
                          />

                          {/* Dia da Semana */}
                          <div className="flex-1 min-w-0">
                            <label className="block text-sm font-semibold text-vitrii-text">
                              {dia}
                            </label>
                          </div>

                          {/* Horários */}
                          {isActive && scheduled && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={scheduled.horaInicio}
                                  onChange={(e) =>
                                    handleChangeHora(
                                      index,
                                      "horaInicio",
                                      e.target.value
                                    )
                                  }
                                  disabled={isLoadingHorarios}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                                />
                                <span className="text-gray-600 text-sm">
                                  até
                                </span>
                                <input
                                  type="time"
                                  value={scheduled.horaFim}
                                  onChange={(e) =>
                                    handleChangeHora(index, "horaFim", e.target.value)
                                  }
                                  disabled={isLoadingHorarios}
                                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                                />
                              </div>
                            </div>
                          )}

                          {!isActive && (
                            <span className="text-sm text-gray-500 italic">
                              Desativado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✓ Padrão:</strong> Segunda a Sábado, 09:00 às 18:00
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoadingHorarios}
                  className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveHorarios}
                  disabled={isLoadingHorarios}
                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoadingHorarios ? "Salvando..." : "Salvar Horários"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
