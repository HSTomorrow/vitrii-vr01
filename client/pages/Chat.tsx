import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ConversaList from "../components/ConversaList";
import ChatBox from "../components/ChatBox";
import CreateConversaModal from "../components/CreateConversaModal";
import ProfileCompletionGate from "../components/ProfileCompletionGate";

interface Message {
  id: number;
  conteudo: string;
  tipoRemetente: "usuario" | "anunciante";
  dataCriacao: string;
  lido: boolean;
  remetente: {
    id: number;
    nome: string;
  };
}

interface Conversa {
  id: number;
  usuarioId: number;
  anuncianteId: number;
  assunto: string;
  ultimaMensagem: string;
  dataUltimaMensagem: string;
  tipo: "publica" | "privada";
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
  mensagens?: Message[];
}

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);

  // Fetch selected conversation with messages
  const { data: conversaData, refetch: refetchConversa } = useQuery({
    queryKey: ["conversa", selectedConversa?.id],
    queryFn: async () => {
      if (!selectedConversa) return null;

      const response = await fetch(`/api/conversas/${selectedConversa.id}`);
      if (!response.ok) throw new Error("Erro ao buscar conversa");
      return response.json();
    },
    enabled: !!selectedConversa,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  const conversa = conversaData?.data;
  const messages = conversa?.mensagens || [];

  // Mark conversation as read
  useEffect(() => {
    if (selectedConversa?.id) {
      fetch(`/api/conversas/${selectedConversa.id}/read`, {
        method: "PATCH",
      }).catch((err) => console.error("Error marking as read:", err));
    }
  }, [selectedConversa?.id]);

  const handleNewMessage = (message: Message) => {
    // This is called when a new message is sent
    // The query will refetch automatically due to the 3-second poll
    refetchConversa();
  };

  const handleCreateConversa = () => {
    // Check if user has completed their profile
    if (!user?.cpf || !user?.telefone) {
      setShowProfileGate(true);
      return;
    }
    setShowCreateModal(true);
  };

  const handleConversaCreated = (novaConversa: Conversa) => {
    queryClient.invalidateQueries({ queryKey: ["conversas"] });
    setSelectedConversa(novaConversa);
    setShowCreateModal(false);
    toast.success("Conversa iniciada!");
  };

  return (
    <div className="min-h-screen bg-vitrii-gray-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center text-vitrii-blue hover:text-vitrii-blue-dark font-semibold"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Link>
          <h1 className="text-2xl font-bold text-vitrii-text">
            Minhas Mensagens
          </h1>
          <button
            onClick={handleCreateConversa}
            className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversation List */}
          <div className="md:col-span-1">
            <ConversaList
              usuarioId={user?.id || 0}
              onSelectConversa={(conversa) => setSelectedConversa(conversa)}
              selectedConversaId={selectedConversa?.id}
            />
          </div>

          {/* Chat Box */}
          <div className="md:col-span-2">
            {selectedConversa && conversa ? (
              <div className="flex flex-col h-full">
                {/* Conversation Header */}
                <div className="bg-white rounded-t-lg shadow-md border-b border-gray-200 p-4">
                  <h2 className="font-bold text-vitrii-text text-lg">
                    {selectedConversa.assunto}
                  </h2>
                  <p className="text-sm text-vitrii-text-secondary">
                    com {selectedConversa.anunciante.nome} •{" "}
                    {selectedConversa.usuario.nome}
                  </p>
                  {selectedConversa.anuncio && (
                    <p className="text-sm text-gray-500 mt-2">
                      📢 Sobre: {selectedConversa.anuncio.titulo}
                    </p>
                  )}
                </div>

                {/* Chat Box */}
                <ChatBox
                  conversaId={selectedConversa.id}
                  messages={messages}
                  currentUserId={user?.id || 0}
                  tipoUsuario="usuario"
                  onNewMessage={handleNewMessage}
                  userCpf={user?.cpf}
                  userTelefone={user?.telefone}
                  onProfileIncomplete={() => setShowProfileGate(true)}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-vitrii-text-secondary text-lg mb-4">
                    Selecione uma conversa para começar
                  </p>
                  <button
                    onClick={handleCreateConversa}
                    className="px-6 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors"
                  >
                    + Iniciar Conversa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Conversation Modal */}
      <CreateConversaModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleConversaCreated}
        currentUserId={user?.id || 0}
      />

      {/* Profile Completion Gate */}
      <ProfileCompletionGate
        isOpen={showProfileGate}
        onClose={() => setShowProfileGate(false)}
        actionLabel="enviar mensagens ou iniciar uma conversa"
      />
    </div>
  );
}
