# Vitrii - Marketplace Platform

![Vitrii Logo](https://img.shields.io/badge/Vitrii-Marketplace-orange)
![Status](https://img.shields.io/badge/Status-Active%20Development-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Overview

**Vitrii** is a comprehensive marketplace platform designed to connect buyers and sellers in a multi-tenant environment. It combines modern e-commerce features with service scheduling, real-time communication, and advanced search capabilities.

### Key Features

- 🏪 **Multi-Tenant Architecture** - Multiple stores and users with isolated data
- 📋 **Ad Management System** - Create, publish, and manage product/service listings
- ⭐ **Featured Listings** - Highlight premium ads on the homepage
- 📅 **Service Scheduling** - Book appointments with automated waiting list management
- 🔍 **Advanced Search** - Filter by category, price range, store, and featured status
- 💳 **QR Code Generation** - Generate direct links to ads with scan tracking
- 👥 **Sales Teams** - Organize users into teams for better coordination
- 📦 **Inventory Management** - Track stock levels and movements
- 💰 **Pricing Tables** - Manage variants and pricing for products
- 🎨 **Category-Specific Fields** - Specialized data for Clothes, Cars, and Real Estate
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔐 **Secure Authentication** - User sign-in and sign-up with JWT

### Coming Soon

- 💬 **Chat System** - Public/private messaging between buyers and sellers
- 💳 **Pix Payments** - Brazilian payment integration
- 📦 **Inline Creation** - Create products without leaving the ad form

---

## 🛠 Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **Tanstack Query** for data fetching
- **Sonner** for notifications
- **Lucide Icons** for UI icons

### Backend

- **Express.js** for REST API
- **PostgreSQL** for database
- **Prisma ORM** for database management
- **Zod** for schema validation
- **Multer** for file uploads

### Infrastructure

- **Docker** for containerization
- **Supabase/Neon** for managed PostgreSQL
- **Netlify** for deployment

---

## 📂 Project Structure

```
vitrii-vr01/
├── client/                    # Frontend React application
│   ├── pages/                # Page components
│   │   ├── Index.tsx          # Homepage
│   │   ├── Browse.tsx         # Browse ads
│   │   ├── Sell.tsx           # Sell page
│   │   ├── Agenda.tsx         # Service scheduling
│   │   ├── SearchAnuncios.tsx # Ad search
│   │   ├── SearchProdutos.tsx # Product search by store
│   │   ├── CriarAnuncio.tsx   # Create ad
│   │   ├── AnuncioDetalhe.tsx # Ad details
│   │   ├── QRCode.tsx         # QR code generator
│   │   └── ...
│   ├── components/           # Reusable components
│   │   ├── Header.tsx        # Navigation header
│   │   ├── Footer.tsx        # Footer
│   │   ├── WaitlistModal.tsx # Waiting list management
│   │   └── ...
│   ├── contexts/             # React Context
│   │   └── AuthContext.tsx   # Authentication state
│   └── App.tsx               # Root component
│
├── server/                    # Backend Express server
│   ├── routes/               # API routes
│   │   ├── usuarios.ts       # User management
│   │   ├── lojas.ts          # Store management
│   │   ├── anuncios.ts       # Ad management
│   │   ├── agendas.ts        # Service scheduling
│   │   ├── qrcodes.ts        # QR code generation
│   │   └── ...
│   ├── lib/                  # Utilities
│   │   └── prisma.ts         # Prisma client
│   └── index.ts              # Server entry point
│
├── prisma/                    # Database schema
│   └── schema.prisma         # Prisma data model
│
├── public/                    # Static files
├── package.json              # Dependencies
└── README.md                 # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL 12+
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/HSTW-Herestomorrow/vitrii-vr01.git
cd vitrii-vr01
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your database URL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/vitrii"
```

4. **Set up database**

```bash
npx prisma migrate dev
npx prisma generate
```

5. **Start development server**

```bash
pnpm run dev
```

The application will be available at `http://localhost:8080`

---

## 📖 API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user

### Users

- `GET /api/usuarios` - List all users
- `GET /api/usuarios/:id` - Get user details
- `PUT /api/usuarios/:id` - Update user
- `DELETE /api/usuarios/:id` - Delete user

### Stores (Lojas)

- `GET /api/lojas` - List all stores
- `GET /api/lojas/:id` - Get store details
- `POST /api/lojas` - Create store
- `PUT /api/lojas/:id` - Update store

### Products

- `GET /api/productos` - List products
- `GET /api/productos/:id` - Get product details
- `POST /api/productos` - Create product
- `PUT /api/productos/:id` - Update product

### Ads (Anúncios)

- `GET /api/anuncios` - List ads (with filters for featured, status)
- `GET /api/anuncios/:id` - Get ad details
- `POST /api/anuncios` - Create ad
- `PUT /api/anuncios/:id` - Update ad
- `PATCH /api/anuncios/:id/status` - Update ad status
- `PATCH /api/anuncios/:id/inactivate` - Deactivate ad
- `PATCH /api/anuncios/:id/activate` - Reactivate ad

### Service Schedule (Agenda)

- `GET /api/agendas` - List time slots
- `GET /api/agendas/:id` - Get slot details
- `POST /api/agendas` - Create new slot
- `PATCH /api/agendas/:id/status` - Update slot status
- `DELETE /api/agendas/:id` - Cancel slot

### Waiting List

- `POST /api/agendas/waitlist/add` - Add to waiting list
- `GET /api/agendas/:agendaId/waitlist` - View waiting list
- `DELETE /api/agendas/waitlist/:waitlistId` - Remove from list
- `POST /api/agendas/:agendaId/waitlist/promote` - Promote next person

### QR Codes

- `POST /api/qrcodes/generate` - Generate QR code
- `GET /api/anuncios/:anuncioId/qrcodes` - Get ad QR codes
- `POST /api/qrcodes/:qrCodeId/track` - Track QR code scan
- `GET /api/qrcodes/:qrCodeId/stats` - Get QR code stats

### Sales Teams

- `GET /api/equipes-venda` - List teams
- `POST /api/equipes-venda` - Create team
- `POST /api/equipes-venda/:id/membros` - Add team member
- `DELETE /api/equipes-venda/:id/membros/:membroId` - Remove member

---

## 🎨 Features in Detail

### 1. Ad Management

- Create listings with title, description, photos, and pricing
- Support for multiple categories (Clothes, Cars, Real Estate)
- Category-specific fields (size/color for clothes, mileage for cars, etc.)
- Manage ad status (draft, awaiting payment, published, archived)
- Logical deletion (ads stay in system but hidden)
- Featured/highlighted ads for premium placement

### 2. Service Scheduling

- Create available time slots for services
- Book appointments with customers
- Automatic waiting list when slots are full
- FIFO (First In, First Out) promotion system
- View current occupant and waiting list
- Cancel or reschedule appointments

### 3. QR Code System

- Generate unique QR codes for each ad
- Direct links to product details
- Track scans and visit statistics
- Multiple QR codes per ad variant

### 4. Search & Discovery

- Advanced filtering by category, price, store, featured status
- Sort by most recent or most featured
- Search products by store with pricing variants
- Save search preferences

### 5. Multi-Tenancy

- Isolated data per store/user
- Role-based access (attendent, manager, admin)
- User-store relationships for permission management

### 6. Inventory Management

- Track product quantities in each store
- Record inventory movements (entry, exit, adjustment)
- Set minimum/maximum stock levels

---

## 📝 Database Schema

The project uses PostgreSQL with Prisma ORM. Key models:

- **Usuario** - Users with authentication
- **Loja** - Stores/shops
- **UsuarioLoja** - User-store relationships with roles
- **Producto** - Products/services
- **GrupoDeProductos** - Product categories
- **TabelaDePreco** - Pricing variants
- **Anuncio** - Listings/advertisements
- **Agenda** - Service schedule slots
- **EquipeDeVenda** - Sales teams
- **QRCode** - QR code tracking
- **MovimentoEstoque** - Inventory movements
- **ProdutoEmEstoque** - Stock levels

---

## 🔐 Authentication & Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Multi-tenant data isolation
- Input validation with Zod schemas

---

## 📦 Deployment

### Production Build

```bash
pnpm run build
```

### Docker Deployment

```bash
docker build -t vitrii:latest .
docker run -p 8080:8080 vitrii:latest
```

### Environment Variables

Key variables to configure:

- `DATABASE_URL` - PostgreSQL connection string
- `BASE_URL` - Frontend base URL for QR codes
- `NODE_ENV` - Set to "production" for production builds

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Test changes before submitting PR
- Update README if adding new features

---

## 📋 Roadmap

- [ ] Payment Integration (Pix)
- [ ] Real-time Chat System
- [ ] Inline Product Creation
- [ ] Advanced Analytics
- [ ] Mobile App (React Native)
- [ ] Notification System (Email/SMS)
- [ ] Review & Rating System
- [ ] Promotional Coupons
- [ ] Bulk Upload/Import

---

## 🐛 Known Issues & Limitations

- Chat system not yet implemented
- Payment gateway integration pending
- Mobile app not available (web-responsive only)
- Email notifications not configured

---

## 📞 Support & Contact

For support, questions, or feedback:

- 📧 Email: support@vitrii.com
- 🐙 GitHub Issues: [Report Bug](https://github.com/HSTW-Herestomorrow/vitrii-vr01/issues)
- 💬 Discussions: [Start Discussion](https://github.com/HSTW-Herestomorrow/vitrii-vr01/discussions)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev)
- Database by [PostgreSQL](https://www.postgresql.org)
- ORM by [Prisma](https://www.prisma.io)
- Styling with [TailwindCSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

---

## 📊 Project Statistics

- **Total Features**: 15+
- **API Endpoints**: 40+
- **Database Models**: 16
- **Pages**: 20+
- **Components**: 30+
- **Code Files**: 100+

---

**Last Updated**: January 2025  
**Version**: 1.0.0 (Beta)

---

Made with ❤️ by [HSTW HeresTomorrow](https://github.com/HSTW-Herestomorrow)
