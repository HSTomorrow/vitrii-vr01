import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import ImageWithFallback from "./ImageWithFallback";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

const DISMISSED_KEY = "bannerInicialVistoEm";

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export default function BannerInicialModal() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(true);

  const { data } = useQuery({
    queryKey: ["banner-inicial"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios/banner-inicial");
      if (!response.ok) return { data: null };
      return response.json();
    },
  });

  const anuncio = data?.data;

  useEffect(() => {
    if (!anuncio) return;
    const vistoEm = localStorage.getItem(DISMISSED_KEY);
    setDismissed(vistoEm === todayKey());
  }, [anuncio]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, todayKey());
    setDismissed(true);
  };

  if (!anuncio || dismissed) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden relative">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5 text-vitrii-text" />
        </button>

        <div className="w-full aspect-square bg-gray-100">
          <ImageWithFallback
            src={getAnuncioImage(anuncio)}
            alt={getImageAlt(anuncio.titulo)}
            className="w-full h-full object-cover"
            containerClassName="w-full h-full"
          />
        </div>

        <div className="p-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-vitrii-red mb-1">
            Promoção do dia
          </p>
          <h2 className="text-lg font-bold text-vitrii-text mb-1">{anuncio.titulo}</h2>
          <p className="text-2xl font-bold text-vitrii-blue mb-4">
            {anuncio.isDoacao
              ? "Grátis"
              : anuncio.aCombinar
                ? "A combinar"
                : anuncio.preco
                  ? formatCurrencyDisplay(anuncio.preco)
                  : ""}
          </p>
          <button
            onClick={() => {
              dismiss();
              navigate(`/anuncio/${anuncio.id}`);
            }}
            className="w-full px-4 py-3 bg-vitrii-blue text-white rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
          >
            Ver Anúncio
          </button>
        </div>
      </div>
    </div>
  );
}
