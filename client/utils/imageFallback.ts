/**
 * Utilities for consistent image fallback chains
 * Ensures that missing images always have a predictable fallback order
 */

export interface AnuncioWithFallback {
  imagem?: string | null;
  fotoUrl?: string | null;
  anunciantes?: {
    fotoUrl?: string | null;
    iconColor?: string;
    nome?: string;
  } | null;
  anunciante?: {
    fotoUrl?: string | null;
    iconColor?: string;
    nome?: string;
  } | null;
  titulo?: string;
}

export interface AnuncianteWithFallback {
  fotoUrl?: string | null;
  iconColor?: string;
  nome?: string;
}

export interface UsuarioWithFallback {
  avatarUrl?: string | null;
  nome?: string;
}

/**
 * Get the best available image for an ad
 * Fallback chain: anuncio.imagem -> anuncio.fotoUrl -> anunciante.fotoUrl -> null
 */
export function getAnuncioImage(anuncio: AnuncioWithFallback | null | undefined): string | null {
  if (!anuncio) return null;

  // Direct ad image
  if (anuncio.imagem) return anuncio.imagem;

  // Ad fallback (legacy field)
  if (anuncio.fotoUrl) return anuncio.fotoUrl;

  // Announcer image (via anunciantes or anunciante)
  const anunciante = anuncio.anunciantes || anuncio.anunciante;
  if (anunciante?.fotoUrl) return anunciante.fotoUrl;

  return null;
}

/**
 * Get the announcer image
 * Fallback chain: anunciante.fotoUrl -> null
 */
export function getAnuncianteImage(
  anunciante: AnuncianteWithFallback | null | undefined
): string | null {
  if (!anunciante) return null;
  return anunciante.fotoUrl || null;
}

/**
 * Get the announcer icon color for fallback
 * Used when there's no photo and we need a colored initial/icon
 */
export function getAnuncianteIconColor(
  anunciante: AnuncianteWithFallback | null | undefined
): string {
  if (!anunciante) return "azul";
  return anunciante.iconColor || "azul";
}

/**
 * Get the announcer's initials for avatar fallback
 */
export function getAnuncianteInitials(
  anunciante: AnuncianteWithFallback | null | undefined
): string {
  if (!anunciante?.nome) return "A";
  return anunciante.nome
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get the user image
 * Fallback chain: user.avatarUrl -> null
 */
export function getUserImage(
  user: UsuarioWithFallback | null | undefined
): string | null {
  if (!user) return null;
  return user.avatarUrl || null;
}

/**
 * Get user's initials for avatar fallback
 */
export function getUserInitials(
  user: UsuarioWithFallback | null | undefined
): string {
  if (!user?.nome) return "U";
  return user.nome
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Build a complete image URL or return null
 * Validates that the URL is not empty or whitespace
 */
export function normalizeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Basic validation: should start with http:// or https:// or data:
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  return null;
}

/**
 * Check if an image URL looks valid
 */
export function isValidImageUrl(url?: string | null): boolean {
  const normalized = normalizeImageUrl(url);
  return !!normalized;
}

/**
 * Get alt text with smart fallback
 */
export function getImageAlt(
  title?: string | null,
  defaultAlt: string = "Imagem"
): string {
  if (!title) return defaultAlt;
  return title.substring(0, 100); // Limit alt text length
}
