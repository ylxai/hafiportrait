# HafiPortrait Photography - Event Photo Sharing Platform

Platform berbagi foto modern untuk semua event spesial Anda. Dikembangkan dengan Next.js 14 dan sistem storage Cloudflare R2 untuk performa optimal.

## 🌟 Fitur Utama

### Untuk Tamu Event
- **Upload Foto**: Tamu dapat mengunggah foto langsung dari smartphone
- **Galeri Real-time**: Lihat semua foto dari event dalam satu tempat
- **Album Terorganisir**: Foto tersusun rapi berdasarkan kategori (Official, Tamu, Bridesmaid)
- **Kualitas Tinggi**: Optimasi otomatis dengan Sharp
- **Akses Mudah**: Hanya perlu kode akses untuk masuk ke galeri event

### Untuk Event Organizer
- **Admin Dashboard**: Panel kontrol lengkap untuk mengelola event
- **Manajemen Event**: Buat, edit, dan kelola multiple event
- **Analytics**: Statistik upload, compression, dan performance
- **Download Bulk**: Download semua foto dalam format ZIP
- **QR Code**: Generate QR code otomatis untuk akses mudah

### Sistem Advanced
- **Real-time Updates**: Foto baru langsung muncul di galeri
- **Cloud Storage**: Cloudflare R2 + Google Drive backup
- **Mobile Responsive**: Tampilan sempurna di semua device
- **Smart Compression**: Optimasi dengan Sharp tanpa kehilangan kualitas

## 🚀 Tech Stack

- **Frontend**: Next.js 14 dengan App Router + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (primary) + Google Drive (backup)
- **Real-time**: Socket.IO / WebSocket dual support
- **UI Framework**: Tailwind CSS + Radix UI + Framer Motion
- **Image Processing**: Sharp untuk optimasi otomatis
- **Process Management**: PM2

## 📦 Instalasi & Setup

### Prerequisites
- Node.js 18+ dan pnpm
- Akun Supabase
- Akun Cloudflare R2
- Akun Google Drive API (untuk backup)

### Quick Start

```bash
# Clone repository
git clone [repository-url]
cd hafiportrait

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local dengan credentials Anda

# Run development server
pnpm run dev
```

Aplikasi akan berjalan di `http://localhost:3002`

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudflare R2 Storage (Primary)
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name

# Google Drive (Backup Only)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# Real-time Configuration
NEXT_PUBLIC_USE_SOCKETIO=true
SOCKETIO_PORT=3003
WEBSOCKET_PORT=3001
```

## 🏗️ Struktur Project

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── event/             # Event pages
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── ui/                # Shared UI components
│   └── event/             # Event-specific components
├── lib/                   # Core utilities
│   ├── database.ts        # Database service (ACTIVE)
│   ├── direct-r2-uploader.ts # Storage handler (ACTIVE)
│   └── supabase.ts        # Supabase client
└── hooks/                 # Custom React hooks
```

## 📱 Development & Deployment

### Development Commands
```bash
pnpm run dev              # Development server (port 3002)
pnpm run dev:socketio     # With Socket.IO
pnpm run dev:full         # With WebSocket
```

### Production Commands
```bash
pnpm run build           # Build for production
pnpm run start           # Start production server
pnpm run pm2:start       # Start with PM2
```

### Testing & Monitoring
```bash
pnpm run test:db         # Test database connection
pnpm run test:r2         # Test R2 storage
pnpm run monitor:start   # Start health monitoring
```

## 🔧 API Documentation

### Public API
- `GET /api/events/{id}` - Get event details
- `POST /api/events/{id}/photos` - Upload photo to event
- `GET /api/events/{id}/photos` - Get event photos
- `GET /api/photos/homepage` - Get homepage photos

### Admin API
- `GET /api/admin/events` - List all events
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events/{id}` - Update event
- `DELETE /api/admin/events/{id}` - Delete event
- `GET /api/admin/photos` - Admin photo management
- `GET /api/admin/stats` - System statistics

## 🔒 Storage System

### Current Architecture (Updated 2024)
- **Primary**: Cloudflare R2 untuk serving photos
- **Database**: Supabase untuk metadata
- **Backup**: Google Drive async backup
- **Processing**: Sharp untuk compression

### Migration Status
- ✅ **COMPLETED**: Migration to single-tier R2 storage
- ❌ **DEPRECATED**: Multi-tier Smart Storage system
- 🔒 **SAFETY**: Old system throws errors to prevent accidents

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

For support or questions:
- Website: https://hafiportrait.photography

---

Made with ❤️ for capturing beautiful moments
