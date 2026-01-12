# WhatsApp Button Update on Ad Detail Page

## Problem
The WhatsApp button on the ad detail page (`AnuncioDetalhe.tsx`) was previously using the `telefone` (phone) field from the advertiser's registration to generate the WhatsApp contact link. This needed to be changed to use the dedicated `whatsapp` field instead.

## Solution Implemented

### 1. Backend Update
**File:** `server/routes/anuncios.ts`
**Function:** `getAnuncioById`

Changed the advertiser fields selection in the ad detail endpoint:

**Before:**
```typescript
anunciantes: {
  select: {
    id: true,
    nome: true,
    endereco: true,
    email: true,
    cnpj: true,
    telefone: true,  // ← OLD
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
    whatsapp: true,  // ← NEW
  },
},
```

**Result:** The API endpoint `/api/anuncios/:id` now returns the advertiser's WhatsApp field instead of the phone field.

### 2. Frontend Update
**File:** `client/pages/AnuncioDetalhe.tsx`
**Lines:** 506-516

Changed the WhatsApp button conditional and link generation:

**Before:**
```jsx
{anuncio.anunciantes?.telefone && (
  <a
    href={`https://wa.me/${anuncio.anunciantes.telefone.replace(/\D/g, "")}`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    <MessageCircle className="w-4 h-4" />
    WhatsApp
  </a>
)}
```

**After:**
```jsx
{anuncio.anunciantes?.whatsapp && (
  <a
    href={`https://wa.me/${anuncio.anunciantes.whatsapp.replace(/\D/g, "")}`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    <MessageCircle className="w-4 h-4" />
    WhatsApp
  </a>
)}
```

**Result:** The WhatsApp button now:
- Only appears if the advertiser has a WhatsApp number in their registration
- Uses the WhatsApp field to generate the wa.me contact link
- Still strips non-digits from the number for the URL

## How It Works

1. **User views an ad** in the detail page
2. **System checks** if the advertiser has a `whatsapp` field with a value
3. **If yes**, the WhatsApp button appears with a link formatted as: `https://wa.me/{WHATSAPP_NUMBER_DIGITS_ONLY}`
4. **User clicks** the button to open WhatsApp chat with the advertiser

## Example

**Advertiser Registration:**
- Nome: Daniel Pelegrinelli
- Telefone: (51) 3333-3333
- WhatsApp: +5511982723837

**Result on Ad Detail Page:**
- WhatsApp button appears with link: `https://wa.me/5511982723837`
- Clicking opens WhatsApp chat with that number

## Backend Data Flow

1. Client requests: `GET /api/anuncios/22`
2. Server queries: `SELECT ... anunciantes.whatsapp FROM anunciantes`
3. Server returns: `{ anunciante: { whatsapp: "+5511982723837", ... } }`
4. Frontend renders: WhatsApp button with wa.me link

## Notes

- The `telefone` field continues to exist in the database and can be used for display/records
- The `whatsapp` field is now the primary contact method for WhatsApp integration
- The phone number normalization (removing non-digits) is still applied when building the wa.me URL
- If an advertiser has no WhatsApp number, the button won't appear on the ad detail page

## Verification

✅ Backend query logs show: `SELECT ... "whatsapp" FROM anunciantes`
✅ Frontend component updated to use `whatsapp` field
✅ WhatsApp button functionality preserved with new field
✅ All changes deployed and live
