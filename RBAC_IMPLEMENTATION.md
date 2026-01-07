# RBAC (Role-Based Access Control) Implementation

## Overview

The Vitrii marketplace now includes a comprehensive Role-Based Access Control (RBAC) system that allows administrators to manage user permissions and control access to platform features.

## System Architecture

### 1. Database Models

#### `Funcionalidade` Table
Stores all available features/permissions in the system.

```sql
CREATE TABLE funcionalidades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  chave VARCHAR(100) UNIQUE NOT NULL,        -- e.g., "MANAGE_USERS", "VIEW_ADS"
  nome VARCHAR(255) NOT NULL,                -- Display name
  descricao TEXT,                             -- Description
  categoria VARCHAR(50) NOT NULL,             -- Category: users, ads, stores, chat, payments, reports
  isActive BOOLEAN DEFAULT TRUE,
  dataCriacao DATETIME DEFAULT NOW(),
  dataAtualizacao DATETIME ON UPDATE NOW()
);
```

#### `UsuarioXFuncionalidade` Table
Junction table mapping users to their permissions.

```sql
CREATE TABLE usuarios_x_funcionalidades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  usuarioId INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  funcionalidadeId INT NOT NULL REFERENCES funcionalidades(id) ON DELETE CASCADE,
  dataCriacao DATETIME DEFAULT NOW(),
  dataAtualizacao DATETIME ON UPDATE NOW(),
  UNIQUE(usuarioId, funcionalidadeId)
);
```

#### Updated `Usuario` Model
Added support for "adm" (administrator) user type.

```typescript
model Usuario {
  tipoUsuario String @default("comum") // "comum", "adm" (administrador)
  usuarioXFuncionalidades UsuarioXFuncionalidade[]
  // ... other fields
}
```

### 2. Available Funcionalidades

**14 Core Funcionalidades** are pre-seeded in the database:

#### User Management
- **MANAGE_USERS** - Criar, editar, deletar usuários
- **VIEW_USERS** - Visualizar lista de usuários e detalhes
- **MANAGE_USER_PERMISSIONS** - Atribuir e remover funcionalidades de usuários

#### Ad Management
- **MANAGE_ADS** - Criar, editar, deletar anúncios
- **VIEW_ALL_ADS** - Visualizar anúncios de todas as lojas
- **MANAGE_FEATURED_ADS** - Marcar anúncios como em destaque

#### Store Management
- **MANAGE_STORES** - Criar, editar, deletar lojas
- **VIEW_ALL_STORES** - Visualizar todas as lojas do sistema

#### Chat Management
- **MANAGE_CHATS** - Visualizar e gerenciar todas as conversas
- **VIEW_ALL_CHATS** - Visualizar conversas de todos os usuários

#### Payment Management
- **MANAGE_PAYMENTS** - Visualizar e gerenciar pagamentos
- **VIEW_PAYMENT_REPORTS** - Visualizar relatórios de pagamento

#### Reports
- **VIEW_REPORTS** - Acessar relatórios gerais do sistema
- **MANAGE_SITE** - Acesso total ao site e configurações

## User Types

### 1. ADM (Administrator)
- Automatically has access to ALL funcionalidades
- Can manage other users and their permissions
- Can manage all platform features
- Cannot have permissions individually revoked (they always have all)

### 2. COMUM (Common User)
- Has only explicitly granted permissions
- Default user type for new registrations
- Can be promoted to ADM

## API Endpoints

### Funcionalidades Management

#### Get All Funcionalidades
```
GET /api/funcionalidades
Query Parameters:
  - categoria: Filter by category (users, ads, stores, chat, payments, reports)
  - ativo: Filter by active status (true/false)

Response:
{
  "success": true,
  "data": [Funcionalidade[]],
  "count": number
}
```

#### Get Funcionalidade by ID
```
GET /api/funcionalidades/:id

Response:
{
  "success": true,
  "data": {
    "id": number,
    "chave": "MANAGE_USERS",
    "nome": "Gerenciar Usuários",
    "descricao": "Criar, editar, deletar usuários",
    "categoria": "users",
    "isActive": true,
    "usuarioXFuncionalidades": [...] // Users with this permission
  }
}
```

#### Create Funcionalidade
```
POST /api/funcionalidades
Body:
{
  "chave": "NEW_FEATURE",
  "nome": "Nova Funcionalidade",
  "descricao": "Descrição",
  "categoria": "reports"
}

Response: 201 Created with funcionalidade object
```

#### Update Funcionalidade
```
PUT /api/funcionalidades/:id
Body: { chave?, nome?, descricao?, categoria?, isActive? }

Response: { "success": true, "data": Funcionalidade }
```

#### Delete Funcionalidade (Soft Delete)
```
DELETE /api/funcionalidades/:id

Response: { "success": true, "data": Funcionalidade, "message": "..." }
```

### User Permissions Management

#### Get User's Funcionalidades
```
GET /api/usuarios/:usuarioId/funcionalidades

Response:
{
  "success": true,
  "data": {
    "usuario": { id, nome, email, tipoUsuario },
    "funcionalidades": [Funcionalidade[]],
    "isAdm": boolean
  }
}
```

#### Grant Single Funcionalidade
```
POST /api/usuarios/:usuarioId/funcionalidades/grant
Body:
{
  "usuarioId": number,
  "funcionalidadeId": number
}

Response: 201 Created
```

#### Grant Multiple Funcionalidades
```
POST /api/usuarios/:usuarioId/funcionalidades/grant-multiple
Body:
{
  "usuarioId": number,
  "funcionalidadeIds": [number, number, ...]
}

Response: 201 Created
```

#### Revoke Single Funcionalidade
```
DELETE /api/usuarios/:usuarioId/funcionalidades/:funcionalidadeId

Response: { "success": true, "message": "..." }
```

#### Revoke Multiple Funcionalidades
```
POST /api/usuarios/:usuarioId/funcionalidades/revoke-multiple
Body:
{
  "usuarioId": number,
  "funcionalidadeIds": [number, number, ...]
}

Response: { "success": true, "data": { funcionalidadesCount: number } }
```

#### Grant All Funcionalidades to User
```
POST /api/usuarios/:usuarioId/funcionalidades/grant-all

Response: 201 Created
```

#### Revoke All Funcionalidades from User
```
POST /api/usuarios/:usuarioId/funcionalidades/revoke-all

Response: { "success": true, "data": { funcionalidadesCount: number } }
```

#### List All User-Funcionalidade Relationships
```
GET /api/usuarios-funcionalidades
Query Parameters:
  - usuarioId: Filter by user
  - funcionalidadeId: Filter by funcionalidade

Response:
{
  "success": true,
  "data": [UsuarioXFuncionalidade[]],
  "count": number
}
```

## Frontend - Admin Dashboard

### Location
`client/pages/AdminDashboard.tsx` (Route: `/admin/dashboard`)

### Features

#### Users Tab
- **Search & Filter** - Find users by name or email
- **User List** - Display all users with their type (ADM/COMUM)
- **User Details** - Expand to manage permissions
- **Permission Management**:
  - Grant individual permissions
  - Revoke individual permissions
  - Grant all permissions at once
  - Revoke all permissions at once
- **ADM Protection** - ADM users show info but cannot have permissions revoked

#### Funcionalidades Tab
- **Browse All Permissions** - View all available features
- **Categorized Display** - Grouped by category
- **Feature Details** - See feature description and key
- **Status Indicator** - See if feature is active

## Permission Guard Middleware

### Location
`server/middleware/permissionGuard.ts`

### Key Functions

#### `checkPermission(requiredPermissions, requireAll)`
Middleware to verify user has specific permission(s).

```typescript
// Example: Check single permission
app.get("/api/sensitive-route", checkPermission("MANAGE_USERS"), handler);

// Example: Check multiple permissions (requires all)
app.post("/api/admin-route", checkPermission(["MANAGE_USERS", "MANAGE_ADS"], true), handler);

// Example: Check multiple permissions (requires at least one)
app.get("/api/view-reports", checkPermission(["VIEW_REPORTS", "VIEW_PAYMENT_REPORTS"]), handler);
```

#### `requireAdmin()`
Middleware to ensure user is ADM.

```typescript
app.delete("/api/users/:id", requireAdmin, handler);
```

#### `userHasPermission(userId, permissionChave)`
Utility function for checking permissions within route handlers.

```typescript
const canManage = await userHasPermission(userId, "MANAGE_USERS");
if (!canManage) {
  return res.status(403).json({ error: "Acesso negado" });
}
```

## How It Works

### User Authentication Flow

1. User logs in via `/api/auth/signin`
2. System fetches user record including `tipoUsuario`
3. For ADM users: Automatic access to all features
4. For COMUM users: Fetch granted permissions from `usuarioXFuncionalidades`

### Permission Checking Flow

1. Request arrives at protected endpoint
2. `extractUserId` middleware extracts user ID
3. `checkPermission` middleware:
   - Fetches user record
   - Checks if ADM (bypass check)
   - Fetches user's funcionalidades
   - Verifies required permissions
   - Allows or denies access
4. Route handler executes if authorized

### Admin Dashboard Flow

1. ADM user navigates to `/admin/dashboard`
2. Dashboard loads:
   - All users from `/api/usuarios`
   - All funcionalidades from `/api/funcionalidades`
3. When user expands:
   - Fetches their permissions from `/api/usuarios/:id/funcionalidades`
4. When granting/revoking:
   - Calls appropriate POST/DELETE endpoints
   - Updates UI in real-time

## Setting Up RBAC in Existing Routes

### Step 1: Identify Sensitive Routes

```typescript
// Routes that should be protected:
- /api/usuarios/* (user management)
- /api/lojas/* (store management - restricted)
- /api/anuncios/* (ad management)
- /api/conversas/* (chat management)
- /api/pagamentos/* (payment management)
```

### Step 2: Apply Middleware

```typescript
// Example: Protect user deletion
app.delete("/api/usuarios/:id", 
  extractUserId,
  checkPermission("MANAGE_USERS"), 
  deleteUsuario
);

// Example: Protect admin routes
app.post("/api/funcionalidades", 
  extractUserId,
  requireAdmin, 
  createFuncionalidade
);

// Example: Multiple permissions (any one)
app.get("/api/reports", 
  extractUserId,
  checkPermission(["VIEW_REPORTS", "MANAGE_SITE"]), 
  getReports
);
```

### Step 3: Test Access Control

```bash
# Test with permission
curl -H "X-User-Id: 1" http://localhost:5000/api/usuarios

# Test without permission (should return 403)
curl -H "X-User-Id: 2" http://localhost:5000/api/usuarios
```

## Database Operations

### Seed Funcionalidades
```bash
node create-rbac-tables.mjs
```

This script:
1. Creates 14 pre-defined funcionalidades
2. Grants all funcionalidades to any existing ADM users

### Grant Permissions to User
```bash
curl -X POST http://localhost:5000/api/usuarios/2/funcionalidades/grant \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": 2,
    "funcionalidadeId": 1
  }'
```

### Promote User to ADM
```bash
# Update user type to "adm"
curl -X PUT http://localhost:5000/api/usuarios/2 \
  -H "Content-Type: application/json" \
  -d '{ "tipoUsuario": "adm" }'
```

## Security Considerations

1. **ADM Protection**: ADM users cannot have permissions individually revoked
2. **Unique Constraints**: Prevents duplicate user-funcionalidade mappings
3. **Soft Deletes**: Funcionalidades marked inactive, not deleted
4. **Permission Validation**: All user actions validated on backend
5. **Audit Trail**: All changes stored with timestamps

## Future Enhancements

1. **Time-based Permissions**: Expiring permissions
2. **Role Groups**: Bundle permissions into roles (EDITOR, VIEWER, etc.)
3. **Resource-level Permissions**: Control access to specific lojas/ads
4. **Audit Logging**: Track who changed what and when
5. **Permission Inheritance**: Parent-child permission hierarchies

## Troubleshooting

### User Can't Access Admin Dashboard
- Check if user type is "adm"
- Verify user is authenticated
- Check browser console for errors

### Permission Denied on Route
- Verify user has required permission via `/api/usuarios/:id/funcionalidades`
- Check if permission key matches exactly
- Ensure middleware is applied in correct order

### Funcionalidade Not Showing
- Verify funcionalidade has `isActive = true`
- Check database directly:
  ```sql
  SELECT * FROM funcionalidades WHERE isActive = true;
  ```

## Files Modified/Created

### New Files
- `server/routes/funcionalidades.ts` - Funcionalidades CRUD
- `server/routes/usuario-funcionalidades.ts` - Permission management
- `server/middleware/permissionGuard.ts` - RBAC middleware
- `client/pages/AdminDashboard.tsx` - Admin UI
- `create-rbac-tables.mjs` - Database setup script

### Modified Files
- `prisma/schema.prisma` - Added Funcionalidade and UsuarioXFuncionalidade models
- `server/index.ts` - Added RBAC routes
- `client/App.tsx` - Added admin dashboard route
- `client/components/Header.tsx` - Added admin link for ADM users

## Summary

The RBAC system provides:
- ✅ Granular permission control
- ✅ User type system (ADM/COMUM)
- ✅ Permission management interface
- ✅ Middleware for route protection
- ✅ Pre-seeded funcionalidades
- ✅ Admin dashboard
- ✅ Scalable architecture

All 14 funcionalidades are ready to use, and the system can be easily extended with new permissions.
