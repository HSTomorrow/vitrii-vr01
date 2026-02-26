import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader, CheckCircle2, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        console.log("[VerifyEmail] 📧 Iniciando verificação com parâmetros:", {
          token: token ? token.substring(0, 10) + "..." : "NÃO FORNECIDO",
          email: email || "NÃO FORNECIDO",
        });

        if (!token || !email) {
          console.error("[VerifyEmail] ❌ Parâmetros inválidos ou faltando");
          setStatus("error");
          setMessage("Link de verificação inválido");
          return;
        }

        console.log("[VerifyEmail] 🔄 Chamando endpoint de verificação...");
        const response = await fetch(
          `/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
        );

        console.log("[VerifyEmail] 📬 Resposta recebida com status:", response.status);

        const data = await response.json();

        console.log("[VerifyEmail] 📋 Dados da resposta:", {
          success: data.success,
          message: data.message,
          error: data.error,
        });

        if (data.success) {
          console.log("[VerifyEmail] ✅ Email verificado com sucesso!");
          setStatus("success");
          setMessage(data.message || "Email verificado com sucesso!");

          // Redirect to home page after 3 seconds
          setTimeout(() => {
            console.log("[VerifyEmail] 🚀 Redirecionando para home page...");
            navigate("/");
          }, 3000);
        } else {
          console.warn("[VerifyEmail] ⚠️ Erro na resposta:", data.error);
          setStatus("error");
          setMessage(data.error || "Erro ao verificar email");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("[VerifyEmail] 🔴 ERRO ao processar verificação:", {
          message: errorMessage,
          error,
        });
        setStatus("error");
        setMessage("Erro ao processar verificação de email");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          {status === "loading" && (
            <>
              <Loader className="w-16 h-16 text-vitrii-blue mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-vitrii-text mb-2">
                Verificando Email
              </h1>
              <p className="text-vitrii-text-secondary">
                Por favor, aguarde...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-vitrii-text mb-2">
                Email Verificado!
              </h1>
              <p className="text-vitrii-text-secondary mb-4">
                {message}
              </p>
              <p className="text-sm text-vitrii-text-secondary">
                Redirecionando para a página inicial...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-vitrii-text mb-2">
                Erro na Verificação
              </h1>
              <p className="text-vitrii-text-secondary mb-6">
                {message}
              </p>
              <button
                onClick={() => navigate("/")}
                className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Voltar para Home
              </button>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
