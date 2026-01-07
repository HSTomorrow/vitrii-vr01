# RBAC Quick Start Guide

## What Was Built

A complete **Role-Based Access Control (RBAC)** system for Vitrii that allows administrators to:

- Manage user types (ADM or COMUM)
- Grant/revoke specific permissions to users
- Control access to all platform features
- Monitor who has access to what

## Key Features

✅ **14 Pre-seeded Funcionalidades** (permissions)
✅ **Admin Dashboard** for permission management
✅ **Automatic ADM Permissions** - ADM users get all permissions automatically
✅ **Permission Middleware** - Protect sensitive API routes
✅ **User-friendly UI** - Manage permissions visually

## Quick Setup

### 1. Database is Ready ✅

The RBAC tables and 14 funcionalidades have been automatically created and seeded.

### 2. Access Admin Dashboard

1. Sign in as an ADM user
2. Click "Administrador" button in header (yellow button with shield icon)
3. Or navigate directly to `/admin/dashboard`

### 3. Manage Users & Permissions

1. Go to **Usuários** tab
2. Search for a user
3. Click to expand user details
4. Add/remove permissions by clicking ✓ or ✗ buttons

## Creating Your First ADM User

### Option A: Database Update

```sql
UPDATE usuarios SET tipoUsuario = 'adm' WHERE email = 'your-email@example.com';
```

### Option B: Via API

```bash
curl -X PUT http://localhost:5000/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{ "tipoUsuario": "adm" }'
```

After that, log out and log back in. The "Administrador" button will appear!

## Available Permissions

### User Management (3)

- **MANAGE_USERS** - Create/Edit/Delete users
- **VIEW_USERS** - View user list and details
- **MANAGE_USER_PERMISSIONS** - Grant/revoke permissions

### Ad Management (3)

- **MANAGE_ADS** - Create/Edit/Delete ads
- **VIEW_ALL_ADS** - View all ads in system
- **MANAGE_FEATURED_ADS** - Mark ads as featured

### Store Management (2)

- **MANAGE_STORES** - Create/Edit/Delete stores
- **VIEW_ALL_STORES** - View all stores

### Chat Management (2)

- **MANAGE_CHATS** - Manage all conversations
- **VIEW_ALL_CHATS** - View all chats

### Payment Management (2)

- **MANAGE_PAYMENTS** - Manage payments
- **VIEW_PAYMENT_REPORTS** - View payment reports

### System (2)

- **VIEW_REPORTS** - View system reports
- **MANAGE_SITE** - Full admin access

## Using Permissions in Your Code

### Example 1: Protect an API Route

```typescript
// In server/index.ts
import { extractUserId, checkPermission } from "./middleware/permissionGuard";

// Only users with MANAGE_USERS permission can access
app.delete(
  "/api/usuarios/:id",
  extractUserId,
  checkPermission("MANAGE_USERS"),
  deleteUsuario,
);
```

### Example 2: Check Permission in Handler

```typescript
// In a route handler
import { userHasPermission } from "../middleware/permissionGuard";

export const sensitiveAction: RequestHandler = async (req, res) => {
  const userId = req.params.usuarioId;

  const canManage = await userHasPermission(userId, "MANAGE_USERS");
  if (!canManage) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  // Continue with action...
};
```

## Admin Dashboard Features

### Users Tab

- **Search Bar** - Find users by name or email
- **User Cards** - Shows user info and type
- **Expand Details** - Click to see/manage permissions
- **Grant/Revoke** - Click ✓ or ✗ to change permissions
- **Grant All / Revoke All** - Bulk operations

### Funcionalidades Tab

- **Browse All Permissions** - View all 14 available features
- **Grouped by Category** - Organized for easy browsing
- **Feature Details** - See description and key

## Common Tasks

### Grant Permission to User

1. Open Admin Dashboard
2. Search for user
3. Expand user details
4. Click ✓ next to permission to grant
5. Done! ✅

### Remove Permission from User

1. Open Admin Dashboard
2. Search for user
3. Expand user details
4. Click ✗ next to permission to revoke
5. Done! ✅

### Make User an Administrator

```bash
# Via Admin Dashboard:
1. Can't be done directly (for security)
2. Use database or API

# Via API:
curl -X PUT http://localhost:5000/api/usuarios/USER_ID \
  -H "Content-Type: application/json" \
  -d '{ "tipoUsuario": "adm" }'
```

### View User's Permissions

```bash
curl http://localhost:5000/api/usuarios/USER_ID/funcionalidades
```

## File Locations

```
server/
├── routes/
│   ├── funcionalidades.ts           # Permission CRUD
│   └── usuario-funcionalidades.ts   # User-Permission mapping
├── middleware/
│   └── permissionGuard.ts           # RBAC middleware
└── index.ts                         # Added routes here

client/
├── pages/
│   └── AdminDashboard.tsx           # Admin UI (NEW)
├── components/
│   └── Header.tsx                   # Updated with admin button
└── App.tsx                          # Added admin route

prisma/
└── schema.prisma                    # Added 2 new models

Database:
├── funcionalidades                  # 14 pre-seeded
├── usuarios_x_funcionalidades
└── usuarios (tipoUsuario updated)
```

## API Endpoints

### View Permissions

```
GET /api/funcionalidades
GET /api/usuarios/:usuarioId/funcionalidades
GET /api/usuarios-funcionalidades
```

### Manage Permissions

```
POST /api/usuarios/:usuarioId/funcionalidades/grant
POST /api/usuarios/:usuarioId/funcionalidades/grant-multiple
DELETE /api/usuarios/:usuarioId/funcionalidades/:funcionalidadeId
POST /api/usuarios/:usuarioId/funcionalidades/revoke-multiple
POST /api/usuarios/:usuarioId/funcionalidades/grant-all
POST /api/usuarios/:usuarioId/funcionalidades/revoke-all
```

### Manage Features (Admin only)

```
POST /api/funcionalidades
PUT /api/funcionalidades/:id
DELETE /api/funcionalidades/:id
```

## User Types

### ADM (Administrator)

- ✅ Can access admin dashboard
- ✅ Can manage all users and permissions
- ✅ Can manage all platform features
- ✅ Automatically has all permissions
- ❌ Can't have individual permissions revoked

### COMUM (Common User)

- ❌ Can't access admin dashboard
- ❌ Can't see permission management
- ✅ Has only explicitly granted permissions
- ✅ Can be promoted to ADM

## Testing

### Test Admin Access

1. Create/update a user to type "adm"
2. Sign in as that user
3. Should see "Administrador" button in header
4. Click it to go to admin dashboard

### Test Permission Guard

```bash
# As ADM (should work)
curl -H "X-User-Id: 1" http://localhost:5000/api/usuarios

# As COMUM without permission (should return 403)
curl -H "X-User-Id: 2" http://localhost:5000/api/usuarios
```

## Security Notes

1. **ADM users can't have permissions revoked** - For security
2. **Permissions are validated server-side** - Not just client-side
3. **All changes are timestamped** - For audit trails
4. **Soft deletes** - Funcionalidades marked inactive, not deleted
5. **Unique constraints** - Prevent duplicate permissions

## Troubleshooting

### Can't see Admin button in header?

- User must be logged in ✅
- User must have `tipoUsuario = 'adm'` ✅
- Try refreshing the page ✅

### "Acesso negado" error?

- Check if user has required permission
- View permissions: `GET /api/usuarios/:id/funcionalidades`
- Grant permission via admin dashboard ✅

### Admin Dashboard not loading?

- Clear browser cache
- Check browser console for errors
- Verify user is ADM type
- Try different browser

## Next Steps

1. **Test the System** - Promote a user to ADM and explore
2. **Protect Routes** - Add permission checks to sensitive endpoints
3. **Create Roles** - Consider grouping permissions (Editor, Viewer, etc.)
4. **Audit Logging** - Track permission changes
5. **Time-based Permissions** - Expiring access

## Support

For issues or questions:

1. Check `RBAC_IMPLEMENTATION.md` for detailed docs
2. Review code in `server/middleware/permissionGuard.ts`
3. Check API responses for error messages

## Summary

✅ **RBAC System Ready!**

You now have:

- ✅ Complete permission management system
- ✅ Admin dashboard
- ✅ 14 pre-configured permissions
- ✅ Protection middleware
- ✅ User type support (ADM/COMUM)

**All tasks completed successfully!** 🎉
