import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, ArrowRight, CheckCircle, Lock } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    senha: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [invalidCredentialsAlert, setInvalidCredentialsAlert] = useState(false);
  const [accountBlocked, setAccountBlocked] = useState(false);
  const [tentativasRestantes, setTentativasRestantes] = useState<number | null>(null);

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        console.log("[SignIn] Iniciando autenticação com:", data.email);
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        console.log("[SignIn] Status da resposta:", response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            console.error("[SignIn] Erro ao parsear resposta JSON:", parseError);
            errorData = { error: "Erro ao processar resposta do servidor" };
          }

          console.error("[SignIn] Erro completo da API:", {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          blocked: errorData.blocked,
          tentativasRestantes: errorData.tentativasRestantes,
        });

        // Customize error messages based on status
        if (response.status === 401) {
          // Failed login attempt with remaining tries info
          if (errorData.tentativasRestantes !== undefined) {
            const error = new Error(errorData.error) as any;
            error.tentativasRestantes = errorData.tentativasRestantes;
            throw error;
          }
          throw new Error("Email ou senha incorretos. Verifique suas credenciais.");
        } else if (response.status === 403) {
          // Account blocked
          if (errorData.blocked) {
            const error = new Error(errorData.error) as any;
            error.blocked = true;
            error.supportUrl = errorData.supportUrl;
            throw error;
          }
          throw new Error(errorData.error || "Acesso negado. Verifique seu email ou entre em contato com o suporte.");
        } else if (response.status === 400) {
          throw new Error(errorData.error || "Por favor, preencha todos os campos obrigatórios.");
        } else if (response.status === 500) {
          const serverError = errorData.error || "Erro desconhecido no servidor";
          console.error("[SignIn] ERRO 500 - Detalhes:", serverError);
          throw new Error(`Erro no servidor: ${serverError}`);
        }

        throw new Error(errorData.error || `Erro ao fazer login (HTTP ${response.status})`);
        }

        const result = await response.json();
        console.log("[SignIn] ✅ Login bem-sucedido para usuário:", result.data?.id);
        return result;
      } catch (error) {
        console.error("[SignIn] ❌ Erro na autenticação:", error instanceof Error ? error.message : error);
        throw error;
      }
    },
    onSuccess: (responseData) => {
      console.log("[SignIn] Sucesso - processando dados do usuário");
      if (responseData.data) {
        login(responseData.data);
        const userName = responseData.data.nome.split(" ")[0];
        toast.success(`Bem-vindo, ${userName}! 🎉`, {
          description: "Redirecionando para a página inicial...",
          duration: 2000,
        });
        setTimeout(() => {
          console.log("[SignIn] Navegando para a home");
          navigate("/");
        }, 1500);
      } else {
        console.error("[SignIn] Erro - dados de usuário ausentes");
        toast.error("Erro ao processar login", {
          description: "Dados do usuário não foram retornados. Tente novamente.",
        });
      }
    },
    onError: (error) => {
      console.error("[SignIn] Erro no login:", error);
      const errorObj = error as any;
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao fazer login";

      // Check if account is blocked
      if (errorObj.blocked) {
        console.warn("[SignIn] Conta bloqueada, redirecionando para suporte");
        setAccountBlocked(true);
        toast.error("Conta Bloqueada", {
          description: errorMessage,
          duration: 5000,
        });
        setTimeout(() => {
          navigate("/ajuda-e-contato");
        }, 2000);
        return;
      }

      // Check if it's an invalid credentials error with remaining attempts
      if (errorObj.tentativasRestantes !== undefined) {
        console.warn("[SignIn] Tentativas restantes:", errorObj.tentativasRestantes);
        setTentativasRestantes(errorObj.tentativasRestantes);
        setInvalidCredentialsAlert(true);
      } else if (errorMessage.includes("Email ou senha incorretos")) {
        setInvalidCredentialsAlert(true);
      } else {
        toast.error("Falha no login", {
          description: errorMessage,
          duration: 4000,
        });
      }
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

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
      toast.error("Email é obrigatório", {
        description: "Por favor, insira seu email para continuar.",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Digite um email válido (ex: seu.email@exemplo.com)";
      toast.error("Email inválido", {
        description: "Verifique se digitou o email corretamente.",
      });
    }

    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória";
      toast.error("Senha é obrigatória", {
        description: "Por favor, insira sua senha para continuar.",
      });
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter no mínimo 6 caracteres";
      toast.error("Senha muito curta", {
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      console.log("[SignIn] Formulário validado, iniciando login...");
      signInMutation.mutate(formData);
    } else {
      console.log("[SignIn] Validação falhou");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Alert Dialog for Invalid Credentials */}
      <AlertDialog open={invalidCredentialsAlert} onOpenChange={setInvalidCredentialsAlert}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-red-600 m-0">
                Credenciais Inválidas
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>
          <div className="text-base">
            <p className="text-gray-700 font-semibold mb-3">
              Desculpe, não conseguimos entrar na sua conta.
            </p>
            <p className="text-gray-600 mb-4">
              O email ou a senha que você inseriu está incorreto. Por favor, verifique suas credenciais e tente novamente.
            </p>

            {tentativasRestantes !== null && tentativasRestantes > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4">
                <p className="text-sm font-semibold text-yellow-900">
                  ⚠️ Aviso de Segurança
                </p>
                <p className="text-sm text-yellow-800 mt-1">
                  Você tem <strong>{tentativasRestantes}</strong> tentativa(s) restante(s) antes de sua conta ser bloqueada por segurança.
                </p>
              </div>
            )}

            <ul className="text-gray-600 text-sm space-y-2 ml-4">
              <li>✓ Verifique se o email está correto</li>
              <li>✓ Verifique se a senha está correta (maiúsculas importam)</li>
              <li>✓ Se esqueceu a senha, clique em "Esqueci minha senha"</li>
            </ul>
          </div>
          <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white mt-6">
            Tentar Novamente
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-vitrii-gray-light rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-vitrii-text">Entrar</h1>
            <p className="text-vitrii-text-secondary mt-2">
              Acesse sua conta Vitrii
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-8 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">
                Bem-vindo de volta!
              </h3>
              <p className="text-sm text-green-800 mt-1">
                Faça login para acessar sua conta e gerenciar seus anúncios.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Digite sua senha"
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

            {/* Remember Me and Forgot Password */}
            <div className="flex justify-between items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-vitrii-blue focus:ring-vitrii-blue"
                />
                <span className="text-sm text-vitrii-text-secondary">
                  Manter-me conectado
                </span>
              </label>
              <Link
                to="/esqueci-senha"
                className="text-sm text-vitrii-blue font-semibold hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={signInMutation.isPending}
              className="w-full bg-vitrii-blue text-white py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {signInMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Verificando credenciais...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Entrar na Conta</span>
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

            {/* Google Login (placeholder) */}
            <button
              type="button"
              disabled
              className="w-full bg-white border-2 border-gray-300 text-vitrii-text py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Entrar com Google (em breve)
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-vitrii-text-secondary">
              Não tem conta?{" "}
              <Link
                to="/auth/signup"
                className="text-vitrii-blue font-semibold hover:underline"
              >
                Cadastre-se
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
