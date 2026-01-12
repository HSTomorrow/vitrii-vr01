# Telefone Field Implementation for Anunciante Cadastro

## Problem

The "Cadastro de Anunciantes" form was missing the dedicated "Telefone" (Phone) field for editing and creating advertisers. Only WhatsApp was available, but not a general phone number field.

## Solution Implemented

### 1. Updated TypeScript Interface

**File:** `client/pages/CadastroLojas.tsx`

Added `telefone` as an optional property to the `Anunciante` interface:

```typescript
interface Anunciante {
  // ... existing fields ...
  telefone?: string;
  // ... other fields ...
}
```

### 2. Updated Form State

Added `telefone` to the `formData` state initialization:

```typescript
const [formData, setFormData] = useState({
  // ... existing fields ...
  telefone: "",
  // ... other fields ...
});
```

### 3. Updated Form Data Handling

Updated three places where `formData` is reset:

#### a) handleEdit Function

When editing an existing advertiser, the form now loads the telefone value:

```typescript
const handleEdit = (loja: Anunciante) => {
  setFormData({
    // ... other fields ...
    telefone: loja.telefone || "",
    // ... other fields ...
  });
  setEditingId(loja.id);
  setIsFormOpen(true);
};
```

#### b) onSuccess Callback

After successful save, the form is reset including telefone:

```typescript
onSuccess: () => {
  setFormData({
    // ... other fields ...
    telefone: "",
    // ... other fields ...
  });
  // ... rest of callback ...
};
```

#### c) Nova Anunciante Button

When opening a new advertiser form, telefone is initialized to empty string:

```typescript
onClick={() => {
  setFormData({
    // ... other fields ...
    telefone: "",
    // ... other fields ...
  });
}}
```

### 4. Added Telefone Form Input Field

A new form field was added in the form, positioned between Email and Site fields:

```jsx
<div>
  <label className="block text-sm font-semibold text-walmart-text mb-2">
    Telefone (Opcional)
  </label>
  <input
    type="text"
    value={formData.telefone}
    onChange={(e) => {
      // Only allow digits, spaces, parentheses, and hyphens
      const cleanValue = e.target.value.replace(/[^\d\s()()-]/g, "");
      setFormData({ ...formData, telefone: cleanValue });
    }}
    placeholder="(51) 3333-3333"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-50"
  />
</div>
```

## Features

✅ **Input Validation**: Only allows digits, spaces, parentheses, and hyphens
✅ **Placeholder**: Shows example format "(51) 3333-3333"
✅ **Optional Field**: Marked as "(Opcional)" in the label
✅ **Loading on Edit**: Loads existing phone number when editing an advertiser
✅ **Reset on Save**: Clears the field after successful save when creating new advertiser

## Form Field Order

The complete form now includes fields in this order:

1. Nome da Anunciante \* (Name)
2. Tipo de Anunciante \* (Type)
3. CNPJ/CPF \* (ID Number)
4. Endereço \* (Address)
5. Cidade \* (City)
6. Estado (UF) \* (State)
7. Email \* (Email)
8. **Telefone (Opcional)** ← NEW
9. Site (Opcional) (Website)
10. Instagram (Opcional) (Instagram)
11. Facebook (Opcional) (Facebook)
12. WhatsApp (Opcional) (WhatsApp)
13. Descrição (Opcional) (Description)

## Backend Support

The backend already has support for the telefone field:

- **Prisma Schema**: `telefone` field exists in the anunciantes model
- **Database**: Field was added to the PostgreSQL table via migration
- **Validation Schema**: `AnuncianteUpdateSchema` includes `telefone` validation
- **API Route**: `/api/anunciantes/:id` accepts and saves telefone field

## Testing

To verify the implementation:

1. Navigate to "Cadastro de Anunciantes" page
2. Click "Nova Anunciante" to create a new advertiser
3. The Telefone field should appear in the form
4. Enter a phone number in format like "(51) 3333-3333"
5. Click "Salvar" - the phone number should be saved
6. Click "Editar" on an advertiser - the telefone field should show the saved value

## Files Modified

- `client/pages/CadastroLojas.tsx` - Added telefone field to interface, state, form, and all state reset locations

## Notes

- The telefone field is optional (not required)
- The field accepts phone number formatting like "(XX) XXXXX-XXXX"
- The field is separate from WhatsApp, allowing both phone and WhatsApp to be stored
- Input is sanitized to only accept valid phone number characters
