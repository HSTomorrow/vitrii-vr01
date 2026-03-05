import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import BannerCarousel from "@/components/BannerCarousel";
import AnunciosCarousel from "@/components/AnunciosCarousel";
import AnunciantesCarousel from "@/components/AnunciantesCarousel";
import {
  Star,
  ArrowRight,
  Package,
  BarChart3,
  AlertCircle,
  Plus,
  MapPin,
  Calendar,
  Heart,
  Users,
  Zap,
  User,
} from "lucide-react";

const extractMunicipality = (endereco: string): string => {
  if (!endereco) return "Localização desconhecida";
  const parts = endereco.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return endereco.split(" ").slice(-2, -1)[0] || "Localização";
};

export default function Index() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

  // Debug log on mount and when user changes
  useEffect(() => {
    console.log("[Index] Page loaded - isLoading:", isLoading, "user:", user?.email || "null");
  }, [isLoading, user?.email]);

  // Load user's favorites when page loads
  useEffect(() => {
    if (!user?.id) {
      setFavoritos(new Set());
      return;
    }

    const loadFavoritos = async () => {
      try {
        const response = await fetch(`/api/favoritos?usuarioId=${user.id}`);
        if (!response.ok) throw new Error("Erro ao buscar favoritos");

        const data = await response.json();
        const favoritoIds = data.data?.map((anuncio: any) => anuncio.id) || [];

        console.log("[Index] Loaded favorites:", favoritoIds);
        setFavoritos(new Set(favoritoIds));
      } catch (error) {
        console.error("[Index] Error loading favorites:", error);
      }
    };

    loadFavoritos();
  }, [user?.id]);

  // Validate user status on page load (only if user is logged in)
  useEffect(() => {
    // Only validate if we have a user
    if (!user?.id) {
      console.log("[Index] No user logged in, skipping status validation");
      return;
    }

    console.log("[Index] Validating user status for:", user.email);

    const validateUserStatus = async () => {
      try {
        const response = await fetch(`/api/usracessos/${user.id}/validate-status`);

        if (!response.ok) {
          const errorData = await response.json();

          // User is inactive or doesn't exist
          if (response.status === 403 || response.status === 404) {
            console.warn("[Index] User is inactive or not found (status: " + response.status + "), logging out and redirecting...", errorData);
            toast.error(errorData.error || "Sua conta foi desativada");
            logout();
            navigate("/auth/signin");
            return;
          }

          console.warn("[Index] Validation error but not 403/404:", response.status, errorData);
        }
      } catch (error) {
        console.error("[Index] Error validating user status:", error);
      }
    };

    validateUserStatus();
  }, [user?.id]); // Only depend on user?.id, not logout/navigate

  // All paid ads are fetched and filtered on client side

  const toggleFavoritoMutation = useMutation({
    mutationFn: async (anuncioId: number) => {
      if (!user) {
        toast.error("Faça login para adicionar favoritos");
        navigate("/auth/signin");
        throw new Error("Not logged in");
      }

      const response = await fetch("/api/favoritos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: user.id,
          anuncioId,
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar favorito");
      return { ...(await response.json()), anuncioId };
    },
    onSuccess: (data) => {
      setFavoritos((prev) => {
        const newFavoritos = new Set(prev);
        if (data.isFavorited) {
          newFavoritos.add(data.anuncioId);
          toast.success("Adicionado aos favoritos!");
        } else {
          newFavoritos.delete(data.anuncioId);
          toast.success("Removido dos favoritos");
        }
        return newFavoritos;
      });
    },
    onError: () => {
      // Error is handled, don't show double toast
    },
  });

  // Fetch all banners
  const { data: bannersData } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const response = await fetch("/api/banners");
      if (!response.ok) throw new Error("Erro ao buscar banners");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch user's default localidade
  const { data: userLocalidadeData } = useQuery({
    queryKey: ["user-localidade"],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await fetch(`/api/usracessos/${user.id}`, {
        headers: {
          "x-user-id": user.id.toString(),
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar localidade do usuário");
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const userLocalidadeId = userLocalidadeData?.data?.localidadePadraoId || null;

  // Fetch all active ads without status filter - we'll filter on client side
  const { data: allAnunciosData, isLoading: allAnunciosLoading } = useQuery({
    queryKey: ["anuncios-all"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?limit=500&offset=0");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all anunciantes
  const { data: anunciantesData, isLoading: anunciantesLoading } = useQuery({
    queryKey: ["anunciantes-all"],
    queryFn: async () => {
      const response = await fetch("/api/anunciantes?limit=50&offset=0");
      if (!response.ok) throw new Error("Erro ao buscar anunciantes");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Debug: check anunciante 2 status
  useEffect(() => {
    if (anunciantesData?.data) {
      const anunc2 = anunciantesData.data.find((a: any) => a.id === 2);
      console.log("[Index] Anunciante 2:", anunc2);
    }
  }, [anunciantesData]);

  const allAnuncios = allAnunciosData?.data || [];

  // Debug logging for all ads and specifically ads 5 and 6
  useEffect(() => {
    if (allAnuncios.length > 0) {
      console.log("[Index] All fetched ads:", allAnuncios.map((a: any) => ({
        id: a.id,
        titulo: a.titulo,
        anuncianteId: a.anuncianteId,
        anuncianteStatus: a.anunciantes?.status,
        destaque: a.destaque,
        isDoacao: a.isDoacao,
        status: a.status,
      })));

      const ad5 = allAnuncios.find((a: any) => a.id === 5);
      const ad6 = allAnuncios.find((a: any) => a.id === 6);

      console.log("[Index] Total ads fetched:", allAnuncios.length);

      if (ad5) {
        console.log("[Index] Ad 5 found:", {
          titulo: ad5.titulo,
          destaque: ad5.destaque,
          isDoacao: ad5.isDoacao,
          preco: ad5.preco,
          status: ad5.status,
          tipo: ad5.tipo,
          anuncianteId: ad5.anuncianteId,
          anuncianteStatus: ad5.anunciantes?.status,
        });
      } else {
        console.log("[Index] Ad 5 NOT FOUND in allAnuncios");
      }

      if (ad6) {
        console.log("[Index] Ad 6 found:", {
          titulo: ad6.titulo,
          destaque: ad6.destaque,
          isDoacao: ad6.isDoacao,
          preco: ad6.preco,
          status: ad6.status,
          tipo: ad6.tipo,
          anuncianteId: ad6.anuncianteId,
          anuncianteStatus: ad6.anunciantes?.status,
        });
      } else {
        console.log("[Index] Ad 6 NOT FOUND in allAnuncios");
      }
    }
  }, [allAnuncios]);

  // Filter anuncios by type and gratuito status
  // Helper to check if an anuncio is free (donation or price = 0)
  const isGratis = (anuncio: any) =>
    anuncio.isDoacao || anuncio.preco === 0 || anuncio.preco === "0";

  // Helper to filter by localidade if user has one selected
  const matchesLocalidade = (anuncio: any) => {
    if (!userLocalidadeId) return true; // Show all if no localidade selected
    // If anunciante has no localidade set, show it in all localidades
    if (!anuncio.anunciantes?.localidadeId) return true;
    return anuncio.anunciantes?.localidadeId === userLocalidadeId;
  };

  // Helper to check if ad should be featured (must have destaque=true and status=ativo)
  const isMainPageEligible = (anuncio: any) => {
    return anuncio.destaque && anuncio.status === "ativo";
  };

  // Show featured ads first
  // "Anuncio Padrão", "Produto", and "Serviço Especializado" go here
  // Only show if destaque=true and status=ativo
  const destacados = allAnuncios
    .filter(
      (anuncio: any) =>
        isMainPageEligible(anuncio) &&
        !isGratis(anuncio) &&
        ["anuncio_padrao", "produto", "servico"].includes(anuncio.tipo) &&
        matchesLocalidade(anuncio),
    );

  // Split featured ads into 3 groups of 15 ads each
  const destaquedosCarousel1 = destacados.slice(0, 15);
  const destaquedosCarousel2 = destacados.slice(15, 30);
  const destaquedosCarousel3 = destacados.slice(30, 45);

  // Free/donation ads - only show if isDoacao=true (primary rule for this section)
  // Ads with value or "A Combinar" follow tipo-based classification
  const destaqueDoacoes = allAnuncios
    .filter(
      (anuncio: any) =>
        isMainPageEligible(anuncio) &&
        anuncio.isDoacao === true &&
        matchesLocalidade(anuncio),
    )
    .slice(0, 100);

  // Events - only show if destaque=true and status=ativo
  const destaqueEventos = allAnuncios
    .filter(
      (anuncio: any) =>
        isMainPageEligible(anuncio) &&
        !isGratis(anuncio) &&
        anuncio.tipo === "evento" &&
        matchesLocalidade(anuncio),
    )
    .slice(0, 100);

  // Recurring schedules/courses - only show if destaque=true and status=ativo
  // Note: No isGratis filter as aulas_cursos can have price=0 with "A combinar" or other pricing models
  const destaqueAgendas = allAnuncios
    .filter(
      (anuncio: any) =>
        isMainPageEligible(anuncio) &&
        anuncio.tipo === "aulas_cursos" &&
        matchesLocalidade(anuncio),
    )
    .slice(0, 100);

  // Job opportunities - only show if destaque=true and status=ativo
  // Allow price > 0 or "A Combinar" (aCombinar=true), but reject donations
  const destaqueOportunidades = allAnuncios
    .filter(
      (anuncio: any) =>
        isMainPageEligible(anuncio) &&
        !anuncio.isDoacao &&
        anuncio.tipo === "oportunidade" &&
        (anuncio.preco > 0 || anuncio.aCombinar) &&
        matchesLocalidade(anuncio),
    )
    .slice(0, 100);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Banner Carousel Section */}
      <section className="py-0 md:py-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {bannersData?.data && bannersData.data.length > 0 ? (
            <BannerCarousel banners={bannersData.data} autoPlay={true} />
          ) : (
            <div
              style={{ backgroundColor: "#78BDF6" }}
              className="text-white py-8 md:py-12 rounded-lg flex items-center justify-center"
            >
              <h1
                style={{ fontFamily: "Segoe Fuente Icons, sans-serif" }}
                className="text-lg md:text-xl font-bold"
              >
                Bem-vindo ao Vitrii
              </h1>
            </div>
          )}
        </div>
      </section>

      {/* Featured Listings Section - Carousel 1 */}
      <section className="py-2 md:py-3 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">
                Anúncios em Destaque
              </h2>
              <p className="text-label">
                Veja os produtos e serviços mais procurados
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden md:inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Featured Cards Carousel 1 */}
          <AnunciosCarousel
            anuncios={destaquedosCarousel1}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhum anúncio em destaque publicado ainda"
            color="blue"
          />

          <div className="text-center mt-2">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos os Anúncios</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Listings Section - Carousel 2 */}
      <section className="py-2 md:py-3 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Cards Carousel 2 */}
          <AnunciosCarousel
            anuncios={destaquedosCarousel2}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhum anúncio em destaque publicado ainda"
            color="blue"
          />
        </div>
      </section>

      {/* Featured Listings Section - Carousel 3 */}
      <section className="py-2 md:py-3 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Featured Cards Carousel 3 */}
          <AnunciosCarousel
            anuncios={destaquedosCarousel3}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhum anúncio em destaque publicado ainda"
            color="blue"
          />
        </div>
      </section>

      {/* Featured Anunciantes Section */}
      <section className="py-2 md:py-3 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">
                Anunciantes em Destaque
              </h2>
              <p className="text-label">
                Conheça os principais anunciantes da plataforma
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden md:inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Featured Anunciantes Carousel */}
          <AnunciantesCarousel
            anunciantes={anunciantesData?.data || []}
            isLoading={anunciantesLoading}
            emptyMessage="Nenhum anunciante disponível no momento"
          />

          <div className="text-center mt-2">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Explorar Todos os Anunciantes</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Free/Gratuito Listings Section */}
      <section className="py-2 md:py-3 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">
                Doações, Brindes e Serviços Gratuitos
              </h2>
              <p className="text-label">
                Doações, Brindes, Produtos, Serviços e Eventos disponíveis para
                experimentação gratuitamente
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/anuncio/criar?tipo=doacao"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publicar Grátis
              </Link>
              <Link
                to="/browse?filter=gratuito"
                className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Free/Gratuito Cards Carousel */}
          <AnunciosCarousel
            anuncios={destaqueDoacoes}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhum item gratuito publicado ainda"
            color="green"
          />

          <div className="text-center mt-2 space-y-2">
            <Link
              to="/anuncio/criar?tipo=doacao"
              className="md:hidden inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publicar Grátis
            </Link>
            <div>
              <Link
                to="/browse?filter=gratuito"
                className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Ver Todos os Itens Gratuitos</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events Listings Section */}
      <section className="py-2 md:py-3 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">Eventos</h2>
              <p className="text-label">
                Descubra eventos, workshops e experiências próximas a você
              </p>
            </div>
            <Link
              to="/browse?filter=evento"
              className="hidden md:inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Events Cards Carousel */}
          <AnunciosCarousel
            anuncios={destaqueEventos}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhum evento publicado ainda"
            color="purple"
          />

          <div className="text-center mt-2">
            <Link
              to="/browse?filter=evento"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span className="ver-todos-mobile-green">
                Ver Todos os Eventos
              </span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recurring Schedule Listings Section */}
      <section className="py-2 md:py-3 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">
                Aulas, Cursos e Atendimentos Agendados
              </h2>
              <p className="text-label">
                Aulas, Cursos e Atendimentos Agendados
              </p>
            </div>
            <Link
              to="/browse?filter=aulas_cursos"
              className="hidden md:inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Recurring Schedule Cards Carousel */}
          <AnunciosCarousel
            anuncios={destaqueAgendas}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhuma agenda recorrente publicada ainda"
            color="orange"
          />

          <div className="text-center mt-2">
            <Link
              to="/browse?filter=aulas_cursos"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas as Agendas</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Job Opportunities Listings Section */}
      <section className="py-2 md:py-3 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-h2 mb-0.5">
                Oportunidades e Vagas de Emprego
              </h2>
              <p className="text-label">
                Descubra oportunidades profissionais e vagas de emprego
              </p>
            </div>
            <Link
              to="/browse?filter=oportunidade"
              className="hidden md:inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Job Opportunities Cards Carousel */}
          <AnunciosCarousel
            anuncios={destaqueOportunidades}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) => toggleFavoritoMutation.mutate(id)}
            emptyMessage="Nenhuma oportunidade de emprego publicada ainda"
            color="red"
          />

          <div className="text-center mt-2">
            <Link
              to="/browse?filter=oportunidade"
              className="inline-flex items-center space-x-2 text-vitrii-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas as Oportunidades</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Create Ad Section */}
      <section className="py-2 md:py-3 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark rounded-lg p-6 md:p-8 text-white text-center">
            <Plus className="w-12 h-12 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Publique Seu Anúncio Agora
            </h2>
            <p className="text-blue-100 text-sm md:text-base mb-6 max-w-2xl mx-auto">
              Aproveite nossos 3 anúncios gratuitos e comece a vender seus
              produtos e serviços para milhares de clientes potenciais
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/anuncio/criar"
                className="bg-vitrii-yellow text-vitrii-text px-8 py-2.5 rounded-lg font-semibold hover:bg-vitrii-yellow-dark transition-colors"
              >
                Criar Anúncio
              </Link>
              <Link
                to="/sell"
                className="bg-white text-vitrii-blue px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Gerenciar Anúncios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Vitrii Section */}
      <section className="py-2 md:py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="section-title-green text-2xl md:text-3xl font-bold">Por que escolher Vitrii?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-vitrii-blue" />
              </div>
              <h3 className="text-lg font-bold text-vitrii-text mb-2">
                Rápido e Fácil
              </h3>
              <p className="text-sm text-vitrii-text-secondary">
                Comece em minutos. Cadastre sua loja, adicione produtos e comece
                a vender ou comprar sem complicações.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-vitrii-blue" />
              </div>
              <h3 className="text-lg font-bold text-vitrii-text mb-2">
                Comunidade Ativa
              </h3>
              <p className="text-sm text-vitrii-text-secondary">
                Conecte-se com milhares de vendedores e compradores. Cresça sua
                rede e suas vendas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-7 h-7 text-vitrii-blue" />
              </div>
              <h3 className="text-lg font-bold text-vitrii-text mb-2">
                Análises Completas
              </h3>
              <p className="text-sm text-vitrii-text-secondary">
                Acompanhe suas vendas, clientes e performance com dashboards
                detalhados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-6 md:py-8 bg-vitrii-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Pronto para crescer seu negócio?
          </h2>
          <p className="text-sm md:text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            Transforme seus negócios com Vitrii
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth/signup"
              className="bg-vitrii-yellow text-vitrii-text px-8 py-2.5 rounded-lg font-semibold hover:bg-vitrii-yellow-dark transition-colors inline-block"
            >
              Comece Grátis
            </Link>
            <Link
              to="/browse"
              className="border-2 border-white text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors inline-block"
            >
              Explorar Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-blue-50 border-t-4 border-vitrii-blue py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-vitrii-text mb-0.5 text-sm">
              Informação Importante
            </h3>
            <p className="text-vitrii-text-secondary text-xs">
              Vitrii é um marketplace seguro com autenticação via Google ou
              Usuário/Senha. Suas transações são protegidas e dados
              criptografados.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
