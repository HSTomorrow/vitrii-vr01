import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, Send, AlertCircle, CheckCircle } from "lucide-react";

export default function TestEmail() {
  const [toEmail, setToEmail] = useState("vitriimarketplace@gmail.com");
  const [fromEmail, setFromEmail] = useState("contato@herestomorrow.com");
  const [result, setResult] = useState<any>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [resetResult, setResetResult] = useState<any>(null);

  // Diagnostic mutation
  const diagnosticMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/smtp-diagnostic");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao executar diagnóstico");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setDiagnosticResult(data);
      toast.success(data.success ? "✅ SMTP conectado!" : "❌ Erro ao conectar");
      console.log("Diagnóstico:", data);
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(errorMsg);
    },
  });

  // Reset email mutation
  const resetEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/send-reset-email");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar reset");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResetResult(data);
      toast.success("✅ Email de reset enviado!");
      console.log("Reset email enviado:", data);
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(errorMsg);
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail, fromEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao enviar email");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("✅ Email de teste enviado com sucesso!");
      console.log("✅ Email enviado:", data);
    },
    onError: (error) => {
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      setResult({ success: false, error: errorMsg });
      toast.error(errorMsg);
      console.error("❌ Erro ao enviar email:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    testEmailMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-vitrii-gray-light rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-vitrii-blue rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-vitrii-text">
              Teste de Email SMTP
            </h1>
            <p className="text-vitrii-text-secondary mt-2">
              Teste a configuração do servidor de e-mail
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-8 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Como funciona</h3>
              <p className="text-sm text-blue-800 mt-1">
                Digite um email e este enviará um e-mail de teste usando as configurações SMTP do servidor (contato@herestomorrow.com via GoDaddy).
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            {/* From Email */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                De (Remetente)
              </label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                disabled={testEmailMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                placeholder="contato@herestomorrow.com"
              />
            </div>

            {/* To Email */}
            <div>
              <label className="block text-sm font-semibold text-vitrii-text mb-2">
                Para (Destinatário)
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                disabled={testEmailMutation.isPending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
                placeholder="seu.email@exemplo.com"
              />
              <p className="text-xs text-vitrii-text-secondary mt-1">
                Padrão: vitriimarketplace@gmail.com
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={testEmailMutation.isPending}
              className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                testEmailMutation.isPending
                  ? "bg-gray-400 text-white cursor-not-allowed opacity-75"
                  : "bg-vitrii-blue text-white hover:bg-vitrii-blue-dark"
              }`}
            >
              {testEmailMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar Email de Teste
                </>
              )}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div
              className={`rounded-lg p-6 flex gap-4 ${
                result.success
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "bg-red-50 border-l-4 border-red-500"
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3
                  className={`font-semibold mb-2 ${
                    result.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.success ? "✅ Sucesso!" : "❌ Erro"}
                </h3>
                <p
                  className={`text-sm mb-3 ${
                    result.success ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.message || result.error}
                </p>

                {result.details && (
                  <div className="bg-white rounded p-3 text-sm space-y-1">
                    <p>
                      <strong>De:</strong> {result.details.from}
                    </p>
                    <p>
                      <strong>Para:</strong> {result.details.to}
                    </p>
                    <p>
                      <strong>Servidor SMTP:</strong> {result.details.smtp}
                    </p>
                    <p>
                      <strong>Data/Hora:</strong>{" "}
                      {new Date(result.details.timestamp).toLocaleString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic Buttons */}
          <div className="mt-8 space-y-4">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-vitrii-text mb-4">🔧 Ferramentas de Diagnóstico</h3>

              <div className="space-y-3">
                {/* Test SMTP Connection */}
                <button
                  onClick={() => diagnosticMutation.mutate()}
                  disabled={diagnosticMutation.isPending}
                  className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    diagnosticMutation.isPending
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-vitrii-blue text-white hover:bg-vitrii-blue-dark"
                  }`}
                >
                  {diagnosticMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Testando...
                    </>
                  ) : (
                    "🔍 Testar Conexão SMTP"
                  )}
                </button>

                {/* Send Reset Email */}
                <button
                  onClick={() => resetEmailMutation.mutate()}
                  disabled={resetEmailMutation.isPending}
                  className={`w-full py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    resetEmailMutation.isPending
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {resetEmailMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Enviando...
                    </>
                  ) : (
                    "📧 Enviar Email de Reset para vitriimarketplace@gmail.com"
                  )}
                </button>
              </div>

              {/* Diagnostic Result */}
              {diagnosticResult && (
                <div
                  className={`mt-4 p-4 rounded ${
                    diagnosticResult.success
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`font-semibold mb-2 ${
                      diagnosticResult.success ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {diagnosticResult.message}
                  </p>
                  <div className="bg-white rounded p-2 text-sm space-y-1">
                    <p>
                      <strong>Host:</strong> {diagnosticResult.configuration?.host}
                    </p>
                    <p>
                      <strong>Porta:</strong> {diagnosticResult.configuration?.port}
                    </p>
                    <p>
                      <strong>Usuário:</strong> {diagnosticResult.configuration?.user}
                    </p>
                    <p>
                      <strong>Seguro:</strong> {diagnosticResult.configuration?.secure}
                    </p>
                  </div>
                </div>
              )}

              {/* Reset Email Result */}
              {resetResult && (
                <div className="mt-4 p-4 rounded bg-blue-50 border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">
                    {resetResult.message}
                  </p>
                  <div className="bg-white rounded p-2 text-sm space-y-1 break-all">
                    <p>
                      <strong>Para:</strong> {resetResult.to}
                    </p>
                    <p>
                      <strong>Token:</strong> {resetResult.token?.substring(0, 20)}...
                    </p>
                    <p className="mt-3">
                      <strong>Link de Reset:</strong>
                      <br />
                      <a
                        href={resetResult.resetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-vitrii-blue hover:underline break-all"
                      >
                        {resetResult.resetLink}
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 pt-8 border-t border-gray-300 text-sm text-vitrii-text-secondary space-y-2">
            <p>
              <strong>📧 Configuração SMTP Atual:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Host: mail.herestomorrow.com</li>
              <li>Porta: 465</li>
              <li>Usuário: contato@herestomorrow.com</li>
              <li>Segurança: SSL/TLS</li>
              <li>Provedor: GoDaddy</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
