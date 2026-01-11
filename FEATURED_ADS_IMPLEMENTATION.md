# Featured Ads (Destaque) Implementation

## Overview
This document covers the implementation of the featured ads functionality and fixes for the ad activation issue.

## Changes Made

### 1. **Database Schema Updates** (`prisma/schema.prisma`)
Added two new fields to the `anuncios` table:
```prisma
model anuncios {
  // ... existing fields ...
  visualizacoes       Int                     @default(0)
  destaque            Boolean                 @default(false)    // NEW: Toggle featured status
  isActive            Boolean                 @default(true)     // NEW: Track active/inactive state
  // ... relations ...
}
```

### 2. **Backend Endpoints**

#### New Endpoint: Toggle Featured Status
**Route:** `PATCH /api/anuncios/:id/destaque`
- **Authentication:** Admin-only (requires `extractUserId` + `requireAdmin`)
- **Purpose:** Toggle the `destaque` (featured) status of an ad
- **Response:**
  ```json
  {
    "success": true,
    "message": "Anúncio adicionado ao destaque com sucesso",
    "data": { /* updated anuncio object */ }
  }
  ```

#### Fixed Endpoint: Activate Ad
**Route:** `PATCH /api/anuncios/:id/activate`
- **Fix:** Changed incorrect relation names from singular to plural
  - ❌ `anunciante` → ✅ `anunciantes`
  - Removed non-existent relations: `producto`, `tabelaDePreco`
- **Why:** Ad ID 46 was failing because the endpoint referenced non-existent relations

### 3. **Frontend Updates**

#### AnuncioDetalhe.tsx (Ad Detail Page)
1. **Added ID Display** in the metadata section
   - Shows "ID: #{anuncio.id}" alongside visualization count
   
2. **Fixed Visualization Counter**
   - Changed from hardcoded "0" to actual count: `{anuncio.visualizacoes || 0}`

3. **Added Admin Controls**
   - New button for admins to toggle featured status
   - Button styling changes color based on featured status:
     - Featured (yellow): "Remover do Destaque"
     - Not featured (gray): "Adicionar ao Destaque"
   - Uses Star icon to indicate featured status
   - Includes loading state and error handling via toast notifications

#### Index.tsx (Homepage)
- Already had the logic to display featured ads
- Code was filtering by `destaque` field which now exists in database:
  ```javascript
  const destacados = allAnuncios
    .filter((anuncio) => anuncio.destaque && /* other filters */)
    .slice(0, 20);
  ```

## How to Use

### Running the Database Migration
The migration script has been created at `scripts/add-destaque-field.mjs` to add the new columns to your database.

```bash
# Install dependencies (if not already installed)
npm install

# Run the migration script
node scripts/add-destaque-field.mjs
```

**What it does:**
1. Adds `destaque` column (BOOLEAN, DEFAULT false)
2. Adds `isActive` column (BOOLEAN, DEFAULT true)
3. Verifies the columns were created
4. Shows sample of ads with new fields

### Controlling Featured Ads (Admin Only)

#### Via Admin UI:
1. Admin navigates to an ad detail page (`/anuncio/:id`)
2. Clicks "Adicionar ao Destaque" or "Remover do Destaque" button
3. Status is immediately updated
4. Ad appears/disappears from "Anúncios em Destaque" section on homepage

#### Via API:
```bash
curl -X PATCH http://localhost:3000/api/anuncios/46/destaque \
  -H "x-user-id: <admin-user-id>"
```

### Why Ad ID 46 Was Not Appearing

**Root Cause:** The `activateAnuncio` endpoint had incorrect relation names:
```typescript
// ❌ BEFORE (Broken)
include: {
  anunciante: true,      // Wrong: should be 'anunciantes' (plural)
  producto: true,        // Wrong: doesn't exist
  tabelaDePreco: true,   // Wrong: doesn't exist
}

// ✅ AFTER (Fixed)
include: {
  anunciantes: true,     // Correct relation name
}
```

This caused a 500 error when trying to activate/reactivate ad ID 46, preventing it from appearing in search results.

## Technical Details

### Featured Ads Display Priority
The homepage displays featured ads at the top in the "Anúncios em Destaque" section, with filtering:
1. **Filter by destaque status:** `destaque === true`
2. **Filter by type:** Only "produto" and "servico" types
3. **Exclude donations:** `!isDoacao`
4. **Limit to 20 items**

### Admin Controls Visibility
The featured/destaque button only appears when:
- User is logged in and is an admin (`user.tipoUsuario === "adm"`)
- User can edit the ad (`canEdit === true`)

### State Management
- Uses React Query mutations for:
  - Toggling destaque status
  - Automatic cache invalidation
  - Toast notifications for user feedback
  - Disabled state during mutation

## Database Migration Rollback (if needed)

If you need to revert these changes:

```sql
-- Remove the columns
ALTER TABLE "anuncios" 
DROP COLUMN IF EXISTS "destaque",
DROP COLUMN IF EXISTS "isActive";
```

## Related Files Modified

1. **Backend:**
   - `server/routes/anuncios.ts` - Added `toggleDestaqueAnuncio` function, fixed `activateAnuncio`
   - `server/index.ts` - Added new route `/api/anuncios/:id/destaque`

2. **Frontend:**
   - `client/pages/AnuncioDetalhe.tsx` - Added ID display, fixed visualizations counter, added admin button
   - `prisma/schema.prisma` - Added `destaque` and `isActive` fields to model

3. **Migration:**
   - `scripts/add-destaque-field.mjs` - New script to add columns to database

## Next Steps

1. Run the migration script: `node scripts/add-destaque-field.mjs`
2. Restart the development server
3. Test the featured ads functionality:
   - Login as admin
   - Go to any ad detail page
   - Click "Adicionar ao Destaque"
   - Verify the ad appears on the homepage in "Anúncios em Destaque" section

## Testing Checklist

- [ ] Migration script runs without errors
- [ ] Ad ID 46 can be activated/reactivated
- [ ] Admin can toggle destaque status on ad detail page
- [ ] Featured ads appear on homepage in "Anúncios em Destaque" section
- [ ] Non-featured ads don't appear in featured section
- [ ] Ad ID is displayed in the metadata area
- [ ] Visualization counter shows actual number of views
- [ ] Toast notifications appear for admin actions
