# Hafiportrait Photography Platform

Mobile-first wedding photography gallery platform built with Next.js 15.

## 🚀 Tech Stack

- **Framework:** Next.js 15.0.3 (App Router + TypeScript)
- **Database:** NeonDB (PostgreSQL Serverless)
- **ORM:** Prisma 5.7+
- **Realtime:** Socket.IO 4.7+
- **Storage:** Cloudflare R2
- **Cache:** Redis
- **Styling:** Tailwind CSS
- **Auth:** JWT with bcrypt

## 📋 Prerequisites

- Node.js 20+ LTS
- pnpm 8+
- Docker (for Redis)
- NeonDB account

## 🛠️ Development Setup

### 1. Install Dependencies

```bash
# Install pnpm if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Environment Variables

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# - NeonDB connection string
# - Cloudflare R2 credentials
# - NextAuth secret (min 32 characters)
```

### 3. Start Redis

```bash
# Start Redis container
docker run -d --name hafiportrait-redis -p 6379:6379 redis:7-alpine
```

### 4. Database Setup

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# (Optional) Seed database
pnpm prisma:seed
```

### 5. Start Development Server

```bash
# Start Next.js dev server
pnpm dev

# Application runs at:
# http://localhost:3000
```

## 📁 Project Structure

```
hafiportrait/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (public)/          # Public routes
│   ├── admin/             # Admin dashboard
│   ├── client/            # Client dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature components
│   └── layouts/          # Layout components
├── lib/                  # Utilities
│   ├── auth.ts          # Auth utilities
│   ├── prisma.ts        # Prisma client
│   ├── redis.ts         # Redis client
│   ├── r2.ts            # R2 storage client
│   └── socket.ts        # Socket.IO setup
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript types
├── prisma/              # Database schema & migrations
└── public/              # Static assets
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

## 🎨 Code Quality

```bash
# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format
pnpm format:check

# Type checking
pnpm type-check
```

## 📦 Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🌈 Color Palette

- Primary: `#A7EBF2` (Light Cyan)
- Secondary: `#54ACBF` (Teal)
- Accent: `#26658C` (Ocean Blue)
- Dark: `#023859` (Deep Blue)
- Darkest: `#011C40` (Navy)

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm prisma:migrate` - Run database migrations

## 🔗 Documentation

- [PRD Documentation](./docs/prd.md)
- [Architecture Documentation](./docs/architecture.md)
- [API Documentation](./docs/architecture/api-specification.md)

## 📄 License

Copyright © 2024 Hafiportrait. All rights reserved.
