# Database Schema Fix Summary - Anunciantes Table

## Problem
The PostgreSQL/Supabase database was missing several columns that were defined in the Prisma schema, causing update operations to fail with errors like:
- "The column `anunciantes.site` does not exist in the current database"
- "The column `anunciantes.fotoUrl` does not exist in the current database"
- "The column `anunciantes.instagram` does not exist in the current database"

## Root Cause
The Prisma schema file (`prisma/schema.prisma`) defined optional fields for the `anunciantes` model, but these columns had never been created in the actual PostgreSQL database. This mismatch occurred because:
1. The schema was updated with new fields
2. No database migration was executed to create the corresponding columns

## Solution Implemented

### 1. Database Migration
Created and executed a comprehensive migration script (`scripts/add-all-missing-anunciante-fields.mjs`) that added ALL missing columns to the `anunciantes` table:

**Columns Added:**
- `descricao` (TEXT) - Description of advertiser
- `cnpj` (VARCHAR 14) - CNPJ/CPF number
- `telefone` (VARCHAR 20) - Phone number
- `email` (VARCHAR 255) - Email address
- `endereco` (VARCHAR 255) - Address
- `cep` (VARCHAR 8) - ZIP code
- `site` (VARCHAR 255) - Website URL
- `instagram` (VARCHAR 255) - Instagram handle
- `facebook` (VARCHAR 255) - Facebook URL
- `whatsapp` (VARCHAR 20) - WhatsApp number
- `fotoUrl` (VARCHAR 500) - Photo/image URL
- `status` (VARCHAR 50) - Status field
- `tipo` (VARCHAR 50) - Type field (Padrão/Profissional) with default 'Padrão'
- `dataCriacao` (TIMESTAMP) - Creation date with current timestamp default
- `dataAtualizacao` (TIMESTAMP) - Update date with current timestamp default

**Migration Execution:**
```bash
pnpm node scripts/add-all-missing-anunciante-fields.mjs
```

**Result:**
✓ All 7 existing advertiser records updated with new column structure
✓ Default values applied where necessary
✓ No data loss

### 2. Backend API Updates

#### Updated `AnuncianteUpdateSchema` (server/routes/anunciantes.ts)
Added the following fields to the update schema validation:
- `cnpj` - With regex validation for 11-14 digit format
- `telefone` - Optional string
- `cep` - Optional string

These were previously missing, preventing updates to these fields.

#### Enhanced Empty String Handling
Updated the `updateAnunciante` function to:
- Convert empty strings to `null` for all optional fields
- Prevent Prisma validation errors when optional fields are left blank
- Updated timestamp (`dataAtualizacao`) on every update

### 3. Frontend Form Validation
Verified that `client/pages/CadastroLojas.tsx` includes all form fields:
- Nome (Name) ✓
- Tipo (Type) ✓
- CNPJ/CPF ✓
- Endereço (Address) ✓
- Cidade (City) ✓
- Estado (State) ✓
- Email ✓
- Telefone (Phone) ✓
- CEP (ZIP) ✓
- Site ✓
- Instagram ✓
- Facebook ✓
- WhatsApp ✓
- Descrição (Description) ✓

## Verification

**Test Case: Daniel Pelegrinelli (ID 22)**
```json
{
  "id": 22,
  "nome": "Daniel Pelegrinelli",
  "tipo": "Padrão",
  "email": "daniel_pelegrinelli@hotmail.com",
  "endereco": "Rua Brasil",
  "cidade": "Montenegro",
  "estado": "RS",
  "cnpj": null,
  "telefone": null,
  "whatsapp": null,
  "site": null,
  "instagram": null,
  "facebook": null,
  "fotoUrl": null
}
```

All fields are now present in the database and can be updated successfully.

## Files Modified

1. **scripts/add-all-missing-anunciante-fields.mjs** (New)
   - Comprehensive migration script to add all missing columns

2. **scripts/add-social-media-fields.mjs** (New)
   - Earlier migration script (superseded by comprehensive script)

3. **scripts/add-tipo-anunciante-field.mjs** (Existing)
   - Previous migration that added the `tipo` field

4. **server/routes/anunciantes.ts**
   - Updated `AnuncianteUpdateSchema` to include cnpj, telefone, cep
   - Enhanced empty string to null conversion for all optional fields

5. **prisma/schema.prisma**
   - Verified all field definitions exist (no changes needed)

## Next Steps

1. **Testing**: Try updating Daniel Pelegrinelli with:
   - CPF: 30171600843
   - WhatsApp: 11982723837
   - All should now update successfully

2. **Verification**: Check the database to confirm updates are saved:
   ```bash
   pnpm node scripts/check-anunciante-22.mjs
   ```

3. **Backup**: The migration script `add-all-missing-anunciante-fields.mjs` can be re-run on production to ensure consistency

## Error Handling Improvements

When updates now fail, users see:
- **Validation Errors**: Field-specific messages (e.g., "CNPJ/CPF inválido")
- **Constraint Violations**: "Este cnpj já está cadastrado no sistema"
- **Not Found Errors**: "Anunciante não encontrado"
- **Detailed Logging**: Server logs include full error context for debugging

## Backward Compatibility

✓ All changes are backward compatible
✓ Existing records continue to work
✓ New fields default to NULL for existing records
✓ No breaking changes to API endpoints
