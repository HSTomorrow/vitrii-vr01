import { useRef } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ShareButton from "./ShareButton";

interface Anunciante {
  id: number;
  nome: string;
  descricao?: string;
  fotoUrl?: string;
  tipo: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  email?: string;
}

interface AnunciantesCarouselProps {
  anunciantes: Anunciante[];
  isLoading: boolean;
  emptyMessage?: string;
}

export default function AnunciantesCarousel({
  anunciantes,
  isLoading,
  emptyMessage = "Nenhum anunciante disponível",
}: AnunciantesCarouselProps) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="vitrii-card overflow-hidden animate-pulse flex-shrink-0 w-52"
            >
              <div className="w-full h-52 bg-gray-300" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-300 rounded" />
                <div className="h-3 bg-gray-300 rounded w-3/4" />
                <div className="h-3 bg-gray-300 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (anunciantes.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-vitrii-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-vitrii-blue" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-vitrii-blue" />
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
      >
        {anunciantes.map((anunciante) => (
          <div
            key={anunciante.id}
            onClick={() => navigate(`/anunciante/${anunciante.id}`)}
            className="vitrii-card overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer relative flex-shrink-0 w-52"
          >
            {/* Logo/Imagem Container */}
            <div className="w-full h-52 bg-gradient-to-br from-vitrii-blue to-vitrii-blue-dark flex items-center justify-center overflow-hidden relative group/image">
              {anunciante.fotoUrl ? (
                <img
                  src={anunciante.fotoUrl}
                  alt={anunciante.nome}
                  className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-300"
                />
              ) : (
                <User className="w-16 h-16 text-white opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Top Right Actions */}
            <div className="absolute top-2.5 right-2.5 z-10 flex gap-2 items-start">
              {/* Badge de Tipo */}
              {anunciante.tipo && (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
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
                </div>
              )}

              {/* Share Button */}
              <ShareButton
                title={anunciante.nome}
                url={`${window.location.origin}/anunciante/${anunciante.id}`}
                whatsappPhone={anunciante.telefone}
                whatsappMessage={`Confira este anunciante: ${anunciante.nome}`}
                variant="icon"
              />
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col h-full">
              <div>
                <div className="flex items-start justify-between mb-1">
                <h4 className="font-bold text-sm line-clamp-2 text-vitrii-blue hover:text-vitrii-blue-dark transition-colors duration-200 flex-1">
                  {anunciante.nome}
                </h4>
                {anunciante.status && anunciante.status !== "Ativo" && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full flex-shrink-0">
                    {anunciante.status}
                  </span>
                )}
              </div>

                <p className="text-xs text-vitrii-text-secondary mb-2 line-clamp-2 hover:text-vitrii-text transition-colors duration-200">
                  {anunciante.descricao || "Loja online"}
                </p>

                {anunciante.cidade && anunciante.estado && (
                  <div className="flex items-center gap-1 mb-2 text-xs text-vitrii-text-secondary hover:text-vitrii-text transition-colors duration-200">
                    <span className="truncate">
                      {anunciante.cidade}, {anunciante.estado}
                    </span>
                  </div>
                )}
              </div>

              {anunciante.telefone && (
                <div className="text-xs text-vitrii-text-secondary mb-2 truncate">
                  <span className="font-semibold">📞</span> {anunciante.telefone}
                </div>
              )}

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => navigate(`/anunciante/${anunciante.id}`)}
                  className="flex-1 text-white py-1.5 text-xs rounded-md font-semibold bg-vitrii-blue hover:bg-vitrii-blue-dark transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  Ver Perfil
                </button>
                <button
                  onClick={() => navigate(`/browse?anuncianteId=${anunciante.id}`)}
                  className="flex-1 text-white py-1.5 text-xs rounded-md font-semibold bg-green-600 hover:bg-green-700 transition-all duration-300 transform hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  🛍️ Vitrini
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
