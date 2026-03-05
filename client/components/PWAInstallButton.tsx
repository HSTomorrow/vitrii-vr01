import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { toast } from 'sonner';

export default function PWAInstallButton() {
  const { isInstallable, install, isOnline } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  if (!isInstallable || !isOnline) {
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

  if (showPrompt) {
    return (
      <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm z-50 animate-slide-up">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-vitrii-text text-lg">Instalar Vitrii</h3>
            <p className="text-sm text-gray-600 mt-1">
              Instale o Vitrii como um app no seu dispositivo para melhor experiência
            </p>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleInstall}
            className="w-full bg-vitrii-blue text-white px-4 py-2 rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Instalar Agora
          </button>
          <button
            onClick={() => setShowPrompt(false)}
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
      className="fixed bottom-20 right-4 bg-vitrii-blue text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow z-40 md:hidden"
      title="Instalar Vitrii"
    >
      <Download className="w-6 h-6" />
    </button>
  );
}
