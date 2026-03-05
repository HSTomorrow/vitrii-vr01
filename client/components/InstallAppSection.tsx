import { usePWA } from '@/hooks/usePWA';
import { Download, Copy, Check, MessageCircle, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function InstallAppSection() {
  const { isInstallable, install, isIOS, isSafari } = usePWA();
  const [copied, setCopied] = useState(false);
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';
  const messageText = '🏪 Conheça a Vitrii! Um marketplace seguro com tecnologia QR Code. Instale agora: ' + appUrl;

  // Detectar se é mobile/app
  const isMobileApp = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const whatsappLink = isMobileApp
    ? `whatsapp://send?text=${encodeURIComponent(messageText)}`
    : `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // Para iOS Safari
  if (isIOS && isSafari) {
    return (
      <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-vitrii-text mb-3">
              📱 Instalar Vitrii no iOS
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Para instalar a Vitrii como um app no seu iPhone ou iPad:
            </p>
            <ol className="text-gray-700 text-sm space-y-2 ml-4 list-decimal mb-6">
              <li>Toque no ícone <strong>Compartilhar</strong> (↑ caixa com seta)</li>
              <li>Deslize para a esquerda e toque em <strong>"Adicionar à Tela de Início"</strong></li>
              <li>Nomeie como "Vitrii" e toque em <strong>Adicionar</strong></li>
              <li>Pronto! O app aparecerá na tela inicial! 🎉</li>
            </ol>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-4 rounded-lg border-2 border-gray-300 shadow">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-semibold mb-3">Escaneie com outra câmera</p>
                <QRCodeSVG
                  value={appUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                  fgColor="#025CB6"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Copy Link and Share */}
            <div className="space-y-3">
              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm border border-blue-300"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => {
                  if (isMobileApp) {
                    window.location.href = whatsappLink;
                  } else {
                    window.open(whatsappLink, "_blank");
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Para Android Chrome com instalação disponível
  if (isInstallable && !isIOS) {
    return (
      <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-vitrii-text mb-3">
              🚀 Instalar Vitrii no Android
            </h3>
            <p className="text-gray-700 text-sm mb-6">
              Instale a Vitrii como um app nativo para melhor experiência!
            </p>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-4 rounded-lg border-2 border-gray-300 shadow">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-semibold mb-3">Escaneie o QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={140}
                  level="H"
                  includeMargin={true}
                  fgColor="#15803d"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await install();
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm border border-green-300"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => {
                  if (isMobileApp) {
                    window.location.href = whatsappLink;
                  } else {
                    window.open(whatsappLink, "_blank");
                  }
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop ou Chrome sem suporte - mostrar ambas as opções
  return (
    <div className="space-y-4 mb-6">
      {/* iOS Option */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Smartphone className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-vitrii-text mb-3">
              📱 Instalar no iOS
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Toque em <strong>Compartilhar</strong> (↑) → <strong>Adicionar à Tela de Início</strong>
            </p>

            {/* QR Code */}
            <div className="mb-4 flex items-center justify-center bg-white p-3 rounded-lg border-2 border-gray-300">
              <div className="text-center">
                <p className="text-xs text-gray-600 font-semibold mb-2">QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={100}
                  level="H"
                  includeMargin={true}
                  fgColor="#025CB6"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold text-sm border border-blue-300"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => window.open(whatsappLink, "_blank")}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Option */}
      <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-vitrii-text mb-3">
              🚀 Instalar no Android
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Toque em <strong>Instalar</strong> quando a opção aparecer no Chrome
            </p>

            {/* QR Code */}
            <div className="mb-4 flex items-center justify-center bg-white p-3 rounded-lg border border-green-300">
              <div className="text-center">
                <p className="text-xs text-green-700 font-semibold mb-2">QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={100}
                  level="H"
                  includeMargin={true}
                  fgColor="#15803d"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm border border-green-300"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={() => window.open(whatsappLink, "_blank")}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
