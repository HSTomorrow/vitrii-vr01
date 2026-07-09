import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Store, Loader, Search, Share2 } from "lucide-react";
import Pagination from "@/components/Pagination";
import ImageWithFallback from "@/components/ImageWithFallback";
import ShareModal from "@/components/ShareModal";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";
import { formatCurrencyDisplay } from "@/utils/formatCurrency";

interface Anuncio {
  id: number;
  titulo: string;
  categoria?: string;
  preco?: number;
  imagem?: string;
  aCombinar?: boolean;
  isDoacao?: boolean;
}

interface Anunciante {
  id: number;
  nome: string;
}

const ITEMS_PER_PAGE = 100;

// Full-screen kiosk mode meant to stay open on a tablet/totem inside the physical store,
// showing only that one anunciante's active ads as a browsable catalog for walk-in customers.
// No Header/Footer/BottomNavBar and no login required — the person setting it up (via the
// "Meu Catálogo" menu item) is logged in, but whoever taps through the tablet afterwards isn't.
export default function Catalogo() {
  const { anuncianteId } = useParams<{ anuncianteId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data: anuncianteData } = useQuery<{ data: Anunciante }>({
    queryKey: ["catalogo-anunciante", anuncianteId],
    queryFn: async () => {
      const response = await fetch(`/api/anunciantes/${anuncianteId}`);
      if (!response.ok) throw new Error("Erro ao buscar anunciante");
      return response.json();
    },
    enabled: !!anuncianteId,
  });

  const { data: anunciosData, isLoading } = useQuery<{ data: Anuncio[] }>({
    queryKey: ["catalogo-anuncios", anuncianteId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios?anuncianteId=${anuncianteId}&status=ativo&limit=1000`);
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    enabled: !!anuncianteId,
  });

  // No anuncianteId in the URL: if the logged-in user manages one or more anunciantes,
  // let them pick which one's catalog to open.
  const { data: meusAnunciantesData, isLoading: isLoadingMeusAnunciantes } = useQuery<{ data: Anunciante[] }>({
    queryKey: ["anunciantes", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes/do-usuario/listar");
      if (!response.ok) return { data: [] };
      return response.json();
    },
    enabled: !anuncianteId && !!user?.id,
  });

  const anuncios = anunciosData?.data || [];
  const anunciante = anuncianteData?.data;

  const categorias = useMemo(
    () => Array.from(new Set(anuncios.map((a) => a.categoria).filter((c): c is string => !!c))).sort(),
    [anuncios],
  );

  const anunciosFiltrados = useMemo(() => {
    return anuncios.filter((a) => {
      if (selectedCategoria && a.categoria !== selectedCategoria) return false;
      if (searchTerm && !a.titulo.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [anuncios, searchTerm, selectedCategoria]);

  // Reset to page 1 whenever the visible set changes, so a filter/search never leaves the
  // user stranded on a now-empty page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategoria]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const anunciosPagina = anunciosFiltrados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (!anuncianteId) {
    const meusAnunciantes = meusAnunciantesData?.data || [];
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-vitrii-gray-light p-6">
        <Store className="w-12 h-12 text-vitrii-blue mb-4" />
        <h1 className="text-2xl font-bold text-vitrii-text mb-2">Meu Catálogo</h1>
        {!user ? (
          <p className="text-vitrii-text-secondary">Faça login para escolher qual anunciante exibir.</p>
        ) : isLoadingMeusAnunciantes ? (
          <p className="text-vitrii-text-secondary flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            Procurando anunciantes cadastrados...
          </p>
        ) : meusAnunciantes.length === 0 ? (
          <p className="text-vitrii-text-secondary">Você ainda não possui um anunciante.</p>
        ) : (
          <div className="w-full max-w-sm space-y-2 mt-2">
            <p className="text-sm text-vitrii-text-secondary text-center mb-3">
              Escolha o anunciante para exibir no catálogo:
            </p>
            {meusAnunciantes.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/catalogo/${a.id}`)}
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

  return (
    <div className="min-h-screen bg-vitrii-gray-light">
      <header className="sticky top-0 z-10 bg-white shadow-sm px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-vitrii-blue" />
            <h1 className="text-2xl font-bold text-vitrii-text">{anunciante?.nome || "Catálogo"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Compartilhar
            </button>
            <button
              onClick={() => navigate("/catalogo")}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold text-vitrii-text-secondary hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Catálogo
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            />
          </div>
          {categorias.length > 0 && (
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-vitrii-blue"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      <main className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader className="w-10 h-10 animate-spin text-vitrii-blue" />
          </div>
        ) : anunciosFiltrados.length === 0 ? (
          <div className="text-center py-24 text-vitrii-text-secondary text-lg">
            {anuncios.length === 0 ? "Nenhum anúncio ativo no momento." : "Nenhum anúncio encontrado com esses filtros."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {anunciosPagina.map((anuncio) => (
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

            <Pagination
              currentPage={currentPage}
              totalItems={anunciosFiltrados.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </main>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={anunciante?.nome ? `Catálogo de ${anunciante.nome}` : "Catálogo"}
        url={window.location.href}
        whatsappMessage={`Confira o catálogo de ${anunciante?.nome || "este anunciante"}:`}
      />
    </div>
  );
}
