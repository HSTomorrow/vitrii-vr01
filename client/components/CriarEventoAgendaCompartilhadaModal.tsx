import { useState, useEffect } from "react";
import { X, AlertCircle, Calendar, Clock, Phone, Loader, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

interface CriarEventoAgendaCompartilhadaModalProps {
  isOpen: boolean;
  anuncianteId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CriarEventoAgendaCompartilhadaModal({
  isOpen,
  anuncianteId,
  onClose,
  onSuccess,
}: CriarEventoAgendaCompartilhadaModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingContact, setIsCheckingContact] = useState(false);
  const [existingContactId, setExistingContactId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    dataFim: "",
    celular: user?.celular || "", // Pre-fill if user is logged in
    telefone: "",
    nomeSolicitante: user?.nome || "",
  });

  // Check if user is announcer
  const { data: anuncianteStatusData } = useQuery({
    queryKey: ["is-user-announcer", anuncianteId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(
        `/api/eventos-agenda/${anuncianteId}/is-announcer`,
        {
          headers: {
            "X-User-Id": user.id.toString(),
          },
        }
      );
      if (!response.ok) throw new Error("Erro ao verificar status");
      return response.json();
    },
    enabled: !!anuncianteId && !!user?.id,
  });

  const isAnunciante = anuncianteStatusData?.data?.isAnunciante ?? false;
  const canCreateContacts = anuncianteStatusData?.data?.canCreateContacts ?? false;

  // Auto-check if contact exists when modal opens or user celular changes
  useEffect(() => {
    if (isOpen && user?.celular && !isCheckingContact) {
      checkContatoExistente();
    }
  }, [isOpen, user?.celular]);

  const checkContatoExistente = async () => {
    if (!user?.celular) return;

    setIsCheckingContact(true);
    try {
      const response = await fetch("/api/contatos/check-duplicates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id.toString(),
        },
        body: JSON.stringify({
          celular: user.celular,
          telefone: user.telefone || null,
        }),
      });

      const data = await response.json();
      if (data.existe) {
        setExistingContactId(data.id);
      } else {
        setExistingContactId(null);
      }
    } catch (error) {
      console.error("Erro ao verificar contato:", error);
    } finally {
      setIsCheckingContact(false);
    }
  };

  if (!isOpen) return null;

  // If not logged in, show login message
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-vitrii-text">Criar Evento</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  Autenticação Necessária
                </p>
                <p className="text-sm text-blue-800">
                  Você precisa estar logado para criar eventos na agenda.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/auth/signin")}
                className="w-full py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Entrar na Conta
              </button>
              <button
                onClick={() => navigate("/auth/signup")}
                className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Criar Nova Conta
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.titulo.trim()) {
      toast.error("Título do evento é obrigatório");
      return;
    }

    if (!formData.dataInicio) {
      toast.error("Data e hora de início são obrigatórias");
      return;
    }

    if (!formData.celular.trim()) {
      toast.error("Celular/WhatsApp é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create/get contact if it doesn't exist
      let contatoId: number | null = existingContactId;

      // If no existing contact found, try to create/find one
      if (!contatoId) {
        const checkContactResponse = await fetch("/api/contatos/check-duplicates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": user.id.toString(),
          },
          body: JSON.stringify({
            celular: formData.celular,
            telefone: formData.telefone || null,
          }),
        });

        const checkData = await checkContactResponse.json();

        if (checkData.existe) {
          // Contact exists
          contatoId = checkData.id;
        }
      }

      if (!contatoId) {
        // Create new contact
        const createContactResponse = await fetch("/api/contatos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": user.id.toString(),
          },
          body: JSON.stringify({
            nome: formData.nomeSolicitante || user.nome,
            celular: formData.celular,
            telefone: formData.telefone || null,
            email: user.email,
            status: "ativo",
            tipoContato: "Cliente",
            observacoes: null,
            imagem: null,
          }),
        });

        if (!createContactResponse.ok) {
          throw new Error("Erro ao criar contato");
        }

        const contactData = await createContactResponse.json();
        contatoId = contactData.data.id;
      }

      // Create event as "pendente" (pending) using visitor endpoint
      const createEventResponse = await fetch("/api/eventos-agenda/visitante/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id.toString(),
        },
        body: JSON.stringify({
          anuncianteId: anuncianteId,
          titulo: formData.titulo.trim(),
          descricao: formData.descricao.trim() || null,
          dataInicio: new Date(formData.dataInicio).toISOString(),
          dataFim: formData.dataFim
            ? new Date(formData.dataFim).toISOString()
            : new Date(formData.dataInicio).toISOString(),
          contatoIds: [contatoId],
        }),
      });

      if (!createEventResponse.ok) {
        const error = await createEventResponse.json();
        throw new Error(error.error || "Erro ao criar evento");
      }

      toast.success("Evento criado com sucesso! Aguardando aprovação do anunciante.");

      // Reset form
      setFormData({
        titulo: "",
        descricao: "",
        dataInicio: "",
        dataFim: "",
        celular: user.celular || "",
        telefone: "",
        nomeSolicitante: user.nome,
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar evento";
      console.error("Erro ao criar evento:", error);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-vitrii-text">Criar Evento</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-vitrii-text mb-1">
              Título do Evento *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              placeholder="Ex: Serviço de fotografia"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-vitrii-text mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Detalhes adicionais sobre o evento"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-vitrii-text mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data/Hora de Início *
              </label>
              <input
                type="datetime-local"
                value={formData.dataInicio}
                onChange={(e) =>
                  setFormData({ ...formData, dataInicio: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vitrii-text mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Data/Hora de Fim (opcional)
              </label>
              <input
                type="datetime-local"
                value={formData.dataFim}
                onChange={(e) =>
                  setFormData({ ...formData, dataFim: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm font-semibold text-blue-900">
                Informações de Contato
              </p>
              {isCheckingContact && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Loader className="w-3 h-3 animate-spin" />
                  Verificando...
                </div>
              )}
              {!isCheckingContact && existingContactId && (
                <div className="text-xs text-green-600 font-semibold">
                  ✓ Contato detectado
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nomeSolicitante}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nomeSolicitante: e.target.value,
                    })
                  }
                  placeholder="Seu nome completo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Celular/WhatsApp *
                </label>
                <input
                  type="text"
                  value={formData.celular}
                  onChange={(e) =>
                    setFormData({ ...formData, celular: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-vitrii-text mb-1">
                  Telefone (opcional)
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  placeholder="(11) 3333-3333"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                />
              </div>
            </div>

            <p className="text-xs text-blue-700 mt-3">
              ℹ️ O contato será salvo automaticamente para futuras interações.
            </p>
          </div>

          {/* Permission Warning - Non-Announcer */}
          {!canCreateContacts && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-3">
              <Lock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Restrição: Sem Permissão para Criar Contatos</p>
                <p>
                  Apenas anunciantes podem criar novos contatos. Se seu contato não está na lista,
                  entre em contato com o anunciante para ser adicionado.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Status: Pendente</p>
              <p>
                Este evento será criado como "pendente" e aguardará aprovação do
                anunciante antes de aparecer em sua agenda final.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isSubmitting ? "Criando..." : "Criar Evento"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
