import { usePWA } from '@/hooks/usePWA';
import { Download, Share2, Copy, Check, MessageCircle } from 'lucide-react';
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

  // Mostrar para iOS Safari
  if (isIOS && isSafari) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              Instalar Vitrii no iOS
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              Para instalar a Vitrii como um app no seu iPhone ou iPad, siga estes passos:
            </p>
            <ol className="text-blue-800 text-sm space-y-2 ml-4 list-decimal mb-6">
              <li>Toque no ícone <strong>Compartilhar</strong> (caixa com seta para cima)</li>
              <li>Deslize para a esquerda e toque em <strong>Adicionar à Tela de Início</strong></li>
              <li>Nomeie como "Vitrii" e toque em <strong>Adicionar</strong></li>
              <li>O app aparecerá na sua tela inicial como um ícone nativo!</li>
            </ol>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-3 rounded-lg border border-blue-300">
              <div className="text-center">
                <p className="text-xs text-blue-700 font-semibold mb-2">Escaneie o QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#025CB6"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  navigator.share({
                    title: 'Vitrii',
                    text: 'Instale a Vitrii como um app!',
                    url: appUrl,
                  }).catch(() => {
                    navigator.clipboard.writeText(appUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'URL Copiada!' : 'Compartilhar'}
              </button>
              <button
                onClick={() => {
                  if (isMobileApp) {
                    window.location.href = whatsappLink;
                  } else {
                    window.open(whatsappLink, "_blank");
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
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
            <h3 className="text-lg font-bold text-green-900 mb-3">
              Instalar Vitrii no Android
            </h3>
            <p className="text-green-800 text-sm mb-6">
              Instale a Vitrii como um app nativo no seu dispositivo Android para melhor experiência e acesso rápido!
            </p>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-3 rounded-lg border border-green-300">
              <div className="text-center">
                <p className="text-xs text-green-700 font-semibold mb-2">Escaneie o QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#15803d"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={async () => {
                  await install();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <Download className="w-4 h-4" />
                Instalar Agora
              </button>
              <button
                onClick={() => {
                  if (isMobileApp) {
                    window.location.href = whatsappLink;
                  } else {
                    window.open(whatsappLink, "_blank");
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Para Desktop ou outros browsers - mostrar ambas as opções
  return (
    <div className="space-y-4 mb-6">
      {/* iOS Option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-3">
              Instalar no iOS
            </h3>
            <p className="text-blue-800 text-sm mb-4">
              Toque em Compartilhar → Adicionar à Tela de Início
            </p>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-3 rounded-lg border border-blue-300">
              <div className="text-center">
                <p className="text-xs text-blue-700 font-semibold mb-2">Escaneie o QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#025CB6"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  if (isMobileApp) {
                    window.location.href = whatsappLink;
                  } else {
                    window.open(whatsappLink, "_blank");
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Compartilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Android Option */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Download className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-900 mb-3">
              Instalar no Android
            </h3>
            <p className="text-green-800 text-sm mb-4">
              Toque em Instalar quando a opção aparecer
            </p>

            {/* QR Code */}
            <div className="mb-6 flex items-center justify-center bg-white p-3 rounded-lg border border-green-300">
              <div className="text-center">
                <p className="text-xs text-green-700 font-semibold mb-2">Escaneie o QR Code</p>
                <QRCodeSVG
                  value={appUrl}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#15803d"
                  bgColor="#ffffff"
                />
              </div>
            </div>

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
              Compartilhar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
