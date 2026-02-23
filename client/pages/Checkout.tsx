import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

export default function Checkout() {
  const { anuncioId: paramAnuncioId } = useParams<{ anuncioId: string }>();
  const [searchParams] = useSearchParams();
  const queryAnuncioId = searchParams.get("anuncioId");
  const anuncioId = paramAnuncioId || queryAnuncioId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState(false);

  // Auto-redirect if no anuncioId
  useEffect(() => {
    if (!anuncioId) {
      const timer = setTimeout(() => {
        navigate("/meus-anuncios");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [anuncioId, navigate]);

  if (!anuncioId) {
    return (
      <div className="min-h-screen bg-vitrii-gray-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-vitrii-text">
            ID do anúncio não encontrado
          </h1>
          <p className="text-vitrii-text-secondary mt-2 mb-6">
            Por favor, selecione um anúncio válido para continuar com o pagamento
          </p>
          <p className="text-sm text-vitrii-text-secondary mb-6">
            Você será redirecionado para Meus Anúncios em 3 segundos...
          </p>
          <Link
            to="/meus-anuncios"
            className="text-vitrii-blue hover:text-vitrii-blue-dark font-semibold"
          >
            ← Voltar para meus anúncios
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
          valor: 19.9,
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
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao gerar código Pix",
      );
    },
  });

  // Upload proof of payment
  const uploadProofMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploadingProof(true);
      
      // In production, upload to cloud storage (S3, Firebase, etc)
      // For now, we'll create a data URL for demo purposes
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (dataUrl) => {
      if (!payment?.id) return;
      
      // Send proof to backend
      fetch(`/api/pagamentos/${payment.id}/comprovante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comprovantePagamento: dataUrl,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setUploadingProof(false);
          if (data.success) {
            toast.success(data.message);
            queryClient.invalidateQueries({
              queryKey: ["pagamento", parsedAnuncioId],
            });
            refetchPayment();
            setShowProofModal(false);
            setProofFile(null);
            setProofPreview("");
          } else {
            toast.error(data.error || "Erro ao enviar comprovante");
            setUploadingProof(false);
          }
        })
        .catch((error) => {
          console.error("Erro:", error);
          toast.error("Erro ao enviar comprovante");
          setUploadingProof(false);
        });
    },
    onError: (error) => {
      setUploadingProof(false);
      toast.error("Erro ao processar arquivo");
      console.error(error);
    },
  });

  // Handle proof file selection
  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }

      // Validate file type
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
        toast.error("Formato inválido. Aceite: JPG, PNG, PDF");
        return;
      }

      setProofFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProofPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle proof upload
  const handleUploadProof = () => {
    if (!proofFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    uploadProofMutation.mutate(proofFile);
  };

  // Auto-create payment if doesn't exist
  useEffect(() => {
    if (!paymentLoading && !payment && !createPaymentMutation.isPending) {
      createPaymentMutation.mutate();
    }
  }, [paymentLoading, payment]);

  const isPaid = payment?.status === "pago" || payment?.status === "aprovado";
  const isProofSent = payment?.status === "comprovante_enviado";
  const isAnalysis =
    payment?.status === "comprovante_enviado" ||
    payment?.status === "aprovado" ||
    payment?.status === "rejeitado";
  const isRejected = payment?.status === "rejeitado";
  const isExpired =
    payment?.status === "expirado" || payment?.status === "cancelado";
  const isPending = payment?.status === "pendente";

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
    <div className="min-h-screen bg-vitrii-gray-light py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/sell"
            className="inline-flex items-center text-vitrii-blue hover:text-vitrii-blue-dark font-semibold mb-4"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-vitrii-text">
            Finalizar Pagamento
          </h1>
          <p className="text-vitrii-text-secondary mt-2">
            Realize o pagamento via Pix para ativar seu anúncio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Ad Summary */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="font-semibold text-vitrii-text mb-4">
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
                    <p className="text-sm text-vitrii-text-secondary">
                      Título
                    </p>
                    <p className="font-semibold text-vitrii-text">
                      {anuncio.titulo}
                    </p>
                  </div>

                  {anuncio.descricao && (
                    <div>
                      <p className="text-sm text-vitrii-text-secondary">
                        Descrição
                      </p>
                      <p className="text-sm text-vitrii-text line-clamp-2">
                        {anuncio.descricao}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-vitrii-text-secondary">
                        Preço do anúncio:
                      </span>
                      <span className="font-semibold text-vitrii-text">
                        R$ 19,90 (30 dias)
                      </span>
                    </div>
                    {anuncio.destaque && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-vitrii-text-secondary">
                          Em destaque:
                        </span>
                        <span className="text-sm font-semibold text-yellow-600">
                          Sim ⭐
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                      <span className="font-semibold text-vitrii-text">
                        Total:
                      </span>
                      <span className="text-2xl font-bold text-vitrii-blue">
                        R$ 19,90 (30 dias)
                      </span>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Status: Paid */}
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

            {/* Status: Proof Sent */}
            {isProofSent && !isPaid && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 flex items-start gap-4">
                <Clock className="w-8 h-8 text-vitrii-blue flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-800 text-lg">
                    Comprovante Enviado!
                  </h3>
                  <p className="text-blue-700 mt-3 text-base font-semibold">
                    Agradecemos a confirmação do pagamento. Agora é só aguardar
                    a confirmação do pagamento para que seu anúncio seja
                    publicada em nossa plataforma.
                  </p>
                  <p className="text-blue-700 mt-3">
                    Seu comprovante de pagamento foi recebido. Analisaremos em
                    até <strong>24 horas</strong> e seu anúncio será ativado em
                    breve.
                  </p>
                  <p className="text-sm text-blue-600 mt-3">
                    📧 Você receberá um email de confirmação assim que o
                    pagamento for validado.
                  </p>
                </div>
              </div>
            )}

            {/* Status: Rejected */}
            {isRejected && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-800 text-lg">
                    Pagamento Rejeitado
                  </h3>
                  <p className="text-red-700 mt-2">
                    O comprovante enviado foi rejeitado. Por favor, tente novamente
                    com um comprovante válido.
                  </p>
                  <button
                    onClick={() => setShowProofModal(true)}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Enviar Novo Comprovante
                  </button>
                </div>
              </div>
            )}

            {/* Status: Expired */}
            {isExpired && !isProofSent && (
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

            {/* Status: Pending Payment */}
            {isPending && (
              <>
                {/* QR Code Section */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="font-bold text-vitrii-text mb-4 text-lg">
                    📱 Escaneie o QR Code
                  </h2>

                  {payment ? (
                    <div className="space-y-6">
                      <div className="flex justify-center">
                        <div className="bg-gray-100 p-4 rounded-lg border-4 border-vitrii-blue">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                              payment.urlCopiaECola || "https://vitrii.com.br",
                            )}`}
                            alt="Pix QR Code"
                            className="w-72 h-72"
                          />
                        </div>
                      </div>

                      <p className="text-center text-vitrii-text-secondary">
                        Abra seu aplicativo bancário e escaneie o código acima
                        para pagar
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin">
                        <div className="w-8 h-8 border-4 border-vitrii-blue border-t-transparent rounded-full" />
                      </div>
                      <p className="text-vitrii-text-secondary mt-4">
                        Gerando código Pix...
                      </p>
                    </div>
                  )}
                </div>

                {/* Copy Code Section */}
                {payment && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="font-bold text-vitrii-text mb-4 text-lg">
                      📋 Copiar Código Pix
                    </h2>

                    <p className="text-sm text-vitrii-text-secondary mb-3">
                      Se preferir, copie o código abaixo e cole no seu
                      aplicativo bancário
                    </p>

                    <button
                      onClick={handleCopyPixCode}
                      className="w-full bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 rounded-lg p-4 flex items-center justify-between transition-colors mb-3"
                    >
                      <code className="text-xs text-vitrii-text font-mono truncate">
                        {payment.urlCopiaECola?.substring(0, 40)}...
                      </code>
                      <Copy className="w-5 h-5 text-vitrii-blue flex-shrink-0 ml-2" />
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
                      <Clock className="w-6 h-6 text-vitrii-blue" />
                      <div className="text-center">
                        <p className="text-sm text-vitrii-text-secondary">
                          Tempo restante:
                        </p>
                        <p className="text-3xl font-bold text-vitrii-blue mt-1">
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
                    <h2 className="font-bold text-vitrii-text mb-4">
                      Detalhes do Pagamento
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-vitrii-text-secondary">
                          Status:
                        </span>
                        <span className="font-semibold text-blue-600">
                          Aguardando Pagamento
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="text-vitrii-text-secondary font-semibold">
                          Valor:
                        </span>
                        <span className="font-bold text-vitrii-blue">
                          R$ {Number(payment.valor).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-vitrii-blue p-4 rounded">
                  <p className="text-sm text-vitrii-text font-semibold mb-2">
                    💡 Dica
                  </p>
                  <p className="text-sm text-vitrii-text-secondary">
                    Após realizar o pagamento, clique em "Pagamento Realizado"
                    para enviar o comprovante. Nossa equipe analisará em até 24
                    horas.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="font-semibold text-vitrii-text mb-4">Próximos Passos</h2>
          <div className="space-y-3">
            {/* Realizar Pagamento Button - Only if pending */}
            {isPending && payment && (
              <button
                onClick={() => setShowProofModal(true)}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Realizar Pagamento
              </button>
            )}

            {/* Reeditar Anúncio Button */}
            <button
              onClick={() => navigate(`/anuncio/${parsedAnuncioId}/editar`)}
              className="w-full px-6 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              Reeditar Anúncio
            </button>

            {/* Ver Anúncio Completo Button */}
            <button
              onClick={() => navigate(`/anuncio/${parsedAnuncioId}`)}
              className="w-full px-6 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Ver Anúncio Completo
            </button>

            {/* Voltar para a Página Inicial Button */}
            <Link
              to="/"
              className="w-full px-6 py-3 border-2 border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              Voltar para a Página Inicial
            </Link>
          </div>
        </div>
      </div>

      {/* Proof Upload Modal */}
      {showProofModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-xl font-bold text-vitrii-text">
                Enviar Comprovante de Pagamento
              </h2>
              <button
                onClick={() => {
                  setShowProofModal(false);
                  setProofFile(null);
                  setProofPreview("");
                }}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-vitrii-text-secondary mb-4">
                  Selecione o comprovante do seu pagamento (JPG, PNG ou PDF)
                </p>

                {/* File Input */}
                <label className="block">
                  <div className="border-2 border-dashed border-vitrii-blue rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50 transition-colors">
                    {proofPreview ? (
                      <div className="space-y-4">
                        {proofFile?.type.startsWith("image/") ? (
                          <img
                            src={proofPreview}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                              <Upload className="w-12 h-12 text-vitrii-blue mx-auto mb-2" />
                              <p className="text-vitrii-text font-semibold">
                                PDF: {proofFile?.name}
                              </p>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-vitrii-text font-semibold">
                          {proofFile?.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setProofFile(null);
                            setProofPreview("");
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-semibold"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 text-vitrii-blue mx-auto" />
                        <p className="text-vitrii-text font-semibold">
                          Clique ou arraste o arquivo aqui
                        </p>
                        <p className="text-xs text-vitrii-text-secondary">
                          JPG, PNG ou PDF • Máximo 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleProofFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-vitrii-text font-semibold mb-2">
                  ℹ️ Informações Importantes
                </p>
                <ul className="text-sm text-vitrii-text-secondary space-y-1">
                  <li>
                    • O comprovante deve conter data, valor e identificação de
                    quem pagou
                  </li>
                  <li>
                    • Enviamos o PIX em nome de "Vitrii" - procure por essa
                    identificação
                  </li>
                  <li>
                    • Análise feita em até 24 horas úteis
                  </li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowProofModal(false);
                    setProofFile(null);
                    setProofPreview("");
                  }}
                  className="flex-1 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={!proofFile || uploadingProof}
                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingProof ? "Enviando..." : "Enviar Comprovante"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
