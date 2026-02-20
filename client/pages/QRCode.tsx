import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  QrCode,
  AlertCircle,
  Smartphone,
  Bell,
  BarChart3,
  ArrowRight,
  Zap,
  Printer,
  Download,
  LogIn,
  ExternalLink,
} from "lucide-react";

export default function QRCodePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [selectedQRCodeId, setSelectedQRCodeId] = useState<number | null>(null);
  const [isDownloadingAnuncianteQR, setIsDownloadingAnuncianteQR] = useState(false);
  const anuncianteQRRef = useRef<HTMLDivElement>(null);

  // Fetch user's anuncios
  const { data: meusAnunciosData, isLoading: anunciosLoading } = useQuery({
    queryKey: ["meus-anuncios-qrcode"],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await fetch(`/api/anuncios?usuarioId=${user.id}&limit=500`, {
        headers: {
          "x-user-id": user.id.toString(),
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar anúncios");
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch user's anunciante
  const { data: anuncianteData, isLoading: anuncianteLoading } = useQuery({
    queryKey: ["usuario-anunciante"],
    queryFn: async () => {
      if (!user?.id) return null;

      const response = await fetch(`/api/anunciantes?limit=1`, {
        headers: {
          "x-user-id": user.id.toString(),
        },
      });

      if (!response.ok) throw new Error("Erro ao buscar anunciante");
      return response.json();
    },
    enabled: !!user?.id,
  });

  const meusAnuncios = meusAnunciosData?.data || [];
  const meuAnunciante = anuncianteData?.data?.[0] || null;
  const anunciantePageUrl = meuAnunciante ? `${window.location.origin}/anunciante/${meuAnunciante.id}` : null;

  const handlePrintQRCode = (anuncioId: number) => {
    const qrElement = document.getElementById(`qr-code-${anuncioId}`);
    if (!qrElement) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    const svg = qrElement.querySelector("svg") as SVGElement;
    if (!svg) {
      toast.error("Erro ao gerar QR Code para impressão");
      return;
    }

    const anuncio = meusAnuncios.find((a: any) => a.id === anuncioId);
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const qrImage = URL.createObjectURL(blob);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${anuncio?.titulo || "Anúncio"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              background: white;
            }
            .qr-container {
              text-align: center;
              page-break-inside: avoid;
              border: 2px solid #000;
              padding: 20px;
              margin-bottom: 30px;
              background: white;
            }
            .qr-image {
              max-width: 300px;
              margin: 20px auto;
            }
            .qr-image img {
              width: 100%;
              height: auto;
            }
            .qr-info {
              text-align: left;
              margin-top: 20px;
            }
            .qr-info h3 {
              margin: 5px 0;
              font-size: 16px;
              color: #333;
            }
            .qr-info p {
              margin: 3px 0;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Escaneie para ver o anúncio</h2>
            <div class="qr-image">
              <img src="data:image/svg+xml;base64,${btoa(svgData)}" alt="QR Code" />
            </div>
            <div class="qr-info">
              <h3><strong>Anúncio:</strong> ${anuncio?.titulo || "Sem título"}</h3>
              <p><strong>Descrição:</strong> ${anuncio?.descricao ? anuncio.descricao.substring(0, 100) + "..." : "Sem descrição"}</p>
              ${anuncio?.preco ? `<p><strong>Preço:</strong> R$ ${parseFloat(anuncio.preco).toFixed(2)}</p>` : ""}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadQRCode = (anuncioId: number) => {
    const qrElement = document.getElementById(`qr-code-${anuncioId}`);
    const svg = qrElement?.querySelector("svg") as SVGElement;

    if (!svg) {
      toast.error("Erro ao gerar QR Code");
      return;
    }

    // Convert SVG to PNG
    const canvas = document.createElement("canvas");
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `qrcode-anuncio-${anuncioId}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("QR Code baixado com sucesso!");
      }
    };

    img.src = url;
  };

  const handleDownloadAnuncianteQRCode = async () => {
    if (!anuncianteQRRef.current) return;

    setIsDownloadingAnuncianteQR(true);
    try {
      const svg = anuncianteQRRef.current.querySelector("svg") as SVGElement;
      if (!svg) {
        toast.error("Erro ao gerar QR Code");
        return;
      }

      // Convert SVG to PNG
      const canvas = document.createElement("canvas");
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `qrcode-perfil-anunciante-${meuAnunciante?.id}.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("QR Code baixado com sucesso!");
        }
      };

      img.src = url;
    } catch (error) {
      console.error("Error downloading QR Code:", error);
      toast.error("Erro ao baixar QR Code");
    } finally {
      setIsDownloadingAnuncianteQR(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Page Header */}
      <section className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            QR Codes para Vitrines
          </h1>
          <p className="text-blue-100 text-lg">
            {isLoggedIn
              ? "Imprima os QR Codes de seus anúncios para suas vitrines"
              : "Faça login para gerenciar seus QR Codes"}
          </p>
        </div>
      </section>

      {/* Main Content */}
      {!isLoggedIn ? (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
              <LogIn className="w-12 h-12 text-vitrii-blue mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vitrii-text mb-3">
                Faça Login para Continuar
              </h2>
              <p className="text-vitrii-text-secondary mb-6">
                Você precisa estar logado para visualizar e gerenciar os QR Codes de
                seus anúncios.
              </p>
              <Link
                to="/auth/signin"
                className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
              >
                Fazer Login
              </Link>
            </div>
          </div>
        </section>
      ) : anunciosLoading ? (
        <section className="py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vitrii-blue mx-auto" />
            <p className="text-vitrii-text-secondary mt-4">
              Carregando seus anúncios...
            </p>
          </div>
        </section>
      ) : meusAnuncios.length === 0 ? (
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
              <QrCode className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-vitrii-text mb-3">
                Nenhum Anúncio Encontrado
              </h2>
              <p className="text-vitrii-text-secondary mb-6">
                Você ainda não tem nenhum anúncio publicado. Crie um anúncio para
                gerar seu QR Code para vitrines.
              </p>
              <Link
                to="/anuncio/criar"
                className="inline-flex items-center gap-2 bg-vitrii-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-vitrii-blue-dark transition-colors"
              >
                Criar Anúncio
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Meu QRCode Section */}
            {meuAnunciante && !anuncianteLoading && (
              <div className="mb-16">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-vitrii-text mb-2">
                    Meu QR Code
                  </h2>
                  <p className="text-vitrii-text-secondary">
                    QR Code do seu perfil para compartilhar com clientes
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* QR Code Display */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        ref={anuncianteQRRef}
                        className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-center"
                      >
                        <QRCodeSVG
                          value={anunciantePageUrl || ""}
                          size={256}
                          level="H"
                          includeMargin={true}
                          fgColor="#000000"
                          bgColor="#ffffff"
                        />
                      </div>

                      <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Perfil:</strong> {meuAnunciante.nome}
                        </p>
                        <p className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded max-w-xs">
                          {anunciantePageUrl}
                        </p>
                      </div>
                    </div>

                    {/* Info and Actions */}
                    <div className="flex-1">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-vitrii-text mb-2">
                            Como Usar
                          </h3>
                          <ul className="space-y-3 text-vitrii-text-secondary text-sm">
                            <li className="flex gap-3">
                              <span className="font-bold flex-shrink-0">1.</span>
                              <span>Clique em "Baixar QR Code" para salvar a imagem</span>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-bold flex-shrink-0">2.</span>
                              <span>Imprima e cole em suas vitrines ou materiais</span>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-bold flex-shrink-0">3.</span>
                              <span>Clientes podem escanear para ver seu perfil completo</span>
                            </li>
                            <li className="flex gap-3">
                              <span className="font-bold flex-shrink-0">4.</span>
                              <span>Compartilhe no WhatsApp, Email e outras redes</span>
                            </li>
                          </ul>
                        </div>

                        <div className="pt-4 space-y-3">
                          <button
                            onClick={handleDownloadAnuncianteQRCode}
                            disabled={isDownloadingAnuncianteQR}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 font-semibold"
                          >
                            <Download className="w-5 h-5" />
                            {isDownloadingAnuncianteQR ? "Baixando..." : "Baixar QR Code"}
                          </button>

                          <Link
                            to={`/anunciante/${meuAnunciante.id}`}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                          >
                            <ExternalLink className="w-5 h-5" />
                            Ver Meu Perfil
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Meus Anúncios Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-vitrii-text mb-2">
                Meus Anúncios
              </h2>
              <p className="text-vitrii-text-secondary">
                {meusAnuncios.length} anúncio{meusAnuncios.length !== 1 ? "s" : ""} com
                QR Code disponível{meusAnuncios.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {meusAnuncios.map((anuncio: any) => (
                <div
                  key={anuncio.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Anuncio Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-vitrii-text line-clamp-2 mb-2">
                      {anuncio.titulo}
                    </h3>
                    <p className="text-sm text-vitrii-text-secondary line-clamp-3 mb-3">
                      {anuncio.descricao}
                    </p>
                    {anuncio.preco && (
                      <p className="text-lg font-bold text-vitrii-blue">
                        R$ {parseFloat(anuncio.preco).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* QR Code */}
                  <div
                    id={`qr-code-${anuncio.id}`}
                    className="bg-gray-50 p-4 rounded-lg flex justify-center mb-4 border border-gray-200"
                  >
                    <QRCodeSVG
                      value={`${window.location.origin}/anuncio/${anuncio.id}`}
                      size={200}
                      level="H"
                      includeMargin={true}
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handlePrintQRCode(anuncio.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors font-semibold"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir
                    </button>
                    <button
                      onClick={() => handleDownloadQRCode(anuncio.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-vitrii-blue text-vitrii-blue rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                    <Link
                      to={`/anuncio/${anuncio.id}`}
                      className="w-full flex items-center justify-center px-4 py-2 border-2 border-gray-300 text-vitrii-text rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center"
                    >
                      Ver Anúncio
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">
                💡 Como Usar os QR Codes nas Vitrines
              </h3>
              <ul className="space-y-3 text-blue-800">
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">1.</span>
                  <span>
                    Clique em "Imprimir" para abrir a janela de impressão e imprima os
                    QR Codes em papel de qualidade
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">2.</span>
                  <span>
                    Alternativamente, clique em "Baixar" para salvar a imagem do QR Code
                    e imprimi-la depois
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">3.</span>
                  <span>
                    Cole ou fixe os QR Codes nas vitrines ao lado dos produtos/serviços
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold flex-shrink-0">4.</span>
                  <span>
                    Clientes podem escanear para ver os detalhes completos e solicitar
                    ajuda
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
