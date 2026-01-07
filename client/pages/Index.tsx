import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  QrCode,
  Star,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Package,
  BarChart3,
  AlertCircle,
  Plus,
  MapPin,
} from "lucide-react";

// Helper function to extract municipality from address
const extractMunicipality = (endereco: string): string => {
  if (!endereco) return "Localização desconhecida";

  // Split by comma and get the second-to-last part (usually city)
  // Format is typically: "Rua X, 123, Cidade, Estado CEP"
  const parts = endereco.split(",");

  if (parts.length >= 2) {
    // Get the second-to-last part (city)
    return parts[parts.length - 2].trim();
  }

  return endereco.split(" ").slice(-2, -1)[0] || "Localização";
};

export default function Index() {
  const navigate = useNavigate();

  // Fetch featured ads (excluding donations)
  const { data: anunciosData, isLoading } = useQuery({
    queryKey: ["anuncios-destaque"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?status=pago&isDoacao=false");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  // Fetch donation ads
  const { data: doacoesData, isLoading: doacoesLoading } = useQuery({
    queryKey: ["anuncios-doacoes"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios?status=pago&isDoacao=true");
      if (!response.ok) throw new Error("Erro ao buscar doações");
      return response.json();
    },
  });

  const anuncios = anunciosData?.data || [];
  const destacados = anuncios.slice(0, 20);
  const doacoes = doacoesData?.data || [];
  const destaqueDoacoes = doacoes.slice(0, 20);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark text-white py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Bem-vindo ao Vitrii
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              O marketplace inteligente que conecta vendedores e compradores
              com tecnologia QR Code revolucionária.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth/signup"
                className="bg-walmart-yellow text-walmart-text px-8 py-2 rounded-lg font-semibold hover:bg-walmart-yellow-dark transition-colors text-center"
              >
                Começar Agora
              </Link>
              <Link
                to="/browse"
                className="bg-white text-walmart-blue px-8 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Ver Anúncios
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-16 md:py-24 bg-walmart-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-walmart-text mb-2">
                Anúncios em Destaque
              </h2>
              <p className="text-walmart-text-secondary">
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
            {isLoading ? (
              // Loading Skeleton
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="vitrii-card overflow-hidden animate-pulse">
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
              // Display actual ads
              destacados.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer"
                >
                  {/* Image */}
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

                  {/* Content */}
                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Produto em destaque"}
                      </p>

                      {/* Municipality */}
                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.loja?.endereco || "")}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4 mt-auto">
                      <span className="text-2xl font-bold text-walmart-blue">
                        R$ {anuncio.tabelaDePreco?.preco ? Number(anuncio.tabelaDePreco.preco).toFixed(2) : "0.00"}
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
              ))
            ) : (
              // No ads placeholder
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">Nenhum anúncio publicado ainda</p>
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

      {/* Donation Listings Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-walmart-text mb-2">
                Anúncios de Doação
              </h2>
              <p className="text-walmart-text-secondary">
                Encontre itens grátis disponíveis para retirada
              </p>
            </div>
            <Link
              to="/browse?filter=doacao"
              className="hidden md:inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Donation Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {doacoesLoading ? (
              // Loading Skeleton
              <>
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="vitrii-card overflow-hidden animate-pulse">
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
              // Display actual donation ads
              destaqueDoacoes.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative"
                >
                  {/* Donation Badge */}
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                    GRÁTIS
                  </div>

                  {/* Image */}
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

                  {/* Content */}
                  <div className="p-4 flex flex-col h-full">
                    <div>
                      <h4 className="font-semibold text-walmart-text mb-2 line-clamp-2">
                        {anuncio.titulo}
                      </h4>
                      <p className="text-sm text-walmart-text-secondary mb-3 line-clamp-2">
                        {anuncio.descricao || "Item disponível para doação"}
                      </p>

                      {/* Municipality */}
                      <div className="flex items-center gap-1 mb-3 text-xs text-walmart-text-secondary">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {extractMunicipality(anuncio.loja?.endereco || "")}
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

                    <button
                      onClick={() => navigate(`/anuncio/${anuncio.id}`)}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // No donation ads placeholder
              <div className="col-span-full text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-walmart-text-secondary">Nenhuma doação publicada ainda</p>
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
              to="/browse?filter=doacao"
              className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
            >
              <span>Ver Todas as Doações</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Create Ad Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-walmart-blue to-walmart-blue-dark rounded-lg p-12 text-white text-center">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Publique Seu Anúncio Agora
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Aproveite nossos 3 anúncios gratuitos e comece a vender seus produtos e serviços
              para milhares de clientes potenciais
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
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-walmart-text mb-4">
              Por que escolher Vitrii?
            </h2>
            <p className="text-xl text-walmart-text-secondary">
              Recursos que transformam seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Reason 1 */}
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

            {/* Reason 2 */}
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

            {/* Reason 3 */}
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
      <section className="py-16 md:py-24 bg-walmart-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para crescer seu negócio?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
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
