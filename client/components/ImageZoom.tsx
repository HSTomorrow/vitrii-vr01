import { X, ZoomIn } from "lucide-react";
import { useState } from "react";

interface ImageZoomProps {
  src?: string;
  alt: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export default function ImageZoom({
  src,
  alt,
  fallbackIcon,
  className = "w-full h-full object-cover",
  containerClassName = "w-full h-64",
}: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!src && !fallbackIcon) {
    return (
      <div className={`${containerClassName} bg-gray-200 flex items-center justify-center rounded-lg`}>
        <div className="text-gray-400">Sem imagem</div>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`${containerClassName} bg-gray-100 flex items-center justify-center rounded-lg`}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <>
      <div
        className={`${containerClassName} relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group`}
        onClick={() => setIsZoomed(true)}
      >
        <img
          src={src}
          alt={alt}
          className={className}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-8 h-8 text-white" />
        </div>
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-screen object-contain rounded-lg"
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
