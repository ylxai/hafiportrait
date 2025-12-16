# Data Models & Database Schema - Hafiportrait Photography Platform

**Last Updated:** December 2024  
**Version:** 2.0 - NeonDB (PostgreSQL Serverless)

---

## Overview

Database schema untuk Hafiportrait menggunakan **NeonDB (PostgreSQL 15+ Serverless)** dengan **Prisma ORM** untuk type-safe database access. Schema dirancang untuk mendukung multi-tenant event management, high-volume photo storage metadata, engagement features, dan analytics tracking.

---

## NeonDB Configuration

### Why NeonDB?

**NeonDB advantages:**
- ✅ **Serverless:** Auto-scaling, pay-per-use
- ✅ **Connection Pooling:** Built-in pooling (no PgBouncer needed)
- ✅ **Branching:** Create database branches untuk development
- ✅ **Point-in-Time Recovery:** Built-in backups
- ✅ **Vercel Integration:** Native integration dengan Vercel
- ✅ **Free Tier:** 0.5GB storage, 10GB data transfer

### Connection Setup

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Environment Variables:**

```bash
# NeonDB connection string (pooled)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hafiportrait?sslmode=require&pgbouncer=true"

# Direct connection for migrations
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/hafiportrait?sslmode=require"
```

### Prisma Client Setup

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## Core Data Models

### 1. User

**Purpose:** Menyimpan data user (Admin/Photographer dan Client/Mempelai). Guest tidak disimpan sebagai user.

```prisma
model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  passwordHash  String    @map("password_hash")
  fullName      String    @map("full_name")
  role          UserRole
  phone         String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  isActive      Boolean   @default(true) @map("is_active")
  
  // Relations
  clientEvents      Event[]           @relation("ClientEvents")
  editingRequests   EditingRequest[]
  photoDownloads    PhotoDownload[]
  
  @@map("users")
}

enum UserRole {
  ADMIN
  CLIENT
}
```

**TypeScript Interface:**
```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'ADMIN' | 'CLIENT';
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}
```

---

### 2. Event

**Purpose:** Menyimpan data event pernikahan dan konfigurasinya.

```prisma
model Event {
  id                  String       @id @default(uuid()) @db.Uuid
  slug                String       @unique
  title               String
  eventDate           DateTime     @map("event_date")
  clientId            String?      @map("client_id") @db.Uuid
  description         String?      @db.Text
  location            String?
  accessCode          String       @unique @map("access_code")
  qrCodeUrl           String?      @map("qr_code_url")
  status              EventStatus  @default(ACTIVE)
  storageExpiresAt    DateTime     @map("storage_expires_at")
  allowDownloads      Boolean      @default(true) @map("allow_downloads")
  allowComments       Boolean      @default(true) @map("allow_comments")
  requireModeration   Boolean      @default(true) @map("require_moderation")
  watermarkEnabled    Boolean      @default(false) @map("watermark_enabled")
  createdAt           DateTime     @default(now()) @map("created_at")
  updatedAt           DateTime     @updatedAt @map("updated_at")
  
  // Relations
  client              User?             @relation("ClientEvents", fields: [clientId], references: [id], onDelete: SetNull)
  photos              Photo[]
  comments            Comment[]
  editingRequests     EditingRequest[]
  photoDownloads      PhotoDownload[]
  guestSessions       GuestSession[]
  analytics           EventAnalytics?
  
  @@index([slug])
  @@index([accessCode])
  @@index([status])
  @@index([clientId])
  @@index([eventDate])
  @@map("events")
}

enum EventStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

**TypeScript Interface:**
```typescript
interface Event {
  id: string;
  slug: string;
  title: string;
  eventDate: Date;
  clientId?: string;
  description?: string;
  location?: string;
  accessCode: string;
  qrCodeUrl?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  storageExpiresAt: Date;
  allowDownloads: boolean;
  allowComments: boolean;
  requireModeration: boolean;
  watermarkEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 3. Photo

**Purpose:** Menyimpan metadata foto. Actual file disimpan di Cloudflare R2.

```prisma
model Photo {
  id              String    @id @default(uuid()) @db.Uuid
  eventId         String    @map("event_id") @db.Uuid
  filename        String
  storageKey      String    @unique @map("storage_key")
  thumbnailKey    String    @map("thumbnail_key")
  fileSize        BigInt    @map("file_size")
  width           Int
  height          Int
  mimeType        String    @map("mime_type")
  takenAt         DateTime? @map("taken_at")
  uploadedAt      DateTime  @default(now()) @map("uploaded_at")
  displayOrder    Int       @default(0) @map("display_order")
  isFeatured      Boolean   @default(false) @map("is_featured")
  metadata        Json?
  
  // Relations
  event           Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  likes           PhotoLike[]
  comments        Comment[]
  downloads       PhotoDownload[]
  
  @@index([eventId])
  @@index([storageKey])
  @@index([displayOrder])
  @@index([isFeatured])
  @@map("photos")
}
```

**TypeScript Interface:**
```typescript
interface Photo {
  id: string;
  eventId: string;
  filename: string;
  storageKey: string;
  thumbnailKey: string;
  fileSize: number;
  width: number;
  height: number;
  mimeType: string;
  takenAt?: Date;
  uploadedAt: Date;
  displayOrder: number;
  isFeatured: boolean;
  metadata?: Record<string, any>;
}
```

---

### 4. PhotoLike

**Purpose:** Tracking likes pada foto oleh guest (tanpa registration).

```prisma
model PhotoLike {
  id          String   @id @default(uuid()) @db.Uuid
  photoId     String   @map("photo_id") @db.Uuid
  sessionId   String   @map("session_id")
  ipAddress   String   @map("ip_address")
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  photo       Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)
  
  @@unique([photoId, sessionId])
  @@index([photoId])
  @@index([sessionId])
  @@map("photo_likes")
}
```

---

### 5. Comment

**Purpose:** Menyimpan komentar/ucapan dari guest dan client.

```prisma
model Comment {
  id            String         @id @default(uuid()) @db.Uuid
  photoId       String?        @map("photo_id") @db.Uuid
  eventId       String         @map("event_id") @db.Uuid
  authorName    String         @map("author_name")
  authorEmail   String?        @map("author_email")
  content       String         @db.Text
  sessionId     String         @map("session_id")
  ipAddress     String         @map("ip_address")
  status        CommentStatus  @default(PENDING)
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")
  
  // Relations
  photo         Photo?         @relation(fields: [photoId], references: [id], onDelete: Cascade)
  event         Event          @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([photoId])
  @@index([eventId])
  @@index([status])
  @@index([sessionId])
  @@index([createdAt])
  @@map("comments")
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

### 6. EditingRequest

**Purpose:** Client requests untuk editing foto.

```prisma
model EditingRequest {
  id            String                 @id @default(uuid()) @db.Uuid
  eventId       String                 @map("event_id") @db.Uuid
  clientId      String                 @map("client_id") @db.Uuid
  photoIds      String[]               @map("photo_ids")
  requestType   EditingRequestType     @map("request_type")
  description   String                 @db.Text
  status        EditingRequestStatus   @default(PENDING)
  adminNotes    String?                @map("admin_notes") @db.Text
  createdAt     DateTime               @default(now()) @map("created_at")
  updatedAt     DateTime               @updatedAt @map("updated_at")
  completedAt   DateTime?              @map("completed_at")
  
  // Relations
  event         Event                  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  client        User                   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([clientId])
  @@index([status])
  @@map("editing_requests")
}

enum EditingRequestType {
  COLOR_CORRECTION
  CROPPING
  RETOUCHING
  OTHER
}

enum EditingRequestStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
}
```

---

### 7. PhotoDownload

**Purpose:** Tracking download activity untuk analytics.

```prisma
model PhotoDownload {
  id            String       @id @default(uuid()) @db.Uuid
  photoId       String?      @map("photo_id") @db.Uuid
  eventId       String       @map("event_id") @db.Uuid
  sessionId     String       @map("session_id")
  userId        String?      @map("user_id") @db.Uuid
  downloadType  DownloadType @map("download_type")
  ipAddress     String       @map("ip_address")
  userAgent     String       @map("user_agent")
  createdAt     DateTime     @default(now()) @map("created_at")
  
  // Relations
  photo         Photo?       @relation(fields: [photoId], references: [id], onDelete: SetNull)
  event         Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user          User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([photoId])
  @@index([eventId])
  @@index([sessionId])
  @@index([createdAt])
  @@map("photo_downloads")
}

enum DownloadType {
  SINGLE
  BATCH_ZIP
  BATCH_ALL
}
```

---

### 8. EventAnalytics

**Purpose:** Aggregated analytics per event.

```prisma
model EventAnalytics {
  id                String   @id @default(uuid()) @db.Uuid
  eventId           String   @unique @map("event_id") @db.Uuid
  totalViews        Int      @default(0) @map("total_views")
  uniqueVisitors    Int      @default(0) @map("unique_visitors")
  totalDownloads    Int      @default(0) @map("total_downloads")
  totalLikes        Int      @default(0) @map("total_likes")
  totalComments     Int      @default(0) @map("total_comments")
  totalPhotos       Int      @default(0) @map("total_photos")
  lastCalculatedAt  DateTime @default(now()) @map("last_calculated_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // Relations
  event             Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@map("event_analytics")
}
```

---

### 9. GuestSession

**Purpose:** Tracking guest sessions tanpa registration.

```prisma
model GuestSession {
  id          String    @id @default(uuid()) @db.Uuid
  sessionId   String    @unique @map("session_id")
  eventId     String?   @map("event_id") @db.Uuid
  ipAddress   String    @map("ip_address")
  userAgent   String    @map("user_agent")
  firstSeenAt DateTime  @default(now()) @map("first_seen_at")
  lastSeenAt  DateTime  @updatedAt @map("last_seen_at")
  pageViews   Int       @default(1) @map("page_views")
  
  // Relations
  event       Event?    @relation(fields: [eventId], references: [id], onDelete: SetNull)
  
  @@index([sessionId])
  @@index([eventId])
  @@map("guest_sessions")
}
```

---

### 10. PortfolioPhoto

**Purpose:** Public portfolio photos untuk landing page.

```prisma
model PortfolioPhoto {
  id            String   @id @default(uuid()) @db.Uuid
  filename      String
  storageKey    String   @unique @map("storage_key")
  thumbnailKey  String   @map("thumbnail_key")
  title         String
  description   String?  @db.Text
  displayOrder  Int      @default(0) @map("display_order")
  isPublished   Boolean  @default(false) @map("is_published")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  @@index([displayOrder])
  @@index([isPublished])
  @@map("portfolio_photos")
}
```

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Enums
enum UserRole {
  ADMIN
  CLIENT
}

enum EventStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum CommentStatus {
  PENDING
  APPROVED
  REJECTED
}

enum EditingRequestType {
  COLOR_CORRECTION
  CROPPING
  RETOUCHING
  OTHER
}

enum EditingRequestStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  REJECTED
}

enum DownloadType {
  SINGLE
  BATCH_ZIP
  BATCH_ALL
}

// Models
model User {
  id              String    @id @default(uuid()) @db.Uuid
  email           String    @unique
  passwordHash    String    @map("password_hash")
  fullName        String    @map("full_name")
  role            UserRole
  phone           String?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastLoginAt     DateTime? @map("last_login_at")
  isActive        Boolean   @default(true) @map("is_active")
  
  clientEvents    Event[]           @relation("ClientEvents")
  editingRequests EditingRequest[]
  photoDownloads  PhotoDownload[]
  
  @@map("users")
}

model Event {
  id                String       @id @default(uuid()) @db.Uuid
  slug              String       @unique
  title             String
  eventDate         DateTime     @map("event_date")
  clientId          String?      @map("client_id") @db.Uuid
  description       String?      @db.Text
  location          String?
  accessCode        String       @unique @map("access_code")
  qrCodeUrl         String?      @map("qr_code_url")
  status            EventStatus  @default(ACTIVE)
  storageExpiresAt  DateTime     @map("storage_expires_at")
  allowDownloads    Boolean      @default(true) @map("allow_downloads")
  allowComments     Boolean      @default(true) @map("allow_comments")
  requireModeration Boolean      @default(true) @map("require_moderation")
  watermarkEnabled  Boolean      @default(false) @map("watermark_enabled")
  createdAt         DateTime     @default(now()) @map("created_at")
  updatedAt         DateTime     @updatedAt @map("updated_at")
  
  client            User?             @relation("ClientEvents", fields: [clientId], references: [id], onDelete: SetNull)
  photos            Photo[]
  comments          Comment[]
  editingRequests   EditingRequest[]
  photoDownloads    PhotoDownload[]
  guestSessions     GuestSession[]
  analytics         EventAnalytics?
  
  @@index([slug])
  @@index([accessCode])
  @@index([status])
  @@index([clientId])
  @@index([eventDate])
  @@map("events")
}

model Photo {
  id            String    @id @default(uuid()) @db.Uuid
  eventId       String    @map("event_id") @db.Uuid
  filename      String
  storageKey    String    @unique @map("storage_key")
  thumbnailKey  String    @map("thumbnail_key")
  fileSize      BigInt    @map("file_size")
  width         Int
  height        Int
  mimeType      String    @map("mime_type")
  takenAt       DateTime? @map("taken_at")
  uploadedAt    DateTime  @default(now()) @map("uploaded_at")
  displayOrder  Int       @default(0) @map("display_order")
  isFeatured    Boolean   @default(false) @map("is_featured")
  metadata      Json?
  
  event         Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  likes         PhotoLike[]
  comments      Comment[]
  downloads     PhotoDownload[]
  
  @@index([eventId])
  @@index([storageKey])
  @@index([displayOrder])
  @@index([isFeatured])
  @@map("photos")
}

model PhotoLike {
  id        String   @id @default(uuid()) @db.Uuid
  photoId   String   @map("photo_id") @db.Uuid
  sessionId String   @map("session_id")
  ipAddress String   @map("ip_address")
  createdAt DateTime @default(now()) @map("created_at")
  
  photo     Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)
  
  @@unique([photoId, sessionId])
  @@index([photoId])
  @@index([sessionId])
  @@map("photo_likes")
}

model Comment {
  id          String        @id @default(uuid()) @db.Uuid
  photoId     String?       @map("photo_id") @db.Uuid
  eventId     String        @map("event_id") @db.Uuid
  authorName  String        @map("author_name")
  authorEmail String?       @map("author_email")
  content     String        @db.Text
  sessionId   String        @map("session_id")
  ipAddress   String        @map("ip_address")
  status      CommentStatus @default(PENDING)
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
  
  photo       Photo?        @relation(fields: [photoId], references: [id], onDelete: Cascade)
  event       Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([photoId])
  @@index([eventId])
  @@index([status])
  @@index([sessionId])
  @@index([createdAt])
  @@map("comments")
}

model EditingRequest {
  id          String                @id @default(uuid()) @db.Uuid
  eventId     String                @map("event_id") @db.Uuid
  clientId    String                @map("client_id") @db.Uuid
  photoIds    String[]              @map("photo_ids")
  requestType EditingRequestType    @map("request_type")
  description String                @db.Text
  status      EditingRequestStatus  @default(PENDING)
  adminNotes  String?               @map("admin_notes") @db.Text
  createdAt   DateTime              @default(now()) @map("created_at")
  updatedAt   DateTime              @updatedAt @map("updated_at")
  completedAt DateTime?             @map("completed_at")
  
  event       Event                 @relation(fields: [eventId], references: [id], onDelete: Cascade)
  client      User                  @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([clientId])
  @@index([status])
  @@map("editing_requests")
}

model PhotoDownload {
  id           String       @id @default(uuid()) @db.Uuid
  photoId      String?      @map("photo_id") @db.Uuid
  eventId      String       @map("event_id") @db.Uuid
  sessionId    String       @map("session_id")
  userId       String?      @map("user_id") @db.Uuid
  downloadType DownloadType @map("download_type")
  ipAddress    String       @map("ip_address")
  userAgent    String       @map("user_agent")
  createdAt    DateTime     @default(now()) @map("created_at")
  
  photo        Photo?       @relation(fields: [photoId], references: [id], onDelete: SetNull)
  event        Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([photoId])
  @@index([eventId])
  @@index([sessionId])
  @@index([createdAt])
  @@map("photo_downloads")
}

model EventAnalytics {
  id               String   @id @default(uuid()) @db.Uuid
  eventId          String   @unique @map("event_id") @db.Uuid
  totalViews       Int      @default(0) @map("total_views")
  uniqueVisitors   Int      @default(0) @map("unique_visitors")
  totalDownloads   Int      @default(0) @map("total_downloads")
  totalLikes       Int      @default(0) @map("total_likes")
  totalComments    Int      @default(0) @map("total_comments")
  totalPhotos      Int      @default(0) @map("total_photos")
  lastCalculatedAt DateTime @default(now()) @map("last_calculated_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  event            Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@map("event_analytics")
}

model GuestSession {
  id          String   @id @default(uuid()) @db.Uuid
  sessionId   String   @unique @map("session_id")
  eventId     String?  @map("event_id") @db.Uuid
  ipAddress   String   @map("ip_address")
  userAgent   String   @map("user_agent")
  firstSeenAt DateTime @default(now()) @map("first_seen_at")
  lastSeenAt  DateTime @updatedAt @map("last_seen_at")
  pageViews   Int      @default(1) @map("page_views")
  
  event       Event?   @relation(fields: [eventId], references: [id], onDelete: SetNull)
  
  @@index([sessionId])
  @@index([eventId])
  @@map("guest_sessions")
}

model PortfolioPhoto {
  id           String   @id @default(uuid()) @db.Uuid
  filename     String
  storageKey   String   @unique @map("storage_key")
  thumbnailKey String   @map("thumbnail_key")
  title        String
  description  String?  @db.Text
  displayOrder Int      @default(0) @map("display_order")
  isPublished  Boolean  @default(false) @map("is_published")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  @@index([displayOrder])
  @@index([isPublished])
  @@map("portfolio_photos")
}
```

---

## Database Migrations

### Creating Migrations

```bash
# Create new migration
pnpm prisma migrate dev --name init

# Apply migrations (production)
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate
```

### Migration Strategy

**Development:**
1. Make schema changes in `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name descriptive_name`
3. Test changes locally
4. Commit migration files

**Production:**
1. Pull latest code with migrations
2. Run `pnpm prisma migrate deploy`
3. Restart application

---

## Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hafiportrait.com' },
    update: {},
    create: {
      email: 'admin@hafiportrait.com',
      passwordHash: adminHash,
      fullName: 'Hafi Admin',
      role: 'ADMIN',
      phone: '+6281234567890',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create sample client
  const clientHash = await bcrypt.hash('client123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'budi.ani@example.com' },
    update: {},
    create: {
      email: 'budi.ani@example.com',
      passwordHash: clientHash,
      fullName: 'Budi & Ani',
      role: 'CLIENT',
      phone: '+6281234567891',
    },
  });
  console.log('✅ Client user created:', client.email);

  // Create sample event
  const event = await prisma.event.upsert({
    where: { slug: 'budi-ani-wedding' },
    update: {},
    create: {
      slug: 'budi-ani-wedding',
      title: 'Pernikahan Budi & Ani',
      eventDate: new Date('2024-12-25'),
      clientId: client.id,
      description: 'Pernikahan Budi dan Ani di Bandung',
      location: 'Grand Ballroom, Hotel XYZ Bandung',
      accessCode: 'BUDIANI2024',
      status: 'ACTIVE',
      storageExpiresAt: new Date('2025-12-25'),
      allowDownloads: true,
      allowComments: true,
      requireModeration: true,
    },
  });
  console.log('✅ Sample event created:', event.slug);

  // Create event analytics
  await prisma.eventAnalytics.upsert({
    where: { eventId: event.id },
    update: {},
    create: {
      eventId: event.id,
    },
  });
  console.log('✅ Event analytics created');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed:**
```bash
pnpm prisma db seed
```

**Configure in package.json:**
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## NeonDB Branching Strategy

### Development Branches

```bash
# Create development branch in NeonDB Console
# Branch name: dev-yourname
# Use this connection string for local development

DATABASE_URL="postgresql://user:password@ep-xxx-dev.neon.tech/hafiportrait_dev?sslmode=require"
```

### Branch Strategy

| Branch | Purpose | Created From |
|--------|---------|--------------|
| `main` | Production database | - |
| `staging` | Staging environment | `main` |
| `dev` | Shared development | `main` |
| `dev-feature-x` | Feature development | `dev` |

**Benefits:**
- ✅ Isolated testing environments
- ✅ Safe schema changes testing
- ✅ Easy rollback if issues
- ✅ No impact on production

---

**Next:** [Deployment Architecture](./deployment.md)
