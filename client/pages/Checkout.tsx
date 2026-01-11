import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Checkout() {
  const { anuncioId } = useParams<{ anuncioId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  if (!anuncioId) {
    return (
      <div className="min-h-screen bg-walmart-gray-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-walmart-text">
            ID do anúncio não encontrado
          </h1>
          <Link
            to="/sell"
            className="text-walmart-blue hover:text-walmart-blue-dark mt-4 inline-block"
          >
            Voltar para meus anúncios
          </Link>
        </div>
      </div>
    );
  }

  const parsedAnuncioId = parseInt(anuncioId);

  // Fetch anuncio data
  const { data: anuncioData } = useQuery({
    queryKey: ["anuncio", parsedAnuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${parsedAnuncioId}`);
      if (!response.ok) throw new Error("Anúncio não encontrado");
      return response.json();
    },
  });

  const anuncio = anuncioData?.data;

  // Fetch or create payment
  const {
    data: paymentData,
    refetch: refetchPayment,
    isLoading: paymentLoading,
  } = useQuery({
    queryKey: ["pagamento", parsedAnuncioId],
    queryFn: async () => {
      const response = await fetch(
        `/api/pagamentos/anuncio/${parsedAnuncioId}`,
      );
      if (response.status === 404) {
        // Payment doesn't exist, create one
        return null;
      }
      if (!response.ok) throw new Error("Erro ao buscar pagamento");
      return response.json();
    },
  });

  const payment = paymentData?.data;

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/pagamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncioId: parsedAnuncioId,
          valor: 9.9, // Standard ad cost
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar código Pix");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pagamento", parsedAnuncioId],
      });
      refetchPayment();
      toast.success("Código Pix gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar código Pix",
      );
    },
  });

  // Poll payment status
  useEffect(() => {
    if (!payment || payment.status !== "pendente") return;

    const interval = setInterval(() => {
      refetchPayment().then((result) => {
        if (result.data?.data?.status === "pago") {
          toast.success("Pagamento confirmado! Seu anúncio foi ativado! 🎉");
          setTimeout(() => {
            navigate("/sell");
          }, 2000);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [payment?.id, payment?.status]);

  // Auto-create payment if doesn't exist
  useEffect(() => {
    if (!paymentLoading && !payment && !createPaymentMutation.isPending) {
      createPaymentMutation.mutate();
    }
  }, [paymentLoading, payment]);

  const isPaid = payment?.status === "pago";
  const isExpired =
    payment?.status === "expirado" || payment?.status === "cancelado";
  const isPending =
    payment?.status === "pendente" || payment?.status === "processando";

  const expirationTime = payment?.dataExpiracao
    ? new Date(payment.dataExpiracao)
    : null;
  const now = new Date();
  const timeRemaining = expirationTime
    ? Math.max(0, Math.floor((expirationTime.getTime() - now.getTime()) / 1000))
    : 0;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleCopyPixCode = () => {
    if (payment?.urlCopiaECola) {
      navigator.clipboard.writeText(payment.urlCopiaECola);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-walmart-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/sell"
            className="inline-flex items-center text-walmart-blue hover:text-walmart-blue-dark font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-walmart-text">
            Finalizar Pagamento
          </h1>
          <p className="text-walmart-text-secondary mt-2">
            Realize o pagamento via Pix para ativar seu anúncio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Ad Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="font-semibold text-walmart-text mb-4">
                Resumo do Anúncio
              </h2>

              {anuncio && (
                <div className="space-y-4">
                  {anuncio.imagem && (
                    <img
                      src={anuncio.imagem}
                      alt={anuncio.titulo}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <p className="text-sm text-walmart-text-secondary">
                      Título
                    </p>
                    <p className="font-semibold text-walmart-text">
                      {anuncio.titulo}
                    </p>
                  </div>

                  {anuncio.descricao && (
                    <div>
                      <p className="text-sm text-walmart-text-secondary">
                        Descrição
                      </p>
                      <p className="text-sm text-walmart-text line-clamp-2">
                        {anuncio.descricao}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-walmart-text-secondary">
                        Preço do anúncio:
                      </span>
                      <span className="font-semibold text-walmart-text">
                        R$ 9,90
                      </span>
                    </div>
                    {anuncio.destaque && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-walmart-text-secondary">
                          Em destaque:
                        </span>
                        <span className="text-sm font-semibold text-yellow-600">
                          Sim ⭐
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                      <span className="font-semibold text-walmart-text">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-walmart-blue">
                        R$ 9,90
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/anuncio/${parsedAnuncioId}`)}
                    className="w-full mt-4 px-4 py-2 border-2 border-walmart-blue text-walmart-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Ver Anúncio Completo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Card */}
            {isPaid && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 flex items-start gap-4">
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-800 text-lg">
                    Pagamento Confirmado!
                  </h3>
                  <p className="text-green-700 mt-2">
                    Seu anúncio foi ativado com sucesso e está disponível no
                    marketplace.
                  </p>
                  <Link
                    to="/sell"
                    className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Ver Meus Anúncios
                  </Link>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-800 text-lg">
                    Pagamento Expirado
                  </h3>
                  <p className="text-red-700 mt-2">
                    O código Pix expirou. Você será redirecionado para voltar a
                    tentar.
                  </p>
                  <Link
                    to="/sell"
                    className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Voltar para Anúncios
                  </Link>
                </div>
              </div>
            )}

            {isPending && (
              <>
                {/* QR Code Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="font-bold text-walmart-text mb-4 text-lg">
                    Escaneie o QR Code
                  </h2>

                  {payment ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                              payment.urlCopiaECola,
                            )}`}
                            alt="Pix QR Code"
                            className="w-72 h-72"
                          />
                        </div>
                      </div>

                      <p className="text-center text-walmart-text-secondary">
                        Abra seu aplicativo bancário e escaneie o código acima
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin">
                        <div className="w-8 h-8 border-4 border-walmart-blue border-t-transparent rounded-full" />
                      </div>
                      <p className="text-walmart-text-secondary mt-4">
                        Gerando código Pix...
                      </p>
                    </div>
                  )}
                </div>

                {/* Copy Code Section */}
                {payment && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="font-bold text-walmart-text mb-4 text-lg">
                      Copiar Código Pix
                    </h2>

                    <p className="text-sm text-walmart-text-secondary mb-3">
                      Se preferir, copie o código abaixo e cole no seu
                      aplicativo bancário
                    </p>

                    <button
                      onClick={handleCopyPixCode}
                      className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between transition-colors mb-3"
                    >
                      <code className="text-sm text-walmart-text font-mono truncate">
                        {payment.urlCopiaECola.substring(0, 50)}...
                      </code>
                      <Copy className="w-5 h-5 text-walmart-blue flex-shrink-0 ml-2" />
                    </button>

                    {copied && (
                      <p className="text-sm text-green-600 text-center font-semibold">
                        ✓ Copiado com sucesso!
                      </p>
                    )}
                  </div>
                )}

                {/* Timer Section */}
                {payment && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="flex items-center gap-3 justify-center">
                      <Clock className="w-6 h-6 text-walmart-blue" />
                      <div className="text-center">
                        <p className="text-sm text-walmart-text-secondary">
                          Tempo restante:
                        </p>
                        <p className="text-3xl font-bold text-walmart-blue mt-1">
                          {String(minutes).padStart(2, "0")}:
                          {String(seconds).padStart(2, "0")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Details */}
                {payment && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="font-bold text-walmart-text mb-4">
                      Detalhes do Pagamento
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-walmart-text-secondary">
                          ID Pix:
                        </span>
                        <span className="font-mono text-walmart-text">
                          {payment.pixId?.substring(0, 20)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-walmart-text-secondary">
                          Status:
                        </span>
                        <span className="font-semibold text-blue-600">
                          {payment.status === "pendente" &&
                            "Aguardando pagamento"}
                          {payment.status === "processando" && "Processando"}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="text-walmart-text-secondary font-semibold">
                          Valor:
                        </span>
                        <span className="font-bold text-walmart-blue">
                          R$ {Number(payment.valor).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-walmart-blue p-4 rounded">
                  <p className="text-sm text-walmart-text font-semibold mb-2">
                    💡 Dica
                  </p>
                  <p className="text-sm text-walmart-text-secondary">
                    O pagamento é processado instantaneamente após você
                    confirmar a transferência Pix. Seu anúncio será ativado
                    automaticamente!
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
