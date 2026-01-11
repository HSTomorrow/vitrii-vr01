# Vitrii Marketplace - Database Setup Guide

## Overview

This guide will walk you through setting up PostgreSQL for the Vitrii marketplace using Supabase and Prisma ORM.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier available at https://supabase.com)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `vitrii-marketplace` (or your preferred name)
   - **Password**: Create a strong password
   - **Region**: Choose the region closest to you
5. Click "Create new project"
6. Wait for the project to be created (1-2 minutes)

## Step 2: Get Database Connection String

1. In Supabase dashboard, go to **Settings** > **Database**
2. Copy the connection string under "Connection string" (PSQL format)
3. It will look like:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   ```

## Step 3: Set Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Paste your connection string as:
   ```
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public"
   ```

## Step 4: Install Dependencies

Run the following command to install Prisma and dependencies:

```bash
pnpm install
```

## Step 5: Run Prisma Migrations

Generate the Prisma client and apply migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations to your database
npx prisma migrate dev --name init
```

This will:
1. Create all tables in your PostgreSQL database
2. Generate the Prisma client for your application
3. Create a migration file

## Step 6: Verify Setup

View your database schema with Prisma Studio:

```bash
npx prisma studio
```

This opens a web interface where you can view and manage your data.

## Database Schema Overview

### Core Tables

#### 1. **usuarios** (Users)
- `id` (Primary Key)
- `nome` (Name)
- `email` (Email - Unique)
- `senha` (Password - hashed)
- `cpf` (CPF - Unique, 11 digits)
- `telefone` (Phone)
- `endereco` (Address)
- `tipoUsuario` (Type: "comum" or "administrador")
- `dataCriacao` (Created At)
- `dataAtualizacao` (Updated At)

#### 2. **lojas** (Stores)
- `id` (Primary Key)
- `nome` (Store Name)
- `cnpjOuCpf` (CNPJ or CPF - Unique)
- `endereco` (Address)
- `descricao` (Description)
- `email` (Email)
- `site` (Website URL)
- `instagram` (Instagram handle)
- `facebook` (Facebook URL)
- `fotoUrl` (Store photo URL)
- `status` (Status: "ativa" or "inativa")
- Timestamps

#### 3. **usuarios_lojas** (User-Store-Role Junction)
- `id` (Primary Key)
- `usuarioId` (Foreign Key -> usuarios)
- `lojaId` (Foreign Key -> lojas)
- `tipoUsuario` (Role: "atendente", "gestor", "administrador")
- Unique constraint on (usuarioId, lojaId)

#### 4. **grupos_de_productos** (Product Groups)
- `id` (Primary Key)
- `lojaId` (Foreign Key -> lojas)
- `nome` (Group Name)
- `descricao` (Description)
- Timestamps

#### 5. **fotos_grupo** (Product Group Photos - up to 5 per group)
- `id` (Primary Key)
- `grupoId` (Foreign Key -> grupos_de_productos)
- `fotoUrl` (Photo URL)
- `ordem` (Order/Position)

#### 6. **productos** (Products/Services)
- `id` (Primary Key)
- `grupoId` (Foreign Key -> grupos_de_productos)
- `nome` (Product Name)
- `descricao` (Description)
- `sku` (SKU/Code)
- Timestamps

#### 7. **tabelas_de_preco** (Price Tables)
- `id` (Primary Key)
- `productId` (Foreign Key -> productos)
- `lojaId` (Foreign Key -> lojas)
- `preco` (Price)
- `precoCusto` (Cost Price - optional)
- Timestamps

#### 8. **qr_codes** (QR Codes)
- `id` (Primary Key)
- `tabelaDePrecoId` (Foreign Key -> tabelas_de_preco)
- `codigo` (QR Code string - Unique)
- `descricao` (Description)
- Timestamps

#### 9. **anuncios** (Listings/Announcements)
- `id` (Primary Key)
- `lojaId` (Foreign Key -> lojas)
- `productId` (Foreign Key -> productos)
- `tabelaDePrecoId` (Foreign Key -> tabelas_de_preco)
- `titulo` (Title)
- `descricao` (Description)
- `fotoUrl` (Listing photo URL)
- `status` (Status: "em_edicao", "aguardando_pagamento", "pago", "historico")
- `dataValidade` (Expiration date)
- Timestamps

#### 10. **produtos_em_estoque** (Stock Control)
- `id` (Primary Key)
- `lojaId` (Foreign Key -> lojas)
- `productId` (Foreign Key -> productos)
- `quantidade` (Current quantity)
- `quantidadeMinima` (Minimum quantity)
- `quantidadeMaxima` (Maximum quantity)
- Timestamps
- Unique constraint on (lojaId, productId)

#### 11. **movimentos_estoque** (Stock Movements/History)
- `id` (Primary Key)
- `lojaId` (Foreign Key -> lojas)
- `productId` (Foreign Key -> productos)
- `tipo` (Type: "entrada", "saida", "ajuste")
- `quantidade` (Quantity)
- `motivoSaida` (Reason if exit: "venda", "devolucao", "perda", etc)
- `observacoes` (Observations)
- `dataCriacao` (Created At)

#### 12. **producto_visualizacoes** (Product Views)
- `id` (Primary Key)
- `usuarioId` (Foreign Key -> usuarios, nullable for guests)
- `productId` (Foreign Key -> productos)
- `dataVisualizacao` (View date/time)

#### 13. **qr_code_chamadas** (QR Code Calls/Alerts)
- `id` (Primary Key)
- `usuarioId` (Foreign Key -> usuarios, nullable for guests)
- `qrCodeId` (Foreign Key -> qr_codes)
- `dataChamada` (Call date/time)

## Using the API

### Example: Create a User

```bash
POST /api/usuarios
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "cpf": "12345678901",
  "telefone": "51999999999",
  "endereco": "Rua A, 123, São Paulo"
}
```

### Example: Create a Store

```bash
POST /api/lojas
Content-Type: application/json

{
  "nome": "Minha Loja",
  "cnpjOuCpf": "12345678901234",
  "endereco": "Rua B, 456, São Paulo",
  "descricao": "Loja de eletrônicos",
  "email": "loja@example.com",
  "site": "www.meusite.com",
  "instagram": "@minaloja",
  "facebook": "facebook.com/minaloja"
}
```

### Example: Add User to Store

```bash
POST /api/lojas/usuarios
Content-Type: application/json

{
  "usuarioId": 1,
  "lojaId": 1,
  "tipoUsuario": "gestor"
}
```

## Important Security Notes

1. **Password Hashing**: Currently passwords are stored plain text. You MUST implement bcrypt hashing:
   ```bash
   npm install bcrypt
   ```

2. **Environment Variables**: Never commit `.env` to git. The `.env.example` file shows what variables are needed.

3. **Authentication**: Implement JWT tokens or session management.

4. **SQL Injection**: Prisma prevents SQL injection automatically.

5. **Rate Limiting**: Add rate limiting to your API endpoints.

## Troubleshooting

### Connection Error
- Verify DATABASE_URL is correct
- Check if Supabase project is running
- Ensure firewall allows connections

### Migration Errors
- Check Prisma schema syntax: `npx prisma validate`
- Reset database if needed: `npx prisma migrate reset` (deletes all data)

### Prisma Client Not Found
- Run: `npx prisma generate`
- Check if node_modules/@prisma exists

## Next Steps

1. Implement password hashing with bcrypt
2. Set up authentication (JWT or OAuth)
3. Add input validation to all endpoints
4. Set up error handling middleware
5. Add rate limiting
6. Implement logging
7. Set up testing

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
