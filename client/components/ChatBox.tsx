import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";

interface Message {
  id: number;
  conteudo: string;
  tipoRemetente: "usuario" | "loja";
  dataCriacao: string;
  lido: boolean;
  remetente: {
    id: number;
    nome: string;
  };
}

interface ChatBoxProps {
  conversaId: number;
  messages: Message[];
  currentUserId: number;
  tipoUsuario: "usuario" | "loja";
  onNewMessage: (message: Message) => void;
}

export default function ChatBox({
  conversaId,
  messages,
  currentUserId,
  tipoUsuario,
  onNewMessage,
}: ChatBoxProps) {
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-grow textarea
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
      messageInputRef.current.style.height = Math.min(
        messageInputRef.current.scrollHeight,
        120
      ) + "px";
    }
  }, [messageText]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (conteudo: string) => {
      const response = await fetch("/api/mensagens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversaId,
          remetentId: currentUserId,
          tipoRemetente: tipoUsuario,
          conteudo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      return response.json();
    },
    onSuccess: (result) => {
      onNewMessage(result.data);
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["conversa", conversaId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/mensagens/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar mensagem");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversa", conversaId] });
      toast.success("Mensagem deletada");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = messageText.trim();

    if (!trimmed) {
      toast.error("Mensagem não pode estar vazia");
      return;
    }

    if (trimmed.length > 2000) {
      toast.error("Mensagem muito longa (máx 2000 caracteres)");
      return;
    }

    sendMessageMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSendMessage(e as any);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    const today = new Date();
    const msgDate = new Date(date);

    if (msgDate.toDateString() === today.toDateString()) {
      return "Hoje";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    }

    return msgDate.toLocaleDateString("pt-BR");
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const date = formatDate(msg.dataCriacao);
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    },
    {} as Record<string, Message[]>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-walmart-text-secondary">
            <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-walmart-text-secondary">{date}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Messages for this date */}
                {msgs.map((msg) => {
                  const isCurrentUser = msg.remetente.id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${
                          isCurrentUser
                            ? "bg-walmart-blue"
                            : "bg-gray-400"
                        }`}
                      >
                        {msg.remetente.nome.charAt(0).toUpperCase()}
                      </div>

                      {/* Message Content */}
                      <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                        <p className="text-xs text-walmart-text-secondary mb-1">
                          {msg.remetente.nome} • {formatTime(msg.dataCriacao)}
                        </p>
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? "bg-walmart-blue text-white"
                              : "bg-gray-100 text-walmart-text"
                          }`}
                        >
                          <p className="break-words text-sm">{msg.conteudo}</p>
                        </div>

                        {/* Delete Button */}
                        {isCurrentUser && (
                          <button
                            onClick={() => deleteMessageMutation.mutate(msg.id)}
                            disabled={deleteMessageMutation.isPending}
                            className="mt-1 text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Deletar
                          </button>
                        )}

                        {/* Read Status */}
                        {isCurrentUser && msg.lido && (
                          <p className="text-xs text-gray-400 mt-1">✓ Lido</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex gap-2">
            <textarea
              ref={messageInputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva sua mensagem... (Ctrl+Enter para enviar)"
              maxLength={2000}
              rows={1}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-walmart-blue focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !messageText.trim()}
              className="px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sendMessageMutation.isPending ? "..." : "Enviar"}
            </button>
          </div>
          <p className="text-xs text-walmart-text-secondary">
            {messageText.length}/2000 caracteres
          </p>
        </form>
      </div>
    </div>
  );
}
