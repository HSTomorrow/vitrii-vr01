import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Package,
  MapPin,
  X,
  ChevronDown,
  Search,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";

const CATEGORIES = [
  { value: "roupas", label: "Roupas" },
  { value: "carros", label: "Carros" },
  { value: "imoveis", label: "Imóveis" },
];

const TYPES = [
  { value: "produto", label: "Produto" },
  { value: "servico", label: "Serviço" },
  { value: "evento", label: "Evento" },
  { value: "agenda_recorrente", label: "Aula/Agenda" },
];

export default function Browse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(true);
  const itemsPerPage = 20;

  // Fetch all active ads with pagination
  // Note: The API already filters by status="ativo" by default when no status param is provided
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["browse-anuncios"],
    queryFn: async () => {
      // Fetch ads with larger limit to allow client-side filtering
      const response = await fetch("/api/anuncios?limit=500");
      if (!response.ok) {
        console.error("Error fetching ads:", response.status, response.statusText);
        throw new Error("Erro ao buscar anúncios");
      }
      const data = await response.json();
      console.log("Browse: Fetched ads from API:", data?.data?.length || 0, "ads");
      return data;
    },
  });

  const allAnuncios = anunciosData?.data || [];
  console.log("Browse: Total anuncios available:", allAnuncios.length);

  // Extract unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    allAnuncios.forEach((a: any) => {
      if (!a.endereco && !a.anunciantes?.endereco) return;
      const endereco = a.endereco || a.anunciantes?.endereco;
      if (!endereco) return;
      const parts = endereco.split(",");
      if (parts.length >= 2) {
        const municipality = parts[parts.length - 2].trim();
        if (municipality) locations.add(municipality);
      }
    });
    return Array.from(locations).sort();
  }, [allAnuncios]);

  // Apply filters client-side
  const filteredAnuncios = useMemo(() => {
    return allAnuncios.filter((anuncio: any) => {
      // Search by title or description
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          anuncio.titulo?.toLowerCase().includes(searchLower) ||
          anuncio.descricao?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filter by category
      if (selectedCategory && anuncio.categoria !== selectedCategory) {
        return false;
      }

      // Filter by type
      if (selectedType && anuncio.tipo !== selectedType) {
        return false;
      }

      // Filter by location
      if (selectedLocation) {
        const endereco = anuncio.endereco || anuncio.anunciantes?.endereco;
        if (!endereco) return false;
        const parts = endereco.split(",");
        const municipality =
          parts.length >= 2 ? parts[parts.length - 2].trim() : null;
        if (municipality !== selectedLocation) return false;
      }

      // Filter by price range
      if (priceRange.min || priceRange.max) {
        const price = parseFloat(anuncio.preco || 0);
        if (priceRange.min && price < parseFloat(priceRange.min)) return false;
        if (priceRange.max && price > parseFloat(priceRange.max)) return false;
      }

      return true;
    });
  }, [
    allAnuncios,
    searchTerm,
    selectedCategory,
    selectedType,
    selectedLocation,
    priceRange,
  ]);

  const totalItems = filteredAnuncios.length;

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const anuncios = filteredAnuncios.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleFilterChange();
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    handleFilterChange();
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    handleFilterChange();
  };

  const handleLocationChange = (value: string) => {
    setSelectedLocation(value);
    handleFilterChange();
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    setPriceRange((prev) => ({ ...prev, [type]: value }));
    handleFilterChange();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedType("");
    setSelectedLocation("");
    setPriceRange({ min: "", max: "" });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory ||
    selectedType ||
    selectedLocation ||
    priceRange.min ||
    priceRange.max;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Explorar Anúncios</h1>
          <p className="text-blue-100">
            Encontre os melhores produtos e serviços
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Carregando anúncios...</p>
          </div>
        ) : (
          <div>
            {/* Filter Toggle Button (Mobile) */}
            <div className="mb-6 lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between bg-vitrii-blue text-white px-4 py-3 rounded-lg font-semibold"
              >
                <span>Filtros</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    showFilters ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-6">
              {/* Filters Sidebar */}
              <div
                className={`${
                  showFilters ? "block" : "hidden"
                } lg:block w-full lg:w-64 flex-shrink-0`}
              >
                <div className="bg-vitrii-gray-light p-6 rounded-lg space-y-6">
                  {/* Search Input */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Buscar
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Título ou descrição..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Categoria
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                    >
                      <option value="">Todas as categorias</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-2">
                      Tipo
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                    >
                      <option value="">Todos os tipos</option>
                      {TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Location Filter */}
                  {uniqueLocations.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-vitrii-text mb-2">
                        Localização
                      </label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                      >
                        <option value="">Todas as localizações</option>
                        {uniqueLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-vitrii-text mb-3">
                      Faixa de Preço
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Mín."
                        value={priceRange.min}
                        onChange={(e) => handlePriceChange("min", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                      />
                      <input
                        type="number"
                        placeholder="Máx."
                        value={priceRange.max}
                        onChange={(e) => handlePriceChange("max", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vitrii-blue focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="w-full flex items-center justify-center gap-2 bg-gray-200 text-vitrii-text px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>

              {/* Results Section */}
              <div className="flex-1">
                {totalItems > 0 ? (
                  <div>
                    <p className="text-vitrii-text-secondary mb-6">
                      {totalItems} anúncio{totalItems !== 1 ? "s" : ""} encontrado
                      {totalItems !== 1 ? "s" : ""}
                      {hasActiveFilters && " com os filtros aplicados"}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {anuncios.map((anuncio: any) => (
                        <div
                          key={anuncio.id}
                          className="vitrii-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        >
                          <div className="w-full h-40 bg-gradient-to-br from-vitrii-blue to-vitrii-blue-dark flex items-center justify-center overflow-hidden">
                            {anuncio.imagem || anuncio.anunciantes?.fotoUrl ? (
                              <img
                                src={anuncio.imagem || anuncio.anunciantes?.fotoUrl}
                                alt={anuncio.titulo}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-12 h-12 text-white opacity-50" />
                            )}
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-vitrii-text mb-2 line-clamp-2">
                              {anuncio.titulo}
                            </h3>

                            {(anuncio.endereco ||
                              anuncio.anunciantes?.endereco) && (
                              <div className="flex items-center gap-1 mb-3 text-xs text-vitrii-text-secondary">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {anuncio.endereco ||
                                    anuncio.anunciantes?.endereco}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-center mb-4 pt-2 border-t">
                              <span className="text-lg font-bold text-vitrii-blue">
                                {anuncio.isDoacao
                                  ? "Grátis"
                                  : `R$ ${Number(
                                      anuncio.preco || 0
                                    ).toLocaleString("pt-BR", {
                                      minimumFractionDigits: 2,
                                    })}`}
                              </span>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-vitrii-yellow text-vitrii-yellow" />
                                <span className="text-sm font-semibold">
                                  5.0
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/anuncio/${anuncio.id}`);
                              }}
                              className="w-full bg-vitrii-blue text-white py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
                            >
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-vitrii-text-secondary mb-4">
                      {hasActiveFilters
                        ? "Nenhum anúncio encontrado com esses filtros"
                        : "Nenhum anúncio encontrado"}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="inline-block bg-vitrii-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-vitrii-blue-dark mb-4"
                      >
                        Limpar Filtros
                      </button>
                    )}
                    <Link
                      to="/"
                      className="inline-block bg-gray-200 text-vitrii-text px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Voltar para Home
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
