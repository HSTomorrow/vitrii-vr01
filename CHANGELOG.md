# Changelog

All notable changes to Vitrii will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta] - 2025-01-07

### 🎉 Initial Release (Beta)

#### Added - Core Features

**Database & Multi-Tenancy**

- PostgreSQL with Prisma ORM
- Multi-tenant data isolation
- User-store relationships with role-based access
- Logical deletion (soft delete) for data preservation
- Support for 16 core database models

**Ad Management System**

- Create, read, update, delete (CRUD) ads
- Ad status management (draft → awaiting payment → published → archived)
- Featured/highlighted ads for premium placement
- Category-specific fields:
  - 👕 Clothes (size, color, material)
  - 🚗 Cars (brand, mileage, transmission)
  - 🏠 Real Estate (rooms, area, type)
- Ad inactivation/reactivation (logical deletion)
- Image upload support

**Service Scheduling (Agenda)**

- Create available time slots
- Book appointments
- View and manage waiting lists
- FIFO (First In, First Out) promotion system
- Automatic waiting list when slots are full
- Cancel/reschedule functionality
- Time slot status tracking (available, occupied, canceled)

**QR Code System**

- Generate unique QR codes per ad
- Direct links to product/ad details
- Scan tracking and visit statistics
- Multiple QR codes support per product variant
- Base64 data URL generation

**Search & Discovery**

- Advanced ad search with multi-criteria filtering
  - Filter by category
  - Price range (min/max)
  - Store/seller
  - Featured status
  - Ad status
- Sort by most recent or featured
- Featured ads highlighted on homepage
- Dedicated product search by store
- Pricing variants display in search results
- Pagination support

**Inventory Management**

- Stock level tracking per store
- Inventory movement history (entry, exit, adjustment)
- Minimum/maximum stock alerts
- Movement reason tracking (sale, return, loss, etc.)

**Pricing & Variants**

- Price table management with variants
- Size, color, or custom variant support
- Cost price tracking
- Product variant active/inactive toggle

**User & Store Management**

- User registration and authentication
- JWT-based secure login
- Store creation and management
- User-store role assignment
  - Attendant (atendente)
  - Manager (gestor)
  - Administrator (administrador)

**Sales Teams**

- Create and manage sales teams per store
- Add/remove team members
- Team-based ad assignment
- Team member availability tracking

**Frontend Features**

- Responsive design (mobile, tablet, desktop)
- Header navigation with dropdown menus
- Footer with links and information
- Toast notifications (Sonner)
- Modal dialogs for complex interactions
- Form validation
- Loading states
- Error handling

**API Endpoints**

- 40+ RESTful API endpoints
- Proper HTTP status codes
- JSON request/response format
- Zod schema validation
- Error message responses

#### Technology Stack

**Frontend**

- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Tanstack Query for data management
- Sonner for notifications
- Lucide Icons

**Backend**

- Express.js server
- PostgreSQL database
- Prisma ORM
- Zod schema validation
- Multer for file uploads

**Infrastructure**

- Docker support
- Environment variable configuration
- CORS enabled
- Static file serving

#### Documentation

- Comprehensive README.md
- Contributing guidelines
- MIT License
- This CHANGELOG

### 🚧 Known Limitations

- Chat system not yet implemented
- Payment gateway (Pix) not yet integrated
- Inline product creation during ad form not yet available
- Email notifications not configured
- Mobile app not available (web-responsive only)

### 🔐 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- SQL injection prevention (Prisma ORM)
- XSS protection
- CORS configuration
- Input validation with Zod

### 📊 Project Statistics

- **API Endpoints**: 40+
- **Database Models**: 16
- **Pages**: 20+
- **Components**: 30+
- **Frontend Routes**: 25+
- **Total Code Files**: 100+
- **Database Tables**: 16

---

## [Unreleased] - Coming Soon

### Planned Features

#### Payment Integration

- [ ] Pix payment gateway integration
- [ ] Payment status tracking
- [ ] Invoice generation
- [ ] Transaction history

#### Real-time Chat

- [ ] Direct messaging between users
- [ ] Public chat for ads
- [ ] Private messages
- [ ] Read receipts
- [ ] Message history
- [ ] Typing indicators

#### Enhanced Ad Creation

- [ ] Inline product creation (no page navigation)
- [ ] Inline store creation
- [ ] Quick variant addition
- [ ] Bulk import/export

#### Advanced Features

- [ ] Review and rating system
- [ ] User reputation/trust score
- [ ] Promotional coupons/discounts
- [ ] Analytics dashboard
- [ ] Advanced reporting

#### Notifications

- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Push notifications
- [ ] Notification preferences

#### Performance

- [ ] Query optimization
- [ ] Caching strategies
- [ ] Image optimization
- [ ] CDN integration
- [ ] API rate limiting

---

## Version History Summary

### 1.0.0-beta (Current)

- ✅ Complete core marketplace functionality
- ✅ Service scheduling with waiting lists
- ✅ QR code generation and tracking
- ✅ Advanced search and filtering
- ✅ Multi-tenant architecture
- ✅ 40+ API endpoints
- 🚧 Awaiting: Payments, Chat, Advanced features

---

## How to Update

To stay updated with the latest version:

```bash
# Fetch latest changes
git fetch origin

# Update to latest version
git pull origin main

# Install new dependencies if any
pnpm install

# Run database migrations
npx prisma migrate deploy

# Start development server
pnpm run dev
```

---

## Breaking Changes

**None yet** - This is the initial beta release.

When breaking changes are introduced in future versions, they will be documented here with migration guides.

---

## Migration Guides

No migrations required for the initial release.

---

## Support & Questions

- 📖 [Documentation](README.md)
- 🐛 [Bug Reports](https://github.com/HSTW-Herestomorrow/vitrii-vr01/issues)
- 💬 [Discussions](https://github.com/HSTW-Herestomorrow/vitrii-vr01/discussions)
- 📧 [Contact Support](mailto:support@vitrii.com)

---

**Last Updated**: January 7, 2025  
**Version**: 1.0.0-beta

---

Thank you for using Vitrii! 🙏
