import { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function InstallAppMenuItem() {
  const { isInstallable, install, isIOS, isSafari } = usePWA();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Show for iOS Safari or when installable (Chrome/Android)
  if (!isInstallable && !(isIOS && isSafari)) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS && isSafari) {
      // Navigate to iOS instructions
      navigate('/install-ios');
      return;
    }

    // Chrome/Android - trigger install
    setIsLoading(true);
    try {
      await install();
      toast.success('Vitrii instalado com sucesso!');
    } catch (error) {
      toast.error('Erro ao instalar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleInstall}
      disabled={isLoading}
      className="w-full flex items-center gap-4 px-6 py-4 bg-vitrii-blue hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isIOS && isSafari ? (
        <Smartphone className="w-6 h-6 text-white flex-shrink-0" />
      ) : (
        <Download className="w-6 h-6 text-white flex-shrink-0" />
      )}
      <div className="text-left">
        <span className="text-white font-bold block">
          {isIOS && isSafari ? 'Instalar no iOS' : 'Instalar Vitrii'}
        </span>
        <span className="text-blue-100 text-xs">
          {isIOS && isSafari ? 'iPhone e iPad' : 'Aplicativo para seu dispositivo'}
        </span>
      </div>
    </button>
  );
}
