import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Filter,
  Search,
  Star,
  Package,
  Heart,
  X,
  MapPin,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Browse() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState(5000);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  // Fetch all ads
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["anuncios-browse"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/anuncios");
        if (!response.ok) throw new Error("Erro ao buscar anúncios");
        return response.json();
      } catch (error) {
        console.error("Error fetching ads:", error);
        return { data: [] };
      }
    },
  });

  const allAnuncios = anunciosData?.data || [];

  // Apply filters with safeguards
  const filtered = useMemo(() => {
    try {
      let result = Array.isArray(allAnuncios) ? [...allAnuncios] : [];

      // Filter by search term
      if (searchTerm && searchTerm.trim().length > 0) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter((a: any) => {
          try {
            return (
              (a.titulo && a.titulo.toLowerCase().includes(searchLower)) ||
              (a.descricao && a.descricao.toLowerCase().includes(searchLower)) ||
              (a.anunciante?.nome && a.anunciante.nome.toLowerCase().includes(searchLower)) ||
              (a.producto?.nome && a.producto.nome.toLowerCase().includes(searchLower))
            );
          } catch (e) {
            return true;
          }
        });
      }

      // Filter by price range
      result = result.filter((a: any) => {
        try {
          const price = a.precoAnuncio || a.tabelaDePreco?.preco || 0;
          return Number(price) <= Number(priceRange);
        } catch (e) {
          return true;
        }
      });

      // Filter by favorites
      if (showFavoritesOnly && user) {
        result = result.filter((a: any) => favoritos.has(a.id));
      }

      return result;
    } catch (error) {
      console.error("Error filtering ads:", error);
      return allAnuncios;
    }
  }, [allAnuncios, searchTerm, priceRange, showFavoritesOnly, favoritos, user]);

  // Toggle favorite mutation
  const toggleFavoritoMutation = useMutation({
    mutationFn: async (anuncioId: number) => {
      if (!user) {
        toast.error("Faça login para adicionar favoritos");
        navigate("/auth/signin");
        throw new Error("Not logged in");
      }

      const response = await fetch("/api/favoritos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: user.id,
          anuncioId,
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar favorito");
      return { ...(await response.json()), anuncioId };
    },
    onSuccess: (data) => {
      setFavoritos((prev) => {
        const newFavoritos = new Set(prev);
        if (data.isFavorited) {
          newFavoritos.add(data.anuncioId);
          toast.success("Adicionado aos favoritos!");
        } else {
          newFavoritos.delete(data.anuncioId);
          toast.success("Removido dos favoritos");
        }
        return newFavoritos;
      });
    },
  });

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange(5000);
    setShowFavoritesOnly(false);
  };

  const hasActiveFilters = searchTerm || priceRange !== 5000 || showFavoritesOnly;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Explorar Anúncios</h1>
          <p className="text-blue-100 text-lg">
            Descubra produtos, serviços e eventos de vendedores verificados
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block fixed inset-0 lg:static bg-black lg:bg-transparent bg-opacity-50 lg:bg-opacity-100 z-40 lg:z-auto`}
          >
            <div className="bg-white lg:bg-walmart-gray-light rounded-lg p-6 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-6 lg:mb-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-walmart-blue" />
                  <h3 className="font-bold text-walmart-text text-lg">Filtros</h3>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-walmart-text"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Search in filters */}
                <div>
                  <label className="block font-semibold text-walmart-text mb-3">
                    Busca
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block font-semibold text-walmart-text mb-3">
                    Preço Máximo
                  </label>
                  <div className="space-y-3">
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      value={priceRange}
                      onChange={(e) => setPriceRange(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-walmart-text-secondary">
                      <span>R$ 0</span>
                      <span>R$ {priceRange.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>

                {/* Favorites Filter */}
                {user && (
                  <div className="border-t border-gray-200 pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFavoritesOnly}
                        onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                        className="rounded"
                      />
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-walmart-text-secondary text-sm">
                        Apenas Favoritos
                      </span>
                    </label>
                  </div>
                )}

                {/* Reset Button */}
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="w-full text-walmart-blue py-2 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex-1">
                <p className="text-walmart-text-secondary">
                  {filtered.length} anúncio{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-walmart-blue text-white rounded-lg font-semibold"
              >
                <Filter className="w-4 h-4" />
                Filtros
              </button>
            </div>

            {/* Ads Grid */}
            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="vitrii-card overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-300" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-3 bg-gray-300 rounded w-3/4" />
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-10 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered && filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filtered.map((anuncio: any) => (
                  <div
                    key={anuncio.id}
                    className="vitrii-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative group"
                  >
                    {/* Image */}
                    <div
                      className="w-full h-48 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                    >
                      {anuncio.fotoUrl ? (
                        <img
                          src={anuncio.fotoUrl}
                          alt={anuncio.titulo}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-white opacity-50" />
                      )}
                    </div>

                    {/* Store Logo Badge */}
                    {anuncio.anunciante?.fotoUrl && (
                      <div className="absolute bottom-3 left-3 z-10 w-12 h-12 rounded-full bg-white border-2 border-walmart-blue overflow-hidden flex items-center justify-center shadow-md">
                        <img
                          src={anuncio.anunciante.fotoUrl}
                          alt={anuncio.anunciante.nome}
                          className="w-full h-full object-cover"
                          title={anuncio.anunciante.nome}
                        />
                      </div>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoritoMutation.mutate(anuncio.id);
                      }}
                      disabled={toggleFavoritoMutation.isPending}
                      className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title={
                        favoritos.has(anuncio.id)
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          favoritos.has(anuncio.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>

                    {/* Content */}
                    <div className="p-4 flex flex-col h-full">
                      <div className="flex-1">
                        <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2 hover:text-walmart-blue">
                          {anuncio.titulo}
                        </h4>
                        <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                          {anuncio.descricao || "Veja mais detalhes"}
                        </p>

                        {/* Location */}
                        {anuncio.anunciante?.endereco && (
                          <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{anuncio.anunciante.endereco}</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Rating */}
                      <div className="flex justify-between items-center mb-4 pt-2 border-t border-gray-100">
                        <span className="text-xl font-bold text-walmart-blue">
                          R${" "}
                          {anuncio.isDoacao
                            ? "Grátis"
                            : (
                                anuncio.precoAnuncio ||
                                anuncio.tabelaDePreco?.preco ||
                                0
                              ).toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                          <span className="text-sm font-semibold">5.0</span>
                        </div>
                      </div>

                      {/* Store Info */}
                      {anuncio.anunciante?.nome && (
                        <div className="mb-4 p-2 bg-gray-50 rounded text-xs">
                          <p className="text-walmart-text-secondary truncate">
                            <strong>{anuncio.anunciante.nome}</strong>
                          </p>
                        </div>
                      )}

                      {/* Button */}
                      <button
                        onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        className="w-full bg-walmart-blue text-white py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // No results
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-walmart-gray-light rounded-full mb-6">
                  <Package className="w-12 h-12 text-walmart-text-secondary" />
                </div>
                <h2 className="text-3xl font-bold text-walmart-text mb-2">
                  Nenhum anúncio encontrado
                </h2>
                <p className="text-walmart-text-secondary mb-8 max-w-md mx-auto text-lg">
                  {searchTerm
                    ? `Não encontramos anúncios com "${searchTerm}". Tente ajustar os filtros.`
                    : "Nenhum anúncio publicado ainda. Seja o primeiro a publicar!"}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="inline-flex items-center justify-center bg-walmart-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                  <Link
                    to="/anuncio/criar"
                    className="inline-flex items-center justify-center bg-walmart-yellow text-walmart-text px-6 py-3 rounded-lg font-semibold hover:bg-walmart-yellow-dark transition-colors"
                  >
                    Publicar Anúncio
                  </Link>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center border-2 border-walmart-blue text-walmart-blue px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Voltar para Home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
