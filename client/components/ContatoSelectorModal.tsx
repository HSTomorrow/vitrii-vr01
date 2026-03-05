import { useState, useEffect } from "react";
import { X, Search, ChevronLeft, ChevronRight, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import NewContatoModal from "./NewContatoModal";

interface Contato {
  id: number;
  nome: string;
  celular: string;
  telefone?: string;
  email?: string;
  tipoContato: string;
}

interface ContatoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contatoId: number) => void;
  selectedContatoIds: number[];
  anuncianteId?: number;
  userId?: number;
}

const ITEMS_PER_PAGE = 20;

export default function ContatoSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedContatoIds,
  anuncianteId,
  userId,
}: ContatoSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewContatoModal, setShowNewContatoModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchContatos = async () => {
      setIsLoading(true);
      try {
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
              if (!anuncianteId) return true;
              return !contato.anuncianteId || contato.anuncianteId === anuncianteId;
            });
          setContatos(contatosList);
          setCurrentPage(1);
        }
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
        toast.error("Erro ao carregar contatos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContatos();
  }, [isOpen, anuncianteId, userId]);

  // Filter contatos based on search term
  const filteredContatos = contatos.filter((contato) =>
    contato.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contato.celular.includes(searchTerm) ||
    (contato.email && contato.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredContatos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const contatosExibidos = filteredContatos.slice(startIndex, endIndex);

  const handleSelectContato = (contatoId: number) => {
    onSelect(contatoId);
  };

  const handleNewContatoSuccess = (novoContato: Contato) => {
    // Add the new contact to the list
    setContatos([...contatos, novoContato]);
    setShowNewContatoModal(false);
    setCurrentPage(1);
    setSearchTerm("");
    // Optionally auto-select the newly created contact
    onSelect(novoContato.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-vitrii-text">
            Selecionar Contatos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-600">Carregando contatos...</p>
            </div>
          ) : contatosExibidos.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-gray-600">
                {filteredContatos.length === 0
                  ? "Nenhum contato encontrado"
                  : "Nenhum contato nesta página"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {contatosExibidos.map((contato) => {
                const isSelected = selectedContatoIds.includes(contato.id);
                return (
                  <button
                    key={contato.id}
                    onClick={() => handleSelectContato(contato.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? "border-vitrii-blue bg-blue-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-vitrii-text truncate">
                            {contato.nome}
                          </h3>
                          {isSelected && (
                            <Check className="w-5 h-5 text-vitrii-blue flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 space-y-1 mt-1">
                          <p>{contato.celular}</p>
                          {contato.email && <p>{contato.email}</p>}
                          <p className="text-vitrii-blue font-medium">
                            {contato.tipoContato}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({filteredContatos.length} contatos)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0 space-y-3">
          <button
            onClick={() => setShowNewContatoModal(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Fechar
          </button>
        </div>

        {/* New Contact Modal */}
        <NewContatoModal
          isOpen={showNewContatoModal}
          onClose={() => setShowNewContatoModal(false)}
          onSuccess={handleNewContatoSuccess}
          existingContatos={contatos}
        />
      </div>
    </div>
  );
}
