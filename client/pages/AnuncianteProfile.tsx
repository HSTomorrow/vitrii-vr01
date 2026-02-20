import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Facebook,
  MessageCircle,
  ArrowLeft,
  User,
  AlertCircle,
  Calendar,
  QrCode,
  Download,
} from "lucide-react";

interface Anunciante {
  id: number;
  nome: string;
  descricao?: string;
  fotoUrl?: string;
  tipo: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  dataCriacao?: string;
}

export default function AnuncianteProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [anunciante, setAnunciante] = useState<Anunciante | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [isDownloadingQR, setIsDownloadingQR] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["anunciante", id],
    queryFn: async () => {
      const response = await fetch(`/api/anunciantes/${id}`);
      if (!response.ok) {
        throw new Error("Falha ao carregar perfil do anunciante");
      }
      return response.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.data) {
      setAnunciante(data.data);
    }
  }, [data]);

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case "Profissional":
        return "bg-blue-100 text-blue-700";
      case "Premium":
        return "bg-purple-100 text-purple-700";
      case "Master":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTipoBgColor = (tipo: string) => {
    switch (tipo) {
      case "Profissional":
        return "from-blue-400 to-blue-600";
      case "Premium":
        return "from-purple-400 to-purple-600";
      case "Master":
        return "from-yellow-400 to-yellow-600";
      default:
        return "from-vitrii-blue to-vitrii-blue-dark";
    }
  };

  const currentPageUrl = typeof window !== "undefined"
    ? window.location.href
    : "";

  const handleDownloadQRCode = async () => {
    if (!qrCodeRef.current) return;

    setIsDownloadingQR(true);
    try {
      const svg = qrCodeRef.current.querySelector("svg");
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
          link.download = `qrcode-${anunciante?.id}.png`;
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
      setIsDownloadingQR(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-300 rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3" />
              <div className="h-4 bg-gray-300 rounded w-2/3" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !anunciante) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-vitrii-blue hover:text-vitrii-blue-dark mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-900 mb-1">
                Anunciante não encontrado
              </h2>
              <p className="text-red-700 text-sm">
                Desculpe, não conseguimos encontrar o perfil deste anunciante.
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-vitrii-blue hover:text-vitrii-blue-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </button>

        {/* Header Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Logo/Imagem */}
          <div
            className={`bg-gradient-to-br ${getTipoBgColor(anunciante.tipo)} rounded-lg h-64 md:h-80 flex items-center justify-center overflow-hidden`}
          >
            {anunciante.fotoUrl ? (
              <img
                src={anunciante.fotoUrl}
                alt={anunciante.nome}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-24 h-24 text-white opacity-50" />
            )}
          </div>

          {/* Info Section */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-vitrii-text mb-2">
                    {anunciante.nome}
                  </h1>
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getTipoBadgeColor(anunciante.tipo)}`}
                  >
                    {anunciante.tipo}
                  </span>
                </div>
              </div>

              {anunciante.descricao && (
                <p className="text-vitrii-text-secondary mb-6 leading-relaxed">
                  {anunciante.descricao}
                </p>
              )}

              {/* Location */}
              {(anunciante.cidade || anunciante.endereco) && (
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-vitrii-blue flex-shrink-0 mt-0.5" />
                  <div>
                    {anunciante.endereco && (
                      <div className="text-vitrii-text">{anunciante.endereco}</div>
                    )}
                    {anunciante.cidade && anunciante.estado && (
                      <div className="text-vitrii-text-secondary">
                        {anunciante.cidade}, {anunciante.estado}
                        {anunciante.cep && ` - ${anunciante.cep}`}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => navigate(`/browse?anuncianteId=${anunciante.id}`)}
            className="bg-gradient-to-r from-vitrii-blue to-vitrii-blue-dark hover:shadow-lg text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            🛍️ O que temos na Vitrine para você
          </button>

          <button
            onClick={() => navigate(`/agenda/${anunciante.id}`)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-vitrii-yellow to-vitrii-yellow-dark hover:shadow-lg text-vitrii-text py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            <Calendar className="w-6 h-6" />
            Ver Agenda
          </button>
        </div>

        {/* Share and QR Code Section */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-vitrii-text mb-4">Compartilhe este Perfil</h3>

          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            {/* Share Button */}
            <ShareButton
              title={`Perfil: ${anunciante.nome}`}
              url={currentPageUrl}
              whatsappPhone={anunciante.whatsapp}
              whatsappMessage={`Confira o perfil do(a) ${anunciante.nome} na Vitrii:`}
              variant="button"
              className="flex-1 sm:flex-initial"
            />

            {/* QR Code Button */}
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all transform hover:-translate-y-1 ${
                showQRCode
                  ? "bg-vitrii-blue text-white"
                  : "border-2 border-vitrii-blue text-vitrii-blue hover:bg-blue-50"
              }`}
            >
              <QrCode className="w-5 h-5" />
              {showQRCode ? "Ocultar QR Code" : "Mostrar QR Code"}
            </button>
          </div>

          {/* QR Code Display */}
          {showQRCode && (
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="flex flex-col items-center gap-4">
                <div
                  ref={qrCodeRef}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200"
                >
                  <QRCodeSVG
                    value={currentPageUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Perfil:</strong> {anunciante.nome}
                  </p>
                  <p className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded max-w-xs">
                    {currentPageUrl}
                  </p>
                </div>

                {/* Download QR Code Button */}
                <button
                  onClick={handleDownloadQRCode}
                  disabled={isDownloadingQR}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-vitrii-blue text-white rounded-lg hover:bg-vitrii-blue-dark transition-colors disabled:opacity-50 font-semibold"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingQR ? "Baixando..." : "Baixar QR Code"}
                </button>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center w-full">
                  <p className="text-xs text-blue-800">
                    💡 <strong>Dica:</strong> Use este QR Code em vitrines ou materiais de marketing. Clientes podem escanear para acessar o perfil completo.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="bg-vitrii-gray-light rounded-lg p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-bold text-vitrii-text mb-6">
            Informações de Contato
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {anunciante.email && (
              <a
                href={`mailto:${anunciante.email}`}
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Mail className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Email</div>
                  <div className="text-vitrii-text font-semibold break-all">
                    {anunciante.email}
                  </div>
                </div>
              </a>
            )}

            {anunciante.telefone && (
              <a
                href={`tel:${anunciante.telefone}`}
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Phone className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Telefone</div>
                  <div className="text-vitrii-text font-semibold">
                    {anunciante.telefone}
                  </div>
                </div>
              </a>
            )}

            {anunciante.whatsapp && (
              <a
                href={`https://wa.me/${anunciante.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">WhatsApp</div>
                  <div className="text-vitrii-text font-semibold">
                    {anunciante.whatsapp}
                  </div>
                </div>
              </a>
            )}

            {anunciante.site && (
              <a
                href={anunciante.site}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
              >
                <Globe className="w-6 h-6 text-vitrii-blue flex-shrink-0" />
                <div>
                  <div className="text-xs text-vitrii-text-secondary">Website</div>
                  <div className="text-vitrii-text font-semibold truncate">
                    {anunciante.site}
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Social Media */}
        {(anunciante.instagram || anunciante.facebook) && (
          <div className="bg-white rounded-lg p-6 md:p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-vitrii-text mb-6">
              Redes Sociais
            </h2>

            <div className="flex flex-wrap gap-4">
              {anunciante.instagram && (
                <a
                  href={`https://instagram.com/${anunciante.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  <Instagram className="w-5 h-5" />
                  Instagram
                </a>
              )}

              {anunciante.facebook && (
                <a
                  href={`https://facebook.com/${anunciante.facebook.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                >
                  <Facebook className="w-5 h-5" />
                  Facebook
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
