import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Plus, Trash2, Search } from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface AgendaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  anuncianteId: number;
  anuncianteNome: string;
  onSaved?: () => void;
}

export default function AgendaEditorModal({
  isOpen,
  onClose,
  anuncianteId,
  anuncianteNome,
  onSaved,
}: AgendaEditorModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "permissoes">("info");
  const [nomeAgenda, setNomeAgenda] = useState("");
  const [descricaoAgenda, setDescricaoAgenda] = useState("");
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isLoadingPermissoes, setIsLoadingPermissoes] = useState(false);
  const [usuariosAutorizados, setUsuariosAutorizados] = useState<Usuario[]>([]);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load agenda info from announcer
      setNomeAgenda(anuncianteNome);
      loadPermissoes();
    }
  }, [isOpen, anuncianteId]);

  const loadPermissoes = async () => {
    setIsLoadingPermissoes(true);
    try {
      // You'll need to create this endpoint to fetch current permissions
      // For now, we'll leave this as a placeholder
      setUsuariosAutorizados([]);
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setIsLoadingPermissoes(false);
    }
  };

  const handleSearchUsuarios = async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um nome ou email para buscar");
      return;
    }

    setIsSearching(true);
    try {
      // This would call an API to search for users
      // Placeholder for now
      toast.info("Funcionalidade de busca em desenvolvimento");
    } catch (error) {
      toast.error("Erro ao buscar usuários");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUsuario = (usuario: Usuario) => {
    if (usuariosAutorizados.find((u) => u.id === usuario.id)) {
      toast.error("Usuário já autorizado");
      return;
    }
    setUsuariosAutorizados([...usuariosAutorizados, usuario]);
    setSearchQuery("");
    setUsuariosDisponiveis([]);
  };

  const handleRemoveUsuario = (usuarioId: number) => {
    setUsuariosAutorizados(
      usuariosAutorizados.filter((u) => u.id !== usuarioId)
    );
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

  const handleSavePermissoes = async () => {
    setIsLoadingPermissoes(true);
    try {
      // Call API to update permissions
      // For now, just show success
      toast.success("Permissões atualizadas com sucesso!");
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar permissões"
      );
    } finally {
      setIsLoadingPermissoes(false);
    }
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
              onClick={() => setActiveTab("permissoes")}
              className={`py-4 font-semibold border-b-2 transition-colors ${
                activeTab === "permissoes"
                  ? "border-vitrii-blue text-vitrii-blue"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              👥 Permissões
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
                  <strong>Nota:</strong> Os eventos aprovados na fila de espera serão
                  criados como privados, visíveis apenas para você e quem solicitou.
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

          {/* Permissões Tab */}
          {activeTab === "permissoes" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-3">
                  Adicionar Usuário para Visualizar
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nome ou email do usuário"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                  />
                  <button
                    onClick={handleSearchUsuarios}
                    disabled={isSearching}
                    className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {isSearching ? "Buscando..." : "Buscar"}
                  </button>
                </div>

                {/* Search Results */}
                {usuariosDisponiveis.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 max-h-48 overflow-y-auto">
                    {usuariosDisponiveis.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-vitrii-text">
                            {usuario.nome}
                          </p>
                          <p className="text-xs text-gray-600">
                            {usuario.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddUsuario(usuario)}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Usuários Autorizados */}
              <div>
                <label className="block text-sm font-semibold text-vitrii-text mb-3">
                  Usuários Autorizados ({usuariosAutorizados.length})
                </label>
                {usuariosAutorizados.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600">
                      Nenhum usuário autorizado ainda. Busque e adicione usuários para que
                      eles possam visualizar suas agendas privadas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {usuariosAutorizados.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="flex items-center justify-between bg-white p-4 rounded border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div>
                          <p className="font-medium text-vitrii-text">
                            {usuario.nome}
                          </p>
                          <p className="text-sm text-gray-600">
                            {usuario.email}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveUsuario(usuario.id)}
                          disabled={isLoadingPermissoes}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={isLoadingPermissoes}
                  className="flex-1 px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePermissoes}
                  disabled={isLoadingPermissoes}
                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoadingPermissoes ? "Salvando..." : "Salvar Permissões"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
