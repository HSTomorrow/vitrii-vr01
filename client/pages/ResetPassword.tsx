import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertCircle, ArrowRight, CheckCircle, Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    novaSenha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidToken, setIsValidToken] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  // Validate token on mount
  const validateTokenQuery = useQuery({
    queryKey: ["validate-reset-token", token, email],
    queryFn: async () => {
      const response = await fetch(
        `/api/auth/validate-reset-token?token=${token}&email=${encodeURIComponent(email)}`,
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Token inválido");
      }
      return response.json();
    },
    enabled: !!token && !!email,
    retry: false,
  });

  useEffect(() => {
    if (validateTokenQuery.isSuccess) {
      setIsValidToken(true);
    } else if (validateTokenQuery.isError) {
      const error = validateTokenQuery.error;
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  }, [
    validateTokenQuery.isSuccess,
    validateTokenQuery.isError,
    validateTokenQuery.error,
  ]);

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          novaSenha: data.novaSenha,
          confirmarSenha: data.confirmarSenha,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao redefinir senha");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => {
        navigate("/auth/signin");
      }, 1500);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao redefinir senha",
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

    if (!formData.novaSenha) {
      newErrors.novaSenha = "Senha é obrigatória";
    } else if (formData.novaSenha.length < 6) {
      newErrors.novaSenha = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirmação de senha é obrigatória";
    }

    if (
      formData.novaSenha &&
      formData.confirmarSenha &&
      formData.novaSenha !== formData.confirmarSenha
    ) {
      newErrors.confirmarSenha = "As senhas não conferem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      resetPasswordMutation.mutate(formData);
    }
  };

  // Loading state
  if (validateTokenQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue" />
        </div>
        <Footer />
      </div>
    );
  }

  // Token validation error
  if (validateTokenQuery.isError && !isValidToken) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-vitrii-gray-light rounded-lg p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-vitrii-text">
                Link Inválido ou Expirado
              </h1>
            </div>

            <p className="text-vitrii-text-secondary mb-6">
              O link para redefinir sua senha é inválido ou expirou. Por favor,
              solicite um novo link.
            </p>

            <div className="space-y-3">
              <Link
                to="/esqueci-senha"
                className="block w-full bg-vitrii-blue text-white py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
              >
                Solicitar novo link
              </Link>

              <Link
                to="/auth/signin"
                className="block w-full bg-white border-2 border-vitrii-blue text-vitrii-blue py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Voltar para login
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-300">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Voltar para Home</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-vitrii-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-vitrii-text">
              Redefinir Senha
            </h1>
            <p className="text-vitrii-text-secondary mt-2">
              Digite sua nova senha abaixo
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-8 flex gap-3">
            <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">
                Crie uma senha forte
              </h3>
              <p className="text-sm text-blue-800 mt-1">
                Use uma combinação de letras, números e símbolos.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Nova Senha *
              </label>
              <input
                type="password"
                value={formData.novaSenha}
                onChange={(e) => handleInputChange("novaSenha", e.target.value)}
                placeholder="Digite sua nova senha"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.novaSenha
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              {errors.novaSenha && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.novaSenha}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) =>
                  handleInputChange("confirmarSenha", e.target.value)
                }
                placeholder="Confirme sua nova senha"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.confirmarSenha
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              {errors.confirmarSenha && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmarSenha}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-vitrii-blue text-white py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Redefinindo...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Redefinir Senha
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-vitrii-gray-light text-vitrii-text-secondary">
                  Ou
                </span>
              </div>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-vitrii-text-secondary">
              Lembrou sua senha?{" "}
              <Link
                to="/auth/signin"
                className="text-vitrii-blue font-semibold hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>

          {/* Home Link */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Voltar para Home</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
