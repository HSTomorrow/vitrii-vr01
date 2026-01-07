# Vitrii Marketplace - Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE ENTITIES                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  USUÁRIOS    │
                              ├──────────────┤
                              │ id (PK)      │
                              │ nome         │
                              │ email (UQ)   │
                              │ senha        │
                              │ cpf (UQ)     │
                              │ telefone     │
                              │ endereco     │
                              │ tipoUsuario  │
                              └──────┬───────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 │ (1:N)             │ (1:N)             │ (M:N)
                 ▼                   ▼                   ▼
          ┌────────────────┐  ┌──────────────────┐  ┌────────────────────┐
          │ USUARIOS_LOJAS │  │ PRODUCTO_        │  │ QR_CODE_CHAMADAS   │
          │                │  │ VISUALIZACOES    │  │                    │
          ├────────────────┤  ├──────────────────┤  ├────────────────────┤
          │ id (PK)        │  │ id (PK)          │  │ id (PK)            │
          │ usuarioId (FK) │  │ usuarioId (FK)   │  │ usuarioId (FK)     │
          │ lojaId (FK)    │  │ productId (FK)   │  │ qrCodeId (FK)      │
          │ tipoUsuario    │  │ dataVisualizacao │  │ dataChamada        │
          └────────┬────────┘  └──────────────────┘  └────────────────────┘
                   │
                   │ (M:1)
                   ▼
          ┌──────────────────┐
          │      LOJAS       │
          ├──────────────────┤
          │ id (PK)          │
          │ nome             │
          │ cnpjOuCpf (UQ)   │
          │ endereco         │
          │ descricao        │
          │ email            │
          │ site             │
          │ instagram        │
          │ facebook         │
          │ fotoUrl          │
          │ status           │
          └────────┬─────────┘
                   │
        ┌──────────┼──────────┬──────────┬───────────┐
        │          │          │          │           │
        │(1:N)     │(1:N)     │(1:N)     │(1:N)      │(1:N)
        ▼          ▼          ▼          ▼           ▼
   ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌──────────────────┐
   │ GRUPOS  │ │PRODUCTOS │ │ ANUNCIOS│ │PRODUTOS_EM │ │MOVIMENTOS_       │
   │ DE_     │ │EM_       │ │         │ │ESTOQUE     │ │ESTOQUE           │
   │PRODUCTOS│ │ESTOQUE   │ │         │ │            │ │                  │
   └────┬────┘ └────┬─────┘ └────┬────┘ └────────────┘ └──────────────────┘
        │           │            │
        │(1:N)      │(1:N)       │(1:N)
        ▼           ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────────────┐
   │FOTOS_    │ │PRODUCTOS │ │TABELAS_DE_PRECO  │
   │GRUPO     │ │          │ │                  │
   │          │ ├──────────┤ ├──────────────────┤
   ├──────────┤ │ id (PK)  │ │ id (PK)          │
   │ id (PK)  │ │ grupoId  │ │ productId (FK)   │
   │ grupoId  │ │ nome     │ │ lojaId (FK)      │
   │ fotoUrl  │ │ descricao│ │ preco            │
   │ ordem    │ │ sku      │ │ precoCusto       │
   └──────────┘ └────┬─────┘ └────────┬─────────┘
                     │                │
                     │(1:N)           │(1:N)
                     │                ▼
                     │           ┌──────────┐
                     │           │ QR_CODES │
                     │           ├──────────┤
                     │           │ id (PK)  │
                     │           │ tabelaId │
                     │           │ codigo   │
                     │           └──────────┘
                     │
                     └─────────────────────────┐
                                              │
                                          ┌───┴────────────┐
                                          │(1:N)           │(1:N)
                                          ▼                ▼
                                    ┌──────────────┐
                                    │   ANUNCIOS   │
                                    ├──────────────┤
                                    │ id (PK)      │
                                    │ lojaId (FK)  │
                                    │ productId    │
                                    │ tabelaId (FK)│
                                    │ titulo       │
                                    │ descricao    │
                                    │ fotoUrl      │
                                    │ status       │
                                    │ dataValidade │
                                    └──────────────┘
```

## Relationship Summary

### Usuários (Users) Relationships
- **1:N** → USUARIOS_LOJAS (One user can be linked to multiple stores)
- **1:N** → PRODUCTO_VISUALIZACOES (One user can view multiple products)
- **1:N** → QR_CODE_CHAMADAS (One user can call multiple QR codes)

### Lojas (Stores) Relationships
- **M:N** → USUÁRIOS (through USUARIOS_LOJAS) (Many users can work in a store)
- **1:N** → GRUPOS_DE_PRODUCTOS (One store has multiple product groups)
- **1:N** → PRODUCTOS_EM_ESTOQUE (One store tracks multiple products)
- **1:N** → ANUNCIOS (One store can have multiple listings)
- **1:N** → MOVIMENTOS_ESTOQUE (One store has multiple stock movements)

### Grupos de Productos (Product Groups) Relationships
- **M:1** → LOJAS (Multiple groups per store)
- **1:N** → FOTOS_GRUPO (One group has multiple photos)
- **1:N** → PRODUCTOS (One group contains multiple products)

### Productos (Products/Services) Relationships
- **M:1** → GRUPOS_DE_PRODUCTOS (Multiple products per group)
- **1:N** → TABELAS_DE_PRECO (One product can have multiple prices per store)
- **1:N** → PRODUCTOS_EM_ESTOQUE (Inventory tracking per store)
- **1:N** → MOVIMENTOS_ESTOQUE (Stock history)
- **1:N** → ANUNCIOS (One product can have multiple listings)

### Tabelas de Preço (Price Tables) Relationships
- **M:1** → PRODUCTOS (Multiple prices for same product in different stores)
- **1:N** → QR_CODES (One price table can have multiple QR codes)
- **1:N** → ANUNCIOS (One price table can be used in multiple listings)

### QR Codes Relationships
- **M:1** → TABELAS_DE_PRECO (Multiple QR codes per price table)
- **1:N** → QR_CODE_CHAMADAS (One QR code can be called multiple times)

### Anuncios (Listings) Relationships
- **M:1** → LOJAS (Multiple listings per store)
- **M:1** → PRODUCTOS (One product can have multiple listings)
- **M:1** → TABELAS_DE_PRECO (Links product price to listing)

### Estoque (Stock Control) Relationships
- **M:1** → LOJAS (Multiple items tracked per store)
- **M:1** → PRODUCTOS (Multiple stock entries per product)
- **1:N** → MOVIMENTOS_ESTOQUE (Stock history per inventory item)

## Key Constraints

### Unique Constraints
- `USUARIOS.email` - Email must be unique per user
- `USUARIOS.cpf` - CPF must be unique per user
- `LOJAS.cnpjOuCpf` - CNPJ/CPF unique per store
- `USUARIOS_LOJAS(usuarioId, lojaId)` - User can only have one role per store
- `PRODUCTOS_EM_ESTOQUE(lojaId, productId)` - One inventory record per product per store
- `QR_CODES.codigo` - QR code string must be unique

### Foreign Key Constraints
All foreign keys use `CASCADE DELETE` to maintain referential integrity

## User Types and Permissions

### Usuário Comum (Regular User)
- Can browse products and announcements
- Can view QR codes
- Cannot publish announcements
- Cannot access store management

### Usuário com Loja (Store User)
- Becomes available through USUARIOS_LOJAS relationship
- Role defined by `tipoUsuario` field

#### Atendente (Attendant)
- Receives alerts for customer QR code scans
- Receives alerts for product inquiries
- Cannot manage store or inventory

#### Gestor (Manager)
- Can do everything Atendente can do
- Can manage users in their store(s)
- Can create and manage product groups
- Can create and manage products
- Can create announcements
- Can manage inventory and stock movements

#### Administrador (Administrator)
- Full system access
- Can manage all stores
- Can manage all users
- System-wide configuration

## Data Flow Examples

### Example 1: Listing a Product
1. User (Gestor) creates a product in GRUPOS_DE_PRODUCTOS
2. Creates product entry in PRODUCTOS
3. Sets price in TABELAS_DE_PRECO (Loja + Producto + Price)
4. Generates QR_CODE for that price table
5. Creates ANUNCIO with product, price table, and photo
6. Sets ANUNCIO.status to "pago" after payment
7. Product appears in marketplace

### Example 2: Customer Scans QR Code
1. Customer scans QR_CODE (can be guest or registered user)
2. System records in QR_CODE_CHAMADAS
3. If clicked "Call attendant", alert sent to Atendente
4. System records PRODUCTO_VISUALIZACAO for analytics

### Example 3: Stock Management
1. Gestor receives inventory
2. Records in MOVIMENTOS_ESTOQUE (tipo: "entrada")
3. Updates PRODUTOS_EM_ESTOQUE.quantidade
4. System can track cost vs sale price
5. Gestor can generate inventory reports

## Data Volume Estimates

For a marketplace with:
- 10,000 users
- 1,000 stores
- 5,000 product groups
- 50,000 products
- 100,000 listings
- 1,000,000 monthly product views
- 500,000 monthly QR code scans

PostgreSQL can handle this easily with proper indexing.

### Recommended Indexes
- `usuarios.email`
- `usuarios.cpf`
- `lojas.cnpjOuCpf`
- `anuncios.status`
- `producto_visualizacoes.usuarioId`
- `producto_visualizacoes.productId`
- `qr_code_chamadas.usuarioId`
- `qr_code_chamadas.qrCodeId`
