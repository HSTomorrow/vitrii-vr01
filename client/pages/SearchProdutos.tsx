import { useState, useMemo } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Search,
  MapPin,
  DollarSign,
  Package,
  Filter,
  ChevronRight,
} from "lucide-react";

export default function SearchProdutos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [expandedStore, setExpandedStore] = useState<number | null>(null);

  // Fetch stores
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["lojas"],
    queryFn: async () => {
      const response = await fetch("/api/lojas");
      if (!response.ok) throw new Error("Erro ao buscar lojas");
      return response.json();
    },
  });

  // Fetch products with pricing
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["productos"],
    queryFn: async () => {
      const response = await fetch("/api/produtos");
      if (!response.ok) throw new Error("Erro ao buscar produtos");
      return response.json();
    },
  });

  // Fetch groups
  const { data: groupsData } = useQuery({
    queryKey: ["grupos-productos"],
    queryFn: async () => {
      const response = await fetch("/api/grupos-productos");
      if (!response.ok) throw new Error("Erro ao buscar grupos");
      return response.json();
    },
  });

  // Fetch tables de preco for all prices
  const { data: tabelasData } = useQuery({
    queryKey: ["tabelas-preco"],
    queryFn: async () => {
      const response = await fetch("/api/tabelas-preco");
      if (!response.ok) throw new Error("Erro ao buscar tabelas de preço");
      return response.json();
    },
  });

  const stores = storesData?.data || [];
  const products = productsData?.data || [];
  const groups = groupsData?.data || [];
  const tabelas = tabelasData?.data || [];

  // Build price map
  const priceMap = useMemo(() => {
    const map: Record<number, Array<{ preco: number; tamanho?: string; cor?: string }>> = {};
    tabelas.forEach((tabela: any) => {
      if (!map[tabela.productId]) map[tabela.productId] = [];
      map[tabela.productId].push({
        preco: tabela.preco,
        tamanho: tabela.tamanho,
        cor: tabela.cor,
      });
    });
    return map;
  }, [tabelas]);

  // Filter and organize products by store
  const organizedData = useMemo(() => {
    const storeMap: Record<number, any> = {};

    stores.forEach((store: any) => {
      storeMap[store.id] = {
        store,
        groups: {},
      };
    });

    products.forEach((product: any) => {
      const storeId = product.grupo.lojaId;
      const groupId = product.grupoId;

      if (storeMap[storeId]) {
        if (!storeMap[storeId].groups[groupId]) {
          storeMap[storeId].groups[groupId] = {
            group: product.grupo,
            products: [],
          };
        }

        // Filter products
        let include = true;

        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          include = product.nome.toLowerCase().includes(term);
        }

        // Store filter
        if (selectedStore && storeId !== selectedStore) {
          include = false;
        }

        // Group filter
        if (selectedGroup && groupId !== selectedGroup) {
          include = false;
        }

        // Price filter
        if (include && (priceRange.min || priceRange.max)) {
          const prices = priceMap[product.id] || [];
          const minPrice = prices.length > 0 
            ? Math.min(...prices.map((p: any) => Number(p.preco)))
            : 0;
          
          const min = priceRange.min ? parseFloat(priceRange.min) : 0;
          const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
          
          include = minPrice >= min && minPrice <= max;
        }

        if (include) {
          const prices = priceMap[product.id] || [];
          const minPrice = prices.length > 0 
            ? Math.min(...prices.map((p: any) => Number(p.preco)))
            : 0;
          const maxPrice = prices.length > 0 
            ? Math.max(...prices.map((p: any) => Number(p.preco)))
            : 0;

          storeMap[storeId].groups[groupId].products.push({
            ...product,
            prices,
            minPrice,
            maxPrice,
          });
        }
      }
    });

    return storeMap;
  }, [products, stores, searchTerm, selectedStore, selectedGroup, priceRange, priceMap]);

  // Count results
  const totalProducts = useMemo(() => {
    let count = 0;
    Object.values(organizedData).forEach((storeData: any) => {
      Object.values(storeData.groups).forEach((groupData: any) => {
        count += groupData.products.length;
      });
    });
    return count;
  }, [organizedData]);

  const isLoading = storesLoading || productsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Search Header */}
      <section className="bg-vitrii-blue text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">Buscar Produtos por Loja</h1>
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-vitrii-gray-light rounded-lg p-6 space-y-6">
                <h2 className="font-bold text-vitrii-text flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </h2>

                {/* Store Filter */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">Loja</h3>
                  <select
                    value={selectedStore || ""}
                    onChange={(e) => {
                      setSelectedStore(e.target.value ? parseInt(e.target.value) : null);
                      setSelectedGroup(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Todas as lojas</option>
                    {stores.map((store: any) => (
                      <option key={store.id} value={store.id}>
                        {store.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Group Filter */}
                {selectedStore && (
                  <div>
                    <h3 className="font-semibold text-vitrii-text mb-3">Categoria</h3>
                    <select
                      value={selectedGroup || ""}
                      onChange={(e) =>
                        setSelectedGroup(e.target.value ? parseInt(e.target.value) : null)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Todas as categorias</option>
                      {groups
                        .filter((g: any) => g.lojaId === selectedStore)
                        .map((group: any) => (
                          <option key={group.id} value={group.id}>
                            {group.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Price Filter */}
                <div>
                  <h3 className="font-semibold text-vitrii-text mb-3">Faixa de Preço</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Mín"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, min: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Máx"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange({ ...priceRange, max: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchTerm || selectedStore || selectedGroup || priceRange.min || priceRange.max) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStore(null);
                      setSelectedGroup(null);
                      setPriceRange({ min: "", max: "" });
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
              <h2 className="text-lg font-bold text-vitrii-text mb-6">
                {totalProducts} produto{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}
              </h2>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue mx-auto" />
                </div>
              ) : totalProducts === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-vitrii-text text-lg">Nenhum produto encontrado</p>
                  <p className="text-vitrii-text-secondary">Tente ajustar seus filtros</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.values(organizedData).map((storeData: any) => {
                    const storeProducts = Object.values(storeData.groups).reduce(
                      (sum: number, group: any) => sum + group.products.length,
                      0
                    );

                    if (storeProducts === 0) return null;

                    return (
                      <div key={storeData.store.id}>
                        {/* Store Header */}
                        <button
                          onClick={() =>
                            setExpandedStore(
                              expandedStore === storeData.store.id ? null : storeData.store.id
                            )
                          }
                          className="w-full flex items-center justify-between bg-vitrii-blue text-white px-6 py-4 rounded-lg hover:bg-vitrii-blue-dark transition-colors mb-4"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-bold text-lg text-left">
                                {storeData.store.nome}
                              </h3>
                              <p className="text-sm text-blue-100 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {storeData.store.endereco || "Endereço não informado"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="bg-vitrii-yellow text-vitrii-text px-3 py-1 rounded-full font-semibold">
                              {storeProducts} produto{storeProducts !== 1 ? "s" : ""}
                            </span>
                            <ChevronRight
                              className={`w-5 h-5 transition-transform ${
                                expandedStore === storeData.store.id ? "rotate-90" : ""
                              }`}
                            />
                          </div>
                        </button>

                        {/* Products */}
                        {expandedStore === storeData.store.id && (
                          <div className="space-y-4 mb-8">
                            {Object.values(storeData.groups).map((groupData: any) => {
                              if (groupData.products.length === 0) return null;

                              return (
                                <div key={groupData.group.id}>
                                  <h4 className="font-semibold text-vitrii-text mb-3 px-4">
                                    {groupData.group.nome}
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupData.products.map((product: any) => (
                                      <div
                                        key={product.id}
                                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                                      >
                                        <div className="bg-vitrii-gray-light h-32 flex items-center justify-center">
                                          <Package className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <div className="p-4">
                                          <h5 className="font-bold text-vitrii-text line-clamp-2 mb-2">
                                            {product.nome}
                                          </h5>
                                          {product.descricao && (
                                            <p className="text-sm text-vitrii-text-secondary line-clamp-2 mb-3">
                                              {product.descricao}
                                            </p>
                                          )}

                                          {/* Price Display */}
                                          <div className="mb-3">
                                            {product.prices.length > 0 ? (
                                              <div>
                                                <p className="text-vitrii-blue font-bold text-lg">
                                                  R$ {product.minPrice.toFixed(2)}
                                                  {product.minPrice !== product.maxPrice &&
                                                    ` - R$ ${product.maxPrice.toFixed(2)}`}
                                                </p>
                                                {product.prices.length > 1 && (
                                                  <p className="text-xs text-vitrii-text-secondary">
                                                    {product.prices.length} variante
                                                    {product.prices.length !== 1 ? "s" : ""}
                                                  </p>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-sm text-gray-500">Sem preço</p>
                                            )}
                                          </div>

                                          {/* Variants if limited */}
                                          {product.prices.length > 0 && product.prices.length <= 3 && (
                                            <div className="text-xs text-vitrii-text-secondary space-y-1">
                                              {product.prices.map((p: any, idx: number) => (
                                                <div key={idx}>
                                                  {p.tamanho || p.cor
                                                    ? `${p.tamanho || ""}${p.tamanho && p.cor ? " - " : ""}${p.cor || ""}`
                                                    : "Padrão"}
                                                  {" - "}
                                                  R$ {Number(p.preco).toFixed(2)}
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          <button className="w-full mt-3 px-3 py-2 bg-vitrii-blue text-white rounded font-semibold hover:bg-vitrii-blue-dark transition-colors text-sm">
                                            Ver Detalhes
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
