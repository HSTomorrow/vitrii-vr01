import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import AnuncioForm from "./AnuncioForm";

interface AnuncioFormContainerProps {
  anuncianteId?: number;
  anuncioId?: number;
  onSuccess?: () => void;
  isDonation?: boolean;
  anuncioTipo?: string | null;
}

export default function AnuncioFormContainer({
  anuncianteId,
  anuncioId,
  onSuccess,
  isDonation,
  anuncioTipo,
}: AnuncioFormContainerProps) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Debug logging on mount
  useEffect(() => {
    console.log("[AnuncioFormContainer] Mounted");
    console.log("[AnuncioFormContainer] Device:", navigator.userAgent);
    console.log("[AnuncioFormContainer] Viewport:", window.innerWidth, "x", window.innerHeight);
  }, []);

  // Global error handler for this component
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMsg = event.error?.message || "";

      // Filter out non-critical errors
      if (
        errorMsg.includes("WebSocket") ||
        errorMsg.includes("closed without opened") ||
        errorMsg.includes("@vite/client")
      ) {
        console.warn("[AnuncioFormContainer] Non-critical error (WebSocket/Vite):", errorMsg);
        return;
      }

      console.error("[AnuncioFormContainer] Error caught:", event.error);
      setHasError(true);
      setErrorMessage(errorMsg || "Erro ao carregar formulário");
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || String(event.reason) || "";

      // Filter out non-critical errors
      if (
        errorMsg.includes("WebSocket") ||
        errorMsg.includes("closed without opened") ||
        errorMsg.includes("@vite/client")
      ) {
        console.warn("[AnuncioFormContainer] Non-critical rejection (WebSocket/Vite):", errorMsg);
        return;
      }

      console.error("[AnuncioFormContainer] Unhandled rejection:", event.reason);
      setHasError(true);
      setErrorMessage(errorMsg || "Erro ao carregar dados");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vitrii-gray-light p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <h2 className="text-lg font-semibold text-vitrii-text">
              Erro ao carregar
            </h2>
          </div>
          <p className="text-vitrii-text-secondary mb-6 text-sm">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage("");
              window.location.reload();
            }}
            className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnuncioForm
      anuncianteId={anuncianteId}
      anuncioId={anuncioId}
      onSuccess={onSuccess}
      isDonation={isDonation}
      anuncioTipo={anuncioTipo}
    />
  );
}
