import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  BarChart3,
  ShoppingBag,
  Users,
  ArrowRight,
  AlertCircle,
  Eye,
  MessageSquare,
  Edit2,
} from "lucide-react";

export default function Sell() {
  // Fetch user's ads
  const { data: anunciosData } = useQuery({
    queryKey: ["anuncios"],
    queryFn: async () => {
      const response = await fetch("/api/anuncios");
      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
  });

  const anuncios = anunciosData?.data || [];

  const statusColors: any = {
    em_edicao: "bg-yellow-100 text-yellow-800",
    aguardando_pagamento: "bg-blue-100 text-blue-800",
    pago: "bg-green-100 text-green-800",
    historico: "bg-gray-100 text-gray-800",
  };

  const statusLabels: any = {
    em_edicao: "Em Edição",
    aguardando_pagamento: "Aguardando Pagamento",
    pago: "Publicado",
    historico: "Histórico",
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-walmart-blue text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Comece a Vender no Vitrii
          </h1>
          <p className="text-blue-100 text-lg">
            Alcance milhares de compradores com nossas ferramentas poderosas
          </p>
        </div>
      </section>

      {/* Why Sell Section */}
      <section className="bg-walmart-gray-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-walmart-text mb-8">
            Por que vender no Vitrii?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-walmart-blue" />
              </div>
              <h3 className="font-bold text-walmart-text mb-2">
                3 Anúncios Gratuitos
              </h3>
              <p className="text-walmart-text-secondary text-sm">
                Comece sem pagamentos. Publique até 3 anúncios completamente
                grátis.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-walmart-blue" />
              </div>
              <h3 className="font-bold text-walmart-text mb-2">
                Alcance Milhares
              </h3>
              <p className="text-walmart-text-secondary text-sm">
                Sua loja e produtos aparecem para milhares de compradores
                potenciais.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-walmart-blue" />
              </div>
              <h3 className="font-bold text-walmart-text mb-2">
                Analíticas Completas
              </h3>
              <p className="text-walmart-text-secondary text-sm">
                Acompanhe visualizações, vendas e performance em tempo real.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="w-12 h-12 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <ShoppingBag className="w-6 h-6 text-walmart-blue" />
              </div>
              <h3 className="font-bold text-walmart-text mb-2">
                Gerenciar Tudo
              </h3>
              <p className="text-walmart-text-secondary text-sm">
                Controle estoque, preços, fotos e informações de produtos
                facilmente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-walmart-text mb-12 text-center">
            Como Funciona
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-walmart-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-walmart-text mb-2">
                  Crie sua Conta
                </h3>
                <p className="text-walmart-text-secondary">
                  Cadastre-se com seu e-mail ou use sua conta Google. É rápido
                  e seguro.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-walmart-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-walmart-text mb-2">
                  Configure sua Loja
                </h3>
                <p className="text-walmart-text-secondary">
                  Adicione informações da loja, logotipo, descrição e dados de
                  contato.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-walmart-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-walmart-text mb-2">
                  Publique Produtos
                </h3>
                <p className="text-walmart-text-secondary">
                  Crie anúncios com fotos, descrição, preço e informações de
                  estoque.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 rounded-full bg-walmart-blue text-white flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-walmart-text mb-2">
                  Receba Pedidos
                </h3>
                <p className="text-walmart-text-secondary">
                  Compradores encontram seus produtos, fazem pedidos e você
                  gerencia tudo no painel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-walmart-gray-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-walmart-text mb-12 text-center">
            Planos Simples e Transparentes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg border-2 border-gray-300 p-8">
              <h3 className="text-xl font-bold text-walmart-text mb-2">
                Plano Gratuito
              </h3>
              <p className="text-walmart-text-secondary mb-6">
                Perfeito para começar
              </p>

              <div className="text-3xl font-bold text-walmart-blue mb-6">
                Grátis
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">3 anúncios</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">
                    Gerenciar catálogo
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">Contato básico</span>
                </li>
              </ul>

              <button className="w-full border-2 border-walmart-blue text-walmart-blue py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Começar Grátis
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-lg border-2 border-walmart-blue p-8 shadow-lg">
              <div className="absolute top-0 right-0 bg-walmart-blue text-white px-3 py-1 rounded-bl-lg text-sm font-semibold">
                Popular
              </div>

              <h3 className="text-xl font-bold text-walmart-text mb-2">
                Plano Premium
              </h3>
              <p className="text-walmart-text-secondary mb-6">
                Para vendedores profissionais
              </p>

              <div className="text-3xl font-bold text-walmart-blue mb-1">
                R$ 9,90
              </div>
              <p className="text-walmart-text-secondary text-sm mb-6">
                por anúncio / por dia
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">Anúncios ilimitados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">
                    Analíticas avançadas
                  </span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">Suporte prioritário</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-walmart-yellow flex items-center justify-center text-sm text-walmart-text font-bold">
                    ✓
                  </span>
                  <span className="text-walmart-text">QR Code ilimitados</span>
                </li>
              </ul>

              <button className="w-full bg-walmart-blue text-white py-2 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors">
                Comece Hoje
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AlertCircle className="w-12 h-12 text-walmart-blue mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-walmart-text mb-4">
            Pronto para Começar?
          </h2>
          <p className="text-walmart-text-secondary mb-8">
            Crie sua conta agora e publique seus primeiros 3 anúncios
            gratuitamente. Sem cartão de crédito necessário.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center space-x-2 bg-walmart-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
            >
              <span>Criar Conta Grátis</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 border-2 border-walmart-blue text-walmart-blue px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <span>Saiba Mais</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
