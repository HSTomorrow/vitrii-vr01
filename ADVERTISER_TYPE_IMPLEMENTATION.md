# Advertiser Type (Tipo) Implementation

## Overview
This document covers the implementation of the **Tipo** (Type) field for advertisers (anunciantes) with two options: **Comum** (Common) and **Profissional** (Professional). The field defaults to "Comum" but can be changed during signup or edited by admins.

## Changes Made

### 1. Database Schema Updates (`prisma/schema.prisma`)
Added a new field to the `anunciantes` model:
```prisma
model anunciantes {
  // ... existing fields ...
  tipo                 String                 @default("Comum") @db.VarChar(50)
  // ... relations ...
}
```

### 2. Backend API Updates (`server/routes/anunciantes.ts`)

#### Create Schema Validation
Updated `AnuncianteCreateSchema` to include the tipo field:
```typescript
const AnuncianteCreateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  tipo: z.enum(["Comum", "Profissional"]).default("Comum"),
  // ... other fields ...
});
```

#### Update Schema Validation
Added tipo to `AnuncianteUpdateSchema` to allow admins to edit it:
```typescript
const AnuncianteUpdateSchema = z.object({
  tipo: z.enum(["Comum", "Profissional"]).optional(),
  // ... other fields ...
});
```

#### Create Endpoint
- **Route:** `POST /api/anunciantes`
- Now includes `tipo` field in the request body
- Default value is "Comum" if not specified

#### Update Endpoint
- **Route:** `PUT /api/anunciantes/:id`
- Allows updating the `tipo` field (admin-only via permission checks)

### 3. Frontend Updates

#### CadastroLojas.tsx (Advertiser Registration Form)
1. **Updated Interface:** Added `tipo` field to Anunciante interface
2. **Form State:** Added `tipo` field with default value "Comum"
3. **Form Input:** Added dropdown selector for tipo with two options:
   - Comum
   - Profissional
4. **Form Submission:** tipo is now included in create/update requests
5. **Edit Functionality:** When editing an advertiser, tipo is properly loaded
6. **Table Display:** Added tipo column to the anunciantes list table with badge styling:
   - Comum: Gray badge
   - Profissional: Blue badge

### 4. Migration Script (`scripts/add-tipo-anunciante-field.mjs`)
A migration script was created to safely add the tipo column to existing databases:
- Adds the column with DEFAULT 'Comum'
- Verifies column creation
- Shows statistics about the migration
- All existing advertisers default to "Comum"

## How to Use

### Running the Database Migration
```bash
node scripts/add-tipo-anunciante-field.mjs
```

**What the script does:**
1. Adds `tipo` column (VARCHAR(50), DEFAULT 'Comum')
2. Verifies the column was created
3. Shows sample of advertisers with the new field
4. Displays statistics by advertiser type

### Creating a New Advertiser
1. Navigate to "Cadastro de Anunciantes" page
2. Click "Nova Anunciante"
3. Fill in the form fields
4. **Select Tipo:** Choose either "Comum" or "Profissional"
5. Click "Salvar"

### Editing an Advertiser Type
**By User:**
1. Go to "Cadastro de Anunciantes"
2. Click the edit icon for any advertiser
3. Change the "Tipo de Anunciante" dropdown
4. Click "Salvar"

**By Admin:**
1. Same process as above
2. Admins can edit any advertiser's tipo field

## API Usage

### Create Advertiser with Tipo
```bash
curl -X POST http://localhost:3000/api/anunciantes \
  -H "Content-Type: application/json" \
  -H "X-User-Id: <user-id>" \
  -d '{
    "nome": "Minha Loja",
    "tipo": "Profissional",
    "cidade": "Belo Horizonte",
    "estado": "MG",
    "email": "contato@loja.com"
  }'
```

### Update Advertiser Tipo
```bash
curl -X PUT http://localhost:3000/api/anunciantes/1 \
  -H "Content-Type: application/json" \
  -H "X-User-Id: <user-id>" \
  -d '{
    "tipo": "Profissional"
  }'
```

## Field Details

### Tipo Options
| Value | Label | Display |
|-------|-------|---------|
| Comum | Comum (Common) | Gray badge |
| Profissional | Profissional (Professional) | Blue badge |

### Default Behavior
- **On Creation:** If `tipo` is not specified, defaults to "Comum"
- **On Update:** Can be changed by the advertiser or admin
- **Database:** All existing records before migration will have tipo = "Comum"

## Frontend Components Affected

### Pages
- **client/pages/CadastroLojas.tsx:**
  - Added tipo field to form
  - Added tipo column to advertiser listing table
  - Added tipo selection in edit mode

### Form Fields
- **Input Type:** Dropdown/Select
- **Options:** "Comum", "Profissional"
- **Required:** Yes (on form submission)
- **Default:** "Comum"

### Table Display
- **Column Position:** Second column (after Nome, before CNPJ/CPF)
- **Styling:** Badge with different colors for each type
- **Sortable:** No (but could be added)

## Technical Details

### Validation
- Both create and update endpoints validate tipo using Zod
- Only valid values are accepted: "Comum" or "Profissional"
- Invalid values return 400 Bad Request

### Permissions
- Users can edit their own advertiser tipo
- Admins can edit any advertiser tipo
- Non-owners of an advertiser cannot edit it (403 Forbidden)

### Data Types
- **Database:** VARCHAR(50)
- **Default:** 'Comum'
- **Nullable:** No
- **Validation:** Enum (only two allowed values)

## Related Files Modified

1. **Backend:**
   - `server/routes/anunciantes.ts` - Updated schemas and endpoints
   - `prisma/schema.prisma` - Added tipo field to model

2. **Frontend:**
   - `client/pages/CadastroLojas.tsx` - Added UI for tipo field

3. **Migration:**
   - `scripts/add-tipo-anunciante-field.mjs` - Database migration script

## Testing Checklist

- [ ] Run migration script: `node scripts/add-tipo-anunciante-field.mjs`
- [ ] Restart dev server
- [ ] Create new advertiser with "Comum" type
- [ ] Create new advertiser with "Profissional" type
- [ ] Edit existing advertiser's tipo field
- [ ] Verify tipo is displayed in advertiser list
- [ ] Verify badge colors match tipo value
- [ ] Test API endpoints with curl or Postman
- [ ] Verify admin can edit advertiser tipo
- [ ] Verify non-admin users can only edit their own advertisers

## Future Enhancements

Possible future improvements:
1. **Filtering:** Add ability to filter advertiser list by tipo
2. **Sorting:** Make tipo column sortable
3. **Features:** Different features/limits based on tipo (e.g., Profissional can post more ads)
4. **Upgrade Path:** Allow users to upgrade from Comum to Profissional
5. **Analytics:** Track statistics by advertiser type
6. **Recommendations:** Suggest Profissional type based on activity

## Troubleshooting

### Migration Issues
If the migration script fails:
1. Check database connectivity
2. Ensure Prisma is installed: `npm install @prisma/client prisma`
3. Check DATABASE_URL environment variable
4. Run the script again with Node.js v18+

### Frontend Issues
If the tipo field doesn't appear:
1. Restart dev server: `npm run dev`
2. Clear browser cache
3. Check browser console for errors
4. Verify schema was applied to database

### API Issues
If API returns validation errors:
1. Ensure tipo value is exactly "Comum" or "Profissional" (case-sensitive)
2. Check request headers include Content-Type: application/json
3. Verify user has permission to edit advertiser
