import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Plus, Trash2, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  filaId?: number;
}

interface FilaDeEsperaUsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventoId: number;
  anuncianteId: number;
  isOwner: boolean;
}

export default function FilaDeEsperaUsuariosModal({
  isOpen,
  onClose,
  eventoId,
  anuncianteId,
  isOwner,
}: FilaDeEsperaUsuariosModalProps) {
  const { user } = useAuth();
  const [linkedUsuarios, setLinkedUsuarios] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Usuario[]>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRemoving, setIsRemoving] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && isOwner) {
      loadLinkedUsuarios();
    }
  }, [isOpen, isOwner, eventoId]);

  const loadLinkedUsuarios = async () => {
    setIsLoadingLinked(true);
    try {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/eventos-agenda/${eventoId}/fila-espera/usuarios`,
        {
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao carregar usuários");
      }

      const result = await response.json();
      setLinkedUsuarios(result.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao carregar usuários"
      );
    } finally {
      setIsLoadingLinked(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um nome ou email para buscar");
      return;
    }

    setIsSearching(true);
    try {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/usuarios/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar usuários");
      }

      const result = await response.json();
      setSearchResults(result.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao buscar usuários"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUsuario = async (usuario: Usuario) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/eventos-agenda/${eventoId}/fila-espera/usuarios`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ usuarioId: usuario.id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar usuário");
      }

      toast.success("Usuário adicionado à fila de espera!");
      setSearchQuery("");
      setSearchResults([]);
      loadLinkedUsuarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao adicionar usuário"
      );
    }
  };

  const handleRemoveUsuario = async (filaId: number) => {
    if (!confirm("Tem certeza que deseja remover este usuário da fila?")) {
      return;
    }

    setIsRemoving(filaId);
    try {
      const headers: Record<string, string> = {};
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/eventos-agenda/${eventoId}/fila-espera/${filaId}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao remover usuário");
      }

      toast.success("Usuário removido da fila de espera!");
      loadLinkedUsuarios();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover usuário"
      );
    } finally {
      setIsRemoving(null);
    }
  };

  if (!isOpen) return null;

  if (!isOwner) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-vitrii-text">
              Fila de Espera do Evento
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600">
              Apenas o responsável pela agenda pode gerenciar a fila de espera.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-vitrii-text">
            Fila de Espera do Evento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Search Section */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-3">
              Adicionar Usuário à Fila
            </label>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((usuario) => {
                  const isAlreadyLinked = linkedUsuarios.some(
                    (u) => u.id === usuario.id
                  );
                  return (
                    <div
                      key={usuario.id}
                      className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-vitrii-text">
                          {usuario.nome}
                        </p>
                        <p className="text-xs text-gray-600">{usuario.email}</p>
                      </div>
                      {isAlreadyLinked ? (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded">
                          Na fila
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddUsuario(usuario)}
                          className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Linked Usuarios */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-3">
              Usuários na Fila ({linkedUsuarios.length})
            </label>
            {isLoadingLinked ? (
              <div className="text-center text-gray-500">
                Carregando usuários...
              </div>
            ) : linkedUsuarios.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Nenhum usuário na fila de espera ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedUsuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center justify-between bg-white p-4 rounded border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-vitrii-text">
                        {usuario.nome}
                      </p>
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveUsuario(usuario.filaId || 0)}
                      disabled={isRemoving === usuario.filaId}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-300 text-vitrii-text rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
