import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Trash2, BarChart3 } from "lucide-react";

interface QRCodeGeneratorProps {
  anuncioId: number;
  anuncioTitulo: string;
}

export default function QRCodeGenerator({
  anuncioId,
  anuncioTitulo,
}: QRCodeGeneratorProps) {
  const queryClient = useQueryClient();
  const [showStats, setShowStats] = useState(false);

  // Fetch QR codes for this ad
  const { data: qrCodesData, isLoading } = useQuery({
    queryKey: ["qrcodes", anuncioId],
    queryFn: async () => {
      const response = await fetch(`/api/anuncios/${anuncioId}/qrcodes`);
      if (!response.ok) throw new Error("Erro ao buscar QR Codes");
      return response.json();
    },
  });

  // Generate QR code mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/qrcodes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anuncioId,
          descricao: `QR Code para ${anuncioTitulo}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Erro ao gerar QR Code");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrcodes", anuncioId] });
      toast.success("QR Code gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar QR Code");
    },
  });

  // Delete QR code mutation
  const deleteMutation = useMutation({
    mutationFn: async (qrCodeId: number) => {
      const response = await fetch(`/api/qrcodes/${qrCodeId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar QR Code");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qrcodes", anuncioId] });
      toast.success("QR Code deletado com sucesso!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao deletar QR Code");
    },
  });

  const qrCodes = qrCodesData?.data || [];
  const directLink = qrCodes.length > 0 
    ? `${window.location.origin}/anuncio/${anuncioId}`
    : null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const downloadQRCode = (qrImage: string, filename: string) => {
    const link = document.createElement("a");
    link.href = qrImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Generate QR Code Button */}
      <div className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark rounded-lg p-6 text-white">
        <h3 className="text-xl font-bold mb-2">QR Code para este Anúncio</h3>
        <p className="text-blue-100 mb-4">
          Crie um QR Code para compartilhar o anúncio de forma rápida
        </p>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2 bg-white text-vitrii-blue font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {generateMutation.isPending ? "Gerando..." : "Gerar QR Code"}
        </button>
      </div>

      {/* QR Codes List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando QR Codes...</div>
      ) : qrCodes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhum QR Code gerado ainda
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-vitrii-text">
            QR Codes Gerados ({qrCodes.length})
          </h3>
          {qrCodes.map((qrCode: any) => (
            <div
              key={qrCode.id}
              className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code Image */}
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={qrCode.codigo}
                    alt="QR Code"
                    className="w-40 h-40 border-2 border-gray-300 rounded-lg p-2 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadQRCode(qrCode.codigo, `qrcode-${qrCode.id}.png`)}
                      className="flex items-center gap-1 px-3 py-1 bg-vitrii-blue text-white rounded hover:bg-vitrii-blue-dark text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                  </div>
                </div>

                {/* QR Code Info */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Link Direto:</p>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/anuncio/${anuncioId}`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(`${window.location.origin}/anuncio/${anuncioId}`)
                        }
                        className="px-3 py-2 bg-vitrii-blue text-white rounded hover:bg-vitrii-blue-dark"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Código QR:</p>
                    <p className="text-sm text-gray-700 font-mono break-all">
                      {qrCode.id}
                    </p>
                  </div>

                  {qrCode.descricao && (
                    <div>
                      <p className="text-sm text-gray-600 font-semibold">Descrição:</p>
                      <p className="text-sm text-gray-700">{qrCode.descricao}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-vitrii-text rounded hover:bg-gray-300 text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Stats
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(qrCode.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              {showStats && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <QRCodeStats qrCodeId={qrCode.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Direct Link */}
      {directLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">
            ✓ Link Direto para Compartilhamento:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={directLink}
              className="flex-1 px-3 py-2 border border-green-300 rounded bg-white text-sm"
            />
            <button
              onClick={() => copyToClipboard(directLink)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// QR Code Statistics Component
function QRCodeStats({ qrCodeId }: { qrCodeId: number }) {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["qrcode-stats", qrCodeId],
    queryFn: async () => {
      const response = await fetch(`/api/qrcodes/${qrCodeId}/stats`);
      if (!response.ok) throw new Error("Erro ao buscar estatísticas");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Carregando estatísticas...</div>;
  }

  const stats = statsData?.data?.stats || {};

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 rounded p-3">
        <p className="text-2xl font-bold text-vitrii-blue">{stats.totalScans || 0}</p>
        <p className="text-sm text-gray-600">Total de Scans</p>
      </div>
      <div className="bg-green-50 rounded p-3">
        <p className="text-2xl font-bold text-green-600">{stats.uniqueUsers || 0}</p>
        <p className="text-sm text-gray-600">Usuários Únicos</p>
      </div>
      <div className="bg-yellow-50 rounded p-3">
        <p className="text-sm font-semibold text-gray-700">Primeiro Scan</p>
        <p className="text-sm text-gray-600">
          {stats.firstScan ? new Date(stats.firstScan).toLocaleDateString("pt-BR") : "—"}
        </p>
      </div>
      <div className="bg-purple-50 rounded p-3">
        <p className="text-sm font-semibold text-gray-700">Último Scan</p>
        <p className="text-sm text-gray-600">
          {stats.lastScan ? new Date(stats.lastScan).toLocaleDateString("pt-BR") : "—"}
        </p>
      </div>
    </div>
  );
}
