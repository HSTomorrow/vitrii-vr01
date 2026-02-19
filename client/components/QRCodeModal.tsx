import { useRef, useState } from "react";
import { X, Download, MessageCircle } from "lucide-react";
import QRCode from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface QRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anuncioId: number;
  anuncioTitulo: string;
  anuncianteId: number;
  anunciantheName: string;
}

export default function QRCodeModal({
  open,
  onOpenChange,
  anuncioId,
  anuncioTitulo,
  anuncianteId,
  anunciantheName,
}: QRCodeModalProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Build the full URL for the QR code
  const anuncioUrl = `${window.location.origin}/anuncio/${anuncioId}`;

  const handleDownloadQRCode = async () => {
    if (!qrCodeRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = qrCodeRef.current.querySelector("canvas");
      if (!canvas) {
        toast.error("Erro ao gerar QR Code");
        return;
      }

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qrcode-${anuncioId}.png`;
      link.click();

      toast.success("QR Code baixado com sucesso!");
    } catch (error) {
      console.error("Error downloading QR Code:", error);
      toast.error("Erro ao baixar QR Code");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestEquipe = () => {
    // Navigate to equipe de venda request page or show contact modal
    toast.info("Funcionalidade em desenvolvimento");
    // TODO: Implementar contato com equipe do anunciante
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>QR Code do Anúncio</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center gap-4">
            <div
              ref={qrCodeRef}
              className="bg-white p-4 rounded-lg border-2 border-gray-200"
            >
              <QRCode
                value={anuncioUrl}
                size={256}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Anúncio:</strong> {anuncioTitulo}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                <strong>Loja:</strong> {anunciantheName}
              </p>
              <p className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded">
                {anuncioUrl}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* Download Button */}
            <button
              onClick={handleDownloadQRCode}
              disabled={isDownloading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Baixando..." : "Baixar QR Code"}
            </button>

            {/* Request Team Button */}
            <button
              onClick={handleRequestEquipe}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Solicitar Equipe
            </button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 <strong>Dica:</strong> Use este QR Code em vitrines, materiais de
              marketing ou compartilhe digitalmente. Clientes podem escanear para
              acessar o anúncio completo e solicitar ajuda.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
