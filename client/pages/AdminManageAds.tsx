import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Anuncio {
  id: number;
  titulo: string;
  descricao?: string;
  lojaId: number;
  productId: number;
  fotoUrl?: string;
  precoAnuncio?: number;
  isDoacao: boolean;
  destaque: boolean;
  isActive: boolean;
  status: string;
  dataCriacao: string;
  loja?: { nome: string };
  producto?: { nome: string };
}

export default function AdminManageAds() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAd, setExpandedAd] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Fetch all ads
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["admin-anuncios"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
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
        headers: { "Content-Type": "application/json" },
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

  const anuncios = anunciosData?.data || [];

  const filteredAnuncios = anuncios.filter((a: Anuncio) => {
    const matchesSearch =
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.loja?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.producto?.nome.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "todos") return matchesSearch;
    if (filterStatus === "ativo") return matchesSearch && a.isActive;
    if (filterStatus === "inativo") return matchesSearch && !a.isActive;
    if (filterStatus === "destaque") return matchesSearch && a.destaque;
    return matchesSearch;
  });

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
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-walmart-text-secondary">Carregando anúncios...</p>
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
                        Loja: {anuncio.loja?.nome || "N/A"} • Produto:{" "}
                        {anuncio.producto?.nome || "N/A"}
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
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            Doação
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    {anuncio.precoAnuncio && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-walmart-blue">
                          R$ {anuncio.precoAnuncio.toFixed(2)}
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
              encontrado(s) •{" "}
              <strong>Ativos:</strong> {anuncios.filter((a: Anuncio) => a.isActive).length} •{" "}
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
