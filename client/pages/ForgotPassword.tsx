import { useState } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertCircle, ArrowRight, CheckCircle, Mail } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (emailValue: string) => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar solicitação");
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.emailFound === false) {
        setEmailNotFound(true);
        toast.error(data.message || "Este email não está cadastrado");
      } else {
        setEmailSent(true);
        toast.success(
          "Email enviado com sucesso! Verifique sua caixa de entrada.",
        );
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao processar solicitação",
      );
    },
  });

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setEmailNotFound(false);
      forgotPasswordMutation.mutate(email);
    }
  };

  if (emailNotFound) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-walmart-gray-light rounded-lg p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-walmart-text">
                Email não cadastrado
              </h1>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6 text-left">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">
                    Email não encontrado
                  </h3>
                  <p className="text-sm text-red-800 mt-1">
                    O email <strong>{email}</strong> não está cadastrado em nossa base de dados.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-walmart-text-secondary mb-6">
              Verifique se digitou o email corretamente ou crie uma nova conta.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailNotFound(false);
                  setEmail("");
                }}
                className="w-full bg-walmart-blue text-white py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
              >
                Tentar outro email
              </button>

              <Link
                to="/auth/signup"
                className="block w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Criar uma nova conta
              </Link>

              <Link
                to="/auth/signin"
                className="block w-full bg-white border-2 border-walmart-blue text-walmart-blue py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Voltar para login
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-300">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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

  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />

        <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-walmart-gray-light rounded-lg p-8 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-walmart-text">
                Email Enviado
              </h1>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-6 text-left">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    Verifique seu email
                  </h3>
                  <p className="text-sm text-green-800 mt-1">
                    Enviamos um link para redefinir sua senha para{" "}
                    <strong>{email}</strong>
                  </p>
                </div>
              </div>
            </div>

            <p className="text-walmart-text-secondary mb-6">
              O link para redefinir sua senha expira em 1 hora. Se não receber o
              email, verifique sua pasta de spam ou solicite um novo link.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                className="w-full bg-walmart-blue text-white py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
              >
                Solicitar outro email
              </button>

              <Link
                to="/auth/signin"
                className="block w-full bg-white border-2 border-walmart-blue text-walmart-blue py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Voltar para login
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-300">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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
        <div className="bg-walmart-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-walmart-text">
              Esqueci minha Senha
            </h1>
            <p className="text-walmart-text-secondary mt-2">
              Não se preocupe, vamos ajudar você a recuperar sua conta
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como funciona</h3>
              <p className="text-sm text-blue-800 mt-1">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-walmart-text mb-2">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-walmart-blue focus:ring-walmart-blue"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full bg-walmart-blue text-white py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Enviar Link de Reset
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-walmart-gray-light text-walmart-text-secondary">
                  Ou
                </span>
              </div>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-walmart-text-secondary">
              Lembrou sua senha?{" "}
              <Link
                to="/auth/signin"
                className="text-walmart-blue font-semibold hover:underline"
              >
                Faça login
              </Link>
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-4">
            <p className="text-walmart-text-secondary">
              Não tem conta?{" "}
              <Link
                to="/auth/signup"
                className="text-walmart-blue font-semibold hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </div>

          {/* Home Link */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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
