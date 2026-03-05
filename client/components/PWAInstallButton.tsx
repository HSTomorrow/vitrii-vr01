import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

export default function PWAInstallButton() {
  const { isInstallable, install, isOnline, isIOS, isSafari } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load dismissal state from localStorage
  useEffect(() => {
    try {
      const isDismissed = localStorage.getItem('pwa-install-dismissed');
      if (isDismissed) {
        setDismissed(true);
      }
    } catch (e) {
      // localStorage might not be available
    }
  }, []);

  // Show button for:
  // 1. Chrome/Android when beforeinstallprompt is available
  // 2. iOS Safari always (for WebApp installation)
  const shouldShow = (isInstallable || (isIOS && isSafari)) && isOnline && !dismissed;

  if (!shouldShow) {
    return null;
  }

  const handleInstall = async () => {
    try {
      await install();
      toast.success('Vitrii instalado com sucesso!');
      setShowPrompt(false);
    } catch (error) {
      toast.error('Erro ao instalar. Tente novamente.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    try {
      localStorage.setItem('pwa-install-dismissed', 'true');
    } catch (e) {
      // localStorage might not be available
    }
  };

  if (showPrompt) {
    return (
      <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 animate-slide-up">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-vitrii-text text-lg">Instalar Vitrii</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isIOS && isSafari
                ? 'Instale o Vitrii como um WebApp no seu iOS'
                : 'Instale o Vitrii como um app no seu dispositivo'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {isIOS && isSafari ? (
            <>
              <button
                onClick={() => window.location.href = '/install-ios'}
                className="w-full bg-vitrii-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Instruções de Instalação
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleInstall}
                className="w-full bg-vitrii-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </button>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="w-full bg-gray-100 text-vitrii-text px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            Não Agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowPrompt(true)}
      className="fixed bottom-20 right-4 bg-vitrii-blue text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-110 z-40 md:hidden animate-pulse"
      title={isIOS && isSafari ? 'Instalar Vitrii no iOS' : 'Instalar Vitrii'}
    >
      {isIOS && isSafari ? (
        <Smartphone className="w-6 h-6" />
      ) : (
        <Download className="w-6 h-6" />
      )}
    </button>
  );
}
