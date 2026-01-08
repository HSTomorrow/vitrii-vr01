import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Copy, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  anuncioId: number;
  onPaymentConfirmed?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  anuncioId,
  onPaymentConfirmed,
}: PaymentModalProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  // Use useRef instead of useState to avoid unnecessary re-renders
  const pollIntervalRef = useRef<number | null>(null);

  // Fetch payment data
  const { data: paymentData, refetch: refetchPayment } = useQuery({
    queryKey: ["pagamento", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/pagamentos/anuncio/${anuncioId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // Payment doesn't exist yet, return null
          return null;
        }
        throw new Error("Erro ao buscar pagamento");
      }
      return response.json();
    },
    enabled: isOpen && anuncioId > 0,
  });

  const payment = paymentData?.data;

  // Cancel payment mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/pagamentos/${payment.id}/cancel`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao cancelar pagamento");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Pagamento cancelado");
      queryClient.invalidateQueries({ queryKey: ["pagamento", anuncioId] });
      onClose();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao cancelar pagamento",
      );
    },
  });

  // Copy to clipboard handler
  const handleCopyPixCode = () => {
    if (payment?.urlCopiaECola) {
      navigator.clipboard.writeText(payment.urlCopiaECola);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Poll payment status with useRef for interval
  useEffect(() => {
    if (!isOpen || !payment || payment.status !== "pendente") {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start polling immediately and then every 3 seconds
    refetchPayment();
    pollIntervalRef.current = window.setInterval(() => {
      refetchPayment().then((result) => {
        if (result.data?.data?.status === "pago") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          toast.success("Pagamento confirmado! ✅");
          setTimeout(() => {
            onPaymentConfirmed?.();
          }, 1000);
        }
      });
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [
    isOpen,
    payment?.id,
    payment?.status,
    refetchPayment,
    onPaymentConfirmed,
  ]);

  if (!isOpen || !payment) return null;

  const isExpired =
    payment.status === "expirado" || payment.status === "cancelado";
  const isPaid = payment.status === "pago";
  const isPending =
    payment.status === "pendente" || payment.status === "processando";

  const expirationTime = new Date(payment.dataExpiracao);
  const now = new Date();
  const timeRemaining = Math.max(
    0,
    Math.floor((expirationTime.getTime() - now.getTime()) / 1000),
  );
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-walmart-text">
            Pagamento via Pix
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {isPaid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800">
                  Pagamento Confirmado!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Seu anúncio foi ativado com sucesso.
                </p>
              </div>
            </div>
          )}

          {isExpired && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Pagamento Expirado</p>
                <p className="text-sm text-red-700 mt-1">
                  O código Pix expirou. Feche esta janela e tente novamente.
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <>
              {/* QR Code */}
              {payment.qrCode && (
                <div className="text-center">
                  <p className="text-sm text-walmart-text-secondary mb-3">
                    Escaneie o QR Code com seu aplicativo bancário
                  </p>
                  <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                        payment.urlCopiaECola,
                      )}`}
                      alt="Pix QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
              )}

              {/* Copy and Paste Code */}
              {payment.urlCopiaECola && (
                <div>
                  <p className="text-sm text-walmart-text-secondary mb-2">
                    Ou copie o código Pix abaixo:
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPixCode}
                    className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg p-3 flex items-center justify-between transition-colors"
                  >
                    <code className="text-xs text-walmart-text truncate">
                      {payment.urlCopiaECola.substring(0, 40)}...
                    </code>
                    <Copy className="w-4 h-4 text-walmart-blue flex-shrink-0" />
                  </button>
                  {copied && (
                    <p className="text-sm text-green-600 mt-2 text-center">
                      ✓ Copiado com sucesso!
                    </p>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 justify-center">
                  <Clock className="w-5 h-5 text-walmart-blue" />
                  <p className="text-sm text-walmart-text">
                    <span className="font-semibold">
                      {String(minutes).padStart(2, "0")}:
                      {String(seconds).padStart(2, "0")}
                    </span>
                    <span className="text-walmart-text-secondary">
                      {" "}
                      para expiração
                    </span>
                  </p>
                </div>
              </div>

              {/* Processing info */}
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-walmart-text">
                  Aguardando confirmação do pagamento...
                </p>
                <div className="mt-2 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-walmart-blue rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-walmart-blue rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-walmart-blue rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Valor */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-walmart-text-secondary">
                Valor a pagar:
              </span>
              <span className="text-2xl font-bold text-walmart-blue">
                R$ {Number(payment.valor).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-walmart-text-secondary space-y-2">
            <p>
              <strong>ID Pix:</strong> {payment.pixId?.substring(0, 20)}...
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={`font-semibold ${
                  isPaid
                    ? "text-green-600"
                    : isExpired
                      ? "text-red-600"
                      : "text-blue-600"
                }`}
              >
                {payment.status === "pendente" && "Aguardando pagamento"}
                {payment.status === "processando" && "Processando"}
                {payment.status === "pago" && "Pagamento confirmado"}
                {payment.status === "cancelado" && "Cancelado"}
                {payment.status === "expirado" && "Expirado"}
              </span>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {isPaid ? "Fechar" : "Voltar"}
            </button>
            {!isPaid && (
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelando..." : "Cancelar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
