import { useState, useMemo, useEffect } from "react";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Package,
  Star,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  Store,
  ArrowRight,
} from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";

const ITEMS_PER_PAGE = 12;

export default function SearchAnuncios() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<
    "recent" | "price-asc" | "price-desc" | "featured"
  >("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(true);

  // Read search query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) {
      setSearchTerm(decodeURIComponent(q));
    }
  }, [location.search]);

  // Fetch all ads
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["anuncios", "search"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?status=pago&limit=500");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  // Fetch all anunciantes for filter and search
  const { data: storesData } = useQuery({
    queryKey: ["anunciantes"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes?limit=500");
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
  });

  // Filter and sort ads
  const filteredAds = useMemo(() => {
    let ads = anunciosData?.data || [];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      ads = ads.filter(
        (ad: any) =>
          ad.titulo.toLowerCase().includes(term) ||
          ad.descricao?.toLowerCase().includes(term) ||
          ad.anunciantes?.nome?.toLowerCase().includes(term),
      );
    }

    // Filter by category
    if (selectedCategory) {
      ads = ads.filter((ad: any) => ad.categoria === selectedCategory);
    }

    // Filter by store
    if (selectedStore) {
      ads = ads.filter((ad: any) => ad.anuncianteId === selectedStore);
    }

    // Filter by price range
    if (priceRange.min || priceRange.max) {
      ads = ads.filter((ad: any) => {
        const price = ad.precoAnuncio || ad.tabelaDePreco?.preco || 0;
        const min = priceRange.min ? parseFloat(priceRange.min) : 0;
        const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
        return price >= min && price <= max;
      });
    }

    // Sort ads
    ads.sort((a: any, b: any) => {
      if (sortBy === "featured") {
        // Featured ads first, then by creation date
        if (a.destaque !== b.destaque) return b.destaque ? 1 : -1;
        return (
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        );
      }

      if (sortBy === "recent") {
        return (
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        );
      }

      const priceA = a.preco || a.tabelaDePreco?.preco || 0;
      const priceB = b.preco || b.tabelaDePreco?.preco || 0;

      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;

      return 0;
    });

    return ads;
  }, [
    anunciosData?.data,
    searchTerm,
    selectedCategory,
    selectedStore,
    priceRange,
    sortBy,
  ]);

  // Filter and search anunciantes
  const filteredAnunciantes = useMemo(() => {
    let anunciantes = storesData?.data || [];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      anunciantes = anunciantes.filter(
        (anunciante: any) =>
          anunciante.nome?.toLowerCase().includes(term) ||
          anunciante.descricao?.toLowerCase().includes(term) ||
          anunciante.cidade?.toLowerCase().includes(term),
      );
    }

    return anunciantes;
  }, [storesData?.data, searchTerm]);

  // Pagination for ads
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIdx, endIdx);

  const stores = storesData?.data || [];
  const hasResults = filteredAds.length > 0 || filteredAnunciantes.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Search Header */}
      <section className="bg-vitrii-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Buscar Anúncios e Anunciantes</h1>
          <p className="text-blue-100 mb-6">
            Encontre o que você procura: produtos, serviços, eventos, agendas e anunciantes
          </p>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Digite o que você procura..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-blue-50 text-vitrii-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-vitrii-yellow"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <div
              className={`${
                showFilters
                  ? "w-full md:w-64 flex-shrink-0"
                  : "hidden md:block md:w-64 flex-shrink-0"
              }`}
            >
              <div className="bg-vitrii-gray-light rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between md:hidden">
                  <h2 className="font-bold text-vitrii-text">Filtros</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm text-vitrii-blue"
                  >
                    Fechar
                  </button>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">
                    Categoria
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={selectedCategory === null}
                        onChange={() => {
                          setSelectedCategory(null);
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 text-vitrii-blue"
                      />
                      <span className="text-sm text-vitrii-text">Todas</span>
                    </label>
                    {["roupas", "carros", "imoveis"].map((cat) => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          checked={selectedCategory === cat}
                          onChange={() => {
                            setSelectedCategory(cat);
                            setCurrentPage(1);
                          }}
                          className="w-4 h-4 text-vitrii-blue"
                        />
                        <span className="text-sm text-vitrii-text capitalize">
                          {cat === "roupas" && "👕 Roupas"}
                          {cat === "carros" && "🚗 Carros"}
                          {cat === "imoveis" && "🏠 Imóveis"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">
                    Faixa de Preço
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={priceRange.min}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, min: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Máx"
                      value={priceRange.max}
                      onChange={(e) => {
                        setPriceRange({ ...priceRange, max: e.target.value });
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Store Filter */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">
                    Anunciante
                  </h3>
                  <select
                    value={selectedStore || ""}
                    onChange={(e) => {
                      setSelectedStore(
                        e.target.value ? parseInt(e.target.value) : null,
                      );
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Todas as anunciantes</option>
                    {stores.map((store: any) => (
                      <option key={store.id} value={store.id}>
                        {store.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">
                    Ordenar Por
                  </h3>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as any);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="featured">Em Destaque</option>
                    <option value="recent">Mais Recentes</option>
                    <option value="price-asc">Menor Preço</option>
                    <option value="price-desc">Maior Preço</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(searchTerm ||
                  selectedCategory ||
                  selectedStore ||
                  priceRange.min ||
                  priceRange.max) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory(null);
                      setSelectedStore(null);
                      setPriceRange({ min: "", max: "" });
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors text-sm font-semibold"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header - Only show for ads pagination */}
              {filteredAds.length > 0 && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-vitrii-text-secondary">
                      Página {currentPage} de {totalPages || 1}
                    </p>
                  </div>

                  <div className="flex gap-2 md:hidden">
                    <button
                      onClick={() => setShowFilters(true)}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Filter className="w-4 h-4" />
                      Filtros
                    </button>
                  </div>

                  <div className="hidden md:flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded ${viewMode === "grid" ? "bg-vitrii-blue text-white" : "border border-gray-300"}`}
                    >
                      <Grid3x3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded ${viewMode === "list" ? "bg-vitrii-blue text-white" : "border border-gray-300"}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue mx-auto" />
                </div>
              ) : !hasResults ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-vitrii-text text-lg">
                    Nenhum resultado encontrado
                  </p>
                  <p className="text-vitrii-text-secondary">
                    Tente usar outras palavras-chave
                  </p>
                </div>
              ) : (
                <>
                  {/* Anunciantes Results Section */}
                  {filteredAnunciantes.length > 0 && (
                    <div className="mb-12">
                      <div className="flex items-center gap-2 mb-6">
                        <Store className="w-6 h-6 text-vitrii-blue" />
                        <h2 className="text-2xl font-bold text-vitrii-text">
                          Anunciantes Encontrados ({filteredAnunciantes.length})
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {filteredAnunciantes.map((anunciante: any) => (
                          <div
                            key={anunciante.id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                          >
                            {/* Logo/Imagem */}
                            <div className="w-full bg-gradient-to-br from-vitrii-blue to-vitrii-blue-dark">
                              <ImageWithFallback
                                src={anunciante.fotoUrl || null}
                                alt={anunciante.nome}
                                fallbackIcon={<Store className="w-12 h-12 text-white opacity-50" />}
                                containerClassName="w-full h-40"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                              <h3 className="font-bold text-vitrii-text text-lg mb-2 line-clamp-2">
                                {anunciante.nome}
                              </h3>

                              <div className="flex items-center gap-1 mb-2 text-sm text-vitrii-text-secondary">
                                {anunciante.tipo && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-semibold text-white ${
                                      anunciante.tipo === "Profissional"
                                        ? "bg-blue-600"
                                        : anunciante.tipo === "Premium"
                                          ? "bg-purple-600"
                                          : anunciante.tipo === "Master"
                                            ? "bg-yellow-600"
                                            : "bg-gray-600"
                                    }`}
                                  >
                                    {anunciante.tipo}
                                  </span>
                                )}
                              </div>

                              {anunciante.descricao && (
                                <p className="text-sm text-vitrii-text-secondary line-clamp-2 mb-2">
                                  {anunciante.descricao}
                                </p>
                              )}

                              {anunciante.cidade && anunciante.estado && (
                                <p className="text-xs text-vitrii-text-secondary mb-4 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {anunciante.cidade}, {anunciante.estado}
                                </p>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    navigate(`/anunciante/${anunciante.id}`)
                                  }
                                  className="flex-1 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors text-sm font-semibold"
                                >
                                  Ver Perfil
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/browse?anuncianteId=${anunciante.id}`)
                                  }
                                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                                >
                                  Vitrini
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      {filteredAds.length > 0 && (
                        <div className="my-12 border-t-2 border-gray-200 pt-12">
                          <div className="flex items-center gap-2 mb-6">
                            <Package className="w-6 h-6 text-vitrii-blue" />
                            <h2 className="text-2xl font-bold text-vitrii-text">
                              Anúncios Encontrados ({filteredAds.length})
                            </h2>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results Header for Ads */}
                  {filteredAds.length > 0 && filteredAnunciantes.length === 0 && (
                    <div className="flex items-center gap-2 mb-6">
                      <Package className="w-6 h-6 text-vitrii-blue" />
                      <h2 className="text-2xl font-bold text-vitrii-text">
                        Anúncios Encontrados ({filteredAds.length})
                      </h2>
                    </div>
                  )}

                  {/* Grid View */}
                  {viewMode === "grid" && filteredAds.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentAds.map((anuncio: any) => (
                        <div
                          key={anuncio.id}
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <div className="bg-vitrii-gray-light relative">
                            <ImageWithFallback
                              src={getAnuncioImage(anuncio)}
                              alt={getImageAlt(anuncio.titulo)}
                              fallbackIcon={<Package className="w-12 h-12 text-gray-400" />}
                              containerClassName="w-full aspect-video"
                              className="w-full h-full object-cover"
                            />
                            {anuncio.destaque && (
                              <div className="absolute top-2 right-2 bg-vitrii-yellow text-vitrii-text px-2 py-1 rounded text-xs font-bold">
                                ⭐ DESTAQUE
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-vitrii-text line-clamp-2 mb-2">
                              {anuncio.titulo}
                            </h3>
                            <p className="text-vitrii-blue font-bold text-lg mb-2">
                              R${" "}
                              {(
                                parseFloat(anuncio.preco) ||
                                parseFloat(anuncio.tabelaDePreco?.preco) ||
                                0
                              ).toFixed(2)}
                            </p>
                            <p className="text-sm text-vitrii-text-secondary line-clamp-2 mb-3">
                              {anuncio.anunciantes?.nome}
                            </p>
                            <p className="text-xs text-vitrii-text-secondary">
                              {new Date(anuncio.dataCriacao).toLocaleDateString(
                                "pt-BR",
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === "list" && filteredAds.length > 0 && (
                    <div className="space-y-4">
                      {currentAds.map((anuncio: any) => (
                        <div
                          key={anuncio.id}
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer flex gap-4"
                        >
                          <div className="w-32 h-32 bg-vitrii-gray-light rounded flex-shrink-0 overflow-hidden">
                            <ImageWithFallback
                              src={getAnuncioImage(anuncio)}
                              alt={getImageAlt(anuncio.titulo)}
                              fallbackIcon={<Package className="w-8 h-8 text-gray-400" />}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-vitrii-text text-lg">
                                {anuncio.titulo}
                                {anuncio.destaque && " ⭐"}
                              </h3>
                              <p className="text-vitrii-blue font-bold text-lg">
                                R${" "}
                                {(
                                  parseFloat(anuncio.preco) ||
                                  parseFloat(anuncio.tabelaDePreco?.preco) ||
                                  0
                                ).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm text-vitrii-text-secondary line-clamp-2 mb-2">
                              {anuncio.descricao}
                            </p>
                            <div className="flex gap-4 text-sm text-vitrii-text-secondary">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {anuncio.anunciantes?.nome}
                              </span>
                              <span>
                                {new Date(
                                  anuncio.dataCriacao,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-12">
                      <button
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded ${
                              currentPage === page
                                ? "bg-vitrii-blue text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ),
                      )}

                      <button
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
