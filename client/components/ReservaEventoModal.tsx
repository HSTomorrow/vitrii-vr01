import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Evento {
  id: number;
  titulo: string;
  dataInicio: string;
  dataFim: string;
}

interface ReservaEventoModalProps {
  isOpen: boolean;
  evento: Evento | null;
  onClose: () => void;
  onSuccess?: () => void;
  isLoading?: boolean;
}

export default function ReservaEventoModal({
  isOpen,
  evento,
  onClose,
  onSuccess,
  isLoading = false,
}: ReservaEventoModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"tipo" | "dados">("tipo");
  const [tipo, setTipo] = useState<"reserva" | "lista_espera">("reserva");
  const [formData, setFormData] = useState({
    nomeSolicitante: "",
    emailSolicitante: "",
    telefoneSolicitante: "",
  });

  if (!isOpen || !evento) return null;

  const handleSelectType = (tipoSelecionado: "reserva" | "lista_espera") => {
    setTipo(tipoSelecionado);
    if (user) {
      // If logged in, skip to confirmation
      handleSubmit(tipoSelecionado);
    } else {
      // If not logged in, go to form
      setStep("dados");
    }
  };

  const handleSubmit = async (tipoReserva?: "reserva" | "lista_espera") => {
    const tipoFinal = tipoReserva || tipo;
    const body: Record<string, any> = {
      eventoId: evento.id,
      tipo: tipoFinal,
    };

    // Add user info if not logged in
    if (!user) {
      if (!formData.nomeSolicitante.trim()) {
        toast.error("Nome é obrigatório");
        return;
      }
      if (!formData.emailSolicitante.trim()) {
        toast.error("Email é obrigatório");
        return;
      }
      body.nomeSolicitante = formData.nomeSolicitante;
      body.emailSolicitante = formData.emailSolicitante;
      body.telefoneSolicitante = formData.telefoneSolicitante || undefined;
    }

    try {
      const response = await fetch("/api/reservas-evento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user && { "x-user-id": user.id.toString() }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar reserva");
      }

      const tipoLabel =
        tipoFinal === "reserva" ? "Reserva" : "Solicitação de lista de espera";
      toast.success(`${tipoLabel} criada com sucesso!`);

      // Reset form
      setStep("tipo");
      setFormData({
        nomeSolicitante: "",
        emailSolicitante: "",
        telefoneSolicitante: "",
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar reserva",
      );
    }
  };

  const dataInicio = new Date(evento.dataInicio);
  const dataFim = new Date(evento.dataFim);

  if (!user && step === "dados") {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-vitrii-text">
              {tipo === "reserva" ? "Fazer Reserva" : "Entrar na Lista de Espera"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Event Info */}
          <div className="p-6 bg-blue-50 border-b border-blue-200">
            <h3 className="font-semibold text-vitrii-text mb-2">{evento.titulo}</h3>
            <p className="text-sm text-gray-600">
              {dataInicio.toLocaleDateString("pt-BR")} às{" "}
              {dataInicio.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.nomeSolicitante}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nomeSolicitante: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.emailSolicitante}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailSolicitante: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Telefone/WhatsApp
              </label>
              <input
                type="tel"
                value={formData.telefoneSolicitante}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    telefoneSolicitante: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-orange-800">
                Você será contatado por email ou telefone para confirmar sua{" "}
                {tipo === "reserva" ? "reserva" : "posição na fila"}.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setStep("tipo")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition-colors font-semibold"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold disabled:opacity-50"
              >
                {isLoading ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </form>

          {/* Login Option */}
          <div className="p-6 border-t border-gray-200 text-center bg-gray-50">
            <p className="text-sm text-gray-600 mb-3">
              Já tem uma conta? Faça login para reservar mais rápido
            </p>
            <button
              onClick={() => navigate("/auth/signin")}
              className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold text-sm"
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-vitrii-text">
            Solicitar Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Event Info */}
        <div className="p-6 bg-blue-50 border-b border-blue-200">
          <h3 className="font-semibold text-vitrii-text mb-2">{evento.titulo}</h3>
          <p className="text-sm text-gray-600">
            {dataInicio.toLocaleDateString("pt-BR")} às{" "}
            {dataInicio.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Duração: até{" "}
            {dataFim.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          <button
            onClick={() => handleSelectType("reserva")}
            disabled={isLoading}
            className="w-full p-4 border-2 border-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
          >
            <h4 className="font-semibold text-vitrii-text">
              ✓ Fazer Reserva
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Reserve este horário. O anunciante confirmará sua reserva.
            </p>
          </button>

          <button
            onClick={() => handleSelectType("lista_espera")}
            disabled={isLoading}
            className="w-full p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
          >
            <h4 className="font-semibold text-vitrii-text">
              ⏳ Entrar na Lista de Espera
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Se o horário não estiver disponível, entre na fila.
            </p>
          </button>
        </div>

        {/* Buttons */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-vitrii-text hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
