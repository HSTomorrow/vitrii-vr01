import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Plus, MessageCircle, Archive } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ConversaList from "../components/ConversaList";
import ChatBox, { ChatBoxHandle } from "../components/ChatBox";
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
  mensagens?: Message[];
}

export default function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedConversa, setSelectedConversa] = useState<Conversa | null>(
    null,
  );
  const chatBoxRef = useRef<ChatBoxHandle>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileGate, setShowProfileGate] = useState(false);
  const [preFilledData, setPreFilledData] = useState<{
    anuncianteId: number;
    anuncioId: number;
  } | null>(null);

  // Check for anuncianteId and anuncioId in URL params
  useEffect(() => {
    const anuncianteId = searchParams.get("anuncianteId");
    const anuncioId = searchParams.get("anuncioId");

    if (anuncianteId && anuncioId) {
      setPreFilledData({
        anuncianteId: parseInt(anuncianteId),
        anuncioId: parseInt(anuncioId),
      });
      // Auto-open the modal if user has completed their profile
      if (user?.cpf && user?.telefone) {
        setShowCreateModal(true);
      } else {
        setShowProfileGate(true);
      }
    }
  }, [searchParams, user?.cpf, user?.telefone]);

  // Deep-link directly into an existing conversation (e.g. from the
  // reservation management panel, so the anunciante can jump straight to
  // the buyer's thread instead of hunting for it in the list).
  useEffect(() => {
    const conversaId = searchParams.get("conversaId");
    if (!conversaId) return;

    fetch(`/api/conversas/${conversaId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (result?.data) {
          setSelectedConversa(result.data);
        }
      })
      .catch((err) => console.error("Error loading conversa:", err));
  }, [searchParams]);

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
    refetchInterval: 10000, // Poll every 10 seconds for new messages
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

  const isSelectedDeleted = !!selectedConversa?.dataExclusao;

  return (
    <div className="min-h-screen bg-vitrii-gray-light">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center flex-shrink-0 text-vitrii-blue hover:text-vitrii-blue-dark font-semibold"
          >
            <ChevronLeft className="w-5 h-5 sm:mr-1" />
            <span className="hidden sm:inline">Voltar</span>
          </Link>
          <h1 className="flex-1 min-w-0 justify-center sm:justify-start text-base sm:text-2xl font-bold text-vitrii-text flex items-center gap-1.5 sm:gap-2">
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-vitrii-blue flex-shrink-0" />
            <span className="truncate">Minhas Mensagens</span>
          </h1>
          <button
            onClick={handleCreateConversa}
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 px-2.5 sm:px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Conversa</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-140px)] md:h-[600px]">
          {/* Conversation List */}
          <div
            className={`md:col-span-1 h-full ${selectedConversa ? "hidden md:block" : "block"}`}
          >
            <ConversaList
              usuarioId={user?.id || 0}
              onSelectConversa={(conversa) => setSelectedConversa(conversa)}
              selectedConversaId={selectedConversa?.id}
              onResponder={() => chatBoxRef.current?.focusInput()}
            />
          </div>

          {/* Chat Box */}
          <div
            className={`md:col-span-2 h-full ${selectedConversa ? "block" : "hidden md:block"}`}
          >
            {selectedConversa && conversa ? (
              <div className="flex flex-col h-full">
                {/* Conversation Header */}
                <div
                  className={`rounded-t-lg shadow-md border-b p-3 sm:p-4 ${
                    isSelectedDeleted
                      ? "bg-red-50 border-red-100"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        onClick={() => setSelectedConversa(null)}
                        className="md:hidden flex-shrink-0 text-vitrii-blue hover:text-vitrii-blue-dark mt-0.5"
                        title="Voltar para a lista"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="font-bold text-vitrii-text text-lg truncate">
                          {selectedConversa.assunto}
                        </h2>
                        <p className="text-sm text-vitrii-text-secondary truncate">
                          com {selectedConversa.anunciante.nome} •{" "}
                          {selectedConversa.usuario.nome}
                        </p>
                        {selectedConversa.anuncio && (
                          <p className="text-sm text-gray-500 mt-2 truncate">
                            📢 Sobre: {selectedConversa.anuncio.titulo}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelectedDeleted && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 flex items-center gap-1 flex-shrink-0">
                        <Archive className="w-3.5 h-3.5" />
                        Deletada
                      </span>
                    )}
                  </div>
                </div>

                {/* Chat Box */}
                <ChatBox
                  ref={chatBoxRef}
                  conversaId={selectedConversa.id}
                  messages={messages}
                  currentUserId={user?.id || 0}
                  tipoUsuario="usuario"
                  onNewMessage={handleNewMessage}
                  userCpf={user?.cpf}
                  userTelefone={user?.telefone}
                  onProfileIncomplete={() => setShowProfileGate(true)}
                  readOnly={isSelectedDeleted}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
        onClose={() => {
          setShowCreateModal(false);
          setPreFilledData(null);
        }}
        onSuccess={handleConversaCreated}
        currentUserId={user?.id || 0}
        preFilledAnuncianteId={preFilledData?.anuncianteId}
        preFilledAnuncioId={preFilledData?.anuncioId}
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
