import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Package, Calendar, Star } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ShareButton from "./ShareButton";
import AnuncianteIconColor from "./AnuncianteIconColor";

interface Anuncio {
  id: number;
  titulo: string;
  descricao?: string;
  imagem?: string;
  link?: string;
  preco?: number;
  isDoacao?: boolean;
  tipo: string;
  anuncianteId: number;
  anunciantes?: {
    nome: string;
    fotoUrl?: string;
    iconColor?: string;
    endereco?: string;
    whatsapp?: string;
    temAgenda?: boolean;
  };
}

interface AnunciosGridProps {
  anuncios: Anuncio[];
  isLoading: boolean;
  isFavorited?: (id: number) => boolean;
  onToggleFavorito?: (id: number) => void;
  emptyMessage?: string;
  color?: "blue" | "green" | "purple" | "orange";
  adsPerRow?: number;
  initialRows?: number;
}

const extractMunicipality = (endereco: string): string => {
  if (!endereco) return "Localização desconhecida";
  const parts = endereco.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return endereco.split(" ").slice(-2, -1)[0] || "Localização";
};

const colorClasses = {
  blue: {
    button: "bg-vitrii-blue hover:bg-vitrii-blue-dark",
    badge: "bg-blue-50 text-blue-700",
    border: "border-vitrii-blue",
  },
  green: {
    button: "bg-green-600 hover:bg-green-700",
    badge: "bg-green-50 text-green-700",
    border: "border-green-500",
  },
  purple: {
    button: "bg-purple-600 hover:bg-purple-700",
    badge: "bg-purple-50 text-purple-700",
    border: "border-purple-500",
  },
  orange: {
    button: "bg-orange-600 hover:bg-orange-700",
    badge: "bg-orange-50 text-orange-700",
    border: "border-orange-500",
  },
};

export default function AnunciosGrid({
  anuncios,
  isLoading,
  isFavorited,
  onToggleFavorito,
  emptyMessage = "Nenhum anúncio publicado ainda",
  color = "blue",
  adsPerRow = 15,
  initialRows = 3,
}: AnunciosGridProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const colors = colorClasses[color];
  const [currentPage, setCurrentPage] = useState(0);

  // Calculate total ads to show per page (initialRows * adsPerRow)
  const adsPerPage = initialRows * adsPerRow;

  // Get paginated data
  const paginatedAnuncios = useMemo(() => {
    const startIdx = currentPage * adsPerPage;
    const endIdx = startIdx + adsPerPage;
    return anuncios.slice(startIdx, endIdx);
  }, [anuncios, currentPage, adsPerPage]);

  const totalPages = Math.ceil(anuncios.length / adsPerPage);
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevPage = currentPage > 0;

  const handleToggleFavorito = (anuncioId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Faça login para adicionar favoritos");
      navigate("/auth/signin");
    } else {
      onToggleFavorito?.(anuncioId);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="vitrii-card overflow-hidden animate-pulse"
            >
              <div className="w-full h-48 bg-gray-300" />
              <div className="p-3 space-y-3">
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-3 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-10 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (anuncios.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-vitrii-text-secondary mb-4">{emptyMessage}</p>
        <Link
          to="/anuncio/criar"
          className="inline-flex items-center gap-2 text-vitrii-blue font-semibold hover:underline"
        >
          Publique um Anúncio
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Grid Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {paginatedAnuncios.map((anuncio) => (
          <div
            key={anuncio.id}
            onClick={() => navigate(`/anuncio/${anuncio.id}`)}
            className="vitrii-card overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer relative group flex flex-col h-full"
          >
            {/* Image Container */}
            <div
              className={`w-full h-48 bg-gradient-to-br flex items-center justify-center overflow-hidden relative group ${
                color === "green"
                  ? "from-green-400 to-green-600"
                  : color === "purple"
                    ? "from-purple-400 to-purple-600"
                    : color === "orange"
                      ? "from-orange-400 to-orange-600"
                      : "from-vitrii-blue to-vitrii-blue-dark"
              }`}
            >
              {anuncio.imagem ? (
                <img
                  src={anuncio.imagem}
                  alt={anuncio.titulo}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <Package className="w-10 h-10 text-white opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Anunciante Avatar */}
            <div
              className={`absolute bottom-2.5 left-2.5 z-10 rounded-full border-2 overflow-hidden flex items-center justify-center shadow-lg hover:shadow-xl transition-all ${colors.border}`}
            >
              {anuncio.anunciantes?.fotoUrl ? (
                <img
                  src={anuncio.anunciantes.fotoUrl}
                  alt={anuncio.anunciantes.nome}
                  className="w-9 h-9 object-cover"
                  title={anuncio.anunciantes.nome}
                />
              ) : (
                <AnuncianteIconColor
                  anuncianteName={anuncio.anunciantes?.nome || "Vitrii"}
                  iconColor={anuncio.anunciantes?.iconColor}
                  className="w-9 h-9"
                />
              )}
            </div>

            {/* Type Badges */}
            {anuncio.isDoacao && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                GRATUITO
              </div>
            )}

            {anuncio.tipo === "evento" && (
              <div className="absolute top-3 right-3 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                EVENTO
              </div>
            )}

            {anuncio.tipo === "agenda_recorrente" && (
              <div className="absolute top-3 right-3 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                AGENDA
              </div>
            )}

            {anuncio.tipo === "oportunidade" && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                OPORTUNIDADE
              </div>
            )}

            {/* Share and Favorite Buttons */}
            <div className="absolute top-2.5 right-2.5 z-10 flex gap-2">
              <ShareButton
                title={anuncio.titulo}
                url={`${window.location.origin}/anuncio/${anuncio.id}`}
                whatsappPhone={anuncio.anunciantes?.whatsapp}
                whatsappMessage={`Confira este anúncio: ${anuncio.titulo}`}
                variant="icon"
              />

              <button
                onClick={(e) => handleToggleFavorito(anuncio.id, e)}
                className={`p-2 rounded-full shadow-lg hover:shadow-xl transition-all ${
                  isFavorited?.(anuncio.id)
                    ? "bg-yellow-400"
                    : "bg-white hover:bg-gray-100"
                }`}
                title={
                  isFavorited?.(anuncio.id)
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    isFavorited?.(anuncio.id)
                      ? "fill-white text-white"
                      : "text-gray-400"
                  }`}
                />
              </button>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col h-full">
              <div>
                <h4
                  style={{ color: "#025CBA" }}
                  className="font-bold text-sm mb-1 line-clamp-2 hover:text-vitrii-blue-dark transition-colors duration-200"
                >
                  {anuncio.titulo}
                </h4>
                <p className="text-xs text-vitrii-text-secondary mb-2 line-clamp-2 hover:text-vitrii-text transition-colors duration-200">
                  {anuncio.descricao || "Confira este anúncio"}
                </p>

                <div className="flex items-center gap-1 mb-2 text-xs text-vitrii-text-secondary hover:text-vitrii-text transition-colors duration-200">
                  <span className="truncate">
                    {extractMunicipality(anuncio.anunciantes?.endereco || "")}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3 mt-auto">
                <span
                  className={`text-lg font-bold transition-all duration-300 hover:scale-110 origin-left ${
                    color === "green"
                      ? "text-green-600"
                      : color === "purple"
                        ? "text-purple-600"
                        : color === "orange"
                          ? "text-orange-600"
                          : "text-vitrii-blue"
                  }`}
                >
                  {anuncio.isDoacao
                    ? "Grátis"
                    : `R$ ${anuncio.preco ? Number(anuncio.preco).toFixed(2) : "0.00"}`}
                </span>
                <div className="flex items-center space-x-1 hover:scale-110 transition-transform duration-300 origin-right">
                  <svg
                    className="w-3.5 h-3.5 fill-vitrii-yellow text-vitrii-yellow"
                    viewBox="0 0 24 24"
                  >
                    <polygon points="12 2 15.09 10.26 24 10.26 17.55 15.74 19.64 24 12 19.52 4.36 24 6.45 15.74 0 10.26 8.91 10.26" />
                  </svg>
                  <span className="text-xs font-semibold">5.0</span>
                </div>
              </div>

              {anuncio.anunciantes?.temAgenda ? (
                <div className="flex gap-1.5">
                  <Link
                    to={`/agenda/anunciante/${anuncio.anuncianteId}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 bg-orange-600 hover:bg-orange-700 text-white py-1.5 text-xs rounded-md font-semibold transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-1.5`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Agendar
                  </Link>
                  <button
                    onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                    className={`flex-1 text-white py-1.5 text-xs rounded-md font-semibold transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${colors.button}`}
                  >
                    Detalhes
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                  className={`w-full text-white py-2 text-sm rounded-md font-semibold transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${colors.button}`}
                >
                  Ver Detalhes
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pb-4">
          <button
            onClick={() => setCurrentPage(0)}
            disabled={!hasPrevPage}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Primeira página"
          >
            <ChevronLeft className="w-5 h-5" />
            <ChevronLeft className="w-5 h-5 -ml-3" />
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={!hasPrevPage}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum = i;
              if (totalPages > 5) {
                if (currentPage < 3) {
                  pageNum = i;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 5 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    currentPage === pageNum
                      ? `${colors.button} text-white`
                      : "border border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={!hasNextPage}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Próxima página"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCurrentPage(totalPages - 1)}
            disabled={!hasNextPage}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            title="Última página"
          >
            <ChevronRight className="w-5 h-5" />
            <ChevronRight className="w-5 h-5 -ml-3" />
          </button>

          <span className="text-sm text-vitrii-text-secondary ml-4">
            Página {currentPage + 1} de {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
