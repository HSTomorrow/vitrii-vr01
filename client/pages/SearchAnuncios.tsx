import { useState, useMemo, useEffect } from "react";
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
} from "lucide-react";

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
      const response = await fetch("/api/anuncios");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  // Fetch stores for filter
  const { data: storesData } = useQuery({
    queryKey: ["anunciantes"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes");
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
          ad.anunciante?.nome?.toLowerCase().includes(term),
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

      const priceA = a.precoAnuncio || a.tabelaDePreco?.preco || 0;
      const priceB = b.precoAnuncio || b.tabelaDePreco?.preco || 0;

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

  // Pagination
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const currentAds = filteredAds.slice(startIdx, endIdx);

  const stores = storesData?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Search Header */}
      <section className="bg-walmart-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Buscar Anúncios</h1>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descrição ou anunciante..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-lg bg-blue-50 text-walmart-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-walmart-yellow"
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
              <div className="bg-walmart-gray-light rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between md:hidden">
                  <h2 className="font-bold text-walmart-text">Filtros</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm text-walmart-blue"
                  >
                    Fechar
                  </button>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-semibold text-walmart-text mb-3">
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
                        className="w-4 h-4 text-walmart-blue"
                      />
                      <span className="text-sm text-walmart-text">Todas</span>
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
                          className="w-4 h-4 text-walmart-blue"
                        />
                        <span className="text-sm text-walmart-text capitalize">
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
                  <h3 className="font-semibold text-walmart-text mb-3">
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
                  <h3 className="font-semibold text-walmart-text mb-3">Anunciante</h3>
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
                  <h3 className="font-semibold text-walmart-text mb-3">
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
                    className="w-full px-4 py-2 bg-walmart-blue text-white rounded-lg hover:bg-walmart-blue-dark transition-colors text-sm font-semibold"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-walmart-text">
                    {filteredAds.length} anúncio
                    {filteredAds.length !== 1 ? "s" : ""} encontrado
                    {filteredAds.length !== 1 ? "s" : ""}
                  </h2>
                  <p className="text-sm text-walmart-text-secondary">
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
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-walmart-blue text-white" : "border border-gray-300"}`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${viewMode === "list" ? "bg-walmart-blue text-white" : "border border-gray-300"}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-walmart-blue mx-auto" />
                </div>
              ) : currentAds.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-walmart-text text-lg">
                    Nenhum anúncio encontrado
                  </p>
                  <p className="text-walmart-text-secondary">
                    Tente ajustar seus filtros
                  </p>
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === "grid" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentAds.map((anuncio: any) => (
                        <div
                          key={anuncio.id}
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        >
                          <div className="aspect-video bg-walmart-gray-light flex items-center justify-center overflow-hidden relative">
                            {anuncio.fotoUrl ? (
                              <img
                                src={anuncio.fotoUrl}
                                alt={anuncio.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-12 h-12 text-gray-400" />
                            )}
                            {anuncio.destaque && (
                              <div className="absolute top-2 right-2 bg-walmart-yellow text-walmart-text px-2 py-1 rounded text-xs font-bold">
                                ⭐ DESTAQUE
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-bold text-walmart-text line-clamp-2 mb-2">
                              {anuncio.titulo}
                            </h3>
                            <p className="text-walmart-blue font-bold text-lg mb-2">
                              R${" "}
                              {(
                                parseFloat(anuncio.precoAnuncio) ||
                                parseFloat(anuncio.tabelaDePreco?.preco) ||
                                0
                              ).toFixed(2)}
                            </p>
                            <p className="text-sm text-walmart-text-secondary line-clamp-2 mb-3">
                              {anuncio.anunciante?.nome}
                            </p>
                            <p className="text-xs text-walmart-text-secondary">
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
                  {viewMode === "list" && (
                    <div className="space-y-4">
                      {currentAds.map((anuncio: any) => (
                        <div
                          key={anuncio.id}
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer flex gap-4"
                        >
                          <div className="w-32 h-32 bg-walmart-gray-light rounded flex items-center justify-center flex-shrink-0">
                            {anuncio.fotoUrl ? (
                              <img
                                src={anuncio.fotoUrl}
                                alt={anuncio.titulo}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-walmart-text text-lg">
                                {anuncio.titulo}
                                {anuncio.destaque && " ⭐"}
                              </h3>
                              <p className="text-walmart-blue font-bold text-lg">
                                R${" "}
                                {(
                                  anuncio.precoAnuncio ||
                                  anuncio.tabelaDePreco?.preco ||
                                  0
                                ).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-sm text-walmart-text-secondary line-clamp-2 mb-2">
                              {anuncio.descricao}
                            </p>
                            <div className="flex gap-4 text-sm text-walmart-text-secondary">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {anuncio.anunciante?.nome}
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
                                ? "bg-walmart-blue text-white"
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
