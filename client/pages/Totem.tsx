import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Store, Loader } from "lucide-react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

interface Anuncio {
  id: number;
  titulo: string;
  preco?: number;
  imagem?: string;
  aCombinar?: boolean;
  isDoacao?: boolean;
}

interface Anunciante {
  id: number;
  nome: string;
}

// Full-screen kiosk mode meant to stay open on a tablet/totem inside the physical store,
// showing only that one anunciante's active ads as a browsable catalog for walk-in customers.
// No Header/Footer/BottomNavBar and no login required — the person setting it up (via the
// "Modo Totem" menu item) is logged in, but whoever taps through the tablet afterwards isn't.
export default function Totem() {
  const { anuncianteId } = useParams<{ anuncianteId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: anuncianteData } = useQuery<{ data: Anunciante }>({
    queryKey: ["totem-anunciante", anuncianteId],
    queryFn: async () => {
      const response = await fetch(`/api/anunciantes/${anuncianteId}`);
      if (!response.ok) throw new Error("Erro ao buscar anunciante");
      return response.json();
    },
    enabled: !!anuncianteId,
  });

  const { data: anunciosData, isLoading } = useQuery<{ data: Anuncio[] }>({
    queryKey: ["totem-anuncios", anuncianteId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios?anuncianteId=${anuncianteId}&status=ativo&limit=200`);
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    enabled: !!anuncianteId,
  });

  // No anuncianteId in the URL: if the logged-in user manages one or more anunciantes,
  // let them pick which one's totem to open.
  const { data: meusAnunciantesData } = useQuery<{ data: Anunciante[] }>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes/do-usuario/listar");
      if (!response.ok) return { data: [] };
      return response.json();
    },
    enabled: !anuncianteId && !!user?.id,
  });

  if (!anuncianteId) {
    const meusAnunciantes = meusAnunciantesData?.data || [];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-vitrii-gray-light p-6">
        <Store className="w-12 h-12 text-vitrii-blue mb-4" />
        <h1 className="text-2xl font-bold text-vitrii-text mb-2">Modo Totem</h1>
        {!user ? (
          <p className="text-vitrii-text-secondary">Faça login para escolher qual anunciante exibir.</p>
        ) : meusAnunciantes.length === 0 ? (
          <p className="text-vitrii-text-secondary">Você ainda não possui um anunciante.</p>
        ) : (
          <div className="w-full max-w-sm space-y-2 mt-2">
            <p className="text-sm text-vitrii-text-secondary text-center mb-3">
              Escolha o anunciante para exibir no totem:
            </p>
            {meusAnunciantes.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/totem/${a.id}`)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-lg font-semibold text-vitrii-text hover:border-vitrii-blue hover:bg-blue-50 transition-colors"
              >
                {a.nome}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const anuncios = anunciosData?.data || [];
  const anunciante = anuncianteData?.data;

  return (
    <div className="min-h-screen bg-vitrii-gray-light">
      <header className="sticky top-0 z-10 bg-white shadow-sm px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8 text-vitrii-blue" />
          <h1 className="text-2xl font-bold text-vitrii-text">{anunciante?.nome || "Catálogo"}</h1>
        </div>
        <button
          onClick={() => navigate("/totem")}
          className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-vitrii-text-secondary hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Catálogo
        </button>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-vitrii-blue" />
          </div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-24 text-vitrii-text-secondary text-lg">
            Nenhum anúncio ativo no momento.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {anuncios.map((anuncio) => (
              <button
                key={anuncio.id}
                onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                className="bg-white rounded-xl shadow-md overflow-hidden text-left hover:shadow-xl transition-shadow"
              >
                <div className="w-full aspect-square bg-gray-100">
                  <ImageWithFallback
                    src={getAnuncioImage(anuncio as any)}
                    alt={getImageAlt(anuncio.titulo)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-vitrii-text line-clamp-2 mb-1">{anuncio.titulo}</h3>
                  <p className="text-lg font-bold text-vitrii-blue">
                    {anuncio.isDoacao
                      ? "Grátis"
                      : anuncio.aCombinar
                        ? "A combinar"
                        : anuncio.preco
                          ? formatCurrencyDisplay(anuncio.preco)
                          : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
