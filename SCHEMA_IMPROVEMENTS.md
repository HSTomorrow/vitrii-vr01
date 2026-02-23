# Schema Improvements & Image Fallback Strategy

## Overview
This document outlines improvements to handle incomplete database records and missing images gracefully across the platform.

## Current Issues

### 1. Missing Avatar Field for Users
**Problem**: Users have no avatar/profile photo field in the database
**Impact**: User avatars in UI can only show initials, never user-uploaded photos
**Solution**: Add optional `avatarUrl` field to `usracessos` table

### 2. Inconsistent Image Fallbacks
**Problem**: Different components handle missing images differently
- Some show placeholder icons
- Some omit the image entirely (layout shift)
- Some don't handle broken URLs (404)
**Impact**: Inconsistent user experience, potential layout shifts
**Solution**: Created `ImageWithFallback` component with unified fallback strategy

### 3. Contact Images Not Displayed
**Problem**: `contatos.imagem` field exists in schema but is never rendered in UI
**Impact**: Users can upload contact images but they're never shown
**Solution**: Either display them using `ContactImageWithFallback` or remove the field if unused

## Recommended Changes

### Schema Changes (Optional but Recommended)

#### Add Avatar Field to Users
```sql
ALTER TABLE "usracessos"
ADD COLUMN IF NOT EXISTS "avatarUrl" VARCHAR(500);
```

This allows users to upload profile photos, improving the user experience across:
- User profile pages
- Messages/chat displays
- Team member listings
- Admin dashboards

### Frontend Implementation

#### Image Fallback Chain Strategy

**For Announcements/Ads:**
1. `anuncio.imagem` (primary ad photo)
2. `anuncio.fotoUrl` (legacy fallback)
3. `anunciante.fotoUrl` (announcer photo)
4. Placeholder icon (Package icon)

**For Announcers:**
1. `anunciante.fotoUrl` (announcer photo)
2. `AnuncianteIconColor` with colored initials
3. Store icon as fallback

**For Users:**
1. `usracessos.avatarUrl` (user avatar)
2. User initials on colored background
3. User icon as fallback

**For Contact Images:**
1. `contatos.imagem` (contact photo)
2. User initials on colored background
3. User icon as fallback

**For Banner Images:**
1. `banners.imagemUrl` (required, validate on save)
2. Fallback text with banner title if missing

**For Wishlist Items:**
1. `listas_desejos_itens.imagem` (wishlist item photo)
2. Associated ad image if item links to ad
3. Placeholder icon

## New Components

### ImageWithFallback.tsx
Main component for consistent image rendering with fallbacks.

**Features:**
- Unified fallback handling
- Broken image URL handling (onError)
- Loading states
- Always maintains aspect ratio (no layout shift)
- Accessibility (alt text, roles)
- Pre-configured variants:
  - `AdImageWithFallback` - for ads with Package icon
  - `UserAvatarWithFallback` - for users with User icon
  - `AnuncianteImageWithFallback` - for announcers with Store icon
  - `ContactImageWithFallback` - for contacts with User icon

**Usage Example:**
```tsx
<AdImageWithFallback
  src={getAnuncioImage(anuncio)}
  alt={getImageAlt(anuncio?.titulo)}
  containerClassName="w-32 h-32 rounded-lg"
  initials={getAnuncianteInitials(anuncio?.anunciante)}
/>
```

## New Utilities

### imageFallback.ts
Helper functions for consistent fallback chains:

- `getAnuncioImage()` - Get best ad image with fallback chain
- `getAnuncianteImage()` - Get announcer image
- `getAnuncianteIconColor()` - Get icon color for colored initials
- `getAnuncianteInitials()` - Get initials for avatar
- `getUserImage()` - Get user avatar
- `getUserInitials()` - Get user initials
- `normalizeImageUrl()` - Validate image URLs
- `isValidImageUrl()` - Check if URL is valid
- `getImageAlt()` - Generate accessible alt text

**Usage Example:**
```tsx
import { getAnuncioImage, getAnuncianteInitials, getImageAlt } from "@/utils/imageFallback";

const imageUrl = getAnuncioImage(anuncio);
const initials = getAnuncianteInitials(anuncio?.anunciante);
const altText = getImageAlt(anuncio?.titulo);
```

## Migration Path

### Phase 1: Component Implementation ✅ DONE
- Created `ImageWithFallback.tsx` component
- Created `imageFallback.ts` utilities
- Created this documentation

### Phase 2: Gradual Refactoring (Recommended)
Priority order for replacing image rendering:

1. **High Priority** (affects many items):
   - `BannerCarousel.tsx` - Hero images, critical for UX
   - `AdCard.tsx` - Card listings used everywhere
   - `AnunciosCarousel.tsx` - Carousel with multiple ads
   - `Browse.tsx` - Main browsing experience

2. **Medium Priority** (affects specific sections):
   - `ListaDesejos.tsx` - Wishlist items
   - `AnuncioDetalhe.tsx` - Ad detail page
   - `SearchAnuncios.tsx` - Search results
   - `CadastroContatos.tsx` - Display contact images when available

3. **Low Priority** (admin/maintenance):
   - `AdminManageAds.tsx` - Admin listing
   - `AdminPagamentos.tsx` - Payment admin
   - `MeusAnuncios.tsx` - User's ads listing

### Phase 3: Schema Enhancement (Optional)
- Add `avatarUrl` field to `usracessos` table
- Update form handlers to accept avatar uploads
- Document in API responses

### Phase 4: Testing
- Test broken image URLs (return 404)
- Test missing images (null/empty)
- Test layout consistency across different screen sizes
- Verify accessibility (alt text, ARIA labels)

## Broken Image Handling

All `ImageWithFallback` instances automatically handle broken images:

```tsx
handleImageError = () => {
  setIsBroken(true); // Switch to fallback UI
  console.warn(`Image failed to load: ${src}`);
}

// Applied to all <img> tags
<img onError={handleImageError} ... />
```

This ensures that:
- 404 errors don't show broken image icons
- Network errors gracefully fallback
- No layout shift occurs when images fail
- Users see a consistent placeholder

## Accessibility Considerations

All implemented with:
- Meaningful `alt` text from database (titles, names)
- Fallback `alt` when primary text not available
- `role="img"` for semantic HTML
- Sufficient color contrast for text on colored backgrounds
- Loading states for better UX during image fetch

## Notes

- The `AnuncianteIconColor` component existing in codebase will be complemented by the new `ImageWithFallback` component
- The `ImageZoom` component is good but narrow in scope; `ImageWithFallback` handles broader use cases
- UI Avatar primitives (from Radix) are available but underused; new components leverage them internally
- Consider adding image optimization (lazy loading, blur-up effect) in future iterations

## Files Created

1. `code/client/components/ImageWithFallback.tsx` - Main component
2. `code/client/utils/imageFallback.ts` - Helper utilities
3. `code/SCHEMA_IMPROVEMENTS.md` - This file (documentation)

## Next Steps

1. Review and test `ImageWithFallback` component
2. Begin gradual refactoring using the priority order above
3. Monitor console warnings for broken image URLs in production
4. Consider adding `avatarUrl` field to users table
5. Update contact management to display contact images
6. Add image optimization (compression, CDN) as performance optimization

