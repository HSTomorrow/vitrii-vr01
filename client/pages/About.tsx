import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  Package,
  QrCode,
  ArrowRight,
} from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-walmart-gray-light border-b border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-walmart-text mb-4">
            Sobre o Vitrii
          </h1>
          <p className="text-lg text-walmart-text-secondary max-w-2xl">
            Conheça as poderosas funcionalidades que transformam a forma como você vende e compra.
          </p>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-16 md:py-24 bg-walmart-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-walmart-text mb-4">
              Nossas Principais Funcionalidades
            </h2>
            <p className="text-xl text-walmart-text-secondary max-w-2xl mx-auto">
              Duas soluções poderosas para transformar seu negócio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Marketplace */}
            <div className="vitrii-card p-8">
              <div className="w-16 h-16 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <Package className="w-8 h-8 text-walmart-blue" />
              </div>
              <h3 className="text-2xl font-bold text-walmart-text mb-4">
                Anúncios de Produtos e Serviços
              </h3>
              <p className="text-walmart-text-secondary mb-6">
                Marketplace completo similar ao Mercado Livre. Poste até 3
                anúncios gratuitamente, depois pague apenas por dia por anúncio
                via Pix. Controle total sobre seus produtos, preços e estoque.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    3 anúncios gratuitos
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Tabela de preços flexível
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Controle de estoque
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Pagamento via Pix
                  </span>
                </li>
              </ul>

              <Link
                to="/sell"
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Saiba Mais</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Feature 2: QR Code */}
            <div className="vitrii-card p-8">
              <div className="w-16 h-16 bg-walmart-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <QrCode className="w-8 h-8 text-walmart-blue" />
              </div>
              <h3 className="text-2xl font-bold text-walmart-text mb-4">
                Vitrines com QR Code
              </h3>
              <p className="text-walmart-text-secondary mb-6">
                Coloque QR Codes na sua loja para que clientes vejam produtos,
                tamanhos, cores, estoque e preços em tempo real. Eles podem
                chamar atendentes direto do app, que recebem notificações e
                alertas sonoros.
              </p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    QR Codes dinâmicos
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Informações em tempo real
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Sistema de alertas
                  </span>
                </li>
                <li className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-walmart-yellow flex items-center justify-center text-walmart-text text-sm font-bold">
                    ✓
                  </div>
                  <span className="text-walmart-text">
                    Notificações inteligentes
                  </span>
                </li>
              </ul>

              <Link
                to="/qrcode"
                className="inline-flex items-center space-x-2 text-walmart-blue font-semibold hover:space-x-3 transition-all"
              >
                <span>Saiba Mais</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-walmart-text mb-4">
            Pronto para começar?
          </h2>
          <p className="text-lg text-walmart-text-secondary mb-8 max-w-2xl mx-auto">
            Escolha a funcionalidade que melhor se encaixa no seu negócio e comece hoje mesmo.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center space-x-2 bg-walmart-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-walmart-blue-dark transition-colors"
            >
              <span>Criar Conta</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 border-2 border-walmart-blue text-walmart-blue px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <span>Voltar para Home</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
