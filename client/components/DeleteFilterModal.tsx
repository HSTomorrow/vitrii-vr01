import { useState, useMemo } from "react";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Evento {
  id: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim: string;
  privacidade: string;
  cor: string;
  contatos?: Array<{ contatoId: number }>;
}

interface Contato {
  id: number;
  nome: string;
  tipoContato: string;
}

interface DeleteFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (eventoIds: number[]) => Promise<void>;
  eventos: Evento[];
  contatos: Contato[];
  isLoading?: boolean;
}

export default function DeleteFilterModal({
  isOpen,
  onClose,
  onDelete,
  eventos,
  contatos,
  isLoading = false,
}: DeleteFilterModalProps) {
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterDescricao, setFilterDescricao] = useState("");
  const [filterContatoId, setFilterContatoId] = useState<number | null>(null);

  if (!isOpen) return null;

  // Apply filters to get matching events
  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      // Filter by start date
      if (filterDataInicio) {
        const eventoStart = new Date(evento.dataInicio);
        const filterStart = new Date(filterDataInicio);
        if (eventoStart < filterStart) return false;
      }

      // Filter by end date
      if (filterDataFim) {
        const eventoEnd = new Date(evento.dataFim);
        const filterEnd = new Date(filterDataFim);
        if (eventoEnd > filterEnd) return false;
      }

      // Filter by description
      if (filterDescricao) {
        if (
          !evento.titulo.toLowerCase().includes(filterDescricao.toLowerCase()) &&
          !evento.descricao?.toLowerCase().includes(filterDescricao.toLowerCase())
        ) {
          return false;
        }
      }

      // Filter by contact
      if (filterContatoId) {
        const hasContato = (evento.contatos || []).some(
          (c: any) => c.contatoId === filterContatoId
        );
        if (!hasContato) return false;
      }

      return true;
    });
  }, [eventos, filterDataInicio, filterDataFim, filterDescricao, filterContatoId]);

  const handleDelete = async () => {
    if (filteredEventos.length === 0) {
      toast.error("Nenhum evento selecionado para deletar");
      return;
    }

    const confirmMessage = `Você tem certeza que deseja deletar ${filteredEventos.length} evento(s)?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const eventoIds = filteredEventos.map((e) => e.id);
      await onDelete(eventoIds);
      
      // Reset filters
      setFilterDataInicio("");
      setFilterDataFim("");
      setFilterDescricao("");
      setFilterContatoId(null);

      onClose();
    } catch (error) {
      console.error("Erro ao deletar eventos:", error);
    }
  };

  const handleClearFilters = () => {
    setFilterDataInicio("");
    setFilterDataFim("");
    setFilterDescricao("");
    setFilterContatoId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-vitrii-text flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Deletar Eventos com Filtros
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">
                Atenção: Esta ação é irreversível
              </h3>
              <p className="text-sm text-red-700">
                Os eventos deletados não poderão ser recuperados. Use os filtros abaixo para selecionar exatamente quais eventos deseja remover.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="font-semibold text-vitrii-text mb-4">Selecione os critérios de filtro:</h3>
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Data de Início (a partir de)
                  </label>
                  <input
                    type="date"
                    value={filterDataInicio}
                    onChange={(e) => setFilterDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-vitrii-text mb-2">
                    Data de Fim (até)
                  </label>
                  <input
                    type="date"
                    value={filterDataFim}
                    onChange={(e) => setFilterDataFim(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                </div>
              </div>

              {/* Description/Title */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Descrição ou Título (contém)
                </label>
                <input
                  type="text"
                  placeholder="Busque por parte do título ou descrição..."
                  value={filterDescricao}
                  onChange={(e) => setFilterDescricao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-2">
                  Contato
                </label>
                <select
                  value={filterContatoId || ""}
                  onChange={(e) =>
                    setFilterContatoId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                >
                  <option value="">Todos os contatos</option>
                  {contatos.map((contato) => (
                    <option key={contato.id} value={contato.id}>
                      {contato.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-vitrii-text mb-3">
              ℹ️ Eventos que serão deletados ({filteredEventos.length})
            </h3>
            {filteredEventos.length === 0 ? (
              <p className="text-sm text-gray-600 italic">
                Nenhum evento encontrado com os filtros selecionados
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filteredEventos.map((evento) => (
                  <div key={evento.id} className="p-2 bg-white rounded border border-blue-200 text-sm">
                    <p className="font-semibold text-vitrii-text">{evento.titulo}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(evento.dataInicio).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(evento.dataInicio).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {evento.descricao && (
                      <p className="text-xs text-gray-500 mt-1">{evento.descricao}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filter actions */}
          {(filterDataInicio || filterDataFim || filterDescricao || filterContatoId) && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-vitrii-blue hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-100 transition-colors font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={handleDelete}
            disabled={isLoading || filteredEventos.length === 0}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50"
          >
            {isLoading ? "Deletando..." : `Deletar ${filteredEventos.length} evento(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
