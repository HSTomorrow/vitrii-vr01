import { usePWA } from '@/hooks/usePWA';
import { Download, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function InstallAppSection() {
  const { isInstallable, install, isIOS, isSafari } = usePWA();
  const [copied, setCopied] = useState(false);

  // Mostrar para iOS Safari
  if (isIOS && isSafari) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              Instalar Vitrii no iOS
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              Para instalar a Vitrii como um app no seu iPhone ou iPad, siga estes passos:
            </p>
            <ol className="text-blue-800 text-sm space-y-2 ml-4 list-decimal mb-4">
              <li>Toque no ícone <strong>Compartilhar</strong> (caixa com seta para cima)</li>
              <li>Deslize para a esquerda e toque em <strong>Adicionar à Tela de Início</strong></li>
              <li>Nomeie como "Vitrii" e toque em <strong>Adicionar</strong></li>
              <li>O app aparecerá na sua tela inicial como um ícone nativo!</li>
            </ol>
            <button
              onClick={() => {
                navigator.share({
                  title: 'Vitrii',
                  text: 'Instale a Vitrii como um app!',
                  url: window.location.href,
                }).catch(() => {
                  // Fallback: copiar URL
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'URL Copiada!' : 'Compartilhar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar para Android Chrome
  if (isInstallable) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-2">
              Instalar Vitrii no Android
            </h3>
            <p className="text-green-800 text-sm mb-4">
              Instale a Vitrii como um app nativo no seu dispositivo Android para melhor experiência e acesso rápido!
            </p>
            <button
              onClick={async () => {
                await install();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Download className="w-4 h-4" />
              Instalar Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
