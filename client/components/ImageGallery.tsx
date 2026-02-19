import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "./ui/button";
import ImageZoomModal from "./ImageZoomModal";
import { useAuth } from "@/contexts/AuthContext";

export interface GalleryPhoto {
  id: number;
  url: string;
  ordem: number;
}

interface ImageGalleryProps {
  photos: GalleryPhoto[];
  anuncioId: number;
  canDelete?: boolean;
  onPhotoDeleted?: (fotoId: number) => void;
  onReorder?: (fotosOrder: Array<{ id: number; ordem: number }>) => void;
  anuncianteFotoUrl?: string | null;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  photos,
  anuncioId,
  canDelete = false,
  onPhotoDeleted,
  onReorder,
  anuncianteFotoUrl,
}) => {
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  // Show anunciante photo as fallback if no photos exist
  if (!photos || photos.length === 0) {
    if (!anuncianteFotoUrl) {
      return null;
    }
    // Show only anunciante photo as fallback
    return (
      <div className="w-full space-y-4">
        {/* Main Image */}
        <div
          className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer aspect-square"
          onClick={() => setIsZoomed(true)}
        >
          <img
            src={anuncianteFotoUrl}
            alt="Foto do Anunciante"
            className="w-full h-full object-cover"
          />
          {/* Fallback Badge */}
          <div className="absolute top-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Foto do Anunciante
          </div>
        </div>

        {/* Zoom Modal */}
        <ImageZoomModal
          imageUrl={anuncianteFotoUrl}
          isOpen={isZoomed}
          onClose={() => setIsZoomed(false)}
        />

        {/* Info */}
        <div className="text-sm text-vitrii-text-secondary text-center">
          Nenhuma foto específica foi adicionada. Exibindo a foto do anunciante.
        </div>
      </div>
    );
  }

  const sortedPhotos = [...photos].sort((a, b) => a.ordem - b.ordem);
  const selectedPhoto = sortedPhotos[selectedIndex];

  const handleDeletePhoto = async (fotoId: number) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      "Tem certeza que deseja deletar esta foto?",
    );
    if (!confirmed) return;

    setDeletingId(fotoId);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (user?.id) {
        headers["x-user-id"] = user.id.toString();
      }

      const response = await fetch(
        `/api/anuncios/${anuncioId}/fotos/${fotoId}`,
        {
          method: "DELETE",
          headers,
        },
      );

      if (response.ok) {
        onPhotoDeleted?.(fotoId);
        // Reset selection if deleted photo was selected
        if (selectedPhoto.id === fotoId) {
          setSelectedIndex(0);
        }
      } else {
        alert("Erro ao deletar foto");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Erro ao deletar foto");
    } finally {
      setDeletingId(null);
    }
  };

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(
      `gallery-thumbnails-${anuncioId}`,
    );
    if (!container) return;

    const scrollAmount = 120;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Main Image */}
      <div
        className="relative w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer aspect-square"
        onClick={() => setIsZoomed(true)}
      >
        {selectedPhoto ? (
          <img
            src={selectedPhoto.url}
            alt={`Foto ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Sem imagem
          </div>
        )}

        {/* Primary Badge */}
        {selectedIndex === 0 && (
          <div className="absolute top-2 left-2 bg-vitrii-blue text-white px-3 py-1 rounded-full text-xs font-semibold">
            Principal
          </div>
        )}

        {/* Delete Button on Main Image */}
        {canDelete && selectedPhoto && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePhoto(selectedPhoto.id);
            }}
            disabled={deletingId === selectedPhoto.id}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white p-2 rounded-full transition"
            title="Deletar foto"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Zoom Modal */}
      <ImageZoomModal
        imageUrl={selectedPhoto?.url || ""}
        isOpen={isZoomed}
        onClose={() => setIsZoomed(false)}
      />

      {/* Thumbnail Carousel */}
      {sortedPhotos.length > 1 && (
        <div className="relative flex items-center gap-2">
          {/* Left Scroll Button */}
          <button
            onClick={() => scroll("left")}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Scroll esquerda"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>

          {/* Thumbnails Container */}
          <div
            id={`gallery-thumbnails-${anuncioId}`}
            className="flex gap-2 overflow-x-auto scroll-smooth flex-1"
            style={{
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {sortedPhotos.map((photo, index) => (
              <div key={photo.id} className="relative flex-shrink-0">
                <button
                  onClick={() => setSelectedIndex(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden transition border-2 ${
                    selectedIndex === index
                      ? "border-vitrii-blue shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  title={index === 0 ? "Imagem principal" : `Foto ${index + 1}`}
                >
                  <img
                    src={photo.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>

                {/* Primary Badge on Thumbnail */}
                {index === 0 && (
                  <div className="absolute top-0 right-0 bg-vitrii-blue text-white text-xs px-1 rounded-bl">
                    1ª
                  </div>
                )}

                {/* Delete Button on Thumbnail */}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePhoto(photo.id);
                    }}
                    disabled={deletingId === photo.id}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white p-1 rounded-full transition"
                    title="Deletar foto"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scroll("right")}
            className="p-1 hover:bg-gray-200 rounded transition"
            title="Scroll direita"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* Photo Counter */}
      <div className="text-sm text-gray-600 text-center">
        {sortedPhotos.length > 0 && (
          <span>
            {sortedPhotos.length} foto{sortedPhotos.length !== 1 ? "s" : ""}
            {sortedPhotos.length < 5 && <span> (máximo 5)</span>}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
