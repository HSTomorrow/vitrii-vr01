# Vitrii - Database Quick Start Checklist

## ✅ What Has Been Created

- ✅ **Prisma Schema** (`prisma/schema.prisma`) - Complete database schema with 13 tables
- ✅ **Prisma Client** (`server/lib/prisma.ts`) - Utility for database access
- ✅ **Example API Routes**:
  - `server/routes/usuarios.ts` - User management endpoints
  - `server/routes/lojas.ts` - Store management endpoints
- ✅ **Environment Template** (`.env.example`)
- ✅ **Documentation**:
  - `DATABASE_SETUP.md` - Detailed setup instructions
  - `DATABASE_SCHEMA.md` - Visual ERD and relationships
- ✅ **Dependencies** added to `package.json`:
  - `@prisma/client`
  - `@prisma/cli`

## 🚀 Next Steps (In Order)

### Step 1: Connect Supabase (2 minutes)
1. Click [Connect to Supabase](#open-mcp-popover)
2. Create a new Supabase project or use existing
3. Copy your database connection string

### Step 2: Configure Environment (1 minute)
1. Create `.env` file in project root
2. Paste your connection string:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public"
   ```
3. Save the file

### Step 3: Install Dependencies (2 minutes)
```bash
pnpm install
```

### Step 4: Generate Prisma Client (1 minute)
```bash
npx prisma generate
```

### Step 5: Run Database Migrations (2-3 minutes)
```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables in your database
- Generate migration files
- Set up your database

### Step 6: Verify Setup (1 minute)
```bash
npx prisma studio
```

Open http://localhost:5555 to view your database

### Step 7: Implement Password Hashing (Important!)
```bash
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

Update `server/routes/usuarios.ts` to hash passwords before saving

## 📋 Table of Tables Created

| Table | Purpose | Records |
|-------|---------|---------|
| **usuarios** | User accounts (buyers, sellers, admins) | N |
| **lojas** | Store profiles | N |
| **usuarios_lojas** | User-Store relationships and roles | M |
| **grupos_de_productos** | Product categories/groups per store | N |
| **fotos_grupo** | Photos for product groups (up to 5) | N |
| **productos** | Products and services | N |
| **tabelas_de_preco** | Product pricing per store | N |
| **qr_codes** | QR codes linking to prices | N |
| **anuncios** | Product listings/announcements | N |
| **produtos_em_estoque** | Inventory tracking per store | N |
| **movimentos_estoque** | Inventory history/movements | N |
| **producto_visualizacoes** | Product view tracking | N |
| **qr_code_chamadas** | QR code scan/call tracking | N |

## 🔑 Key Features

✅ **User Management**
- Common users (buyers)
- Store users with roles (Attendant, Manager, Admin)
- CPF and email unique constraints

✅ **Store Management**
- Store profiles with photos
- Multi-user team management with roles
- Status tracking (Active/Inactive)

✅ **Product Catalog**
- Organize products into groups
- Multiple photos per group
- Per-store pricing
- SKU support

✅ **QR Code System**
- Generate unique QR codes for products
- Track QR code scans
- Direct customer alerts

✅ **Announcements/Listings**
- Create product announcements
- Payment status tracking
- Expiration dates
- Photo support

✅ **Inventory Control**
- Track stock per store
- Movement history
- Min/max quantity alerts

✅ **Analytics**
- Track product views
- Track QR code calls
- User and guest data

## 🛠️ API Examples

After setup, you can call these endpoints:

### Create a User
```bash
curl -X POST http://localhost:5173/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "senha": "senha123",
    "cpf": "12345678901",
    "telefone": "11999999999",
    "endereco": "Rua A, 123"
  }'
```

### Create a Store
```bash
curl -X POST http://localhost:5173/api/lojas \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Minha Loja",
    "cnpjOuCpf": "12345678901234",
    "endereco": "Rua B, 456",
    "descricao": "Loja de eletrônicos",
    "email": "loja@example.com"
  }'
```

### List All Users
```bash
curl http://localhost:5173/api/usuarios
```

### List All Stores
```bash
curl http://localhost:5173/api/lojas
```

## 🔒 Security Checklist

Before deploying to production:

- [ ] Implement password hashing with bcrypt
- [ ] Add JWT authentication
- [ ] Validate all API inputs
- [ ] Add rate limiting
- [ ] Implement CORS properly
- [ ] Add request logging
- [ ] Use environment variables for secrets
- [ ] Set up HTTPS
- [ ] Add database backups
- [ ] Implement proper error handling

## 📚 Documentation Files

- **DATABASE_SETUP.md** - Complete setup guide
- **DATABASE_SCHEMA.md** - Visual ERD and relationships
- **.env.example** - Environment variables template
- **prisma/schema.prisma** - Prisma schema (database definition)

## 🆘 Troubleshooting

### "DATABASE_URL not found"
- Create `.env` file
- Copy connection string from Supabase
- Restart dev server: `pnpm dev`

### "Prisma Client not generated"
- Run: `npx prisma generate`

### "Migration failed"
- Check schema syntax: `npx prisma validate`
- Check Supabase connection
- Try reset: `npx prisma migrate reset` (deletes all data)

### "Port 5173 already in use"
- Kill existing process: `lsof -ti :5173 | xargs kill -9`

## 📞 Support Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)

## ⏭️ After Database Setup

Once your database is ready, you can:

1. **Integrate with Frontend**
   - Connect React forms to API endpoints
   - Add user authentication
   - Implement product browsing

2. **Add More Endpoints**
   - Products management
   - Inventory management
   - Announcements/Listings
   - QR Code generation
   - Analytics endpoints

3. **Implement Features**
   - QR code scanning
   - Real-time notifications
   - Payment processing
   - Search and filtering

4. **Setup Infrastructure**
   - Database backups
   - Monitoring
   - Error tracking
   - Performance optimization

---

**Time to complete: ~15-20 minutes**

Ready? [Connect to Supabase](#open-mcp-popover) and get started! 🚀
