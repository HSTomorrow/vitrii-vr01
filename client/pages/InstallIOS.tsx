import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Copy, Check, MessageCircle, Smartphone } from "lucide-react";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

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
      toast.success('✓ Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleInstallClick = () => {
    // No iOS, adiciona à tela inicial manualmente
    if (navigator.share) {
      navigator.share({
        title: 'Vitrii',
        text: 'Instale a Vitrii como um app!',
        url: appUrl,
      }).catch(() => {
        // Fallback
        handleCopyLink();
      });
    } else {
      // Se não tiver share API, copia o link
      handleCopyLink();
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
                  Instale a Vitrii como um WebApp nativo no seu iPhone ou iPad para uma experiência completa:
                </p>

                {/* QR Code */}
                <div className="bg-blue-50 rounded-lg p-8 mb-8 border-2 border-blue-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-700 mb-4">
                      Escaneie este QR code para acessar a Vitrii
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
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-8">
                  <button
                    onClick={handleInstallClick}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <Download className="w-5 h-5" />
                    Instalar Agora
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold border border-blue-300"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                  </button>
                  <button
                    onClick={() => window.open(whatsappLink, "_blank")}
                    className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Compartilhar via WhatsApp
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
                  <h3 className="font-bold text-blue-900 mb-3">ℹ️ Como Funciona:</h3>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>✓ A Vitrii funcionará como um WebApp nativo no seu iOS</li>
                    <li>✓ Pode ser adicionada à tela inicial para acesso rápido</li>
                    <li>✓ Funciona offline após carregar uma vez</li>
                    <li>✓ Atualizações automáticas em tempo real</li>
                    <li>✓ Mesma funcionalidade completa do Android</li>
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
