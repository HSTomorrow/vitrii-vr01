import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  QrCode,
  AlertCircle,
  Smartphone,
  Bell,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function QRCodePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Vitrines com QR Code
          </h1>
          <p className="text-blue-100 text-lg">
            Revolucione a experiência de compra na sua loja com QR Codes
            inteligentes
          </p>
        </div>
      </section>

      {/* Hero Section */}
      <section className="py-16 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left - Features */}
            <div>
              <h2 className="text-3xl font-bold text-vitrii-text mb-6">
                Como Funciona
              </h2>

              <div className="space-y-6">
                {/* Feature 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-vitrii-blue text-white">
                      <QrCode className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-vitrii-text">
                      QR Code na Vitrine
                    </h3>
                    <p className="text-vitrii-text-secondary">
                      Distribua QR Codes impressos ou digitais na sua loja
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-vitrii-blue text-white">
                      <Smartphone className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-vitrii-text">
                      Cliente Escaneia
                    </h3>
                    <p className="text-vitrii-text-secondary">
                      Clientes escaneiam com seus celulares usando câmera ou app
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-vitrii-blue text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-vitrii-text">
                      Informações em Tempo Real
                    </h3>
                    <p className="text-vitrii-text-secondary">
                      Vê preço, tamanhos, cores, estoque disponível e avaliações
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-vitrii-blue text-white">
                      <Bell className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-vitrii-text">
                      Chamar Atendente
                    </h3>
                    <p className="text-vitrii-text-secondary">
                      Cliente clica em &quot;chamar atendente&quot; direto no app
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Illustration */}
            <div className="hidden md:flex justify-center">
              <div className="w-80 h-80 bg-white rounded-lg shadow-lg flex items-center justify-center border-4 border-vitrii-blue">
                <QrCode className="w-32 h-32 text-vitrii-blue opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-vitrii-text mb-12 text-center">
            Benefícios para sua Loja
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="bg-vitrii-gray-light rounded-lg p-8">
              <div className="w-12 h-12 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-vitrii-blue" />
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Reduz Tempo de Atendimento
              </h3>
              <p className="text-vitrii-text-secondary">
                Clientes conseguem informações imediatas sem precisar esperar
                um atendente
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-vitrii-gray-light rounded-lg p-8">
              <div className="w-12 h-12 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-vitrii-blue" />
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Atendimento Inteligente
              </h3>
              <p className="text-vitrii-text-secondary">
                Alertas sonoros e notificações para que você não perda nenhuma
                chamada de cliente
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-vitrii-gray-light rounded-lg p-8">
              <div className="w-12 h-12 bg-vitrii-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-vitrii-blue" />
              </div>
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Analíticas Detalhadas
              </h3>
              <p className="text-vitrii-text-secondary">
                Veja quantas pessoas escanearam seus QR Codes e como
                interagiram
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-vitrii-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-vitrii-text mb-12 text-center">
            Casos de Uso
          </h2>

          <div className="space-y-8">
            {/* Case 1 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Loja de Roupas
              </h3>
              <p className="text-vitrii-text-secondary">
                Clientes escaneiam um QR Code ao lado de cada roupa na vitrine
                e veem preço, tamanhos disponíveis, cores e comentários. Se
                quiserem experimentar ou tirar dúvidas, clicam &quot;chamar
                atendente&quot; e o vendedor é alertado.
              </p>
            </div>

            {/* Case 2 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Loja de Eletrônicos
              </h3>
              <p className="text-vitrii-text-secondary">
                Cada produto tem um QR Code com especificações completas,
                vídeos demonstrativos, avaliações de outros clientes e estoque
                em tempo real. Clientes podem chamar um especialista para
                dúvidas técnicas.
              </p>
            </div>

            {/* Case 3 */}
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-vitrii-text mb-3">
                Restaurante / Cafeteria
              </h3>
              <p className="text-vitrii-text-secondary">
                QR Code nas mesas ou no cardápio mostra pratos, preços,
                ingredientes e fotos. Clientes podem chamar o garçom
                diretamente pelo app para fazer pedidos ou tirar dúvidas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-vitrii-text mb-12 text-center">
            Recursos Disponíveis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Gerador de QR Code
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Crie QR Codes dinamicamente para seus produtos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Customização Visual
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Personalize cores e design dos QR Codes com sua marca
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Rastreamento em Tempo Real
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Veja quantas pessoas estão acessando cada QR Code
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Sistema de Alertas
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Som de campainha e notificações quando cliente chama
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Suporte Mobile First
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Funciona perfeitamente em qualquer smartphone
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-vitrii-yellow flex items-center justify-center text-vitrii-text text-sm font-bold flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-vitrii-text">
                    Relatórios Detalhados
                  </h4>
                  <p className="text-sm text-vitrii-text-secondary">
                    Análise completa de engajamento e conversão
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-vitrii-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Transforme sua Loja Hoje
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Implemente QR Codes inteligentes em sua loja e comece a acompanhar
            e gerenciar todas as interações
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center space-x-2 bg-vitrii-yellow text-vitrii-text px-8 py-3 rounded-lg font-semibold hover:bg-vitrii-yellow-dark transition-colors"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
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
