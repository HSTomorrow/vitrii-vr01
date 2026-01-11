import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Package, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Pagination from "@/components/Pagination";

export default function Browse() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["browse-anuncios"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?status=pago&limit=500");
      if (!response.ok) throw new Error("Erro ao buscar");
      return response.json();
    },
  });

  const allAnuncios = anunciosData?.data || [];
  const totalItems = allAnuncios.length;

  // Calculate pagination indices
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const anuncios = allAnuncios.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <section className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Explorar Anúncios</h1>
          <p className="text-blue-100">
            Encontre os melhores produtos e serviços
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Carregando anúncios...</p>
          </div>
        ) : allAnuncios.length > 0 ? (
          <div>
            <p className="text-walmart-text-secondary mb-6">
              {totalItems} anúncios encontrados
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {anuncios.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="w-full h-40 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark flex items-center justify-center overflow-hidden">
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

                  <div className="p-4">
                    <h3 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                      {anuncio.titulo}
                    </h3>

                    {anuncio.anunciante?.endereco && (
                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {anuncio.anunciante.endereco}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-4 pt-2 border-t">
                      <span className="text-lg font-bold text-walmart-blue">
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
            <p className="text-walmart-text-secondary mb-4">
              Nenhum anúncio encontrado
            </p>
            <Link
              to="/"
              className="inline-block bg-walmart-blue text-white px-6 py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark"
            >
              Voltar para Home
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
