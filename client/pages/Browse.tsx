import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Filter, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Browse() {
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
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-1 focus:ring-walmart-blue"
                />
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>

            {/* Placeholder Content */}
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-walmart-gray-light rounded-full mb-6">
                <Search className="w-10 h-10 text-walmart-text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-walmart-text mb-2">
                Em Desenvolvimento
              </h2>
              <p className="text-walmart-text-secondary mb-6 max-w-md mx-auto">
                A página de navegação de produtos está sendo melhorada para
                oferecer a melhor experiência. Em breve você poderá filtrar,
                buscar e explorar todos os anúncios.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/"
                  className="inline-flex items-center justify-center space-x-2 bg-walmart-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                >
                  <span>Voltar para Home</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
