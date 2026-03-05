import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { usePWA } from "@/hooks/usePWA";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function InstallAndroid() {
  const navigate = useNavigate();
  const { isInstallable, install } = usePWA();
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleInstall = async () => {
    try {
      await install();
      toast.success('✓ Vitrii instalado com sucesso!');
    } catch (error) {
      toast.error('Erro ao instalar. Tente novamente.');
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-200">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <Download className="w-12 h-12 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-vitrii-text mb-4">
                  🚀 Instalar Vitrii no Android
                </h2>
                <p className="text-gray-700 text-lg mb-8">
                  Instale a Vitrii como um app nativo no seu dispositivo Android para uma experiência completa:
                </p>

                {/* QR Code */}
                <div className="bg-green-50 rounded-lg p-8 mb-8 border-2 border-green-300">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-green-700 mb-4">
                      Escaneie este QR code para acessar a Vitrii
                    </p>
                    <div className="flex justify-center">
                      <QRCodeSVG
                        value={appUrl}
                        size={160}
                        level="H"
                        includeMargin={true}
                        fgColor="#15803d"
                        bgColor="#ffffff"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mb-8">
                  {isInstallable ? (
                    <button
                      onClick={handleInstall}
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <Download className="w-5 h-5" />
                      Instalar Agora
                    </button>
                  ) : (
                    <div className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold border border-green-300">
                      <Download className="w-5 h-5" />
                      App já instalado ou não disponível
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded">
                  <h3 className="font-bold text-green-900 mb-3">✨ Vantagens do App:</h3>
                  <ul className="text-green-800 space-y-2 text-sm">
                    <li>✓ Acesso rápido diretamente da tela inicial</li>
                    <li>✓ Funciona como um app nativo do Android</li>
                    <li>✓ Notificações em tempo real sobre atividades</li>
                    <li>✓ Carrega mais rápido que no navegador</li>
                    <li>✓ Funciona offline após o carregamento inicial</li>
                    <li>✓ Pode ser gerenciado como qualquer outro app</li>
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
