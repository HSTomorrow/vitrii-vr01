import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
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
  const destacados = allAnuncios
    .filter((anuncio: any) =>
      !anuncio.isDoacao &&
      anuncio.destaque &&
      ["produto", "servico"].includes(anuncio.producto?.tipo)
    )
    .slice(0, 20);

  const destaqueDoacoes = allAnuncios
    .filter((anuncio: any) => anuncio.isDoacao)
    .slice(0, 20);

  const destaqueEventos = allAnuncios
    .filter((anuncio: any) =>
      !anuncio.isDoacao &&
      anuncio.producto?.tipo === "evento"
    )
    .slice(0, 20);

  const destaqueAgendas = allAnuncios
    .filter((anuncio: any) =>
      !anuncio.isDoacao &&
      anuncio.producto?.tipo === "agenda_recorrente"
    )
    .slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark text-white py-2 md:py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg md:text-xl font-bold">Bem-vindo ao Vitrii</h1>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-8 md:py-12 bg-walmart-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-walmart-text mb-1">
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

          {/* Featured Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {allAnunciosLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="vitrii-card overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-300" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-3 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-10 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : destacados.length > 0 ? (
              destacados.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative"
                >
                  <div className="w-full h-48 bg-gradient-to-br from-walmart-blue to-walmart-blue-dark flex items-center justify-center overflow-hidden">
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

                  {anuncio.anunciante?.fotoUrl && (
                    <div className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-white border-2 border-walmart-blue overflow-hidden flex items-center justify-center shadow-md">
                      <img
                        src={anuncio.anunciante.fotoUrl}
                        alt={anuncio.anunciante.nome}
                        className="w-full h-full object-cover"
                        title={anuncio.anunciante.nome}
                      />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        toast.error("Faça login para adicionar favoritos");
                        navigate("/auth/signin");
                      } else {
                        toggleFavoritoMutation.mutate(anuncio.id);
                      }
                    }}
                    disabled={toggleFavoritoMutation.isPending}
                    className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title={
                      favoritos.has(anuncio.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        favoritos.has(anuncio.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Produto em destaque"}
                      </p>

                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.anunciante?.endereco || "")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-auto">
                      <span className="text-2xl font-bold text-walmart-blue">
                        R${" "}
                        {anuncio.tabelaDePreco?.preco
                          ? Number(anuncio.tabelaDePreco.preco).toFixed(2)
                          : "0.00"}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                        <span className="text-sm font-semibold">5.0</span>
                      </div>
                    </div>

                    {anuncio.producto?.tipo === "servico" ? (
                      <div className="flex gap-2">
                        <Link
                          to={`/agenda/anunciante/${anuncio.anuncianteId}`}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Agendar
                        </Link>
                        <button
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="flex-1 bg-walmart-blue text-white py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                        >
                          Detalhes
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        className="w-full bg-walmart-blue text-white py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">
                  Nenhum anúncio publicado ainda
                </p>
                <Link
                  to="/anuncio/criar"
                  className="inline-flex items-center gap-2 text-walmart-blue font-semibold hover:underline mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Publique um Anúncio
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mt-12 lg:hidden">
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
                Doações, Brindes, Produtos, Serviços e Eventos disponíveis para experimentação gratuitamente
              </p>
            </div>
            <Link
              to="/browse?filter=gratuito"
              className="hidden md:inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Free/Gratuito Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {allAnunciosLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="vitrii-card overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-300" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-3 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-10 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : destaqueDoacoes.length > 0 ? (
              destaqueDoacoes.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative"
                >
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                    GRATUITO
                  </div>

                  <div className="w-full h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center overflow-hidden">
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

                  {anuncio.anunciante?.fotoUrl && (
                    <div className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-white border-2 border-green-500 overflow-hidden flex items-center justify-center shadow-md">
                      <img
                        src={anuncio.anunciante.fotoUrl}
                        alt={anuncio.anunciante.nome}
                        className="w-full h-full object-cover"
                        title={anuncio.anunciante.nome}
                      />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        toast.error("Faça login para adicionar favoritos");
                        navigate("/auth/signin");
                      } else {
                        toggleFavoritoMutation.mutate(anuncio.id);
                      }
                    }}
                    disabled={toggleFavoritoMutation.isPending}
                    className="absolute top-3 left-3 z-10 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title={
                      favoritos.has(anuncio.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        favoritos.has(anuncio.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Disponível gratuitamente"}
                      </p>

                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.anunciante?.endereco || "")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-auto">
                      <span className="text-lg font-bold text-green-600">
                        Grátis
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                        <span className="text-sm font-semibold">5.0</span>
                      </div>
                    </div>

                    {anuncio.producto?.tipo === "servico" ? (
                      <div className="flex gap-2">
                        <Link
                          to={`/agenda/anunciante/${anuncio.anuncianteId}`}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Agendar
                        </Link>
                        <button
                          onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Detalhes
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">
                  Nenhum item gratuito publicado ainda
                </p>
                <Link
                  to="/anuncio/criar"
                  className="inline-flex items-center gap-2 text-walmart-blue font-semibold hover:underline mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Publique uma Doação
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mt-12 lg:hidden">
            <Link
              to="/browse?filter=gratuito"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todos os Itens Gratuitos</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
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

          {/* Events Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {allAnunciosLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="vitrii-card overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-300" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-3 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-10 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : destaqueEventos.length > 0 ? (
              destaqueEventos.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative"
                >
                  <div className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                    EVENTO
                  </div>

                  <div className="w-full h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center overflow-hidden">
                    {anuncio.fotoUrl ? (
                      <img
                        src={anuncio.fotoUrl}
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="w-12 h-12 text-white opacity-50" />
                    )}
                  </div>

                  {anuncio.anunciante?.fotoUrl && (
                    <div className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-white border-2 border-purple-500 overflow-hidden flex items-center justify-center shadow-md">
                      <img
                        src={anuncio.anunciante.fotoUrl}
                        alt={anuncio.anunciante.nome}
                        className="w-full h-full object-cover"
                        title={anuncio.anunciante.nome}
                      />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        toast.error("Faça login para adicionar favoritos");
                        navigate("/auth/signin");
                      } else {
                        toggleFavoritoMutation.mutate(anuncio.id);
                      }
                    }}
                    disabled={toggleFavoritoMutation.isPending}
                    className="absolute top-3 left-3 z-10 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title={
                      favoritos.has(anuncio.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        favoritos.has(anuncio.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Confira este evento especial"}
                      </p>

                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.anunciante?.endereco || "")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-auto">
                      <span className="text-2xl font-bold text-purple-600">
                        R${" "}
                        {anuncio.precoAnuncio
                          ? Number(anuncio.precoAnuncio).toFixed(2)
                          : anuncio.tabelaDePreco?.preco
                            ? Number(anuncio.tabelaDePreco.preco).toFixed(2)
                            : "0.00"}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                        <span className="text-sm font-semibold">5.0</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">
                  Nenhum evento publicado ainda
                </p>
                <Link
                  to="/anuncio/criar"
                  className="inline-flex items-center gap-2 text-walmart-blue font-semibold hover:underline mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Publique um Evento
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mt-12 lg:hidden">
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

          {/* Recurring Schedule Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {allAnunciosLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div
                    key={item}
                    className="vitrii-card overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-48 bg-gray-300" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-3 bg-gray-300 rounded w-3/4" />
                      <div className="h-3 bg-gray-300 rounded w-1/2" />
                      <div className="h-4 bg-gray-300 rounded" />
                      <div className="h-10 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </>
            ) : destaqueAgendas.length > 0 ? (
              destaqueAgendas.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative"
                >
                  <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                    AGENDA
                  </div>

                  <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
                    {anuncio.fotoUrl ? (
                      <img
                        src={anuncio.fotoUrl}
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="w-12 h-12 text-white opacity-50" />
                    )}
                  </div>

                  {anuncio.anunciante?.fotoUrl && (
                    <div className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-white border-2 border-orange-500 overflow-hidden flex items-center justify-center shadow-md">
                      <img
                        src={anuncio.anunciante.fotoUrl}
                        alt={anuncio.anunciante.nome}
                        className="w-full h-full object-cover"
                        title={anuncio.anunciante.nome}
                      />
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) {
                        toast.error("Faça login para adicionar favoritos");
                        navigate("/auth/signin");
                      } else {
                        toggleFavoritoMutation.mutate(anuncio.id);
                      }
                    }}
                    disabled={toggleFavoritoMutation.isPending}
                    className="absolute top-3 left-3 z-10 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                    title={
                      favoritos.has(anuncio.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        favoritos.has(anuncio.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>

                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Serviço agendável disponível"}
                      </p>

                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.anunciante?.endereco || "")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-auto">
                      <span className="text-2xl font-bold text-orange-600">
                        R${" "}
                        {anuncio.precoAnuncio
                          ? Number(anuncio.precoAnuncio).toFixed(2)
                          : anuncio.tabelaDePreco?.preco
                            ? Number(anuncio.tabelaDePreco.preco).toFixed(2)
                            : "0.00"}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-walmart-yellow text-walmart-yellow" />
                        <span className="text-sm font-semibold">5.0</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        to={`/agenda/anunciante/${anuncio.anuncianteId}`}
                        className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Calendar className="w-4 h-4" />
                        Agendar
                      </Link>
                      <button
                        onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                        className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm"
                      >
                        Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">
                  Nenhuma agenda recorrente publicada ainda
                </p>
                <Link
                  to="/anuncio/criar"
                  className="inline-flex items-center gap-2 text-walmart-blue font-semibold hover:underline mt-4"
                >
                  <Plus className="w-4 h-4" />
                  Publique uma Agenda
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mt-12 lg:hidden">
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
