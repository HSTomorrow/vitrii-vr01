import { useState, useEffect } from "react";
import { X, Plus, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ContatoSelectorModal from "./ContatoSelectorModal";

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRecurrence: (data: RecurrenceData) => Promise<void>;
  isLoading?: boolean;
  defaultStartDate?: Date;
}

export interface RecurrenceData {
  titulo: string;
  descricao?: string;
  dataInicio: Date;
  dataFim: Date;
  horaInicio: string;
  horaFim: string;
  recorrenciaType: "semanal" | "mensal";
  diasSemana?: number[]; // 0-6 (Sunday-Saturday)
  diaDoMes?: number; // 1-31
  recorrenciaDataInicio: Date;
  recorrenciaDataFim: Date;
  privacidade: string;
  cor: string;
  contatosPermitidos?: number[];
}

interface Contato {
  id: number;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  tipoContato: string;
}

const DIAS_SEMANA = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
];

export default function RecurrenceModal({
  isOpen,
  onClose,
  onCreateRecurrence,
  isLoading = false,
  defaultStartDate,
}: RecurrenceModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"basic" | "recurrence">("basic");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState(
    defaultStartDate ? defaultStartDate.toISOString().split("T")[0] : ""
  );
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFim, setHoraFim] = useState("10:00");
  const [privacidade, setPrivacidade] = useState("privado");
  const [cor, setCor] = useState("#3B82F6");

  // Contacts
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatosPermitidos, setContatosPermitidos] = useState<number[]>([]);
  const [isLoadingContatos, setIsLoadingContatos] = useState(false);
  const [showContatoSelector, setShowContatoSelector] = useState(false);

  // Recurrence settings
  const [recorrenciaType, setRecorrenciaType] = useState<"semanal" | "mensal">(
    "semanal"
  );
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]); // Default: weekdays
  const [diaDoMes, setDiaDoMes] = useState(1);
  const [recorrenciaDataInicio, setRecorrenciaDataInicio] = useState(
    dataInicio || new Date().toISOString().split("T")[0]
  );
  const [recorrenciaDataFim, setRecorrenciaDataFim] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Fetch contatos when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchContatos = async () => {
      setIsLoadingContatos(true);
      try {
        const response = await fetch("/api/contatos", {
          headers: {
            "X-User-Id": user?.id?.toString() || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setContatos(data.data || []);
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        toast.error("Erro ao carregar contatos");
      } finally {
        setIsLoadingContatos(false);
      }
    };

    fetchContatos();
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (!titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (!dataInicio) {
      toast.error("Data é obrigatória");
      return;
    }
    setStep("recurrence");
  };

  const handleToggleDiaSemana = (dia: number) => {
    setDiasSemana((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  };

  const handleCreateRecurrence = async () => {
    if (recorrenciaType === "semanal" && diasSemana.length === 0) {
      toast.error("Selecione ao menos um dia da semana");
      return;
    }

    if (!recorrenciaDataInicio || !recorrenciaDataFim) {
      toast.error("Data de início e fim são obrigatórias");
      return;
    }

    const startDate = new Date(recorrenciaDataInicio);
    const endDate = new Date(recorrenciaDataFim);

    if (startDate > endDate) {
      toast.error("Data de início não pode ser após a data de fim");
      return;
    }

    try {
      const data: RecurrenceData = {
        titulo,
        descricao: descricao || undefined,
        dataInicio: new Date(dataInicio),
        dataFim: new Date(dataInicio), // Will be adjusted per occurrence
        horaInicio,
        horaFim,
        recorrenciaType,
        diasSemana: recorrenciaType === "semanal" ? diasSemana : undefined,
        diaDoMes: recorrenciaType === "mensal" ? diaDoMes : undefined,
        recorrenciaDataInicio: startDate,
        recorrenciaDataFim: endDate,
        privacidade,
        cor,
        contatosPermitidos: contatosPermitidos.length > 0 ? contatosPermitidos : undefined,
      };

      await onCreateRecurrence(data);

      // Reset form
      setStep("basic");
      setTitulo("");
      setDescricao("");
      setDataInicio(defaultStartDate ? defaultStartDate.toISOString().split("T")[0] : "");
      setHoraInicio("09:00");
      setHoraFim("10:00");
      setPrivacidade("privado");
      setCor("#3B82F6");
      setContatosPermitidos([]);
      setDiasSemana([1, 2, 3, 4, 5]);
      setDiaDoMes(1);

      onClose();
    } catch (error) {
      console.error("Erro ao criar recorrência:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-vitrii-text">
            {step === "basic"
              ? "Criar Evento Recorrente"
              : "Configurar Recorrência"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "basic" ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Reunião Semanal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Adicione detalhes sobre o evento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Início
                    </label>
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Fim
                    </label>
                    <input
                      type="time"
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Privacidade
                  </label>
                  <select
                    value={privacidade}
                    onChange={(e) => setPrivacidade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  >
                    <option value="publico">🌍 Público</option>
                    <option value="privado_usuarios">👥 Restrita</option>
                    <option value="privado">🔒 Privado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Cor
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cor}
                      onChange={(e) => setCor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600">{cor}</span>
                  </div>
                </div>
              </div>

              {/* Contatos */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Contatos (Opcional)
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Selecione os contatos associados a estes eventos recorrentes
                  </p>
                </div>

                {/* Selected Contacts List */}
                {contatosPermitidos.length > 0 ? (
                  <div className="bg-white rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {contatosPermitidos.map((contatoId) => {
                      const contato = contatos.find((c) => c.id === contatoId);
                      if (!contato) return null;
                      return (
                        <div
                          key={contatoId}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200"
                        >
                          <div className="text-sm flex-1">
                            <div className="font-medium text-vitrii-text">{contato.nome}</div>
                            <div className="text-xs text-gray-600">{contato.tipoContato}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setContatosPermitidos(
                                contatosPermitidos.filter((id) => id !== contatoId)
                              );
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
                  className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Contato
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recurrence Type */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-3">
                  Tipo de Recorrência
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRecorrenciaType("semanal")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      recorrenciaType === "semanal"
                        ? "border-vitrii-blue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-semibold text-vitrii-text">📅 Semanal</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Selecione os dias da semana
                    </p>
                  </button>

                  <button
                    onClick={() => setRecorrenciaType("mensal")}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      recorrenciaType === "mensal"
                        ? "border-vitrii-blue bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <h4 className="font-semibold text-vitrii-text">📆 Mensal</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Dia fixo do mês
                    </p>
                  </button>
                </div>
              </div>

              {/* Weekly Configuration */}
              {recorrenciaType === "semanal" && (
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-3">
                    Selecione os dias da semana
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.value}
                        onClick={() => handleToggleDiaSemana(dia.value)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          diasSemana.includes(dia.value)
                            ? "border-vitrii-blue bg-blue-50 text-vitrii-blue font-semibold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Configuration */}
              {recorrenciaType === "mensal" && (
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-3">
                    Dia do mês (1-31)
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <button
                        key={dia}
                        onClick={() => setDiaDoMes(dia)}
                        className={`p-2 border rounded-lg text-sm transition-all ${
                          diaDoMes === dia
                            ? "border-vitrii-blue bg-blue-50 text-vitrii-blue font-semibold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {dia}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-3">
                  Período da Recorrência
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data de Início
                    </label>
                    <input
                      type="date"
                      value={recorrenciaDataInicio}
                      onChange={(e) => setRecorrenciaDataInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={recorrenciaDataFim}
                      onChange={(e) => setRecorrenciaDataFim(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-vitrii-text mb-2">
                  ℹ️ Resumo
                </h4>
                <p className="text-sm text-gray-700">
                  <strong>Título:</strong> {titulo}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Tipo:</strong>{" "}
                  {recorrenciaType === "semanal"
                    ? `Semanal (${diasSemana.map((d) => DIAS_SEMANA[d].label).join(", ")})`
                    : `Mensal (dia ${diaDoMes})`}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Período:</strong> {recorrenciaDataInicio} a{" "}
                  {recorrenciaDataFim}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Horário:</strong> {horaInicio} às {horaFim}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 p-6 border-t border-gray-200 bg-gray-50">
          {step === "recurrence" && (
            <button
              onClick={() => setStep("basic")}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-100 transition-colors font-semibold"
            >
              Voltar
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancelar
          </button>

          {step === "basic" ? (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              Próximo
            </button>
          ) : (
            <button
              onClick={handleCreateRecurrence}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50"
            >
              {isLoading ? "Criando..." : "Criar Recorrência"}
            </button>
          )}
        </div>
      </div>

      {/* Contato Selector Modal */}
      <ContatoSelectorModal
        isOpen={showContatoSelector}
        onClose={() => setShowContatoSelector(false)}
        onSelect={(contatoId) => {
          if (!contatosPermitidos.includes(contatoId)) {
            setContatosPermitidos([...contatosPermitidos, contatoId]);
          }
        }}
        selectedContatoIds={contatosPermitidos}
        userId={user?.id}
      />
    </div>
  );
}
