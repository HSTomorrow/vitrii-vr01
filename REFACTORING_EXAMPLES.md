# ImageWithFallback Refactoring Examples

This document provides before/after examples for refactoring image rendering to use the new `ImageWithFallback` component.

## Example 1: BannerCarousel.tsx

### BEFORE:
```tsx
// code/client/components/BannerCarousel.tsx (lines 72-81)
<img
  src={currentBanner.imagemUrl}
  alt={currentBanner.titulo}
  className="w-full h-full object-cover"
/>
// Problem: No fallback if imagemUrl is missing or broken
```

### AFTER:
```tsx
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { normalizeImageUrl, getImageAlt } from "@/utils/imageFallback";

// In render:
<ImageWithFallback
  src={normalizeImageUrl(currentBanner.imagemUrl)}
  alt={getImageAlt(currentBanner.titulo, "Banner")}
  containerClassName="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200"
  fallbackText={currentBanner.titulo || "Banner sem imagem"}
/>
```

**Benefits:**
- Handles missing/broken images gracefully
- Shows banner title as fallback text
- Maintains consistent aspect ratio
- Better accessibility

---

## Example 2: ListaDesejos.tsx (Wishlist Items)

### BEFORE:
```tsx
// code/client/pages/ListaDesejos.tsx (lines 358-365)
{item.imagem && (
  <div className="flex items-center justify-center">
    <img
      src={item.imagem}
      alt={item.titulo}
      className="h-32 w-32 object-cover rounded-lg"
    />
  </div>
)}
// Problem: No image container when item.imagem is missing -> layout shift
```

### AFTER:
```tsx
import { AdImageWithFallback } from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt } from "@/utils/imageFallback";

// In render:
<AdImageWithFallback
  src={
    item.imagem ||
    (item.anuncioId && item.anuncio ? getAnuncioImage(item.anuncio) : null)
  }
  alt={getImageAlt(item.titulo)}
  containerClassName="h-32 w-32 rounded-lg flex-shrink-0"
  fallbackText={item.titulo}
/>
```

**Benefits:**
- Always renders a consistent-sized container (no layout shift)
- Tries wishlist item image, then associated ad image
- Shows item title as fallback text
- Better visual consistency

---

## Example 3: AdCard.tsx

### BEFORE:
```tsx
// code/client/components/AdCard.tsx (lines 178-186)
<ImageZoom
  src={anuncio.imagem || anuncio.fotoUrl || anunciante?.fotoUrl}
  fallbackIcon={<Package className="w-6 h-6" />}
  alt={anuncio.titulo}
  className="rounded-t-xl w-full"
/>
```

### AFTER:
```tsx
import { AdImageWithFallback } from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt, getAnuncianteInitials } from "@/utils/imageFallback";

// In render (alternative 1 - keep using ImageZoom if zoom is needed):
<ImageZoom
  src={getAnuncioImage(anuncio)}
  fallbackIcon={<Package className="w-6 h-6" />}
  alt={getImageAlt(anuncio.titulo)}
  className="rounded-t-xl w-full"
/>

// Alternative 2 - if zoom not needed, use ImageWithFallback:
<AdImageWithFallback
  src={getAnuncioImage(anuncio)}
  alt={getImageAlt(anuncio.titulo)}
  containerClassName="w-full h-48 rounded-t-lg"
  initials={getAnuncianteInitials(anuncio?.anunciante)}
/>
```

**Benefits:**
- Centralized fallback chain logic
- Automatic handling of broken URLs
- Consistent image dimensions
- Easier to maintain (all logic in utils)

---

## Example 4: Browse.tsx

### BEFORE:
```tsx
// code/client/pages/Browse.tsx (lines 504-508)
{anuncio.imagem || anuncio.anunciantes?.fotoUrl ? (
  <img
    src={anuncio.imagem || anuncio.anunciantes?.fotoUrl}
    alt={anuncio.titulo}
    className="w-full h-40 object-cover"
  />
) : (
  // No fallback UI shown - layout shifts or blank space
)}
```

### AFTER:
```tsx
import { AdImageWithFallback } from "@/components/ImageWithFallback";
import { getAnuncioImage, getImageAlt, getAnuncianteInitials } from "@/utils/imageFallback";

// In render:
<AdImageWithFallback
  src={getAnuncioImage(anuncio)}
  alt={getImageAlt(anuncio.titulo)}
  containerClassName="w-full h-40 rounded-lg"
  initials={getAnuncianteInitials(anuncio?.anunciante)}
/>
```

**Benefits:**
- Always shows consistent-sized image area
- Fallback shows announcer initials
- No layout shifts when images missing
- Single source of truth for fallback chain

---

## Example 5: CadastroContatos.tsx (Display Contact Images)

### BEFORE:
```tsx
// code/client/pages/CadastroContatos.tsx - Contact images not displayed at all
// The form collects contato.imagem but doesn't render it in the list

<div key={contato.id} className="bg-white rounded-lg p-4">
  <h3>{contato.nome}</h3>
  <p>{contato.tipoContato}</p>
  {/* No image displayed */}
</div>
```

### AFTER:
```tsx
import { ContactImageWithFallback } from "@/components/ImageWithFallback";
import { getImageAlt } from "@/utils/imageFallback";

// In render (add to contact card):
<div key={contato.id} className="bg-white rounded-lg p-4 flex gap-4">
  <ContactImageWithFallback
    src={contato.imagem}
    alt={getImageAlt(contato.nome, "Foto do contato")}
    containerClassName="w-16 h-16 flex-shrink-0"
    initials={contato.nome.substring(0, 2).toUpperCase()}
  />
  
  <div className="flex-1">
    <h3 className="font-semibold">{contato.nome}</h3>
    <p className="text-sm text-gray-600">{contato.tipoContato}</p>
  </div>
</div>
```

**Benefits:**
- Contact images now visible (data not wasted)
- Consistent sizing and styling
- Shows initials when no image available
- Professional appearance

---

## Example 6: ImageGallery.tsx (Handle Broken Images)

### BEFORE:
```tsx
// code/client/components/ImageGallery.tsx (selected images rendering)
<img
  src={selectedPhoto.url}
  alt={`Photo ${selectedIndex + 1}`}
  className="w-full h-full object-contain"
/>
// Problem: No fallback if image URL is broken
```

### AFTER:
```tsx
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { getImageAlt } from "@/utils/imageFallback";

// For selected photo:
<ImageWithFallback
  src={selectedPhoto.url}
  alt={getImageAlt(`Foto ${selectedIndex + 1}`)}
  containerClassName="w-full h-96 bg-gray-900"
  fallbackText="Imagem indisponível"
  objectFit="contain"
/>

// For thumbnails - similar pattern:
{fotos.map((foto, idx) => (
  <button
    key={idx}
    onClick={() => setSelectedIndex(idx)}
    className={`relative ${selectedIndex === idx ? 'ring-2 ring-blue-500' : ''}`}
  >
    <ImageWithFallback
      src={foto.url}
      alt={`Miniatura ${idx + 1}`}
      containerClassName="w-20 h-20 rounded"
      fallbackIcon={<Package className="w-4 h-4" />}
    />
  </button>
))}
```

**Benefits:**
- Broken thumbnails show fallback icon instead of broken image
- Main image gracefully degrades
- Gallery remains functional even if some images are broken
- Better user experience during network issues

---

## Migration Checklist

Use this checklist when refactoring each component:

- [ ] Import `ImageWithFallback` or variant component
- [ ] Import utility functions (`getAnuncioImage`, `getImageAlt`, etc.)
- [ ] Replace direct `<img>` tag with component
- [ ] Update `src` to use fallback chain utility
- [ ] Add `alt` text using `getImageAlt()` helper
- [ ] Set appropriate `containerClassName` for sizing
- [ ] Test with missing images (src={null})
- [ ] Test with broken URLs (use inspect to change src to invalid URL)
- [ ] Verify layout consistency across screen sizes
- [ ] Check console for any error warnings
- [ ] Verify accessibility (alt text readable in screen readers)

---

## Testing Broken Images

To test the `onError` handler locally:

```tsx
// Temporarily change a working src to a broken one:
<ImageWithFallback
  src="https://example.com/nonexistent.jpg" // Will trigger onError
  alt="Test broken image"
  containerClassName="w-32 h-32"
/>

// Or simulate with fetch:
// Open DevTools Console and run:
// fetch('https://broken-url.com/image.jpg')
//   .then(r => console.log(r.status))
```

---

## Performance Notes

The new component includes:
- `loading="lazy"` by default for better performance
- Automatic image caching (browser default)
- No unnecessary re-renders on image errors
- Minimal bundle size impact

For even better performance in future:
- Consider blur-up/placeholder effect using CSS filters
- Implement progressive image loading with LQIP (Low Quality Image Placeholder)
- Use image CDN with automatic optimization
- Add srcset for responsive images

---

## Accessibility Notes

Each usage includes:
- Meaningful `alt` text (from database title/name)
- Fallback `alt` for missing text
- Semantic HTML (`role="img"` when needed)
- Color contrast checking (test with WCAG tools)
- Keyboard navigation support (inherited from parent)

---

## Questions?

If refactoring a component and unsure:
1. Check the appropriate pre-configured variant (`AdImageWithFallback`, `UserAvatarWithFallback`, etc.)
2. Use the utilities to get the best image URL
3. Use `getImageAlt()` for alt text
4. Set a fixed `containerClassName` to avoid layout shifts
5. Check this document for similar examples

