import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InstallIOS() {
  const navigate = useNavigate();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleInstallClick = () => {
    // Abre a página no navegador para permitir adicionar à tela inicial
    window.location.href = appUrl;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Header Section */}
        <div className="sticky top-16 bg-white border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-6 h-6 text-vitrii-text" />
              </button>
              <h1 className="text-2xl font-bold text-vitrii-text">Instalar no iOS</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Smartphone className="w-12 h-12 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-vitrii-text mb-4">
                  📱 Instalar Vitrii no iOS
                </h2>
                <p className="text-gray-700 text-lg mb-8">
                  Siga as instruções abaixo para instalar a Vitrii como um WebApp no seu iPhone ou iPad:
                </p>

                {/* Step by Step Instructions */}
                <div className="space-y-6 mb-8">
                  {/* Step 1 */}
                  <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                    <h3 className="font-bold text-gray-900 mb-3">📍 Passo 1: Acessar a Vitrii</h3>
                    <p className="text-gray-700 text-sm mb-3">
                      No Safari do seu iPhone/iPad, acesse: <strong>{appUrl}</strong>
                    </p>
                    <button
                      onClick={handleInstallClick}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Abrir Vitrii no Safari
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                    <h3 className="font-bold text-gray-900 mb-3">📍 Passo 2: Compartilhar</h3>
                    <p className="text-gray-700 text-sm">
                      Toque no ícone de <strong>Compartilhar</strong> (↑ com seta saindo de uma caixa) na barra de ferramentas do Safari (parte inferior ou superior da tela)
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                    <h3 className="font-bold text-gray-900 mb-3">📍 Passo 3: Adicionar à Tela Inicial</h3>
                    <p className="text-gray-700 text-sm mb-3">
                      Procure e toque em <strong>"Adicionar à Tela de Início"</strong> (em inglês: "Add to Home Screen")
                    </p>
                    <p className="text-gray-600 text-xs italic">
                      Dica: Se não encontrar logo, deslize para a esquerda nas opções de compartilhamento
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                    <h3 className="font-bold text-gray-900 mb-3">📍 Passo 4: Nomear o App</h3>
                    <p className="text-gray-700 text-sm mb-3">
                      Uma caixa de diálogo aparecerá. Nomeie como <strong>"Vitrii"</strong> (você pode alterar o nome se desejar)
                    </p>
                    <p className="text-gray-600 text-xs italic">
                      Deixe o ícone como está (será o ícone da Vitrii)
                    </p>
                  </div>

                  {/* Step 5 */}
                  <div className="bg-gray-50 border-l-4 border-blue-600 p-6 rounded">
                    <h3 className="font-bold text-gray-900 mb-3">📍 Passo 5: Instalar</h3>
                    <p className="text-gray-700 text-sm">
                      Toque em <strong>"Adicionar"</strong> no canto superior direito
                    </p>
                  </div>

                  {/* Step 6 */}
                  <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded">
                    <h3 className="font-bold text-green-900 mb-3">✅ Pronto!</h3>
                    <p className="text-green-700 text-sm">
                      A Vitrii foi adicionada à sua tela inicial! Você verá um ícone da Vitrii na tela inicial, assim como qualquer outro app. Toque para abrir!
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-700 mb-4">
                      Ou escaneie este QR code
                    </p>
                    <div className="flex justify-center">
                      <QRCodeSVG
                        value={appUrl}
                        size={160}
                        level="H"
                        includeMargin={true}
                        fgColor="#025CB6"
                        bgColor="#ffffff"
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-4">
                      Use a câmera do seu iPhone para escanear este QR code
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded mt-8">
                  <h3 className="font-bold text-blue-900 mb-3">ℹ️ Vantagens do WebApp:</h3>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>✓ Acesso rápido na tela inicial como um app</li>
                    <li>✓ Funciona offline após o primeiro carregamento</li>
                    <li>✓ Carrega rápido a cada uso</li>
                    <li>✓ Atualizações automáticas quando há internet</li>
                    <li>✓ Sem necessidade de instalar pela App Store</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
