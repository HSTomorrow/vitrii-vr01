import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import {
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth/signin", { replace: true });
    }
  }, [user, navigate]);

  // Initialize form with cached user data first
  const [formData, setFormData] = useState({
    telefone: user?.telefone || "",
    endereco: user?.endereco || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch fresh user data to show current profile info
  const { data: freshUserData } = useQuery({
    queryKey: ["user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`/api/usracessos/${user.id}`);
        if (!response.ok) return null;
        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 0,
    gcTime: 0,
  });

  // Update form with fresh user data when available
  useEffect(() => {
    if (freshUserData) {
      setFormData({
        telefone: freshUserData.telefone || "",
        endereco: freshUserData.endereco || "",
      });
    }
  }, [freshUserData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const response = await fetch(`/api/usracessos/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        // Create error with full response attached for detailed error handling
        const customError = new Error(
          error.error || "Erro ao atualizar perfil",
        );
        (customError as any).response = error;
        throw customError;
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user cache to refresh user data everywhere
      // This will affect both ["user"] and ["user", userId] query keys
      queryClient.invalidateQueries({ queryKey: ["user"] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["user", user.id] });
      }
      toast.success("Perfil atualizado com sucesso!");
      setTimeout(() => {
        // Navigate to ad editing page after profile update
        navigate("/anuncio/criar");
      }, 1500);
    },
    onError: (error: any) => {
      // Check if error has response with details (from our custom error handling)
      if (error?.response?.details && Array.isArray(error.response.details)) {
        // Extract field-specific errors from Zod validation
        const fieldErrors: Record<string, string> = {};
        error.response.details.forEach((detail: any) => {
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

      // Fallback to generic error message
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

    // Phone validation - only if provided
    if (
      formData.telefone.trim() &&
      formData.telefone.replace(/\D/g, "").length < 10
    ) {
      newErrors.telefone = "Telefone deve ter no mínimo 10 dígitos";
    }

    // Address is optional

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
          className="inline-flex items-center text-vitrii-blue hover:text-vitrii-blue-dark font-semibold mb-8"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </button>

        <div className="bg-vitrii-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-vitrii-blue text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-vitrii-text">
              Completar Perfil
            </h1>
            <p className="text-vitrii-text-secondary mt-2">
              Adicione suas informações de contato para melhorar sua experiência
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-vitrii-blue rounded p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-vitrii-text">Parabéns!</h3>
              <p className="text-sm text-vitrii-text-secondary mt-1">
                Sua conta foi criada com sucesso. Complete seu perfil para
                começar a vender.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Email
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-vitrii-text flex items-center gap-2">
                <Mail className="w-5 h-5 text-vitrii-text-secondary flex-shrink-0" />
                <span>{user?.email}</span>
              </div>
              <p className="text-xs text-vitrii-text-secondary mt-2">
                Para alterar o email, entre em contato com o administrador.
              </p>
            </div>

            {/* CPF / CNPJ (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                CPF \ CNPJ
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-vitrii-text flex items-center gap-2">
                <User className="w-5 h-5 text-vitrii-text-secondary flex-shrink-0" />
                <span>{user?.cpf || "Não informado"}</span>
              </div>
              <p className="text-xs text-vitrii-text-secondary mt-2">
                O CPF/CNPJ é um campo primário e não pode ser alterado. Para mudanças, entre em contato com o administrador.
              </p>
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
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
                placeholder="(51) 99999-9999"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.telefone
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
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
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
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
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
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
            <div className="bg-yellow-50 border-l-4 border-vitrii-yellow rounded p-4">
              <p className="text-sm text-vitrii-text">
                💡 Essas informações ajudam seus clientes a te localizarem e
                facilitam a entrega de pedidos.
              </p>
            </div>

            {/* Change Password Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100 transition-colors rounded"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-vitrii-blue" />
                  <div>
                    <p className="font-semibold text-vitrii-text">
                      Alterar Senha
                    </p>
                    <p className="text-xs text-vitrii-text-secondary">
                      Atualize sua senha de forma segura
                    </p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-vitrii-text-secondary rotate-180" />
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/sell")}
                className="flex-1 px-4 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Pular por Enquanto
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
