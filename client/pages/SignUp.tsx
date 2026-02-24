import { useState } from "react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertCircle, ArrowRight, CheckCircle, Mail, AlertTriangle, Loader } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupAttempted, setSignupAttempted] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      console.log("[SignUp] Iniciando requisição de cadastro para:", data.email);
      setGeneralError("");
      setErrors({});

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log("[SignUp] Resposta recebida:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[SignUp] Erro na resposta:", errorData);

        // Extrair erros de validação específicos
        const fieldErrors: Record<string, string> = {};
        if (errorData.details && Array.isArray(errorData.details)) {
          errorData.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message;
          });
          setErrors(fieldErrors);
          console.log("[SignUp] Erros de campo encontrados:", fieldErrors);
        }

        // Definir mensagem de erro geral
        const errorMessage = errorData.error || "Erro ao criar conta";
        setGeneralError(errorMessage);
        console.log("[SignUp] Erro geral:", errorMessage);
        console.log("[SignUp] Campos com erro:", Object.keys(fieldErrors));
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("[SignUp] Cadastro bem-sucedido:", result);
      return result;
    },
    onSuccess: (data) => {
      setSignupAttempted(true);
      setSignupSuccess(true);
      setGeneralError("");
      setErrors({});
      toast.success("Conta criada com sucesso! Bem-vindo ao Vitrii!");
      console.log("[SignUp] ✅ Cadastro concluído, redirecionando...");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    },
    onError: (error) => {
      setSignupAttempted(true);
      setSignupSuccess(false);
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar conta";
      console.error("[SignUp] ❌ Erro:", errorMessage);
      setGeneralError(errorMessage);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Clear general error when user starts typing again
    if (generalError) {
      setGeneralError("");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    } else if (formData.nome.length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória";
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter no mínimo 6 caracteres";
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = "Confirme sua senha";
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = "As senhas não conferem";
    }

    if (!agreeTerms) {
      newErrors.terms = "Você deve concordar com os termos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      signupMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-vitrii-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-vitrii-text">
              Criar Conta
            </h1>
            <p className="text-vitrii-text-secondary mt-2">
              Junte-se ao Vitrii gratuitamente
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">Pronto para começar!</h3>
              <p className="text-sm text-green-800 mt-1">
                Preencha o formulário abaixo para criar sua conta e comece a vender ou comprar.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded p-4 mb-8 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Atenção ao Email de Verificação</h3>
              <p className="text-sm text-yellow-800 mt-1">
                O email de confirmação pode chegar em sua pasta de <strong>Spam ou Lixo Eletrônico</strong>. Verifique essas pastas se não receber em sua caixa de entrada.
              </p>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Erro ao Criar Conta</h3>
                <p className="text-sm text-red-800 mt-1">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: João Silva"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.nome
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              {errors.nome && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nome}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="seu.email@exemplo.com"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Senha *
              </label>
              <PasswordInput
                value={formData.senha}
                onChange={(e) => handleInputChange("senha", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                error={errors.senha}
                showErrorMessage={false}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                  errors.senha
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:border-vitrii-blue focus:ring-vitrii-blue"
                }`}
              />
              {errors.senha && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.senha}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Confirmar Senha *
              </label>
              <PasswordInput
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                placeholder="Digite a senha novamente"
                error={errors.confirmarSenha}
                showErrorMessage={false}
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

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.terms;
                        return newErrors;
                      });
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-vitrii-blue focus:ring-vitrii-blue"
                />
                <span className="text-sm text-vitrii-text-secondary">
                  Concordo com os{" "}
                  <a href="#" className="text-vitrii-blue hover:underline font-semibold">
                    Termos de Uso
                  </a>
                  {" "}e{" "}
                  <a href="#" className="text-vitrii-blue hover:underline font-semibold">
                    Política de Privacidade
                  </a>
                </span>
              </label>
              {errors.terms && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={signupMutation.isPending || signupSuccess}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
                signupSuccess
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : signupAttempted && !signupSuccess && !signupMutation.isPending
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-vitrii-blue hover:bg-vitrii-blue-dark text-white disabled:opacity-50"
              }`}
            >
              {signupMutation.isPending ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Criando conta...
                </>
              ) : signupSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Conta Criada com Sucesso!
                </>
              ) : signupAttempted && !signupSuccess ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Erro ao Criar Conta
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Criar Conta
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-vitrii-text-secondary">
              Já tem conta?{" "}
              <Link
                to="/auth/signin"
                className="text-vitrii-blue font-semibold hover:underline"
              >
                Entrar
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
