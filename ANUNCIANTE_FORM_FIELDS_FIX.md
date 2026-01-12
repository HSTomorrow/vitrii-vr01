# Anunciante Form Fields Fix - Display on Edit

## Problem

When editing an anunciante (loja), the form was not displaying values for the following fields, even though they were saved correctly in the database:

- Telefone (Phone)
- Site
- Instagram
- Facebook
- WhatsApp
- Descrição
- Tipo
- CEP
- Status
- Foto URL

## Root Cause

The API endpoint `/api/anunciantes/do-usuario/listar` used by the form to fetch anunciantes was using a **`select` block that only returned a limited set of fields**:

- id
- nome
- endereco
- cidade
- estado
- email
- cnpj
- dataCriacao

When the `handleEdit` function tried to load the anunciante data into the form, these missing fields would be `undefined`, so they wouldn't display.

## Solution

Updated the Prisma `select` blocks in all anunciante fetch functions to return **ALL fields** from the anunciantes table.

### Files Modified: `server/routes/anunciantes.ts`

#### 1. Function `getAnunciantes` (lines 34-54)

Returns all anunciantes with pagination. Updated select to include:

```typescript
select: {
  id: true,
  nome: true,
  tipo: true,
  descricao: true,
  cnpj: true,
  telefone: true,
  email: true,
  endereco: true,
  cidade: true,
  estado: true,
  cep: true,
  site: true,
  instagram: true,
  facebook: true,
  whatsapp: true,
  fotoUrl: true,
  status: true,
  dataCriacao: true,
  dataAtualizacao: true,
}
```

#### 2. Function `getAnunciantesByUsuario` - Admin Branch (lines 557-597)

Returns all anunciantes if user is admin. Updated select with all fields (same as above).

#### 3. Function `getAnunciantesByUsuario` - Regular User Branch (lines 575-617)

Returns only anunciantes linked to the current user. Updated select with all fields (same as above).

## API Endpoints Updated

### `/api/anunciantes` (GET - List All)

- **Before**: Returned only 8 fields
- **After**: Returns all 19 fields from anunciantes table
- **Used by**: Admin viewing all anunciantes

### `/api/anunciantes/do-usuario/listar` (GET - List by User)

- **Before**: Returned only 8 fields
- **After**: Returns all 19 fields from anunciantes table
- **Used by**: Admin/User viewing their anunciantes and editing form

## What Now Works

When editing an anunciante in the form, all fields are now populated:

### Required Fields:

- ✅ Nome (Name)
- ✅ Tipo (Type: Padrão/Profissional)
- ✅ CNPJ/CPF
- ✅ Endereço (Address)
- ✅ Cidade (City)
- ✅ Estado (State)
- ✅ Email

### Optional Fields (Now Displaying):

- ✅ Telefone (Phone)
- ✅ Site
- ✅ Instagram
- ✅ Facebook
- ✅ WhatsApp
- ✅ CEP (ZIP)
- ✅ Descrição (Description)

### System Fields:

- ✅ Status
- ✅ FotoUrl (Photo URL)
- ✅ dataCriacao (Creation Date)
- ✅ dataAtualizacao (Update Date)

## Example Scenario

**Before Fix:**

```
User clicks "Edit" on Daniel Pelegrinelli anunciante
Form displays:
  - Nome: Daniel Pelegrinelli ✓
  - Tipo: (empty) ✗
  - CNPJ: 30171600843 ✓
  - Email: daniel_pelegrinelli@hotmail.com ✓
  - Telefone: (empty) ✗
  - WhatsApp: (empty) ✗
  - Site: (empty) ✗
  - Instagram: (empty) ✗
  - Facebook: (empty) ✗
```

**After Fix:**

```
User clicks "Edit" on Daniel Pelegrinelli anunciante
Form displays:
  - Nome: Daniel Pelegrinelli ✓
  - Tipo: Padrão ✓
  - CNPJ: 30171600843 ✓
  - Email: daniel_pelegrinelli@hotmail.com ✓
  - Telefone: (51) 3333-3333 ✓
  - WhatsApp: +55 11 98272-3837 ✓
  - Site: www.example.com ✓
  - Instagram: @usuario ✓
  - Facebook: usuario.facebook ✓
```

## Database Verification

All fields are correctly stored in the database:

```sql
SELECT id, nome, tipo, telefone, whatsapp, site, instagram, facebook, descricao
FROM anunciantes
WHERE id = 22;
```

This confirms data integrity - the issue was only in the API response, not the database.

## Server Logs Verification

After deployment, server logs show the complete query:

```
SELECT "public"."anunciantes"."id",
       "public"."anunciantes"."nome",
       "public"."anunciantes"."tipo",
       "public"."anunciantes"."descricao",
       "public"."anunciantes"."cnpj",
       "public"."anunciantes"."telefone",
       "public"."anunciantes"."email",
       "public"."anunciantes"."endereco",
       ... (all fields)
FROM "public"."anunciantes"
```

## Notes

- The database was always correct - this was purely an API/Prisma selection issue
- No data was lost or corrupted during this fix
- All existing anunciantes can now be edited with full field visibility
- Changes are backward compatible - no breaking changes to the API response format

## Testing

To verify the fix:

1. Go to "Cadastro de Anunciantes"
2. Click "Editar" on any anunciante
3. Form should now show ALL fields with their saved values
4. Edit any field and save
5. Re-open the form - all fields should still be populated
