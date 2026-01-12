import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import BannerCarousel from "@/components/BannerCarousel";
import AnunciosCarousel from "@/components/AnunciosCarousel";
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
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Set<number>>(new Set());

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
  });

  // Fetch all active ads without status filter - we'll filter on client side
  const { data: allAnunciosData, isLoading: allAnunciosLoading } = useQuery({
    queryKey: ["anuncios-all"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  const allAnuncios = allAnunciosData?.data || [];

  // Filter anuncios by type and gratuito status
  // Helper to check if an anuncio is free (donation or price = 0)
  const isGratis = (anuncio: any) => anuncio.isDoacao || (anuncio.preco === 0 || anuncio.preco === "0");

  const destacados = allAnuncios
    .filter(
      (anuncio: any) =>
        anuncio.destaque &&
        anuncio.isActive &&
        !isGratis(anuncio) &&
        ["produto", "servico"].includes(anuncio.tipo),
    )
    .slice(0, 20);

  const destaqueDoacoes = allAnuncios
    .filter(
      (anuncio: any) =>
        anuncio.destaque &&
        anuncio.isActive &&
        isGratis(anuncio),
    )
    .slice(0, 20);

  const destaqueEventos = allAnuncios
    .filter(
      (anuncio: any) =>
        anuncio.destaque &&
        anuncio.isActive &&
        !isGratis(anuncio) &&
        anuncio.tipo === "evento",
    )
    .slice(0, 20);

  const destaqueAgendas = allAnuncios
    .filter(
      (anuncio: any) =>
        anuncio.destaque &&
        anuncio.isActive &&
        !isGratis(anuncio) &&
        anuncio.tipo === "agenda_recorrente",
    )
    .slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Banner Carousel Section */}
      <section className="py-4 md:py-6 bg-white">
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

      {/* Featured Listings Section */}
      <section className="py-8 md:py-12 bg-walmart-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2
                style={{ color: "#025CBA" }}
                className="text-2xl md:text-3xl font-bold mb-1"
              >
                Anúncios em Destaque
              </h2>
              <p className="text-sm text-walmart-text-secondary">
                Veja os produtos e serviços mais procurados
              </p>
            </div>
            <Link
              to="/browse"
              className="hidden md:inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Featured Cards Carousel */}
          <AnunciosCarousel
            anuncios={destacados}
            isLoading={allAnunciosLoading}
            isFavorited={(id) => favoritos.has(id)}
            onToggleFavorito={(id) =>
              toggleFavoritoMutation.mutate(id)
            }
            emptyMessage="Nenhum anúncio em destaque publicado ainda"
            color="blue"
          />

          <div className="text-center mt-8">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos os Anúncios</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Free/Gratuito Listings Section */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-walmart-text mb-1">
                Doações, Brindes e Serviços Gratuitos
              </h2>
              <p className="text-sm text-walmart-text-secondary">
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
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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
            onToggleFavorito={(id) =>
              toggleFavoritoMutation.mutate(id)
            }
            emptyMessage="Nenhum item gratuito publicado ainda"
            color="green"
          />

          <div className="text-center mt-8 space-y-4">
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
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Ver Todos os Itens Gratuitos</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events Listings Section */}
      <section className="py-8 md:py-12 bg-walmart-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-walmart-text mb-1">
                Eventos
              </h2>
              <p className="text-sm text-walmart-text-secondary">
                Descubra eventos, workshops e experiências próximas a você
              </p>
            </div>
            <Link
              to="/browse?filter=evento"
              className="hidden md:inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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
            onToggleFavorito={(id) =>
              toggleFavoritoMutation.mutate(id)
            }
            emptyMessage="Nenhum evento publicado ainda"
            color="purple"
          />

          <div className="text-center mt-8">
            <Link
              to="/browse?filter=evento"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos os Eventos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recurring Schedule Listings Section */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-walmart-text mb-1">
                Aulas e Agendas Disponiveis
              </h2>
              <p className="text-sm text-walmart-text-secondary">
                Aulas, consultas e serviços agendáveis disponíveis
              </p>
            </div>
            <Link
              to="/browse?filter=agenda_recorrente"
              className="hidden md:inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
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
            onToggleFavorito={(id) =>
              toggleFavoritoMutation.mutate(id)
            }
            emptyMessage="Nenhuma agenda recorrente publicada ainda"
            color="orange"
          />

          <div className="text-center mt-8">
            <Link
              to="/browse?filter=agenda_recorrente"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas as Agendas</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Create Ad Section */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark rounded-lg p-8 text-white text-center">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Publique Seu Anúncio Agora
            </h2>
            <p className="text-blue-100 text-base mb-8 max-w-2xl mx-auto">
              Aproveite nossos 3 anúncios gratuitos e comece a vender seus
              produtos e serviços para milhares de clientes potenciais
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/anuncio/criar"
                className="bg-walmart-yellow text-walmart-text px-8 py-3 rounded-lg font-semibold hover:bg-walmart-yellow-dark transition-colors"
              >
                Criar Anúncio
              </Link>
              <Link
                to="/sell"
                className="bg-white text-walmart-blue px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Gerenciar Anúncios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Vitrii Section */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-walmart-text mb-3">
              Por que escolher Vitrii?
            </h2>
            <p className="text-sm text-walmart-text-secondary">
              Recursos que transformam seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-walmart-blue" />
              </div>
              <h3 className="text-xl font-bold text-walmart-text mb-3">
                Rápido e Fácil
              </h3>
              <p className="text-walmart-text-secondary">
                Comece em minutos. Cadastre sua loja, adicione produtos e comece
                a vender ou comprar sem complicações.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-walmart-blue" />
              </div>
              <h3 className="text-xl font-bold text-walmart-text mb-3">
                Comunidade Ativa
              </h3>
              <p className="text-walmart-text-secondary">
                Conecte-se com milhares de vendedores e compradores. Cresça sua
                rede e suas vendas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-walmart-blue" />
              </div>
              <h3 className="text-xl font-bold text-walmart-text mb-3">
                Análises Completas
              </h3>
              <p className="text-walmart-text-secondary">
                Acompanhe suas vendas, clientes e performance com dashboards
                detalhados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-8 md:py-12 bg-walmart-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pronto para crescer seu negócio?
          </h2>
          <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            Junte-se a milhares de vendedores que já estão transformando seus
            negócios com Vitrii.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="bg-walmart-yellow text-walmart-text px-8 py-3 rounded-lg font-semibold hover:bg-walmart-yellow-dark transition-colors inline-block"
            >
              Comece Grátis
            </Link>
            <Link
              to="/browse"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors inline-block"
            >
              Explorar Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-blue-50 border-t-4 border-walmart-blue py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-walmart-blue flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-walmart-text mb-1">
              Informação Importante
            </h3>
            <p className="text-walmart-text-secondary text-sm">
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
