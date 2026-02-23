import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, ArrowRight, Trash2, Eye, DollarSign, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import AdCard from "@/components/AdCard";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

const PIX_KEY = "00020101021126470014br.gov.bcb.pix0125contato@herestomorrow.com520400005303986540519.905802BR5914HERES TOMORROW6009SAO PAULO622905251KHC5J8MPZBEFKH86HJ3H33VE6304A7E5";

export default function MeusAnuncios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast: toastShadcn } = useToast();
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedAdForPayment, setSelectedAdForPayment] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [isMarkingPayment, setIsMarkingPayment] = useState(false);

  // Fallback copy function for older browsers
  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("✓ Chave PIX copiada com sucesso!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar. Tente selecionar e copiar manualmente.");
    }
  };

  // Fetch user's ads (query is disabled if user is not logged in)
  const {
    data: anunciosData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["meus-anuncios", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/anuncios/do-usuario/listar", {
        headers: {
          "x-user-id": String(user?.id),
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Render unauthenticated state if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4 inline-block">
            <p className="text-vitrii-text">
              Por favor,{" "}
              <button
                onClick={() => navigate("/auth/signin")}
                className="text-vitrii-blue font-semibold hover:underline"
              >
                faça login
              </button>{" "}
              para ver seus anúncios
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const anuncios = anunciosData?.data || [];

  const handleDeleteAd = async () => {
    if (!adToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/anuncios/${adToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao deletar anúncio");
      }

      toastShadcn({
        title: "Sucesso",
        description: "Anúncio cancelado com sucesso",
      });

      setAdToDelete(null);
      refetch();
    } catch (error) {
      toastShadcn({
        title: "Erro",
        description:
          error instanceof Error ? error.message : "Erro ao cancelar anúncio",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarcarPagamentoRealizado = async () => {
    if (!selectedAdForPayment?.id) return;

    setIsMarkingPayment(true);
    try {
      const response = await fetch(
        `/api/anuncios/${selectedAdForPayment.id}/marcar-pagamento-realizado`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao marcar pagamento");
      }

      toast.success("Pagamento marcado como realizado! Aguardando análise...");
      setSelectedAdForPayment(null);
      refetch();
      setTimeout(() => {
        navigate(`/checkout/${selectedAdForPayment.id}`);
      }, 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao marcar pagamento"
      );
    } finally {
      setIsMarkingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      em_edicao: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Em Edição",
      },
      aguardando_pagamento: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Aguardando Pagamento",
      },
      pago: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Ativo",
      },
      ativo: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Ativo",
      },
      historico: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Histórico",
      },
    };

    const config = statusMap[status] || statusMap["em_edicao"];
    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      pendente: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Pagamento Pendente",
      },
      comprovante_enviado: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Comprovante Enviado",
      },
      aguardando_confirmacao_pagamento: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        label: "Aguardando Confirmação",
      },
      aprovado: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Pagamento Aprovado",
      },
      rejeitado: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Pagamento Rejeitado",
      },
    };

    const config = statusMap[status];
    if (!config) return null;

    return (
      <span
        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-vitrii-text mb-2 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-vitrii-blue" />
            Meus Anúncios
          </h1>
          <p className="text-vitrii-text-secondary">
            {anuncios.length} anúncio{anuncios.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="vitrii-card p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-300 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-300 rounded w-1/2" />
                    <div className="h-4 bg-gray-300 rounded w-1/3" />
                    <div className="h-4 bg-gray-300 rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : anuncios.length > 0 ? (
          <div className="space-y-4">
            {anuncios.map((anuncio: any) => (
              <div
                key={anuncio.id}
                className="vitrii-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4 p-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <ImageWithFallback
                      src={getAnuncioImage(anuncio)}
                      alt={getImageAlt(anuncio.titulo)}
                      fallbackIcon={<ShoppingBag className="w-8 h-8 text-gray-400" />}
                      containerClassName="w-24 h-24 rounded-lg"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-vitrii-text truncate">
                          {anuncio.titulo}
                        </h3>
                        <p className="text-sm text-vitrii-text-secondary">
                          {anuncio.anunciantes?.nome || "Anunciante"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(anuncio.status)}
                        {anuncio.statusPagamento && getPaymentStatusBadge(anuncio.statusPagamento)}
                      </div>
                    </div>

                    {/* Description and price */}
                    <p className="text-sm text-vitrii-text-secondary mb-2 line-clamp-2">
                      {anuncio.descricao || "Sem descrição"}
                    </p>

                    {anuncio.preco && (
                      <p className="text-lg font-bold text-vitrii-blue mb-3">
                        R$ {Number(anuncio.preco).toFixed(2)}
                      </p>
                    )}

                    {/* Meta info */}
                    <div className="text-xs text-vitrii-text-secondary mb-4 space-y-1">
                      {anuncio.visualizacoes !== undefined && (
                        <p>
                          👁️ {anuncio.visualizacoes} visualização
                          {anuncio.visualizacoes !== 1 ? "ões" : ""}
                        </p>
                      )}
                      {anuncio.dataCriacao && (
                        <p>
                          📅{" "}
                          {new Date(anuncio.dataCriacao).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      )}
                      <p className="text-xs text-vitrii-text-secondary">
                        ID: {anuncio.id}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Visualizar
                      </button>

                      {anuncio.status === "em_edicao" && anuncio.statusPagamento === "pendente" && (
                        <button
                          onClick={() => setSelectedAdForPayment(anuncio)}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors text-sm"
                        >
                          <DollarSign className="w-4 h-4" />
                          Efetuar Pagamento
                        </button>
                      )}

                      {anuncio.status !== "historico" && (
                        <button
                          onClick={() =>
                            navigate(`/anuncio/${anuncio.id}/editar`)
                          }
                          className="flex items-center gap-2 px-4 py-2 bg-vitrii-gray text-vitrii-text rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                        >
                          ✏️ Editar
                        </button>
                      )}

                      <button
                        onClick={() => setAdToDelete(anuncio.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-vitrii-text-secondary text-lg mb-6">
              Você ainda não tem anúncios
            </p>
            <button
              onClick={() => navigate("/anuncio/criar")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
            >
              <span>Criar Anúncio</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={adToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAdToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar anúncio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este anúncio? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAd}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Cancelando..." : "Sim, cancelar anúncio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {selectedAdForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-lg font-bold text-vitrii-text">
                Efetuar Pagamento - C6 Bank PIX
              </h2>
              <button
                onClick={() => setSelectedAdForPayment(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-blue-900 mb-2">
                  📱 Como pagar via PIX:
                </p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Abra seu app bancário</li>
                  <li>Escaneie o QR Code abaixo OU copie a chave PIX</li>
                  <li>Confirme o pagamento de R$ 19,90 (validade de 30 dias)</li>
                  <li>Clique em "Pagamento Realizado" para validar</li>
                </ol>
              </div>

              {/* QR Code Section */}
              <div>
                <h3 className="font-semibold text-vitrii-text mb-3 text-sm">
                  QR Code PIX
                </h3>
                <div className="flex justify-center">
                  <div className="bg-gray-100 p-4 rounded-lg border-4 border-vitrii-blue">
                    <img
                      src="https://cdn.builder.io/api/v1/image/assets%2Ff2e9e91d4cc44d4bae5b9dac3bb6abe8%2F97d00882ea4a4c149ab37215aedb309b?format=webp&width=800&height=1200"
                      alt="PIX QR Code"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* PIX Key Section */}
              <div>
                <h3 className="font-semibold text-vitrii-text mb-3 text-sm">
                  Chave PIX para Pagamento
                </h3>

                {/* PIX Info Card */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-blue-900">Dados do PIX</span>
                    <span className="text-base font-bold text-vitrii-blue">R$ 19,90</span>
                  </div>
                  <p className="text-xs text-blue-800">
                    <strong>Chave PIX (Email):</strong> contato@herestomorrow.com
                  </p>
                </div>

                {/* PIX Key Display */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-vitrii-text-secondary block mb-2">
                    Chave PIX Completa (Copia Automática):
                  </label>
                  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-3">
                    <code className="text-xs text-vitrii-text font-mono break-all whitespace-normal leading-relaxed">
                      {PIX_KEY}
                    </code>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => {
                    try {
                      // Modern Clipboard API
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(PIX_KEY).then(() => {
                          setCopied(true);
                          toast.success("✓ Chave PIX copiada com sucesso!");
                          setTimeout(() => setCopied(false), 2000);
                        }).catch(() => {
                          // Fallback: try old method
                          fallbackCopy(PIX_KEY);
                        });
                      } else {
                        // Fallback for older browsers
                        fallbackCopy(PIX_KEY);
                      }
                    } catch (error) {
                      toast.error("Erro ao copiar. Tente selecionar e copiar manualmente.");
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-xs ${
                    copied
                      ? "bg-green-100 text-green-700 border-2 border-green-300"
                      : "bg-vitrii-blue text-white border-2 border-vitrii-blue hover:bg-vitrii-blue-dark"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Chave PIX
                    </>
                  )}
                </button>
              </div>

              {/* Payment Confirmation */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-900 font-semibold mb-2">
                  ⚠️ Importante:
                </p>
                <p className="text-xs text-yellow-800">
                  Após realizar o pagamento via PIX, clique no botão abaixo
                  para registrar o comprovante e iniciar a análise de validação
                  do pagamento (até 24 horas).
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedAdForPayment(null)}
                  className="flex-1 px-3.5 py-1.5 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMarcarPagamentoRealizado}
                  disabled={isMarkingPayment}
                  className="flex-1 px-3.5 py-1.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isMarkingPayment ? "Processando..." : "Pagamento Realizado"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
