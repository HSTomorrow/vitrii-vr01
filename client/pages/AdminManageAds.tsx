import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
  FileText,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface Anuncio {
  id: number;
  titulo: string;
  descricao?: string;
  anuncianteId: number;
  productId: number;
  fotoUrl?: string;
  precoAnuncio?: number;
  isDoacao: boolean;
  destaque: boolean;
  isActive: boolean;
  status: string;
  dataCriacao: string;
  anunciante?: { nome: string };
  producto?: { nome: string };
}

export default function AdminManageAds() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAd, setExpandedAd] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Check if user is admin
  const isAdmin = user?.tipoUsuario === "adm";

  // Fetch all ads (including inactive ones for admin view)
  const {
    data: anunciosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-anuncios"],
    enabled: isAdmin,
    queryFn: async () => {
      // Fetch with limit=100 to get all ads (API max is 100)
      // includeInactive=true to show inactive ads in admin view
      const response = await fetch("/api/anuncios?includeInactive=true&limit=100", {
        headers: {
          "x-user-id": user?.id ? String(user.id) : "",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      return response.json();
    },
  });

  // Mutation to toggle featured
  const toggleDestaqueMutation = useMutation({
    mutationFn: async ({
      anuncioId,
      destaque,
    }: {
      anuncioId: number;
      destaque: boolean;
    }) => {
      const response = await fetch(`/api/anuncios/${anuncioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id ? String(user.id) : "",
        },
        body: JSON.stringify({ destaque: !destaque }),
      });
      if (!response.ok) throw new Error("Erro ao atualizar anúncio");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    },
  });

  // Mutation to toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      anuncioId,
      activate,
    }: {
      anuncioId: number;
      activate: boolean;
    }) => {
      const endpoint = activate ? "/activate" : "/inactivate";
      const response = await fetch(`/api/anuncios/${anuncioId}${endpoint}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id ? String(user.id) : "",
        },
      });
      if (!response.ok) throw new Error("Erro ao atualizar anúncio");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.activate ? "Anúncio reativado" : "Anúncio inativado",
      );
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar");
    },
  });

  // Mutation to delete ad
  const deleteAdMutation = useMutation({
    mutationFn: async (anuncioId: number) => {
      const response = await fetch(`/api/anuncios/${anuncioId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id ? String(user.id) : "",
        },
      });
      if (!response.ok) throw new Error("Erro ao deletar anúncio");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Anúncio deletado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar");
    },
  });

  // Mutation to override ad status (ADM only)
  const overrideStatusMutation = useMutation({
    mutationFn: async ({
      anuncioId,
      status,
    }: {
      anuncioId: number;
      status: string;
    }) => {
      const response = await fetch(
        `/api/anuncios/${anuncioId}/override-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user?.id ? String(user.id) : "",
          },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao alterar status do anúncio");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast.success(`Anúncio alterado para "${variables.status}" com sucesso`);
      queryClient.invalidateQueries({ queryKey: ["admin-anuncios"] });
      setExpandedAd(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Erro ao alterar status",
      );
    },
  });

  const anuncios = anunciosData?.data || [];

  const filteredAnuncios = anuncios.filter((a: Anuncio) => {
    const matchesSearch =
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.anunciante?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.producto?.nome.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "todos") return matchesSearch;
    if (filterStatus === "ativo") return matchesSearch && a.isActive;
    if (filterStatus === "inativo") return matchesSearch && !a.isActive;
    if (filterStatus === "destaque") return matchesSearch && a.destaque;
    return matchesSearch;
  });

  // Check authorization
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-walmart-bg flex flex-col">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-walmart-text mb-2">
              Acesso Restrito
            </h1>
            <p className="text-walmart-text-secondary mb-6">
              Apenas administradores podem acessar esta página.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-walmart-blue text-white rounded-lg hover:bg-blue-700 transition"
            >
              Voltar para Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-walmart-bg flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-walmart-blue" />
            <h1 className="text-3xl font-bold text-walmart-text">
              Gerenciar Anúncios
            </h1>
          </div>
          <p className="text-walmart-text-secondary">
            Edite, ative ou desative qualquer anúncio da plataforma
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-walmart-text-secondary" />
              <input
                type="text"
                placeholder="Buscar por título, loja ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue"
            >
              <option value="todos">Todos os anúncios</option>
              <option value="ativo">Apenas ativos</option>
              <option value="inativo">Apenas inativos</option>
              <option value="destaque">Apenas em destaque</option>
            </select>
          </div>
        </div>

        {/* Ads List */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">
                  Erro ao carregar anúncios
                </h3>
                <p className="text-sm text-red-700">
                  {error instanceof Error ? error.message : "Erro desconhecido"}
                </p>
              </div>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-walmart-text-secondary">
              Carregando anúncios...
            </p>
          </div>
        ) : filteredAnuncios.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-walmart-text-secondary mx-auto mb-2" />
            <p className="text-walmart-text-secondary">
              Nenhum anúncio encontrado
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnuncios.map((anuncio: Anuncio) => (
              <div
                key={anuncio.id}
                className="bg-white border border-gray-200 rounded-lg transition hover:shadow-md"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedAd(expandedAd === anuncio.id ? null : anuncio.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    {anuncio.fotoUrl && (
                      <img
                        src={anuncio.fotoUrl}
                        alt={anuncio.titulo}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-walmart-text truncate">
                          {anuncio.titulo}
                        </h3>
                        {anuncio.destaque && (
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-walmart-text-secondary truncate">
                        Anunciante: {anuncio.anunciante?.nome || "N/A"} •
                        Produto: {anuncio.producto?.nome || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            anuncio.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {anuncio.isActive ? "Ativo" : "Inativo"}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {anuncio.status}
                        </span>
                        {anuncio.isDoacao && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                            Gratuito
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    {anuncio.precoAnuncio &&
                      typeof anuncio.precoAnuncio === "number" && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-walmart-blue">
                            R$ {Number(anuncio.precoAnuncio).toFixed(2)}
                          </p>
                        </div>
                      )}

                    {/* Expand button */}
                    {expandedAd === anuncio.id ? (
                      <ChevronUp className="w-5 h-5 text-walmart-text-secondary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-walmart-text-secondary flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAd === anuncio.id && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                    {/* Description */}
                    {anuncio.descricao && (
                      <div>
                        <h4 className="font-semibold text-walmart-text mb-2">
                          Descrição
                        </h4>
                        <p className="text-walmart-text-secondary line-clamp-3">
                          {anuncio.descricao}
                        </p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-walmart-text-secondary">
                          Data de criação
                        </p>
                        <p className="font-medium text-walmart-text">
                          {new Date(anuncio.dataCriacao).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-walmart-text-secondary">ID</p>
                        <p className="font-medium text-walmart-text">
                          #{anuncio.id}
                        </p>
                      </div>
                    </div>

                    {/* Status Control */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-walmart-text mb-2">
                        Status do Anúncio
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={anuncio.status}
                          onChange={(e) =>
                            overrideStatusMutation.mutate({
                              anuncioId: anuncio.id,
                              status: e.target.value,
                            })
                          }
                          disabled={overrideStatusMutation.isPending}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-walmart-blue text-sm"
                        >
                          <option value="em_edicao">Em Edição</option>
                          <option value="aguardando_pagamento">
                            Aguardando Pagamento
                          </option>
                          <option value="pago">Pago (Publicado)</option>
                          <option value="ativo">Ativo</option>
                          <option value="historico">Histórico</option>
                        </select>
                      </div>
                      <p className="text-xs text-walmart-text-secondary mt-1">
                        Status atual:{" "}
                        <span className="font-semibold">{anuncio.status}</span>
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 border-t border-gray-300">
                      {/* Edit Button */}
                      <Link
                        to={`/anuncio/${anuncio.id}/editar`}
                        className="px-3 py-2 bg-walmart-blue text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </Link>

                      {/* Toggle Active */}
                      <button
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            anuncioId: anuncio.id,
                            activate: !anuncio.isActive,
                          })
                        }
                        disabled={toggleActiveMutation.isPending}
                        className={`px-3 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm font-semibold ${
                          anuncio.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {anuncio.isActive ? (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Ativar
                          </>
                        )}
                      </button>

                      {/* Toggle Featured */}
                      <button
                        onClick={() =>
                          toggleDestaqueMutation.mutate({
                            anuncioId: anuncio.id,
                            destaque: anuncio.destaque,
                          })
                        }
                        disabled={toggleDestaqueMutation.isPending}
                        className={`px-3 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm font-semibold ${
                          anuncio.destaque
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Star className="w-4 h-4" />
                        {anuncio.destaque ? "Remover" : "Destacar"}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Tem certeza que deseja deletar este anúncio?",
                            )
                          ) {
                            deleteAdMutation.mutate(anuncio.id);
                          }
                        }}
                        disabled={deleteAdMutation.isPending}
                        className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition flex items-center justify-center gap-2 text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        Deletar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!isLoading && (
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Total:</strong> {filteredAnuncios.length} anúncio(s)
              encontrado(s) • <strong>Ativos:</strong>{" "}
              {anuncios.filter((a: Anuncio) => a.isActive).length} •{" "}
              <strong>Em Destaque:</strong>{" "}
              {anuncios.filter((a: Anuncio) => a.destaque).length}
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
