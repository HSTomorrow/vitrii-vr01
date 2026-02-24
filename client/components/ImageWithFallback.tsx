import { useState, useCallback } from "react";
import { ImageOff, Package, User, Store } from "lucide-react";

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackIcon?: React.ReactNode;
  fallbackText?: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "scale-down";
  onClickZoom?: () => void;
  loading?: "lazy" | "eager";
  fallbackBgColor?: string;
  showFallbackInitials?: boolean;
  initials?: string;
}

/**
 * Unified image component with consistent fallback behavior
 * - Handles missing images
 * - Handles broken image URLs (404, network errors)
 * - Always maintains consistent aspect ratio (no layout shift)
 * - Provides accessible alt text and semantic HTML
 * 
 * Usage:
 * <ImageWithFallback
 *   src={anuncio.imagem}
 *   alt={anuncio.titulo}
 *   fallbackIcon={<Package className="w-8 h-8" />}
 *   containerClassName="w-32 h-32 rounded-lg"
 * />
 */
export default function ImageWithFallback({
  src,
  alt,
  fallbackIcon = <Package className="w-8 h-8" />,
  fallbackText = "Sem imagem",
  className = "w-full h-full object-cover",
  containerClassName = "w-32 h-32 bg-gray-100 rounded-lg",
  width,
  height,
  objectFit = "cover",
  onClickZoom,
  loading = "lazy",
  fallbackBgColor = "bg-gray-100",
  showFallbackInitials = false,
  initials = "?",
}: ImageWithFallbackProps) {
  const [isBroken, setIsBroken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const hasImage = src && !isBroken;

  const handleImageError = useCallback(() => {
    console.warn(`[ImageWithFallback] ❌ Image failed to load:`, {
      src,
      alt,
      hasImage,
    });
    setIsBroken(true);
    setIsLoading(false);
  }, [src, alt]);

  const handleImageLoad = useCallback(() => {
    console.log(`[ImageWithFallback] ✅ Image loaded successfully:`, {
      src,
      alt,
    });
    setIsLoading(false);
  }, [src, alt]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${containerClassName} ${fallbackBgColor}`}
      title={alt}
    >
      {hasImage ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={src}
            alt={alt}
            className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            style={{
              objectFit: objectFit,
              ...(width && { width: `${width}px` }),
              ...(height && { height: `${height}px` }),
            }}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading={loading}
            onClick={onClickZoom}
            role="img"
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-gray-500">
          {showFallbackInitials && initials ? (
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full text-white font-bold text-sm">
              {initials.substring(0, 2).toUpperCase()}
            </div>
          ) : (
            <>{fallbackIcon}</>
          )}
          {fallbackText && (
            <span className="text-xs font-medium text-center px-2 line-clamp-2">
              {fallbackText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-configured variants for common use cases
 */

export function AdImageWithFallback(
  props: Omit<ImageWithFallbackProps, "fallbackIcon">
) {
  return <ImageWithFallback {...props} fallbackIcon={<Package className="w-8 h-8" />} />;
}

export function UserAvatarWithFallback(
  props: Omit<ImageWithFallbackProps, "fallbackIcon" | "showFallbackInitials">
) {
  return (
    <ImageWithFallback
      {...props}
      fallbackIcon={<User className="w-6 h-6" />}
      showFallbackInitials={true}
      initials={props.initials || "U"}
      fallbackBgColor="bg-blue-100"
    />
  );
}

export function AnuncianteImageWithFallback(
  props: Omit<ImageWithFallbackProps, "fallbackIcon" | "showFallbackInitials">
) {
  return (
    <ImageWithFallback
      {...props}
      fallbackIcon={<Store className="w-8 h-8" />}
      showFallbackInitials={true}
      initials={props.initials || "A"}
      fallbackBgColor="bg-amber-100"
    />
  );
}

export function ContactImageWithFallback(
  props: Omit<ImageWithFallbackProps, "fallbackIcon" | "showFallbackInitials">
) {
  return (
    <ImageWithFallback
      {...props}
      fallbackIcon={<User className="w-6 h-6" />}
      showFallbackInitials={true}
      initials={props.initials || "C"}
      fallbackBgColor="bg-purple-100"
    />
  );
}
