import { useState } from "react";
import { toast } from "sonner";
import { X, Copy, Share2 } from "lucide-react";

interface ShareAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  anuncianteId: number;
  anuncianteNome: string;
}

export default function ShareAgendaModal({
  isOpen,
  onClose,
  anuncianteId,
  anuncianteNome,
}: ShareAgendaModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const agendaUrl = `${window.location.origin}/agenda/anunciante/${anuncianteId}`;
  const shareMessage = `Confira a agenda e disponibilidade de ${anuncianteNome}: ${agendaUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(agendaUrl);
    setIsCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Agenda de ${anuncianteNome}`,
          text: `Confira a agenda e disponibilidade de ${anuncianteNome}`,
          url: agendaUrl,
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.error("Erro ao compartilhar:", error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-vitrii-text">
            Compartilhar Agenda
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 text-sm">
            Compartilhe a agenda de <strong>{anuncianteNome}</strong> com outras pessoas
          </p>

          {/* Link Section */}
          <div>
            <label className="block text-sm font-semibold text-vitrii-text mb-3">
              Link da Agenda
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={agendaUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <Copy className="w-4 h-4" />
                {isCopied ? "Copiado!" : "Copiar"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Envie este link para qualquer pessoa que deseja visualizar a agenda
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs text-gray-500">OU</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* WhatsApp Section */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar no WhatsApp
          </button>

          {/* Native Share (if available) */}
          {navigator.share && (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500">OU</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <button
                onClick={handleShare}
                className="w-full px-4 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Mais Opções de Compartilhamento
              </button>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong>Nota:</strong> Pessoas que recebem o link poderão visualizar sua
              agenda e podem solicitar para a fila de espera (se estiverem logadas).
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
