# User Profile Management and Ad View Tracking

## Overview
This document describes the new features added for user profile management and ad view tracking in the Vitrii platform.

## 1. User Profile Management

### New Fields Added to Users (usracessos)
- **whatsapp**: WhatsApp contact number
- **linkedin**: LinkedIn profile URL
- **facebook**: Facebook profile URL

These fields complement existing fields:
- nome (name)
- email
- cpf
- telefone (phone)
- tipoUsuario (user type: adm or comum)
- dataVigenciaContrato (contract validity date)
- numeroAnunciosAtivos (number of active ads)
- endereco (address)

### User Management Page
**Path**: `/admin/usuarios` (Admin only)

The Gerenciador de Usuários page now includes:

1. **List All Users**
   - Search by name or email
   - Pagination (20 users per page)
   - Display user type (Admin/Common)

2. **Reset User Password**
   - Modal dialog for setting new passwords
   - Requires password confirmation
   - Minimum 6 characters

3. **Edit User Profile** (NEW)
   - Click "Editar" button to open profile editor
   - Edit all user fields including:
     - Basic info (Name, Email, CPF)
     - Contact info (Phone, WhatsApp, LinkedIn, Facebook)
     - Address
     - User Type (Common/Admin)
     - Contract Validity Date
   - View read-only fields:
     - Number of Active Ads
     - Creation Date

### API Endpoints

#### Get All Users (Admin Only)
```
GET /api/admin/usracessos-com-senha
```
Returns: Array of users with all fields including password hash

#### Update User Profile (Admin Only)
```
PUT /api/admin/usracessos/:id/profile
```
Body:
```json
{
  "nome": "string",
  "email": "string",
  "cpf": "string",
  "telefone": "string",
  "whatsapp": "string",
  "linkedin": "string",
  "facebook": "string",
  "tipoUsuario": "adm|comum",
  "dataVigenciaContrato": "ISO date string",
  "endereco": "string"
}
```

## 2. Ad View Tracking

### New Database Tables

#### anuncioVisualizados (Ad Views Log)
Tracks each view of an ad:
- **id**: Primary key
- **anuncioId**: Reference to the ad (Required)
- **usuarioId**: User ID if logged in (Nullable - for anonymous views)
- **dataCriacao**: Timestamp of the view (Default: now())

Indexes for performance:
- anuncioId
- usuarioId
- dataCriacao

### New Field in Anuncios
- **visualizacoes**: Integer count of total views (Default: 0)

### API Endpoints

#### Record Ad View
```
POST /api/anuncios/:id/view
```
- **Optional Query/Body**: User context (automatically extracted if logged in)
- **Response**: Confirms view was recorded

This endpoint:
1. Logs the view in anuncioVisualizados table
2. Increments the visualizacoes counter on the ad
3. Works for both logged-in and anonymous users

#### Get Ad Details (includes view count)
```
GET /api/anuncios/:id
```
Returns: Ad object including `visualizacoes` field

## 3. Integration Points

### Frontend Components
- **AdminEditUserModal.tsx**: User profile editing modal
- **AdminManageUsers.tsx**: Updated user management page with edit functionality

### Server Routes
- **server/routes/usuarios.ts**: Added `adminUpdateUserProfile` handler
- **server/routes/anuncios.ts**: Added `recordAnuncioView` handler

### Database Schema
- **prisma/schema.prisma**: Updated models and added new relationships

## 4. Data Flow

### User Profile Update Flow
1. Admin clicks "Editar" button on user row
2. Modal opens with current user data
3. Admin makes changes and clicks "Salvar Mudanças"
4. Frontend sends PUT to `/api/admin/usracessos/:id/profile`
5. Server validates data and updates user record
6. User query cache is invalidated
7. Table refreshes with updated data

### Ad View Tracking Flow
1. User views an ad (e.g., clicks on detail page)
2. JavaScript calls `POST /api/anuncios/:id/view`
3. Server logs view with userId (if available) or null (if anonymous)
4. Server increments `visualizacoes` counter
5. View appears in both tables:
   - `anuncioVisualizados`: Detailed log of each view
   - `anuncios.visualizacoes`: Total view count

## 5. Usage Examples

### Editing a User Profile
1. Go to Admin Dashboard
2. Click "Gerenciar Usuários"
3. Find user by name/email
4. Click "Editar" button
5. Update fields (all are optional except Name and Email)
6. Click "Salvar Mudanças"

### Recording an Ad View
Add this to any component where ads are viewed:
```javascript
// Record view when ad detail loads
useEffect(() => {
  fetch(`/api/anuncios/${anuncioId}/view`, { method: 'POST' });
}, [anuncioId]);
```

### Querying View Statistics
```javascript
// Get view count for an ad
const ad = await fetch(`/api/anuncios/${id}`).then(r => r.json());
console.log(`Ad has ${ad.visualizacoes} views`);

// Get all views for an ad (admin only)
const views = await fetch(`/api/anuncios/${id}/views`).then(r => r.json());
```

## 6. Validation Rules

### CPF/CNPJ Validation
- Must be 11 digits (CPF) or 14 digits (CNPJ)
- Must be unique per user (cannot duplicate across users)
- Can be empty (optional)

### Email Validation
- Must be valid email format
- Must be unique per user
- Required for updates

### Contract Validity Date
- Must be a valid date
- Can be in the past, present, or future
- Used to control ad creation permissions

### User Type
- Must be either "adm" (administrator) or "comum" (common)
- Only admins can change user types

## 7. Performance Considerations

### Indexes
- anuncioVisualizados table has three indexes for fast queries:
  - anuncioId (find all views for specific ad)
  - usuarioId (find user's viewing history)
  - dataCriacao (find views by date range)

### View Counting
- Uses atomic database increment operation
- No race conditions
- Accurate count in all scenarios

## 8. Security Considerations

### Admin-Only Operations
- User profile updates require admin role
- View logs are accessible to admins
- CPF/CNPJ validation prevents duplicates

### Data Privacy
- Anonymous views (usuarioId = null) don't identify users
- Logged-in user views are tracked for analytics
- Users cannot see other users' profiles

### SQL Injection Prevention
- All inputs validated with Zod schema
- Parameterized queries via Prisma ORM
- No raw SQL in profile updates
