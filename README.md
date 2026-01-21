# 📸 Hafiportrait Photography Platform

<div align="center">

**Professional Photography Platform for Wedding, Prewedding & Event Documentation**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-NeonDB-4169e1?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Deployment](https://img.shields.io/badge/Deployed-VPS%20%2B%20PM2-blue?style=flat-square&logo=linux)](#deployment)

[Live Demo](https://hafiportrait.photography) • [Report Bug](mailto:dev@hafiportrait.photography) • [Request Feature](https://wa.me/6289570050193)

</div>

---

## 🎯 About Hafiportrait

Hafiportrait Photography is a modern photography business platform based in **Kelampaian Tengah, Banjar, Kalimantan Selatan**. This platform provides comprehensive event management, photo gallery, and client interaction tools for professional photography services.

### 📍 Business Information

- **Name:** Hafiportrait Photography
- **Location:** Kelampaian Tengah, Banjar, Kalimantan Selatan, Indonesia
- **Phone:** [+62 895-7005-03193](tel:+6289570050193)
- **Email:** [dev@hafiportrait.photography](mailto:dev@hafiportrait.photography)
- **Instagram:** [@hafiportrait](https://instagram.com/hafiportrait)
- **WhatsApp:** [Contact Us](https://kirimwa.id/hafiportraits)

---

## ✨ Features

### 🎨 Client-Facing Features
- **Hero Slideshow** - Dynamic image carousel with swipe gestures and auto-play
- **Service Showcase** - Detailed presentation of photography services
- **Mobile-First Design** - Fully responsive across all devices
- **Guest Gallery Access** - Secure photo viewing with unique access codes
- **WhatsApp Integration** - Direct messaging for inquiries
- **Conversational Contact Forms** - Engaging multi-step contact flow

### 🛠️ Admin Features
- **Event Management Dashboard** - Create, edit, and manage photography events
- **Photo Upload System** - Drag-and-drop interface supporting up to 200MB files
- **Gallery Management** - Organize and categorize event photos
- **Client Access Control** - Generate and manage guest access codes
- **Analytics Dashboard** - Track gallery views and engagement

### 🎬 Photography Services

1. **Fotografi Pernikahan** - Comprehensive wedding day coverage with cinematic storytelling
2. **Prewedding** - Romantic couple sessions at stunning locations
3. **Tasmiyah & Tasyakuran** - Islamic ceremony documentation with cultural sensitivity
4. **Ulang Tahun** - Birthday celebration photography with creative concepts
5. **Studio Couple** - Professional studio portrait sessions

---

## 🚀 Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion
- **UI Components:** Radix UI, Shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation

### Backend
- **API:** Next.js API Routes
- **ORM:** Prisma
- **Database:** PostgreSQL (NeonDB)
- **Authentication:** Custom JWT-based system
- **File Upload:** Native Next.js API with multipart support

### DevOps & Deployment
- **Hosting:** VPS (Nginx + PM2)
- **Realtime:** Socket.IO server (`npm run start:socket`)
- **Database:** NeonDB (PostgreSQL)
- **Cache/Queue:** Redis (optional, for Socket.IO adapter/caching)
- **Version Control:** Git
- **Package Manager:** npm

---

## 📦 Installation

### Prerequisites

- Node.js 20+ (required by `package.json` engines)
- npm
- PostgreSQL database (Neon recommended)
- Git

### Clone Repository

```bash
git clone <YOUR_REPO_URL>
cd hafiportrait
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

---

## ⚙️ Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/hafiportrait?sslmode=require"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ADMIN_PASSWORD_HASH="your-bcrypt-hashed-admin-password"

# Application
# Public site URL (used in links/metadata). In production, set to your domain.
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Upload Configuration
MAX_FILE_SIZE=209715200  # 200MB in bytes
UPLOAD_DIR="./public/uploads"

# Business Information
NEXT_PUBLIC_BUSINESS_NAME="Hafiportrait Photography"
NEXT_PUBLIC_BUSINESS_PHONE="+6289570050193"
NEXT_PUBLIC_BUSINESS_EMAIL="dev@hafiportrait.photography"
NEXT_PUBLIC_WHATSAPP_URL="https://kirimwa.id/hafiportraits"
NEXT_PUBLIC_INSTAGRAM="hafiportrait"
```

### Generate Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Seed initial data
npx prisma db seed
```

---

## 🛠️ Development

### Run Development Server

Run the Next.js app only:

```bash
npm run dev
```

Run Next.js + Socket server together (recommended for realtime features):

```bash
npm run start:dev:all
```

Open:
- Web app: http://localhost:3000
- Socket server: http://localhost:3001/health


### Build for Production

```bash
npm run build
npm run start
```

### Database Management

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Code Quality

```bash
# Run TypeScript type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format
```

---

## 📚 API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
Admin login endpoint.

```typescript
// Request
{
  "username": "admin",
  "password": "your-password"
}

// Response
{
  "success": true,
  "token": "jwt-token-here"
}
```

### Event Management Endpoints

#### `GET /api/events`
Fetch all events (public events only for non-admin).

```typescript
// Response
{
  "events": [
    {
      "id": "uuid",
      "title": "Wedding of John & Jane",
      "date": "2024-01-15",
      "category": "wedding",
      "accessCode": "GUEST123",
      "photos": []
    }
  ]
}
```

#### `POST /api/events`
Create new event (admin only).

```typescript
// Request
{
  "title": "Wedding of John & Jane",
  "date": "2024-01-15",
  "category": "wedding",
  "description": "Beautiful wedding ceremony",
  "location": "Banjar, Kalimantan Selatan"
}

// Response
{
  "success": true,
  "event": { /* event object */ },
  "accessCode": "GUEST123"
}
```

#### `PUT /api/events/[id]`
Update event (admin only).

#### `DELETE /api/events/[id]`
Delete event (admin only).

### Photo Upload Endpoints

#### `POST /api/admin/events/:eventId/photos/upload`
Upload photos to an event (admin only).

```typescript
// FormData with:
// - files: File[] (max 200MB per file)

// Response
{
  "success": true,
  "uploaded": number,
  "failed": number,
  "results": Array<{ success: boolean; error?: string }>
}
```

### Gallery Access Endpoints

#### `POST /api/gallery/access`
Verify guest access code.

```typescript
// Request
{
  "accessCode": "GUEST123"
}

// Response
{
  "success": true,
  "event": { /* event with photos */ }
}
```

---

## 🚢 Deployment

This project is deployed on a VPS using **Nginx + PM2** (and a separate Socket.IO server).

- Production runbook: `deployment/README.md`
- PM2 helper script (recommended): `bash scripts/pm2-control.sh help`

### Production processes

- **Main app (Next.js)**: `npm run build` then `npm run start` via PM2
- **Realtime socket server**: `npm run start:socket` via PM2

### Quick deploy (VPS)

```bash
npm install
npm run build
bash scripts/pm2-control.sh restart-safe+health
```

> Health endpoints used by the script (override if needed):
> - `BASE_URL=http://localhost:3000/api/health`
> - `SOCKET_URL=http://localhost:3001/health`

---

## 📁 Project Structure (high level)

```
app/                       # Next.js App Router pages
  admin/                   # Admin UI pages
  api/                     # API route handlers
  [eventSlug]/             # Public event pages
components/                # Reusable components (admin/gallery/landing)
hooks/                     # Client hooks (auth, socket, likes/comments, etc.)
lib/                       # Core domain logic (auth, security, upload, storage, prisma, redis)
prisma/                    # Prisma schema + migrations + seeds
server/                    # Socket.IO server entry
public/                    # Static assets (incl. sw.js)
deployment/                # VPS deployment configs (nginx/redis/scripts)
scripts/                   # Operational scripts (pm2-control, audits)
```

Related docs:
- Database models: `DATABASE_SCHEMA.md`
- Production runbook: `deployment/README.md`
- PM2 helper: `scripts/pm2-control.sh`


---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is proprietary software owned by **Hafiportrait Photography**. All rights reserved.

For licensing inquiries, contact: [dev@hafiportrait.photography](mailto:dev@hafiportrait.photography)

---

## 📞 Contact & Support

### Business Inquiries
- **Instagram:** [@hafiportrait](https://instagram.com/hafiportrait)
- **WhatsApp:** [Chat with us](https://kirimwa.id/hafiportraits)
- **Phone:** [+62 895-7005-03193](tel:+6289570050193)

### Technical Support
- **Email:** [dev@hafiportrait.photography](mailto:dev@hafiportrait.photography)
- **Issues:** [GitHub Issues](https://github.com/yourusername/hafiportrait-platform/issues)

---

## 🙏 Acknowledgments

- Built with ❤️ by the Hafiportrait Development Team
- Special thanks to our clients and the photography community
- Proudly serving **Banjar, Kalimantan Selatan** and beyond

---

<div align="center">

**© 2024 Hafiportrait Photography. All Rights Reserved.**

[Website](https://hafiportrait.photography) • [Instagram](https://instagram.com/hafiportrait) • [WhatsApp](https://kirimwa.id/hafiportraits)

</div>
