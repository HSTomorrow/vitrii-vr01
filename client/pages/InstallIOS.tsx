import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Copy, Check, MessageCircle, Smartphone } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InstallIOS() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const messageText = '🏪 Conheça a Vitrii! Um marketplace seguro com tecnologia QR Code. Instale agora: ' + appUrl;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0">
                <Smartphone className="w-12 h-12 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-vitrii-text mb-4">
                  📱 Instalar Vitrii no iOS
                </h2>
                <p className="text-gray-700 text-lg mb-6">
                  Siga estes passos simples para instalar a Vitrii como um app nativo no seu iPhone ou iPad:
                </p>

                {/* Step by step instructions */}
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-blue-600 text-lg">1</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Toque no ícone Compartilhar</h3>
                      <p className="text-gray-600">Procure pelo ícone de compartilhamento (uma caixa com seta para cima) na barra de navegação do Safari</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-blue-600 text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Procure por "Adicionar à Tela de Início"</h3>
                      <p className="text-gray-600">Deslize para a esquerda nas opções e encontre "Adicionar à Tela de Início". Toque nela</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-blue-600 text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Nomeie o app como "Vitrii"</h3>
                      <p className="text-gray-600">Uma caixa de texto aparecerá. Você pode renomear para "Vitrii" ou deixar o nome padrão</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-blue-600 text-lg">4</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Toque em "Adicionar"</h3>
                      <p className="text-gray-600">Pronto! O app aparecerá na sua tela inicial como um ícone nativo. Aproveite! 🎉</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-gray-50 rounded-lg p-8 mb-8 border-2 border-gray-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-4">
                      💡 Dica: Escaneie este QR code com outra câmera ou dispositivo
                    </p>
                    <div className="flex justify-center">
                      <QRCodeSVG
                        value={appUrl}
                        size={180}
                        level="H"
                        includeMargin={true}
                        fgColor="#025CB6"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCopyLink}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold border border-blue-300"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Link Copiado!' : 'Copiar Link de Instalação'}
                  </button>
                  <button
                    onClick={() => window.open(whatsappLink, "_blank")}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Compartilhar via WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
            <h3 className="font-bold text-blue-900 mb-3">💡 Dicas Úteis:</h3>
            <ul className="text-blue-800 space-y-2">
              <li>✓ O app funcionará como um atalho que abre a Vitrii em tela cheia</li>
              <li>✓ Você pode acessar o app mesmo sem conexão (após carregar uma vez)</li>
              <li>✓ Para remover, mantenha pressionado o ícone e selecione "Remover"</li>
              <li>✓ O app receberá notificações em tempo real quando instalado</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
