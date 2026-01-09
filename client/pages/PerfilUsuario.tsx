import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    telefone: "",
    endereco: "",
    cpf: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar perfil");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user cache to refresh user data
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Perfil atualizado com sucesso!");
      setTimeout(() => {
        // Go back to previous page or to /anuncio/criar if no previous page
        const previousPath = window.history.length > 1 ? -1 : "/anuncio/criar";
        if (previousPath === -1) {
          navigate(-1);
        } else {
          navigate(previousPath as string);
        }
      }, 1500);
    },
    onError: (error: any) => {
      // Try to parse detailed error response from server
      if (error instanceof Error && error.message) {
        const errorMsg = error.message;
        // Check if it's a JSON error response from server
        try {
          const parsed = JSON.parse(errorMsg);
          if (parsed.details && Array.isArray(parsed.details)) {
            // Extract field-specific errors from Zod validation
            const fieldErrors: Record<string, string> = {};
            parsed.details.forEach((detail: any) => {
              const fieldPath = Array.isArray(detail.path)
                ? detail.path.join(".")
                : detail.path;
              fieldErrors[fieldPath] = detail.message;
            });
            setErrors(fieldErrors);
            // Show a summary message
            toast.error("Por favor, corrija os dados inválidos indicados abaixo");
            return;
          }
        } catch (e) {
          // Not a JSON response, continue with generic error
        }
      }
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil",
      );
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // CPF/CNPJ validation - only if provided
    if (formData.cpf.trim()) {
      const digitsOnly = formData.cpf.replace(/\D/g, "");
      // Accept either 11 digits (CPF) or 14 digits (CNPJ)
      if (!/^\d{11}$|^\d{14}$/.test(digitsOnly)) {
        newErrors.cpf = "CPF \ CNPJ deve ter 11 ou 14 dígitos";
      }
    }

    // Phone validation - only if provided
    if (
      formData.telefone.trim() &&
      formData.telefone.replace(/\D/g, "").length < 10
    ) {
      newErrors.telefone = "Telefone deve ter no mínimo 10 dígitos";
    }

    // Address is optional now, but if provided should be valid
    // Remove required validation for address

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      updateMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-walmart-blue hover:text-walmart-blue-dark font-semibold mb-8"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>

        <div className="bg-walmart-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-walmart-blue text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-walmart-text">
              Completar Perfil
            </h1>
            <p className="text-walmart-text-secondary mt-2">
              Adicione suas informações de contato para melhorar sua experiência
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-walmart-blue rounded p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-walmart-blue flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-walmart-text">Parabéns!</h3>
              <p className="text-sm text-walmart-text-secondary mt-1">
                Sua conta foi criada com sucesso. Complete seu perfil para
                começar a vender.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CPF / CNPJ */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                CPF \ CNPJ (opcional)
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, "");
                  let formatted = "";

                  // Format based on length: CPF (11) or CNPJ (14)
                  if (input.length <= 11) {
                    // CPF format: XXX.XXX.XXX-XX
                    const cpf = input.slice(0, 11);
                    formatted = cpf
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d{2})$/, "$1-$2");
                  } else {
                    // CNPJ format: XX.XXX.XXX/XXXX-XX
                    const cnpj = input.slice(0, 14);
                    formatted = cnpj
                      .replace(/(\d{2})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1.$2")
                      .replace(/(\d{3})(\d)/, "$1/$2")
                      .replace(/(\d{4})(\d{2})$/, "$1-$2");
                  }

                  handleInputChange("cpf", formatted);
                }}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.cpf
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-walmart-blue focus:ring-walmart-blue"
                }`}
              />
              {errors.cpf && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.cpf}
                </p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Telefone (opcional)
              </label>
              <input
                type="tel"
                value={formData.telefone}
                onChange={(e) => {
                  const tel = e.target.value.replace(/\D/g, "").slice(0, 11);
                  // Format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
                  const formatted = tel
                    .replace(/(\d{2})(\d)/, "($1) $2")
                    .replace(/(\d{5})(\d)/, "$1-$2");
                  handleInputChange("telefone", formatted);
                }}
                placeholder="(11) 99999-9999"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.telefone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-walmart-blue focus:ring-walmart-blue"
                }`}
              />
              {errors.telefone && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.telefone}
                </p>
              )}
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Endereço (opcional)
              </label>
              <input
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange("endereco", e.target.value)}
                placeholder="Ex: Rua das Flores, 123, Apt 456, São Paulo, SP"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.endereco
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-walmart-blue focus:ring-walmart-blue"
                }`}
              />
              {errors.endereco && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.endereco}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-l-4 border-walmart-yellow rounded p-4">
              <p className="text-sm text-walmart-text">
                💡 Essas informações ajudam seus clientes a te localizarem e
                facilitam a entrega de pedidos.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/sell")}
                className="flex-1 px-4 py-3 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Pular por Enquanto
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-3 bg-walmart-blue text-white rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Salvar e Continuar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
