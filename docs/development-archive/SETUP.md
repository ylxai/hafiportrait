# Setup Guide - Hafiportrait Photography Platform

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ LTS
- pnpm 8+
- Docker Desktop (for Redis)
- NeonDB account (https://neon.tech)

### Step 1: Install Dependencies

```bash
# Check Node.js version
node --version  # Should be v20.x

# Install pnpm globally if not installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Step 2: Setup Database (NeonDB)

1. **Create NeonDB Account**
   - Go to https://neon.tech
   - Sign up for free account
   - Create new project: `hafiportrait`

2. **Get Connection String**
   - Copy connection string from NeonDB dashboard
   - It looks like: `postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require`

3. **Update .env.local**
   - Open `.env.local` file
   - Replace `DATABASE_URL` and `DIRECT_URL` with your NeonDB connection string

```bash
DATABASE_URL="postgresql://YOUR_NEON_CONNECTION_STRING"
DIRECT_URL="postgresql://YOUR_NEON_CONNECTION_STRING"
```

### Step 3: Start Redis

```bash
# Start Redis container
docker run -d --name hafiportrait-redis -p 6379:6379 redis:7-alpine

# Verify Redis is running
docker ps | grep redis
```

### Step 4: Setup Database Schema

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed database with admin user
pnpm prisma:seed
```

### Step 5: Start Development Server

```bash
# Start Next.js dev server
pnpm dev

# Server will start at:
# http://localhost:3000
```

## ✅ Verify Installation

### 1. Test Homepage
Open browser: http://localhost:3000
- Should see beautiful gradient landing page
- "Hafiportrait" title visible
- "Admin Login" button working

### 2. Test Health API
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-XX...",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 3. Test Admin Login
1. Open: http://localhost:3000/admin/login
2. Login with:
   - **Email:** admin@hafiportrait.com
   - **Password:** admin123
3. Should redirect to dashboard at `/admin/dashboard`

## 🎯 Default Credentials

After seeding, you'll have these accounts:

**Admin Account:**
- Email: admin@hafiportrait.com
- Password: admin123
- Role: ADMIN

**Client Account:**
- Email: client@example.com
- Password: client123
- Role: CLIENT

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:seed      # Seed database

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues
pnpm format           # Format with Prettier
pnpm type-check       # TypeScript check

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
```

## 🔧 Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### Redis not connecting
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis
docker restart hafiportrait-redis

# Check logs
docker logs hafiportrait-redis
```

### Database connection error
```bash
# Verify connection string in .env.local
# Make sure it includes ?sslmode=require

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

### Prisma Client out of sync
```bash
# Regenerate Prisma Client
pnpm prisma:generate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

## 📁 Project Structure

```
hafiportrait/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   │   ├── login/
│   │   └── dashboard/
│   ├── api/               # API routes
│   │   ├── auth/
│   │   └── health/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/                   # Utilities
│   ├── auth.ts
│   ├── prisma.ts
│   └── redis.ts
├── prisma/                # Database
│   ├── schema.prisma
│   └── seed.ts
├── public/                # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.local
```

## 🎨 Features Implemented

### ✅ Epic 1: Foundation & Core Infrastructure

**Story 1.1: Project Initialization** ✅
- Next.js 15.0.3 with TypeScript
- Tailwind CSS configured
- ESLint & Prettier setup
- Git repository initialized

**Story 1.2: Backend Application Bootstrap** ✅
- Next.js API Routes structure
- Health check endpoint
- Database connection (Prisma + NeonDB)
- Redis connection
- Error handling

**Story 1.3: Database Schema Foundation** ✅
- User model (Admin/Client roles)
- Event model (with slug, access code)
- Photo model (with likes counter)
- Comment model (with approval)
- PhotoLike model

**Story 1.4: Admin Authentication System** ✅
- POST /api/auth/login - Login with JWT
- POST /api/auth/logout - Logout
- GET /api/auth/me - Get current user
- Password hashing (bcrypt)
- JWT token generation (jose)

**Story 1.5: Frontend Application Bootstrap** ✅
- Next.js App Router structure
- Tailwind CSS with brand colors
- Global styles
- Responsive layout

**Story 1.6: Admin Login Page UI** ✅
- Professional login form
- Email & password validation
- Show/hide password toggle
- Loading states
- Error messages
- Mobile responsive

**Story 1.7: Protected Route & Dashboard** ✅
- Authentication check
- Protected dashboard page
- Welcome message
- Navigation placeholder
- Logout functionality

**Story 1.9: Simple Landing Page** ✅
- Hero section with gradient
- Brand name & tagline
- CTA buttons
- Services section placeholder
- Footer

## 🌈 Color Palette

- Primary (Cyan): `#A7EBF2`
- Secondary (Teal): `#54ACBF`
- Accent (Blue): `#26658C`
- Dark: `#023859`
- Navy: `#011C40`

## 📝 Next Steps

After completing setup, you're ready for:
1. ✅ Epic 1 completed - Foundation ready
2. 🔄 Epic 2 - Landing Page enhancements
3. 🔄 Epic 3 - Event Management
4. 🔄 Epic 4 - Photo Upload
5. 🔄 Epic 5 - Guest Gallery

## 📞 Support

For issues or questions, check:
- README.md - Project overview
- docs/prd.md - Product requirements
- docs/architecture.md - Technical architecture

---

**Happy Coding! 🎉**
