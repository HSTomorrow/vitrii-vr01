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
  anuncianteFotoUrl?: string | null;
}

const MAX_UPLOAD_TIME_MS = 10000; // 10 seconds
const MAX_FILE_SIZE_MB = 5;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  onImagesChange,
  currentImages = [],
  maxImages = 5,
  anuncianteFotoUrl,
}) => {
  const [images, setImages] = useState<UploadedImage[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = images.length + newFiles.length;

    if (totalImages > maxImages) {
      toast.error(`❌ Máximo de imagens atingido`, {
        description: `Máximo permitido: ${maxImages} imagens. Você tem ${images.length}.`,
      });
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImages: UploadedImage[] = [];

      for (const file of newFiles) {
        // Validate file type
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedMimes.includes(file.type)) {
          toast.error(`❌ ${file.name}: Formato inválido`, {
            description: `Tipo: ${file.type || "desconhecido"} | Use: JPEG, PNG, GIF, WEBP`,
          });
          continue;
        }

        // Validate file extension
        const extension = file.name.split(".").pop()?.toLowerCase();
        const validExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
        if (!extension || !validExtensions.includes(extension)) {
          toast.error(`❌ ${file.name}: Extensão inválida`, {
            description: `Extensão: .${extension || "sem extensão"} | Use: ${validExtensions.join(", ")}`,
          });
          continue;
        }

        // Validate file is not empty
        if (file.size === 0) {
          toast.error(`❌ ${file.name}: Arquivo vazio`, {
            description: "O arquivo está vazio. Selecione outro arquivo.",
          });
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          const fileSize = formatFileSize(file.size);
          toast.error(`❌ ${file.name}: Arquivo muito grande`, {
            description: `Tamanho: ${fileSize} | Máximo: ${MAX_FILE_SIZE_MB}MB`,
          });
          continue;
        }

        const fileSize = formatFileSize(file.size);
        const uploadStartTime = Date.now();

        const formData = new FormData();
        formData.append("file", file);

        // Create AbortController for timeout
        const abortController = new AbortController();
        const uploadTimeoutId = setTimeout(() => {
          abortController.abort();
        }, MAX_UPLOAD_TIME_MS);

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            signal: abortController.signal,
          });

          clearTimeout(uploadTimeoutId);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.details || errorData.error || `Erro ao fazer upload de ${file.name}`;

            if (response.status === 413) {
              throw new Error("Arquivo muito grande para o servidor");
            } else if (response.status === 400) {
              throw new Error(errorMsg);
            } else {
              throw new Error(errorMsg || `Erro HTTP ${response.status}`);
            }
          }

          const data = await response.json();
          if (!data.url) {
            throw new Error("URL do arquivo não retornada pelo servidor");
          }

          const uploadEndTime = Date.now();
          const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;

          uploadedImages.push({
            id: `temp-${Date.now()}-${Math.random()}`,
            url: data.url,
            file,
          });

          toast.success(`✓ ${file.name} enviado com sucesso`, {
            description: `Tamanho: ${fileSize} | Tempo: ${uploadDuration.toFixed(1)}s`,
            duration: 3000,
          });
        } catch (uploadError) {
          clearTimeout(uploadTimeoutId);

          if (uploadError instanceof Error) {
            if (uploadError.name === "AbortError") {
              toast.error(`❌ Upload cancelado - tempo excedido`, {
                description: `${file.name} demorou mais de ${MAX_UPLOAD_TIME_MS / 1000}s. Tente uma conexão mais rápida.`,
                duration: 5000,
              });
            } else if (uploadError.message.includes("muito grande")) {
              toast.error(`❌ ${file.name}: Arquivo muito grande`, {
                description: "O arquivo excede o limite do servidor (5MB). Comprima a imagem.",
                duration: 5000,
              });
            } else {
              toast.error(`❌ Erro ao fazer upload de ${file.name}`, {
                description: uploadError.message,
                duration: 4000,
              });
            }
          } else {
            toast.error(`❌ Erro ao fazer upload de ${file.name}`, {
              description: "Erro desconhecido durante o upload",
              duration: 4000,
            });
          }
        }
      }

      if (uploadedImages.length > 0) {
        const updatedImages = [...images, ...uploadedImages];
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }
    } catch (error) {
      toast.error("❌ Erro ao processar upload", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
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
          className={`flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
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
              <span className="text-xs text-vitrii-text-secondary">
                Máximo 10 segundos por arquivo
              </span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-vitrii-blue" />
              <div className="text-center">
                <span className="font-semibold text-vitrii-text block">
                  Clique ou arraste imagens
                </span>
                <span className="text-xs text-vitrii-text-secondary">
                  ({images.length}/{maxImages}) | Máx {MAX_FILE_SIZE_MB}MB por arquivo
                </span>
              </div>
            </>
          )}
        </label>
      </div>

      {/* Images Grid */}
      {images.length > 0 ? (
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
      ) : anuncianteFotoUrl ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 h-24">
          <img
            src={anuncianteFotoUrl}
            alt="Foto do Anunciante"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <p className="text-white text-xs font-semibold text-center px-2">
              Foto do Anunciante (fallback)
            </p>
          </div>
        </div>
      ) : null}

      {/* Image Zoom Modal */}
      <ImageZoomModal
        imageUrl={zoomedImage || ""}
        isOpen={!!zoomedImage}
        onClose={() => setZoomedImage(null)}
      />

      {/* Info */}
      <div className="text-sm text-vitrii-text-secondary space-y-1">
        <p>
          {images.length === 0 && anuncianteFotoUrl
            ? "Nenhuma foto foi adicionada. A foto do anunciante será usada como padrão. Você pode adicionar até 5 imagens."
            : `A primeira imagem será a principal. Você pode adicionar até ${maxImages} imagens no total.`}
        </p>
        <p className="text-xs">
          ⏱️ Cada upload deve ser concluído em até 10 segundos. Se demorar mais, o upload será cancelado automaticamente.
        </p>
      </div>
    </div>
  );
};

export default MultiImageUpload;
