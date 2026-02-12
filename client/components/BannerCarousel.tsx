import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: number;
  titulo: string;
  descricao?: string;
  imagemUrl: string;
  link?: string;
  ordem: number;
  ativo: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export default function BannerCarousel({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeBanners = banners.filter((b) => b.ativo);

  useEffect(() => {
    if (!autoPlay || activeBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, activeBanners.length]);

  if (activeBanners.length === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + activeBanners.length) % activeBanners.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const BannerContent = () => (
    <div className="w-full h-full relative overflow-hidden rounded-lg">
      {/* Background Image */}
      <img
        src={currentBanner.imagemUrl}
        alt={currentBanner.titulo}
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-2">
        {/* Content */}
        <div className="text-center text-white max-w-3xl px-2 sm:px-4">
          <h2 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1.5 line-clamp-2">
            {currentBanner.titulo}
          </h2>
          {currentBanner.descricao && (
            <p className="text-xs sm:text-sm md:text-base text-gray-100 mb-2 sm:mb-4 line-clamp-2">
              {currentBanner.descricao}
            </p>
          )}

          {currentBanner.link && (
            <a
              href={currentBanner.link}
              className="inline-block px-3 py-1.5 sm:px-5 sm:py-2 md:px-6 md:py-2.5 bg-vitrii-blue text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-vitrii-blue-dark transition-colors whitespace-nowrap"
            >
              Saiba Mais
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Main Carousel */}
      <div className="relative bg-vitrii-gray-light overflow-hidden rounded-lg">
        {/* Banner Container */}
        <div className="relative w-full h-32 sm:h-36 md:h-44">
          <BannerContent />

          {/* Navigation Buttons */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition-all shadow-md hover:shadow-lg"
                aria-label="Banner anterior"
              >
                <ChevronLeft className="w-5 h-5 text-vitrii-blue" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/80 hover:bg-white rounded-full transition-all shadow-md hover:shadow-lg"
                aria-label="Próximo banner"
              >
                <ChevronRight className="w-5 h-5 text-vitrii-blue" />
              </button>
            </>
          )}
        </div>

        {/* Dot Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? "bg-vitrii-blue" : "bg-white/50"
                }`}
                aria-label={`Ir para banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Banner Counter */}
      {activeBanners.length > 1 && (
        <div className="text-center py-1 text-xs text-vitrii-text-secondary">
          {currentIndex + 1} de {activeBanners.length}
        </div>
      )}
    </div>
  );
}
