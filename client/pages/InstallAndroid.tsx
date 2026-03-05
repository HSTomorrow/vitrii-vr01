import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Copy, Check, MessageCircle } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function InstallAndroid() {
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
              <h1 className="text-2xl font-bold text-vitrii-text">Instalar no Android</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0">
                <Download className="w-12 h-12 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-vitrii-text mb-4">
                  🚀 Instalar Vitrii no Android
                </h2>
                <p className="text-gray-700 text-lg mb-6">
                  Instale a Vitrii como um app nativo no seu dispositivo Android para uma melhor experiência e acesso rápido:
                </p>

                {/* Step by step instructions */}
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-green-600 text-lg">1</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Abra a Vitrii no Chrome</h3>
                      <p className="text-gray-600">Acesse www.vitrii.com.br ou app.vitrii.com.br no navegador Chrome do seu telefone Android</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-green-600 text-lg">2</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Procure pelo botão "Instalar"</h3>
                      <p className="text-gray-600">O Chrome mostrará automaticamente uma opção de instalação. Pode aparecer como um pop-up ou no menu de 3 pontos</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-green-600 text-lg">3</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Toque em "Instalar"</h3>
                      <p className="text-gray-600">Clique no botão de instalação que aparece na tela</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                      <span className="font-bold text-green-600 text-lg">4</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-vitrii-text mb-2 text-lg">Pronto! App instalado</h3>
                      <p className="text-gray-600">O app será adicionado à sua tela inicial automaticamente. Aproveite a Vitrii como um app nativo! 🎉</p>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-gray-50 rounded-lg p-8 mb-8 border-2 border-gray-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-4">
                      💡 Dica: Escaneie este QR code com a câmera do seu Android
                    </p>
                    <div className="flex justify-center">
                      <QRCodeSVG
                        value={appUrl}
                        size={180}
                        level="H"
                        includeMargin={true}
                        fgColor="#15803d"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCopyLink}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold border border-green-300"
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
          <div className="mt-8 bg-green-50 border-l-4 border-green-600 p-6 rounded">
            <h3 className="font-bold text-green-900 mb-3">💡 Vantagens do App:</h3>
            <ul className="text-green-800 space-y-2">
              <li>✓ Acesso rápido diretamente da tela inicial</li>
              <li>✓ Funciona como um app nativo do Android</li>
              <li>✓ Notificações em tempo real sobre suas atividades</li>
              <li>✓ Carrega mais rápido que no navegador</li>
              <li>✓ Funciona offline após o carregamento inicial</li>
              <li>✓ Pode ser gerenciado como qualquer outro app</li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="mt-8 bg-amber-50 border-l-4 border-amber-600 p-6 rounded">
            <h3 className="font-bold text-amber-900 mb-3">❓ Não vejo o botão "Instalar"?</h3>
            <ul className="text-amber-800 space-y-2">
              <li>• Certifique-se de estar usando Chrome ou navegador compatível</li>
              <li>• Atualizar o navegador para a versão mais recente</li>
              <li>• Feche o navegador e abra novamente</li>
              <li>• Tente acessar via menu de 3 pontos → "Instalar app"</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
