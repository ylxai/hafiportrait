# HafiPortrait Photography System - AI Memory

## 🎯 **PROJECT OVERVIEW**
Photography platform untuk event photo sharing dengan admin dashboard lengkap.

## 🏗️ **TECH STACK**
- **Framework**: Next.js 14.2.15 + App Router + TypeScript (strict)
- **Database**: Supabase PostgreSQL (azspktldiblhrwebzmwq)
- **Storage**: Cloudflare R2 (primary) + Google Drive (backup only)
- **UI**: React 18 + Tailwind CSS + Radix UI + Framer Motion
- **Real-time**: Socket.IO + WebSocket dual support
- **Image Processing**: Sharp dengan automatic optimization
- **Process Management**: PM2 (multiple configs)

## 🔧 **STORAGE SYSTEM STATUS**

### ✅ **ACTIVE (USE THESE)**
```typescript
import { directR2Uploader } from '@/lib/direct-r2-uploader';
import { database } from '@/lib/database';
```

### ❌ **DEPRECATED (THROWS ERRORS)**
```typescript
// THESE WILL BREAK:
import { storageAdapter } from '@/lib/storage-adapter';
import { smartDatabase } from '@/lib/database-with-smart-storage';
```

### 📊 **Database Schema Key Fields**
```sql
-- photos table
storage_provider: 'cloudflare-r2'  -- All new photos
google_drive_backup_url           -- Backup URL only
storage_path                      -- R2 object path
```

## 🎨 **APPLICATION STRUCTURE**

### **Public Pages**
- `/` - Homepage (hero slideshow + gallery + pricing)
- `/event/[id]` - Event galleries dengan access code
- **Features**: Photo upload, guestbook, reactions

### **Admin Dashboard** (`/admin`)
- Event management (CRUD, status, archiving)
- Photo management (bulk operations, compression analytics)
- User analytics & session monitoring
- Real-time health monitoring
- Pricing packages management

### **API Routes** (`/api`)
- `/api/events/[id]/photos` - Event photo CRUD
- `/api/photos/homepage` - Homepage photos
- `/api/admin/*` - Admin operations
- `/api/auth/*` - Authentication

## 🔐 **AUTHENTICATION & SECURITY**
- **JWT-based auth** (custom implementation)
- **Event access control** via access codes
- **File validation** (type, size, format)
- **Admin session management**

## 📱 **MOBILE OPTIMIZATION**
- **Admin dashboard**: Full mobile responsive
- **Photo galleries**: Touch-optimized
- **Upload interface**: Mobile-friendly
- **Bottom navigation**: Mobile admin nav

## ⚡ **PERFORMANCE FEATURES**
- **Image optimization**: Sharp automatic compression
- **Lazy loading**: Component-level
- **Caching**: Strategic cache headers
- **Error boundaries**: Comprehensive error handling

## 🔄 **REAL-TIME COMMUNICATION**
- **Primary**: Socket.IO (configurable port 3003)
- **Alternative**: WebSocket (port 3001)
- **Toggle**: `NEXT_PUBLIC_USE_SOCKETIO` environment variable
- **Servers**: Separate process untuk each protocol

## 🚀 **DEVELOPMENT COMMANDS**

### **Core Development**
```bash
pnpm run dev                # Main dev (port 3002)
pnpm run dev:socketio       # With Socket.IO
pnpm run dev:full          # With WebSocket
```

### **Production**
```bash
pnpm run build             # Build
pnpm run pm2:start         # Start PM2
pnpm run monitor:start     # Health monitoring
```

### **Testing**
```bash
pnpm run test:db           # Database test
pnpm run test:r2           # R2 storage test
```

## 📋 **PM2 CONFIGURATIONS**
- `ecosystem.config.js` - Development
- `ecosystem.production.config.js` - Production  
- `ecosystem.monitoring.config.js` - Monitoring

## 🌍 **ENVIRONMENT REQUIREMENTS**

### **Critical Variables**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 (Primary Storage)
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=

# Google Drive (Backup Only)
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=

# Real-time
NEXT_PUBLIC_USE_SOCKETIO=true/false
SOCKETIO_PORT=3003
WEBSOCKET_PORT=3001
```

## 🎯 **KEY COMPONENTS**

### **Core Libraries**
- `src/lib/database.ts` - Main database service
- `src/lib/direct-r2-uploader.ts` - Storage handler
- `src/lib/supabase.ts` - Supabase clients
- `src/lib/auth.ts` - Authentication logic

### **Admin Components**
- `src/components/admin/modern-admin-layout.tsx` - Main admin layout
- `src/components/admin/photo-bulk-actions.tsx` - Bulk operations
- `src/components/admin/compression-analytics.tsx` - Performance metrics

### **Public Components**
- `src/app/page.tsx` - Homepage with data fetching
- `src/app/event/[id]/page.tsx` - Event galleries
- `src/components/hero-slideshow.tsx` - Homepage slideshow

## 🔍 **DATABASE SCHEMA (MAIN TABLES)**
- **events**: Event data, QR codes, status
- **photos**: Photo metadata, storage info, optimization stats
- **messages**: Guestbook messages dengan reactions
- **pricing_packages**: Dynamic pricing dengan drag-drop ordering

## 🚨 **CRITICAL SAFETY RULES**

### **NEVER DO**
- Import deprecated storage files
- Modify storage-adapter.ts
- Re-enable Smart Storage Manager
- Delete photos without checking storage_provider

### **ALWAYS DO**
- Use directR2Uploader for uploads
- Check storage_provider before operations
- Validate file types and sizes
- Test on both Socket.IO and WebSocket

---

**Last Updated**: 2024 Post-Migration
**Status**: ✅ Production Ready
**Storage Migration**: ✅ COMPLETED