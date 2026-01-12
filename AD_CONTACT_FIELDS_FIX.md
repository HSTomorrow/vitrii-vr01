# Ad Contact Fields Fix - Telefone and WhatsApp Display

## Problem
Ad #46 (and potentially other ads) were not displaying both the phone and WhatsApp contact options, even though the advertiser had both fields filled in their registration.

## Root Cause
When updating the WhatsApp button functionality to use the `whatsapp` field instead of `telefone`, the backend query was changed to return ONLY `whatsapp`. However, the ad detail page (`AnuncioDetalhe.tsx`) displays BOTH fields:
- **Telefone** (Phone) - displayed as a `tel:` link (line 437)
- **WhatsApp** - displayed as a `https://wa.me/` link (line 506)

The backend was returning `whatsapp` but NOT returning `telefone`, causing the phone contact option to not appear.

## Solution
Updated the backend query in `server/routes/anuncios.ts` to return BOTH fields:

**File:** `server/routes/anuncios.ts`
**Function:** `getAnuncioById`
**Lines:** 166-180

**Before:**
```typescript
anunciantes: {
  select: {
    id: true,
    nome: true,
    endereco: true,
    email: true,
    cnpj: true,
    whatsapp: true,  // Only returned whatsapp
  },
},
```

**After:**
```typescript
anunciantes: {
  select: {
    id: true,
    nome: true,
    endereco: true,
    email: true,
    cnpj: true,
    telefone: true,  // ← Added back
    whatsapp: true,  // Kept this
  },
},
```

## What Now Displays on Ad Detail Page

When viewing an ad, the advertiser info section now shows:

### **Anunciante (Advertiser) Card:**
- **Name**: Advertiser name
- **Address**: Full address
- **Contact Options** (if filled):
  - ✅ **Email** - Opens email client (mailto: link)
  - ✅ **Phone** - Opens phone dialer (tel: link) - if `telefone` is filled
  - ✅ **WhatsApp** - Opens WhatsApp (wa.me link) - if `whatsapp` is filled

### **Sidebar Contact Actions:**
- **Chamar Vendedor** - Call sales team (if available)
- **Enviar Mensagem** - Send message
- **WhatsApp** - Open WhatsApp chat (appears only if `whatsapp` is filled)
- **Compartilhar** - Share ad

## Example

**Advertiser Data:**
```json
{
  "nome": "Daniel Pelegrinelli",
  "endereco": "Rua Brasil, Montenegro",
  "email": "daniel_pelegrinelli@hotmail.com",
  "telefone": "(51) 3333-3333",
  "whatsapp": "+55 11 98272-3837",
  "cnpj": "30171600843"
}
```

**Display on Ad #46:**
- Email link: `daniel_pelegrinelli@hotmail.com` (clickable - opens email)
- Phone link: `(51) 3333-3333` (clickable - opens phone dialer)
- WhatsApp button: Opens `https://wa.me/5511982723837`

## Backend Data Flow

### API Endpoint
- **GET** `/api/anuncios/:id`
- **Returns**: Complete ad with advertiser info including both `telefone` and `whatsapp`

### Database Query
```sql
SELECT 
  anunciantes.id,
  anunciantes.nome,
  anunciantes.endereco,
  anunciantes.email,
  anunciantes.cnpj,
  anunciantes.telefone,      -- Phone field
  anunciantes.whatsapp       -- WhatsApp field
FROM anunciantes
WHERE anunciantes.id = :anuncianteId
```

## Frontend Display Logic

**AnuncioDetalhe.tsx** - Advertiser info section:
```jsx
{/* Email */}
{anuncio.anunciantes?.email && (
  <a href={`mailto:${anuncio.anunciantes.email}`}>
    {/* Email link */}
  </a>
)}

{/* Phone */}
{anuncio.anunciantes?.telefone && (
  <a href={`tel:${anuncio.anunciantes.telefone.replace(/\D/g, "")}`}>
    {/* Phone link */}
  </a>
)}

{/* WhatsApp (Sidebar) */}
{anuncio.anunciantes?.whatsapp && (
  <a href={`https://wa.me/${anuncio.anunciantes.whatsapp.replace(/\D/g, "")}`}>
    {/* WhatsApp button */}
  </a>
)}
```

## Testing

To verify the fix works:

1. **View Ad #46** (or any ad)
2. **Check Advertiser Card** - Should show:
   - Email (if filled)
   - Phone/Telefone (if filled) ← Was missing, now appears
   - Address info
3. **Check Sidebar** - Should show:
   - WhatsApp button (if filled)

## Files Modified

- `server/routes/anuncios.ts` - Added `telefone` field back to anunciantes select

## Status

✅ **FIXED** - Both phone and WhatsApp contact options now display when available
✅ **DEPLOYED** - Changes are live
✅ **VERIFIED** - Backend query includes both fields
