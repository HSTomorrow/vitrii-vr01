# Feature: Gerenciamento de Anúncios (Ads Management)

## Overview
Complete system for creating, viewing, and managing product/service ads (anúncios) with integration to stores, products, product groups, and price tables.

## Database Structure
The ads feature uses the following database tables:

### Primary Model: `Anuncio`
- **id**: Auto-incrementing primary key
- **lojaId**: Reference to the store
- **productId**: Reference to the product
- **tabelaDePrecoId**: Reference to the price table (includes size/color variants)
- **titulo**: Ad title (max 255 chars)
- **descricao**: Ad description (optional)
- **fotoUrl**: Photo URL (optional)
- **status**: "em_edicao" | "aguardando_pagamento" | "pago" | "historico"
- **dataValidade**: Expiration date (optional)
- **dataCriacao**: Created at timestamp
- **dataAtualizacao**: Updated at timestamp

### Related Models:
- **Loja**: Store information
- **Producto**: Product details
- **GrupoDeProductos**: Product group/category
- **TabelaDePreco**: Price table with size/color variants
- **Usuario**: User who created the ad
- **ProdutoEmEstoque**: Stock information

## API Routes

### GET `/api/anuncios`
Fetch all ads with optional filters
- **Query Parameters:**
  - `lojaId`: Filter by store
  - `status`: Filter by status
- **Response:** List of ads with related data

### GET `/api/anuncios/:id`
Get detailed information about a specific ad
- **Includes:** Store details, product info, price table, product group

### POST `/api/anuncios`
Create a new ad
- **Body:**
  ```json
  {
    "lojaId": 1,
    "productId": 5,
    "tabelaDePrecoId": 12,
    "titulo": "Camiseta Azul Premium",
    "descricao": "Camiseta de alta qualidade...",
    "fotoUrl": "https://..."
  }
  ```
- **Validation:** Ensures product belongs to store and price table belongs to product

### PUT `/api/anuncios/:id`
Update ad details
- **Body:** Same as POST (partial updates allowed)

### PATCH `/api/anuncios/:id/status`
Update ad status
- **Body:** `{ "status": "pago" | "em_edicao" | ... }`

### DELETE `/api/anuncios/:id`
Delete an ad

### GET `/api/lojas/:lojaId/produtos-para-anuncio`
Get all products and price tables for a specific store
- Used for populating dropdowns in the ad form

## Frontend Pages

### 1. **CriarAnuncio** (`/anuncio/criar`)
Page for creating a new ad
- Uses `AnuncioForm` component
- Accessible from the Sell page

### 2. **AnuncioDetalhe** (`/anuncio/:id`)
Detailed view of a single ad
- Displays all ad information
- Shows store, product, and pricing details
- Includes edit and delete buttons
- Shows engagement metrics (views, messages)

### 3. **EditarAnuncio** (`/anuncio/:id/editar`)
Edit form for existing ad
- Uses `AnuncioForm` component
- Pre-loads ad data for editing
- Prevents changing store after creation

## Components

### AnuncioForm (`client/components/AnuncioForm.tsx`)
Reusable form component for creating and editing ads
- **Features:**
  - Dynamic product selection based on store
  - Price table selection with size/color variants
  - Photo upload support
  - Real-time character count for title
  - Form validation with user-friendly errors
  - Error handling with toast notifications
  - Loading states during submission

- **Props:**
  - `lojaId?: number` - Pre-selected store (for creation)
  - `anuncioId?: number` - Ad ID (for editing)
  - `onSuccess?: () => void` - Callback after successful save

## Updated Pages

### Sell (`client/pages/Sell.tsx`)
Enhanced with:
1. **My Ads Section** - Grid view of user's ads with:
   - Ad thumbnail
   - Price
   - Status badge
   - View/message counts
   - Quick edit button

2. **Updated CTA** - Changed from "Sign Up" to "Publish Ad" button

## Integration Flow

### Creating an Ad:
1. User clicks "Novo Anúncio" button on Sell page
2. Navigates to `/anuncio/criar`
3. Selects store → Products are loaded
4. Selects product → Price tables are loaded
5. Fills in ad details (title, description, photo)
6. Submits form
7. API validates data and creates ad
8. Redirects to Sell page on success

### Viewing Ad Details:
1. User clicks on an ad in their list or visits `/anuncio/:id`
2. Detailed view shows:
   - Large product image
   - Full description
   - Store information
   - Price and variants
   - Contact buttons
   - Action buttons (edit/delete)

### Editing an Ad:
1. User clicks "Edit" button on ad detail or in list
2. Form pre-loads current ad data
3. User can modify any field except store
4. Submits changes
5. API validates and updates
6. Returns to ad detail view

## Data Validation

### Frontend:
- Required fields: Store, Product, Price Table, Title
- Title: 5-255 characters
- Description: 10+ characters (optional)
- Photo URL: Valid URL format (optional)

### Backend (Zod Schema):
```typescript
AnuncioCreateSchema = z.object({
  lojaId: z.number().int().positive(),
  productId: z.number().int().positive(),
  tabelaDePrecoId: z.number().int().positive(),
  titulo: z.string().min(5).max(255),
  descricao: z.string().min(10).optional(),
  fotoUrl: z.string().url().optional(),
})
```

## Status Workflow

- **em_edicao** (In Edit): Draft state, not visible to buyers
- **aguardando_pagamento** (Awaiting Payment): Ad ready, waiting for payment
- **pago** (Paid): Publicly published ad
- **historico** (Historical): Archived ad

## Pricing Model

As per the Vitrii business model:
- **3 Free Ads**: Users get 3 ads for free
- **Premium**: R$ 9.90 per ad per day (via Pix)

This is managed at the application level and payment processing will integrate with Pix system.

## UI/UX Details

### Color Scheme:
- Primary: Walmart Blue (#0071CE)
- Accent: Walmart Yellow (#FFC220)
- Status colors: Yellow (draft), Blue (pending), Green (published), Gray (archived)

### Icons Used:
- Plus: Create new
- Edit2: Edit ad
- Trash2: Delete ad
- Eye: Views count
- MessageSquare: Messages count
- Share2: Share functionality
- Package: Product indicator
- DollarSign: Pricing info
- Calendar: Date information
- AlertCircle: Important info

## Future Enhancements

1. **Image Upload**: Implement actual image upload instead of URL only
2. **Draft Persistence**: Auto-save drafts
3. **Analytics Dashboard**: Detailed view/click metrics
4. **Bulk Operations**: Create multiple ads at once
5. **Templates**: Save ad templates for reuse
6. **QR Code Integration**: Auto-generate QR codes for ads
7. **Payment Integration**: Integrate with Pix payment system
8. **Scheduled Publishing**: Schedule ad publication
9. **A/B Testing**: Test different ad variations
10. **Recommendation System**: Suggest optimal pricing/description

## Files Structure

```
client/
├── pages/
│   ├── CriarAnuncio.tsx      # Create ad page
│   ├── AnuncioDetalhe.tsx    # Ad details page
│   ├── EditarAnuncio.tsx     # Edit ad page
│   └── Sell.tsx              # Updated with ad list
├── components/
│   └── AnuncioForm.tsx       # Reusable form component
└── App.tsx                   # Updated routes

server/
├── routes/
│   └── anuncios.ts           # All ad API endpoints
└── index.ts                  # Registered routes

prisma/
└── schema.prisma             # Anuncio model (already exists)
```

## Testing Checklist

- [ ] Create ad with all fields filled
- [ ] Create ad with only required fields
- [ ] Edit existing ad
- [ ] Delete ad with confirmation
- [ ] Validate form errors
- [ ] Test product filtering by store
- [ ] Test price table filtering by product
- [ ] Test image preview
- [ ] Test status changes
- [ ] Test loading states
- [ ] Test error messages
- [ ] Test responsive design

## Notes

- All routes are registered in `server/index.ts`
- Prisma client is used from `server/lib/prisma.ts`
- React Query is used for data fetching and caching
- Sonner is used for toast notifications
- Tailwind CSS is used for styling following Walmart theme
