import React, { useState } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import ImageZoomModal from "./ImageZoomModal";

interface UploadedImage {
  id?: string; // temporary id for new uploads
  file?: File;
  url: string;
}

interface MultiImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  currentImages?: UploadedImage[];
  maxImages?: number;
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onImagesChange,
  currentImages = [],
  maxImages = 5,
}) => {
  const [images, setImages] = useState<UploadedImage[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > maxImages) {
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImages: UploadedImage[] = [];

      for (const file of newFiles) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: Arquivo deve ter no máximo 5MB`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erro ao fazer upload de ${file.name}`);
        }

        const data = await response.json();
        uploadedImages.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          url: data.url,
          file,
        });
      }

      const updatedImages = [...images, ...uploadedImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      toast.success(`${uploadedImages.length} imagem(ns) adicionada(s)`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao fazer upload"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          id="multi-file-upload"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isUploading || images.length >= maxImages}
          className="hidden"
        />
        <label
          htmlFor="multi-file-upload"
          className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isUploading || images.length >= maxImages
              ? "bg-gray-50 border-gray-300 cursor-not-allowed"
              : "border-vitrii-blue hover:bg-blue-50"
          }`}
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-vitrii-blue" />
              <span className="font-semibold text-vitrii-text">
                Enviando...
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-vitrii-blue" />
              <span className="font-semibold text-vitrii-text">
                Clique ou arraste imagens ({images.length}/{maxImages})
              </span>
            </>
          )}
        </label>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className="relative group rounded-lg overflow-hidden bg-gray-100"
            >
              {/* Image */}
              <button
                onClick={() => setZoomedImage(image.url)}
                className="w-full h-24 cursor-pointer hover:opacity-75 transition"
              >
                <img
                  src={image.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-1 left-1 bg-vitrii-blue text-white text-xs px-2 py-1 rounded font-semibold">
                  1ª
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                title="Remover imagem"
              >
                <X size={16} />
              </button>

              {/* Image Number */}
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Zoom Modal */}
      <ImageZoomModal
        imageUrl={zoomedImage || ""}
        isOpen={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
      />

      {/* Info */}
      <p className="text-sm text-vitrii-text-secondary">
        A primeira imagem será a principal. Você pode adicionar até {maxImages}{" "}
        imagens no total.
      </p>
    </div>
  );
};

export default MultiImageUpload;
