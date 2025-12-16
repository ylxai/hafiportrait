# Tech Stack - Hafiportrait Photography Platform

**Last Updated:** December 2024  
**Version:** 2.0 - Next.js 15 Fullstack

---

## Technology Stack Table

Berikut adalah stack teknologi definitif yang akan digunakan untuk seluruh project. Semua development harus menggunakan teknologi dan versi yang exact sesuai dengan tabel ini.

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Fullstack Framework** | Next.js | 15.5.9 | React framework dengan App Router + API Routes | Unified frontend/backend, SSR/SSG support, optimized performance, best-in-class DX |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript development | Type safety prevents bugs, better IDE support, self-documenting code |
| **Database** | NeonDB (PostgreSQL) | PostgreSQL 15+ | Serverless PostgreSQL database | Serverless, auto-scaling, built-in connection pooling, cost-effective |
| **ORM/Query Builder** | Prisma | 5.7+ | Type-safe database client | Excellent TypeScript support, migrations, great developer experience |
| **Realtime Engine** | Socket.IO | 4.7+ | WebSocket communication for live features | Reliable realtime, fallback support, room management, battle-tested |
| **Cache** | Redis | 7.2+ | In-memory cache & session store | Fast, supports various data structures, perfect for sessions and caching |
| **File Storage** | Cloudflare R2 | S3-Compatible API | Object storage for photos | Zero egress fees, CDN integration, scalable, cost-effective |
| **CDN** | Cloudflare CDN | Latest | Content delivery network | Integrated with R2, global edge network, DDoS protection, free tier |
| **Image Processing** | Sharp | 0.33+ | High-performance image processing | Fast, memory efficient, supports all required formats |
| **Authentication** | NextAuth.js + bcrypt | NextAuth 4.24+, bcrypt 5.1+ | Authentication solution for Next.js | Built for Next.js, supports JWT & sessions, extensible |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS framework | Mobile-first by default, highly customizable, small bundle size |
| **UI Components** | HeadlessUI + Radix UI | Latest | Accessible unstyled components | Accessible by default, customizable, works with Tailwind |
| **State Management** | Zustand + TanStack Query | Zustand 4.4+, TQ 5.0+ | Client state + server state management | Lightweight, simple API, TanStack Query handles API caching excellently |
| **Form Handling** | React Hook Form + Zod | RHF 7.48+, Zod 3.22+ | Form validation & management | Performant, TypeScript-first validation, great DX |
| **Icon Library** | Lucide React | 0.294+ | Icon components | Tree-shakeable, consistent design, extensive library |
| **Date Handling** | date-fns | 3.0+ | Date manipulation library | Modular, tree-shakeable, better than moment.js |
| **Frontend Testing** | Vitest + React Testing Library | Vitest 1.0+, RTL 14+ | Unit & integration testing | Fast, Vite-native, encourages good testing practices |
| **E2E Testing** | Playwright | 1.40+ | End-to-end testing | Fast, reliable, multi-browser support, excellent mobile testing |
| **Package Manager** | pnpm | 8.0+ | Fast, disk-efficient package manager | Saves disk space, faster than npm/yarn, better monorepo support |
| **Development** | Docker + Docker Compose | Docker 24+, Compose 2.23+ | Local development environment | Consistent environments, easy local development, portable |
| **Deployment (Dev)** | VPS with Public IP | Ubuntu 22.04+ | Development server | Public access for testing, full control, cost-effective |
| **Deployment (Prod)** | Vercel | Latest | Production hosting | Optimized for Next.js, global edge network, zero-config |
| **CI/CD** | GitHub Actions | Latest | Continuous integration & deployment | Free for public repos, integrated with GitHub, flexible workflows |
| **Monitoring** | Sentry + Vercel Analytics | Latest | Error tracking & performance monitoring | Excellent error tracking, performance insights, alerting |
| **Logging** | Pino | 8.16+ | Fast JSON logger for Node.js | Fast, low overhead, structured logging |
| **Validation** | Zod | 3.22+ | TypeScript-first schema validation | Type inference, composable schemas, excellent error messages |
| **Background Jobs** | Custom Next.js API Routes + Cron | Native | Scheduled tasks and background processing | Built-in with Next.js, no external queue needed for MVP |

---

## Major Changes from Previous Architecture

### 1. **Single Codebase (Monolith → Fullstack)**
**Before:** Separate React (Vite) frontend + Express backend  
**Now:** Next.js 15 dengan App Router + API Routes

**Benefits:**
- ✅ Unified codebase, single deployment
- ✅ Automatic code splitting dan optimizations
- ✅ Built-in API routes (no separate Express server)
- ✅ Server components untuk better performance
- ✅ Simplified type sharing (no separate packages needed)
- ✅ Better SEO dengan SSR/SSG support

### 2. **Database (PostgreSQL → NeonDB)**
**Before:** Self-hosted/Managed PostgreSQL  
**Now:** NeonDB Serverless PostgreSQL

**Benefits:**
- ✅ Serverless, pay-per-use pricing
- ✅ Auto-scaling, no connection pool management
- ✅ Built-in connection pooling dan branching
- ✅ Instant database creation untuk dev/staging
- ✅ Free tier untuk development
- ✅ Compatible dengan Prisma

### 3. **Realtime Features (New)**
**Added:** Socket.IO untuk live comments, likes, notifications

**Implementation:**
- Custom Next.js API route untuk Socket.IO server
- Realtime updates untuk photo likes
- Live comment posting dan moderation
- Instant notifications untuk admin
- Room-based isolation per event

### 4. **Development Setup (Local → VPS)**
**Before:** Docker Compose local development  
**Now:** VPS dengan public IP (0.0.0.0 access)

**Benefits:**
- ✅ Public URL untuk testing di real mobile devices
- ✅ WhatsApp testing dengan webhooks
- ✅ Client demos dengan real URLs
- ✅ Same environment as production (staging)

### 5. **Deployment (VM → Vercel)**
**Before:** DigitalOcean VM dengan Docker  
**Now:** Vercel untuk production

**Benefits:**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS dan CDN
- ✅ Global edge network
- ✅ Built-in analytics
- ✅ Automatic scaling
- ✅ CI/CD integrated

---

## Technology Selection Rationale

### Why Next.js 15.5.9?

**Next.js chosen over separate React + Express karena:**

1. **Unified Development Experience**
   - Single codebase untuk frontend dan backend
   - No need untuk separate CORS configuration
   - Shared types tanpa kompleks monorepo setup
   - Single deployment process

2. **Performance Optimizations**
   - Automatic code splitting
   - Image optimization built-in
   - Server components untuk reduced JavaScript
   - Streaming SSR untuk faster page loads
   - App Router dengan nested layouts

3. **Developer Experience**
   - Hot Module Replacement (HMR) untuk full stack
   - API routes collocated dengan pages
   - File-based routing
   - Built-in TypeScript support
   - Excellent documentation dan community

4. **Production Ready**
   - Battle-tested pada enterprise scale
   - Excellent Vercel deployment integration
   - Built-in security best practices
   - Monitoring dan analytics ready

5. **Mobile-First Support**
   - Excellent mobile performance
   - Progressive Web App (PWA) support
   - Responsive images out of the box
   - Optimized for slow networks

**Version 15.5.9 specifically:**
- Latest stable release
- App Router maturity (recommended over Pages Router)
- Turbopack support untuk faster builds
- Improved middleware capabilities
- Better server actions

### Why NeonDB?

**NeonDB chosen over traditional PostgreSQL karena:**

1. **Serverless Architecture**
   - Auto-scaling based on load
   - Pay only untuk what you use
   - No connection pool management
   - Instant cold starts

2. **Developer Experience**
   - Database branching untuk preview deployments
   - Point-in-time recovery
   - Web-based SQL editor
   - Simple connection strings

3. **Cost Effective**
   - Free tier: 0.5GB storage, 10GB data transfer
   - Paid: From $19/month untuk production workloads
   - No egress fees within same region
   - No idle charges

4. **Vercel Integration**
   - Native Vercel integration
   - Automatic environment variables
   - Edge-compatible dengan connection pooling

5. **PostgreSQL Compatible**
   - Full PostgreSQL 15+ compatibility
   - Works perfectly dengan Prisma
   - All existing PostgreSQL tools compatible
   - JSONB support untuk flexible schemas

### Why Socket.IO?

**Socket.IO chosen untuk realtime features karena:**

1. **Reliability**
   - Automatic reconnection
   - Fallback ke polling jika WebSocket fails
   - Built-in heartbeat mechanism
   - Battle-tested di production

2. **Features**
   - Room-based messaging (perfect untuk per-event isolation)
   - Broadcasting capabilities
   - Binary data support (future: live photo uploads)
   - Middleware support untuk authentication

3. **Next.js Integration**
   - Works dengan Next.js API routes
   - Custom server setup available
   - Compatible dengan Vercel (with serverless adapters)

4. **Developer Experience**
   - Simple API
   - Excellent documentation
   - Large ecosystem
   - TypeScript support

**Realtime Use Cases:**
- ✅ Live comment posting (guests see comments instantly)
- ✅ Real-time like updates (heart animations)
- ✅ Admin notifications (new comments, high engagement photos)
- ✅ Live upload progress (future enhancement)
- ✅ Guest presence indicators (future enhancement)

### Why Cloudflare R2?

**Cloudflare R2 tetap dipilih karena:**

1. **Zero Egress Fees**
   - Tidak charge untuk bandwidth keluar
   - Huge cost savings untuk photo delivery platform
   - Predictable costs

2. **S3 Compatibility**
   - Standard S3 API
   - Easy migration jika needed
   - Works dengan existing S3 libraries

3. **CDN Integration**
   - Native Cloudflare CDN integration
   - Global edge caching
   - Fast photo delivery worldwide

4. **Pricing**
   - $0.015/GB storage
   - $0 egress fees
   - Class A operations: $4.50 per million
   - Class B operations: $0.36 per million

### Why VPS for Development?

**VPS dengan public IP untuk development karena:**

1. **Real Device Testing**
   - Test di actual mobile devices (bukan hanya emulators)
   - QR code testing dengan real phones
   - Network condition testing (3G, 4G)

2. **Client Demos**
   - Share real URLs dengan clients
   - Stakeholder testing tanpa VPN
   - Wedding event simulations

3. **Webhook Testing**
   - WhatsApp API webhooks need public URLs
   - Payment gateway webhooks (future)
   - External service integrations

4. **Staging Environment**
   - Production-like environment
   - Database migrations testing
   - Performance testing under load

**Recommended VPS Setup:**
- **Provider:** DigitalOcean, Hetzner, atau Vultr
- **Specs:** 2 vCPU, 4GB RAM, 80GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Cost:** ~$24-36/month
- **Configuration:** Nginx reverse proxy, PM2 untuk process management

### Why Vercel for Production?

**Vercel chosen untuk production deployment karena:**

1. **Next.js Native**
   - Built by Next.js creators
   - Zero-config deployment
   - Automatic optimizations
   - Latest features support

2. **Global Edge Network**
   - Deploy to 20+ regions worldwide
   - Automatic CDN
   - <100ms response times globally

3. **Developer Experience**
   - Git integration (push to deploy)
   - Preview deployments per PR
   - Automatic HTTPS
   - Environment variables management

4. **Scalability**
   - Automatic scaling
   - No server management
   - Handle traffic spikes automatically
   - 99.99% uptime SLA

5. **Cost**
   - Free tier: Hobby projects
   - Pro: $20/month per member
   - Enterprise: Custom pricing
   - No bandwidth charges untuk static assets

6. **Built-in Features**
   - Analytics dan Web Vitals
   - Image Optimization
   - Edge Functions
   - Incremental Static Regeneration

---

## Repository Structure (Updated)

```
hafiportrait/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (public)/              # Public routes group
│   │   ├── [slug]/           # Event gallery pages
│   │   └── portfolio/
│   ├── admin/                 # Admin dashboard
│   │   ├── events/
│   │   ├── photos/
│   │   └── analytics/
│   ├── client/                # Client dashboard
│   │   └── downloads/
│   ├── api/                   # API Routes
│   │   ├── auth/
│   │   ├── events/
│   │   ├── photos/
│   │   ├── comments/
│   │   ├── socket/           # Socket.IO endpoint
│   │   └── webhooks/
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Homepage
├── components/                # React components
│   ├── ui/                   # Base UI components
│   ├── features/             # Feature-specific components
│   │   ├── events/
│   │   ├── photos/
│   │   ├── comments/
│   │   └── realtime/        # Socket.IO components
│   └── layouts/              # Layout components
├── lib/                      # Utilities & configurations
│   ├── prisma.ts            # Prisma client
│   ├── socket.ts            # Socket.IO client
│   ├── auth.ts              # NextAuth config
│   ├── r2.ts                # Cloudflare R2 client
│   └── utils.ts             # Utility functions
├── hooks/                    # Custom React hooks
│   ├── useSocket.ts         # Socket.IO hook
│   ├── useRealtime.ts       # Realtime features hook
│   └── usePhotoUpload.ts    # Upload hook
├── stores/                   # Zustand stores
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── realtimeStore.ts
├── types/                    # TypeScript types
├── prisma/                   # Prisma schema & migrations
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/                   # Static assets
├── styles/                   # Global styles
├── scripts/                  # Build & deployment scripts
├── .env.local               # Local environment variables
├── .env.development         # Development environment (VPS)
├── .env.production          # Production environment (Vercel)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

**Key Changes:**
- ✅ Single `app/` directory (no separate `apps/web` dan `apps/api`)
- ✅ API routes inside `app/api/`
- ✅ Shared types in `types/` (no separate package)
- ✅ Realtime components dan hooks
- ✅ Simplified structure, easier to navigate

---

## Development Environment Requirements

### Required Software

- **Node.js:** v20 LTS
- **pnpm:** v8+ (atau npm v9+)
- **PostgreSQL:** Optional local, NeonDB preferred
- **Redis:** v7+ (Docker atau local)
- **Git:** v2.40+

### Optional but Recommended

- **VS Code** dengan extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
  - Next.js snippets
- **Postman** atau **Insomnia** untuk API testing
- **Redis Commander** untuk Redis debugging
- **Prisma Studio** untuk database management (built-in)

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/hafiportrait.git
cd hafiportrait

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan NeonDB connection string dan API keys

# Run database migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Start development server
pnpm dev
```

**Development URLs:**
- Application: http://localhost:3000
- API: http://localhost:3000/api
- Prisma Studio: Run `pnpm prisma studio`

### VPS Development Setup

```bash
# SSH to VPS
ssh user@your-vps-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Clone repository
git clone https://github.com/yourusername/hafiportrait.git
cd hafiportrait

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.development
# Edit dengan NeonDB connection, Socket.IO config

# Run migrations
pnpm prisma migrate deploy

# Install PM2 (process manager)
npm install -g pm2

# Build application
pnpm build

# Start with PM2
pm2 start "pnpm start" --name hafiportrait

# Setup Nginx reverse proxy
sudo apt install nginx
# Configure Nginx untuk proxy ke localhost:3000

# Setup SSL dengan Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment Variables

### `.env.local` (Local Development)

```bash
# Database (NeonDB)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/hafiportrait?sslmode=require"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="hafiportrait-photos-dev"
R2_PUBLIC_URL="https://your-r2-bucket.r2.dev"

# Socket.IO
SOCKET_IO_ENABLED="true"

# Features
NEXT_PUBLIC_SOCKET_URL="http://localhost:3000"
```

### `.env.development` (VPS Development)

```bash
# Database (NeonDB Development Branch)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/hafiportrait-dev?sslmode=require"

# Redis (VPS local)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="https://dev.hafiportrait.com"
NEXTAUTH_SECRET="your-super-secret-key-production-grade"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="hafiportrait-photos-dev"
R2_PUBLIC_URL="https://dev-photos.hafiportrait.com"

# Socket.IO
SOCKET_IO_ENABLED="true"
SOCKET_IO_CORS_ORIGIN="https://dev.hafiportrait.com"

# WhatsApp (Development)
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_API_KEY="your-dev-key"

# Features
NEXT_PUBLIC_SOCKET_URL="https://dev.hafiportrait.com"
NEXT_PUBLIC_API_URL="https://dev.hafiportrait.com/api"
```

### `.env.production` (Vercel)

```bash
# Database (NeonDB Production)
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/hafiportrait?sslmode=require"

# Redis (Upstash atau Vercel KV)
REDIS_URL="redis://your-redis-url"

# NextAuth
NEXTAUTH_URL="https://hafiportrait.com"
NEXTAUTH_SECRET="production-secret-very-secure"

# Cloudflare R2
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="hafiportrait-photos"
R2_PUBLIC_URL="https://photos.hafiportrait.com"

# Socket.IO (Vercel deployment)
SOCKET_IO_ENABLED="true"
SOCKET_IO_CORS_ORIGIN="https://hafiportrait.com"

# WhatsApp (Production)
WHATSAPP_API_URL="https://api.whatsapp.com"
WHATSAPP_API_KEY="your-production-key"
WHATSAPP_PHONE_NUMBER="+6281234567890"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"

# Features
NEXT_PUBLIC_SOCKET_URL="https://hafiportrait.com"
NEXT_PUBLIC_API_URL="https://hafiportrait.com/api"
NEXT_PUBLIC_CDN_URL="https://photos.hafiportrait.com"
```

---

## Version Management Strategy

### LTS vs Latest

- **Node.js:** Use LTS version (v20) untuk stability
- **Next.js:** Use 15.5.9 (latest stable), update quarterly
- **PostgreSQL:** NeonDB manages versions automatically (15+)
- **Dependencies:** Pin major versions, allow minor/patch updates

### Update Policy

- **Security patches:** Immediate update
- **Minor versions:** Monthly review dan update
- **Major versions:** Quarterly review, thorough testing before upgrade
- **Lock files:** Commit `pnpm-lock.yaml` untuk reproducible builds

### Dependency Audit

```bash
# Run audit weekly
pnpm audit

# Check for updates
pnpm outdated

# Update dependencies (careful with major versions)
pnpm update
```

---

## Tech Stack Decision Log

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| Dec 2024 | Next.js 15 over Vite + Express | Unified codebase, better DX, optimized performance | ✅ Approved |
| Dec 2024 | NeonDB over self-hosted PostgreSQL | Serverless, cost-effective, Vercel integration | ✅ Approved |
| Dec 2024 | Socket.IO for realtime | Reliability, features, Next.js compatibility | ✅ Approved |
| Dec 2024 | Cloudflare R2 storage | Zero egress fees, cost-effective for photos | ✅ Approved |
| Dec 2024 | VPS for development | Public access, real device testing, webhooks | ✅ Approved |
| Dec 2024 | Vercel for production | Next.js native, global CDN, zero-config | ✅ Approved |
| Dec 2024 | Prisma ORM retained | Type safety, excellent DX, NeonDB compatible | ✅ Approved |

---

## Migration Notes (from Previous Architecture)

### Breaking Changes

1. **Monorepo to Single Repo**
   - Previous: Separate `apps/web` dan `apps/api`
   - Now: Single Next.js app
   - **Action:** Merge codebases, migrate API routes

2. **Express to Next.js API Routes**
   - Previous: Express middleware dan routes
   - Now: Next.js API routes dengan Route Handlers
   - **Action:** Rewrite endpoints, adapt middleware

3. **Database Connection**
   - Previous: Direct PostgreSQL connection
   - Now: NeonDB dengan connection pooling
   - **Action:** Update connection strings, test pooling

4. **Deployment**
   - Previous: Docker on VM
   - Now: Vercel serverless
   - **Action:** Update CI/CD, environment variables

### Backward Compatibility

- ✅ **Prisma Schema:** Compatible, no changes needed
- ✅ **Database:** PostgreSQL compatible
- ✅ **Storage:** Cloudflare R2 retained
- ✅ **Frontend Components:** React components portable
- ⚠️ **API Endpoints:** Need rewrite untuk Next.js API routes
- ⚠️ **Authentication:** Migrate to NextAuth.js

---

**Next:** [API Specification (Next.js API Routes)](./api-specification.md)
