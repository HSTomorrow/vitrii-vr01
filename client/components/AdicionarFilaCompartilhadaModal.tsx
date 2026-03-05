import { useState } from "react";
import { X, AlertCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface AdicionarFilaCompartilhadaModalProps {
  isOpen: boolean;
  anuncianteId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdicionarFilaCompartilhadaModal({
  isOpen,
  anuncianteId,
  onClose,
  onSuccess,
}: AdicionarFilaCompartilhadaModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    celular: user?.celular || "",
    telefone: "",
    nomeSolicitante: user?.nome || "",
  });

  if (!isOpen) return null;

  // If not logged in, show login message
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-vitrii-text">Entrar na Fila de Espera</h2>
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
                  Você precisa estar logado para entrar na fila de espera.
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

    if (!formData.celular.trim()) {
      toast.error("Celular/WhatsApp é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, create/get contact if it doesn't exist
      let contatoId: number | null = null;

      // Check if contact with same phone exists
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
      } else {
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

      // Create waiting list entry as "pendente"
      // Use current date/time for fila (required by API)
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const createFilaResponse = await fetch("/api/filas-espera", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id.toString(),
        },
        body: JSON.stringify({
          anuncianteAlvoId: anuncianteId,
          titulo: formData.descricao.trim() || "Solicitação de Fila de Espera",
          descricao: formData.descricao.trim() || null,
          dataInicio: now.toISOString(),
          dataFim: oneDayLater.toISOString(),
          privacidade: "privado_usuarios",
          contatosPermitidos: [contatoId],
        }),
      });

      if (!createFilaResponse.ok) {
        const error = await createFilaResponse.json();
        throw new Error(error.error || "Erro ao entrar na fila de espera");
      }

      toast.success("Solicitação de fila de espera criada com sucesso! Aguardando aprovação.");

      // Reset form
      setFormData({
        descricao: "",
        celular: user.celular || "",
        telefone: "",
        nomeSolicitante: user.nome,
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao entrar na fila de espera";
      console.error("Erro ao criar fila de espera:", error);
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
          <h2 className="text-xl font-bold text-vitrii-text">
            Entrar na Fila de Espera
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-vitrii-text mb-1">
              Motivo/Descrição (opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Ex: Interessado em serviço de fotografia"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue resize-none"
            />
          </div>

          {/* Contact Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-3">
              Informações de Contato
            </p>

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

          {/* Info Box */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-1">Status: Pendente</p>
              <p>
                Sua solicitação será criada como "pendente" e aguardará aprovação
                do anunciante antes de ser confirmada.
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
              {isSubmitting ? "Criando..." : "Entrar na Fila"}
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
