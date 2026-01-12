import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, ArrowRight, Trash2, Eye } from "lucide-react";
import AdCard from "@/components/AdCard";
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

export default function MeusAnuncios() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch user's ads (query is disabled if user is not logged in)
  const { data: anunciosData, isLoading, refetch } = useQuery({
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
        throw new Error(
          error.error || "Erro ao deletar anúncio",
        );
      }

      toast({
        title: "Sucesso",
        description: "Anúncio cancelado com sucesso",
      });

      setAdToDelete(null);
      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Erro ao cancelar anúncio",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      "em_edicao": {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Em Edição",
      },
      "aguardando_pagamento": {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Aguardando Pagamento",
      },
      "pago": {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Ativo",
      },
      "ativo": {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Ativo",
      },
      "historico": {
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
              <div
                key={i}
                className="vitrii-card p-6 animate-pulse"
              >
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
                    {anuncio.imagem ? (
                      <img
                        src={anuncio.imagem}
                        alt={anuncio.titulo}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
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
                      {getStatusBadge(anuncio.status)}
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
                          👁️ {anuncio.visualizacoes}{" "}
                          visualização{anuncio.visualizacoes !== 1 ? "ões" : ""}
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

                      {anuncio.status !== "historico" && (
                        <button
                          onClick={() => navigate(`/anuncio/${anuncio.id}/editar`)}
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
      <AlertDialog open={adToDelete !== null} onOpenChange={(open) => {
        if (!open) setAdToDelete(null);
      }}>
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

      <Footer />
    </div>
  );
}
