import { useState } from "react";
import { X, Mail, MessageCircle, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  url,
  whatsappPhone,
  whatsappMessage = "Confira este anúncio:",
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("✓ Link copiado para a área de transferência!", {
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("❌ Erro ao copiar link", {
        description: "Tente novamente",
      });
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Confira este anúncio: ${title}`);
    const body = encodeURIComponent(
      `Olá!\n\nQuero compartilhar este anúncio com você:\n\n${title}\n\n${url}\n\nAtenciosamente`
    );
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleShareWhatsApp = () => {
    // Open WhatsApp main page
    window.open("https://wa.me", "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full mx-4 sm:mx-0 p-6 space-y-4 animate-in fade-in slide-in-from-bottom sm:slide-in-from-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Title */}
        <div className="pr-8">
          <h2 className="text-xl font-bold text-vitrii-text">Compartilhar</h2>
          <p className="text-sm text-vitrii-text-secondary mt-1 line-clamp-2">
            {title}
          </p>
        </div>

        {/* Share Options */}
        <div className="grid grid-cols-1 gap-3 pt-4">
          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 text-vitrii-text rounded-lg font-semibold hover:bg-gray-50 transition-colors group"
          >
            <div className="p-2 bg-gray-100 group-hover:bg-gray-200 rounded-lg transition-colors">
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">
                {copied ? "Link Copiado!" : "Copiar Link"}
              </p>
              <p className="text-xs text-gray-500">
                {copied ? "Pronto para compartilhar" : "Cole em qualquer lugar"}
              </p>
            </div>
          </button>

          {/* WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors group bg-green-50 border-2 border-green-300 text-green-700 hover:bg-green-100"
          >
            <div className="p-2 bg-green-100 group-hover:bg-green-200 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Abrir WhatsApp</p>
              <p className="text-xs opacity-75">WhatsApp Web</p>
            </div>
          </button>

          {/* Email Button */}
          <button
            onClick={handleShareEmail}
            className="flex items-center justify-center gap-3 px-4 py-3 border-2 border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors group"
          >
            <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-lg transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Enviar Email</p>
              <p className="text-xs text-blue-600">Abre seu cliente de email</p>
            </div>
          </button>
        </div>

        {/* URL Display */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <p className="text-xs text-gray-500 font-semibold mb-1">URL:</p>
          <p className="text-xs text-gray-600 break-all font-mono">{url}</p>
        </div>

        {/* Info Text */}
        <p className="text-xs text-center text-gray-500 pt-2">
          Compartilhe este anúncio com seus amigos
        </p>
      </div>
    </div>
  );
}
