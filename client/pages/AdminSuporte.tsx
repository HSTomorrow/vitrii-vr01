import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, MessagesSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import ChatBox from "@/components/ChatBox";

interface ConversaResumo {
  id: number;
  usuarioId: number;
  anuncianteId: number;
  assunto: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  dataCriacao: string;
  usuario: { id: number; nome: string; email: string };
}

export default function AdminSuporte() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!user || user.tipoUsuario !== "adm") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Acesso Negado
            </h1>
            <p className="text-gray-600">
              Apenas administradores podem acessar esta página.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { data: conversasData, isLoading: listLoading } = useQuery({
    queryKey: ["suporte-admin-conversas"],
    queryFn: async () => {
      const response = await fetch("/api/suporte/admin/conversas");
      if (!response.ok) throw new Error("Erro ao buscar conversas de suporte");
      return response.json();
    },
    refetchInterval: 10000,
  });

  const conversas: ConversaResumo[] = conversasData?.data || [];
  const selectedConversa = conversas.find((c) => c.id === selectedId);

  const { data: detalheData, refetch: refetchDetalhe } = useQuery({
    queryKey: ["conversa", selectedId],
    queryFn: async () => {
      const response = await fetch(`/api/conversas/${selectedId}`);
      if (!response.ok) throw new Error("Erro ao buscar conversa");
      return response.json();
    },
    enabled: !!selectedId,
    refetchInterval: 10000,
  });

  const conversa = detalheData?.data;
  const messages = conversa?.mensagens || [];

  const handleSelect = (conversaId: number) => {
    setSelectedId(conversaId);
    fetch(`/api/conversas/${conversaId}/read`, { method: "PATCH" }).catch(
      (err) => console.error("Error marking as read:", err),
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-vitrii-gray-light flex flex-col">
      <Header />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <h1 className="text-2xl font-bold text-vitrii-text flex items-center gap-2 mb-6">
          <MessagesSquare className="w-6 h-6 text-vitrii-blue" />
          Suporte
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* List */}
          <div className="md:col-span-1 flex flex-col h-full bg-white rounded-xl shadow-md overflow-hidden">
            <div className="border-b border-gray-100 p-4 bg-gradient-to-b from-blue-50/60 to-white">
              <h2 className="font-bold text-vitrii-text">Conversas</h2>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {listLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-vitrii-text-secondary">Carregando...</p>
                </div>
              ) : conversas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <MessagesSquare className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-vitrii-text-secondary">
                    Nenhuma conversa de suporte ainda
                  </p>
                </div>
              ) : (
                conversas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      selectedId === c.id
                        ? "border-vitrii-blue bg-blue-50"
                        : "border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-vitrii-blue text-white text-sm font-semibold flex-shrink-0">
                        {c.usuario.nome.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-vitrii-text truncate">
                            {c.usuario.nome}
                          </p>
                          <span className="text-xs text-vitrii-text-secondary flex-shrink-0">
                            {formatDate(c.dataUltimaMensagem || c.dataCriacao)}
                          </span>
                        </div>
                        <p className="text-sm text-vitrii-text-secondary truncate">
                          {c.ultimaMensagem || "Sem mensagens ainda"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="md:col-span-2">
            {selectedConversa && conversa ? (
              <div className="flex flex-col h-full">
                <div className="rounded-t-lg shadow-md border-b border-gray-200 bg-white p-4">
                  <h2 className="font-bold text-vitrii-text text-lg">
                    {selectedConversa.usuario.nome}
                  </h2>
                  <p className="text-sm text-vitrii-text-secondary">
                    {selectedConversa.usuario.email}
                  </p>
                </div>
                <ChatBox
                  conversaId={selectedConversa.id}
                  messages={messages}
                  currentUserId={selectedConversa.anuncianteId}
                  tipoUsuario="anunciante"
                  onNewMessage={() => {
                    refetchDetalhe();
                    queryClient.invalidateQueries({
                      queryKey: ["suporte-admin-conversas"],
                    });
                  }}
                  userCpf="-"
                  userTelefone="-"
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center h-full">
                <div className="text-center">
                  <MessagesSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-vitrii-text-secondary text-lg">
                    Selecione uma conversa para responder
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
