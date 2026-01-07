import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Filter, Search, Star, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Browse() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all published ads
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["anuncios-browse", searchTerm],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?status=pago");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  const anuncios = anunciosData?.data || [];

  // Filter by search term
  const filtered = anuncios.filter(
    (a: any) =>
      a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-walmart-gray-light border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-walmart-text mb-4">
            Explorar Produtos e Serviços
          </h1>
          <p className="text-walmart-text-secondary">
            Descubra milhares de produtos e serviços de vendedores verificados
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="hidden lg:block">
            <div className="bg-walmart-gray-light rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-5 h-5 text-walmart-blue" />
                <h3 className="font-bold text-walmart-text">Filtros</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-semibold text-walmart-text mb-3">
                    Categoria
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-walmart-text-secondary">
                        Eletrônicos
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-walmart-text-secondary">
                        Roupas
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-walmart-text-secondary">
                        Serviços
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-walmart-text mb-3">
                    Preço
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    className="w-full"
                  />
                </div>

                <button className="w-full bg-walmart-blue text-white py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos ou serviços..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Ads Grid */}
            {isLoading ? (
              // Loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="vitrii-card overflow-hidden animate-pulse">
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
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filtered.map((anuncio: any) => (
                  <div
                    key={anuncio.id}
                    className="vitrii-card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                  >
                    {/* Image */}
                    <div className="w-full h-48 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark flex items-center justify-center overflow-hidden">
                      {anuncio.fotoUrl ? (
                        <img
                          src={anuncio.fotoUrl}
                          alt={anuncio.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-white opacity-50" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Produto em destaque"}
                      </p>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-walmart-blue">
                          R$ {anuncio.tabelaDePreco?.preco ? Number(anuncio.tabelaDePreco.preco).toFixed(2) : "0.00"}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                          <span className="text-sm font-semibold">5.0</span>
                        </div>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                        <p className="text-walmart-text-secondary">
                          <strong>{anuncio.loja?.nome || "Loja"}</strong>
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/anuncio/${anuncio.id}`);
                        }}
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
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-walmart-gray-light rounded-full mb-6">
                  <Package className="w-10 h-10 text-walmart-text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-walmart-text mb-2">
                  Nenhum anúncio encontrado
                </h2>
                <p className="text-walmart-text-secondary mb-6 max-w-md mx-auto">
                  {searchTerm
                    ? `Não encontramos anúncios com "${searchTerm}". Tente outra busca.`
                    : "Nenhum anúncio publicado ainda. Seja o primeiro a publicar!"}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!searchTerm && (
                    <Link
                      to="/anuncio/criar"
                      className="inline-flex items-center justify-center space-x-2 bg-walmart-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                    >
                      <span>Publicar Anúncio</span>
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center space-x-2 border-2 border-walmart-blue text-walmart-blue px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    <span>Voltar para Home</span>
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
