import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, MessageSquare, Search } from "lucide-react";

interface Conversa {
  id: number;
  usuarioId: number;
  lojaId: number;
  assunto: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  tipo: "publica" | "privada";
  usuario: {
    id: number;
    nome: string;
  };
  loja: {
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
  lojaId?: number;
  onSelectConversa: (conversa: Conversa) => void;
  selectedConversaId?: number;
}

export default function ConversaList({
  usuarioId,
  lojaId,
  onSelectConversa,
  selectedConversaId,
}: ConversaListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todas" | "publica" | "privada">("todas");

  // Fetch conversations
  const { data: conversasData, isLoading } = useQuery({
    queryKey: ["conversas", usuarioId, lojaId],
    queryFn: async () => {
      let url = "/api/conversas?";
      if (usuarioId) url += `usuarioId=${usuarioId}&`;
      if (lojaId) url += `lojaId=${lojaId}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Erro ao buscar conversas");
      return response.json();
    },
  });

  const conversas = conversasData?.data || [];

  // Filter conversations
  const filteredConversas = conversas.filter((conv: Conversa) => {
    const matchSearch =
      conv.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.loja.nome.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === "todas" || conv.tipo === filterType;

    return matchSearch && matchType;
  });

  // Delete conversation mutation
  const deleteConversaMutation = useMutation({
    mutationFn: async (conversaId: number) => {
      const response = await fetch(`/api/conversas/${conversaId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar conversa");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversas", usuarioId, lojaId] });
      toast.success("Conversa deletada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }

    if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }

    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 space-y-4">
        <h2 className="font-bold text-walmart-text text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Mensagens
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 text-sm">
          {(["todas", "publica", "privada"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                filterType === type
                  ? "bg-walmart-blue text-white"
                  : "bg-gray-100 text-walmart-text hover:bg-gray-200"
              }`}
            >
              {type === "todas" && "Todas"}
              {type === "publica" && "Públicas"}
              {type === "privada" && "Privadas"}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-walmart-text-secondary">Carregando conversas...</p>
          </div>
        ) : filteredConversas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
            <p className="text-walmart-text-secondary">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversas.map((conversa: Conversa) => (
              <button
                key={conversa.id}
                onClick={() => onSelectConversa(conversa)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                  selectedConversaId === conversa.id
                    ? "border-walmart-blue bg-blue-50"
                    : "border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-walmart-text truncate">
                      {conversa.assunto}
                    </p>
                    <p className="text-sm text-walmart-text-secondary">
                      {conversa.loja.nome} • {conversa.usuario.nome}
                    </p>
                    {conversa.anuncio && (
                      <p className="text-xs text-gray-500 truncate">
                        📢 {conversa.anuncio.titulo}
                      </p>
                    )}
                    {conversa.ultimaMensagem && (
                      <p className="text-sm text-walmart-text-secondary truncate mt-1">
                        {conversa.ultimaMensagem}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs text-walmart-text-secondary">
                      {formatDate(conversa.dataUltimaMensagem || conversa.dataCriacao)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        conversa.tipo === "publica"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {conversa.tipo === "publica" ? "Pública" : "Privada"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Button (shown when conversation selected) */}
      {selectedConversaId && (
        <div className="border-t border-gray-200 p-4">
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
        </div>
      )}
    </div>
  );
}
