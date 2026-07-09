import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  MessageSquare,
  Search,
  Reply,
  Archive,
  Sparkles,
} from "lucide-react";

interface Conversa {
  id: number;
  usuarioId: number;
  anuncianteId: number;
  assunto: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  dataCriacao: string;
  tipo: "publica" | "privada";
  dataExclusao?: string | null;
  usuario: {
    id: number;
    nome: string;
  };
  anunciante: {
    id: number;
    nome: string;
  };
  anuncio?: {
    id: number;
    titulo: string;
  };
}

interface ConversaListProps {
  usuarioId: number;
  anuncianteId?: number;
  onSelectConversa: (conversa: Conversa) => void;
  selectedConversaId?: number;
  onResponder?: () => void;
}

type FilterType = "todas" | "publica" | "privada" | "deletadas";

export default function ConversaList({
  usuarioId,
  anuncianteId,
  onSelectConversa,
  selectedConversaId,
  onResponder,
}: ConversaListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("todas");

  // Fetch conversations
  const { data: conversasData, isLoading } = useQuery({
    queryKey: ["conversas", usuarioId, anuncianteId],
    queryFn: async () => {
      let url = "/api/conversas?";
      if (usuarioId) url += `usuarioId=${usuarioId}&`;
      if (anuncianteId) url += `anuncianteId=${anuncianteId}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar conversas");
      return response.json();
    },
  });

  const conversas: Conversa[] = conversasData?.data || [];
  const conversasDeletadas = conversas.filter((c) => !!c.dataExclusao);

  // Filter conversations
  const filteredConversas = conversas.filter((conv: Conversa) => {
    const matchSearch =
      conv.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.anunciante.nome.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (filterType === "deletadas") return !!conv.dataExclusao;
    if (conv.dataExclusao) return false;

    return filterType === "todas" || conv.tipo === filterType;
  });

  const selectedConversa = conversas.find((c) => c.id === selectedConversaId);

  // Delete conversation mutation (soft delete — kept in the DB for audit)
  const deleteConversaMutation = useMutation({
    mutationFn: async (conversaId: number) => {
      const response = await fetch(`/api/conversas/${conversaId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar conversa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversas", usuarioId, anuncianteId],
      });
      toast.success("Conversa deletada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  // Clears deleted conversations from view entirely (both tabs) — rows stay in
  // the DB for audit, per the "limpar" request.
  const limparDeletadasMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/conversas/limpar-deletadas", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Erro ao limpar conversas deletadas");
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["conversas", usuarioId, anuncianteId],
      });
      toast.success(
        result?.data?.count
          ? `${result.data.count} conversa(s) removida(s) da tela`
          : "Nenhuma conversa deletada para limpar",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao limpar");
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }

    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  };

  const filterLabels: Record<FilterType, string> = {
    todas: "Todas",
    publica: "Públicas",
    privada: "Privadas",
    deletadas: "Deletadas",
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 space-y-4 bg-gradient-to-b from-blue-50/60 to-white">
        <h2 className="font-bold text-vitrii-text text-lg flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-vitrii-blue text-white">
            <MessageSquare className="w-4 h-4" />
          </span>
          Mensagens
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-vitrii-blue focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 text-sm">
          {(["todas", "publica", "privada", "deletadas"] as const).map(
            (type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                  filterType === type
                    ? type === "deletadas"
                      ? "bg-red-500 text-white"
                      : "bg-vitrii-blue text-white"
                    : "bg-gray-100 text-vitrii-text hover:bg-gray-200"
                }`}
              >
                {type === "deletadas" && <Archive className="w-3.5 h-3.5" />}
                {filterLabels[type]}
                {type === "deletadas" && conversasDeletadas.length > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 ${
                      filterType === "deletadas"
                        ? "bg-white/20"
                        : "bg-gray-200"
                    }`}
                  >
                    {conversasDeletadas.length}
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        {filterType === "deletadas" && conversasDeletadas.length > 0 && (
          <button
            onClick={() => {
              if (
                confirm(
                  "Limpar as conversas deletadas? Elas somem da tela, mas continuam salvas no banco de dados para auditoria.",
                )
              ) {
                limparDeletadasMutation.mutate();
              }
            }}
            disabled={limparDeletadasMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {limparDeletadasMutation.isPending
              ? "Limpando..."
              : "Limpar Deletadas"}
          </button>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-vitrii-text-secondary">
              Carregando conversas...
            </p>
          </div>
        ) : filteredConversas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            {filterType === "deletadas" ? (
              <>
                <Archive className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-vitrii-text-secondary">
                  Nenhuma conversa deletada
                </p>
              </>
            ) : (
              <>
                <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-vitrii-text-secondary">
                  {searchTerm
                    ? "Nenhuma conversa encontrada"
                    : "Nenhuma conversa ainda"}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversas.map((conversa: Conversa) => {
              const isDeleted = !!conversa.dataExclusao;
              const avatarLetter = (
                conversa.anunciante.nome || "?"
              )
                .charAt(0)
                .toUpperCase();

              return (
                <button
                  key={conversa.id}
                  onClick={() => onSelectConversa(conversa)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                    selectedConversaId === conversa.id
                      ? isDeleted
                        ? "border-red-400 bg-red-50/60"
                        : "border-vitrii-blue bg-blue-50"
                      : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold text-white flex-shrink-0 ${
                        isDeleted ? "bg-gray-400" : "bg-vitrii-blue"
                      }`}
                    >
                      {avatarLetter}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`font-semibold truncate ${
                            isDeleted
                              ? "text-vitrii-text-secondary line-through"
                              : "text-vitrii-text"
                          }`}
                        >
                          {conversa.assunto}
                        </p>
                        <span className="text-xs text-vitrii-text-secondary flex-shrink-0">
                          {formatDate(
                            conversa.dataExclusao ||
                              conversa.dataUltimaMensagem ||
                              conversa.dataCriacao,
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-vitrii-text-secondary truncate">
                        {conversa.anunciante.nome} • {conversa.usuario.nome}
                      </p>
                      {conversa.anuncio && (
                        <p className="text-xs text-gray-500 truncate">
                          📢 {conversa.anuncio.titulo}
                        </p>
                      )}
                      {conversa.ultimaMensagem && (
                        <p className="text-sm text-vitrii-text-secondary truncate mt-1">
                          {conversa.ultimaMensagem}
                        </p>
                      )}

                      <div className="mt-1.5">
                        {isDeleted ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 inline-flex items-center gap-1">
                            <Archive className="w-3 h-3" />
                            Deletada
                          </span>
                        ) : (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              conversa.tipo === "publica"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {conversa.tipo === "publica"
                              ? "Pública"
                              : "Privada"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions (shown when conversation selected) */}
      {selectedConversaId && selectedConversa && (
        <div className="border-t border-gray-100 p-4 space-y-2">
          {selectedConversa.dataExclusao ? (
            <p className="text-xs text-center text-vitrii-text-secondary flex items-center justify-center gap-1">
              <Archive className="w-3.5 h-3.5" />
              Conversa deletada — mantida no banco para auditoria
            </p>
          ) : (
            <>
              <button
                onClick={() => onResponder?.()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-vitrii-blue rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                <Reply className="w-4 h-4" />
                Responder
              </button>
              <button
                onClick={() => {
                  if (confirm("Tem certeza que deseja deletar esta conversa?")) {
                    deleteConversaMutation.mutate(selectedConversaId);
                  }
                }}
                disabled={deleteConversaMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Deletar Conversa
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
