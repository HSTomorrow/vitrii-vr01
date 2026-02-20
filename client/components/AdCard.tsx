import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Heart, Package, Calendar, MapPin, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import ImageZoom from "./ImageZoom";
import QRCodeModal from "./QRCodeModal";

interface AdCardProps {
  anuncio: any;
  isFavorited?: boolean;
  onFavoritoToggle?: (anuncioId: number, isFavorited: boolean) => void;
  variant?: "featured" | "donation";
  anunciante?: any;
}

export default function AdCard({
  anuncio,
  isFavorited = false,
  onFavoritoToggle,
  variant = "featured",
  anunciante,
}: AdCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  const toggleFavoritoMutation = useMutation({
    mutationFn: async (anuncioId: number) => {
      if (!user) {
        toast.error("Faça login para adicionar favoritos");
        navigate("/auth/signin");
        throw new Error("Not logged in");
      }

      const response = await fetch("/api/favoritos/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: user.id,
          anuncioId,
        }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar favorito");
      return response.json();
    },
    onSuccess: (data) => {
      onFavoritoToggle?.(anuncio.id, data.isFavorited);
      if (data.isFavorited) {
        toast.success("Adicionado aos favoritos!");
      } else {
        toast.success("Removido dos favoritos");
      }
    },
  });

  const extractMunicipality = (endereco: string): string => {
    if (!endereco) return "Localização desconhecida";
    const parts = endereco.split(",");
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim();
    }
    return endereco.split(" ").slice(-2, -1)[0] || "Localização";
  };

  const isDonation = variant === "donation";
  const backgroundColor = isDonation
    ? "from-green-400 to-green-600"
    : "from-vitrii-blue to-vitrii-blue-dark";
  const buttonClass = isDonation
    ? "bg-green-600 hover:bg-green-700"
    : "bg-vitrii-blue hover:bg-vitrii-blue-dark";
  const badgeColor = isDonation ? "bg-green-500" : "bg-vitrii-blue";

  return (
    <div className="vitrii-card overflow-hidden hover:scale-105 transition-transform duration-200 cursor-pointer relative">
      {isDonation && (
        <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
          GRÁTIS
        </div>
      )}

      {/* Action Buttons Container */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {/* Favorito Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoritoMutation.mutate(anuncio.id);
          }}
          disabled={toggleFavoritoMutation.isPending}
          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title={
            isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>

        {/* QR Code Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQRCodeModal(true);
          }}
          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          title="Ver QR Code do anúncio"
        >
          <QrCode className="w-5 h-5 text-vitrii-blue" />
        </button>
      </div>

      {/* Store Logo Badge */}
      <div className="absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full bg-white border-2 border-vitrii-blue overflow-hidden flex items-center justify-center shadow-md">
        {anunciante?.fotoUrl || anuncio.anunciante?.fotoUrl ? (
          <img
            src={anunciante?.fotoUrl || anuncio.anunciante?.fotoUrl}
            alt={anunciante?.nome || anuncio.anunciante?.nome}
            className="w-full h-full object-cover"
            title={anunciante?.nome || anuncio.anunciante?.nome}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-vitrii-blue text-white text-xs font-bold">
            V
          </div>
        )}
      </div>

      {/* Image with fallback chain: anuncio > anunciante > icon */}
      <div className={`w-full bg-gradient-to-br ${backgroundColor}`}>
        <ImageZoom
          src={
            anuncio.imagem ||
            anuncio.fotoUrl ||
            anunciante?.fotoUrl ||
            anuncio.anunciante?.fotoUrl
          }
          alt={anuncio.titulo}
          fallbackIcon={<Package className="w-12 h-12 text-white opacity-50" />}
          containerClassName="w-full h-48"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-full">
        <div>
          <h4 className="font-semibold text-vitrii-text mb-2 line-clamp-2">
            {anuncio.titulo}
          </h4>
          <p className="text-sm text-vitrii-text-secondary mb-3 line-clamp-2">
            {anuncio.descricao ||
              (isDonation
                ? "Item disponível para doação"
                : "Produto em destaque")}
          </p>

          {/* Municipality */}
          <div className="flex items-center gap-1 mb-3 text-xs text-vitrii-text-secondary">
            <MapPin className="w-3 h-3" />
            <span className="truncate">
              {extractMunicipality(anuncio.anunciante?.endereco || "")}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 mt-auto">
          <span
            className={`text-2xl font-bold ${isDonation ? "text-green-600" : "text-vitrii-blue"}`}
          >
            {isDonation
              ? "Grátis"
              : `R$ ${anuncio.tabelaDePreco?.preco ? Number(anuncio.tabelaDePreco.preco).toFixed(2) : "0.00"}`}
          </span>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-vitrii-yellow text-vitrii-yellow" />
            <span className="text-sm font-semibold">5.0</span>
          </div>
        </div>

        {(anunciante?.temAgenda || anuncio.anunciante?.temAgenda) ? (
          <div className="flex gap-2">
            <Link
              to={`/agenda/anunciante/${anuncio.anuncianteId}`}
              className={`flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </Link>
            <button
              onClick={() => navigate(`/anuncio/${anuncio.id}`)}
              className={`flex-1 ${buttonClass} text-white py-2 rounded-lg font-semibold transition-colors`}
            >
              Detalhes
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate(`/anuncio/${anuncio.id}`)}
            className={`w-full ${buttonClass} text-white py-2 rounded-lg font-semibold transition-colors`}
          >
            {isDonation ? "Ver Detalhes" : "Ver Detalhes"}
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        open={showQRCodeModal}
        onOpenChange={setShowQRCodeModal}
        anuncioId={anuncio.id}
        anuncioTitulo={anuncio.titulo}
        anuncianteId={anuncio.anuncianteId}
        anunciantheName={anunciante?.nome || anuncio.anunciante?.nome || "Anunciante"}
      />
    </div>
  );
}
