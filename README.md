# 📸 HafiPortrait Photography

> **Professional Event Photography Platform** - Built with Next.js 14, TypeScript & Supabase

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

## ✨ **Features**

### 🎯 **Core Features**
- **📅 Event Management** - Create, manage, and organize photography events
- **🖼️ Photo Galleries** - Dynamic galleries with lightbox viewing
- **🔐 Access Control** - Event-specific access codes and QR codes
- **📱 Mobile-First Design** - Responsive across all devices
- **⚡ Real-time Updates** - Live notifications and status updates

### 🔧 **Admin Dashboard**
- **📊 Analytics & Statistics** - Event and photo metrics
- **👥 User Management** - Client and photographer management
- **🎨 Content Management** - Homepage gallery and slideshow
- **💰 Pricing Packages** - Dynamic package management
- **📷 DSLR Integration** - Camera auto-upload monitoring

### 🚀 **Technical Features**
- **🖥️ Server-Side Rendering** - Optimized performance with Next.js
- **🗄️ Smart Storage** - Cloudflare R2 + Google Drive integration
- **🔄 Real-time Communication** - Socket.IO integration
- **📐 Image Optimization** - Automatic compression and resizing
- **🛡️ Type Safety** - Full TypeScript implementation

## 🛠️ **Tech Stack**

### **Frontend**
- **Next.js 14** - App Router with RSC
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **Framer Motion** - Smooth animations

### **Backend & Database**
- **Supabase** - PostgreSQL database & Auth
- **Next.js API Routes** - Server-side logic
- **Socket.IO** - Real-time communication

### **Storage & Media**
- **Cloudflare R2** - Primary image storage
- **Google Drive** - Backup storage
- **Sharp** - Image processing
- **Next/Image** - Optimized image delivery

### **DevOps & Deployment**
- **PM2** - Process management
- **GitHub Actions** - CI/CD pipeline
- **Environment Management** - Multi-stage deployments

## 🚀 **Quick Start**

### **Prerequisites**
```bash
Node.js >= 18.17.0
pnpm >= 8.0.0
```

### **Installation**
```bash
# Clone repository
git clone https://github.com/ylxai/hafiportrait.git
cd hafiportrait

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
pnpm run dev
```

### **Build for Production**
```bash
# Build application
pnpm run build

# Start production server
pnpm start
```

## 📁 **Project Structure**

```
hafiportrait/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # Admin dashboard
│   │   ├── api/            # API routes
│   │   └── event/          # Event pages
│   ├── components/         # React components
│   │   ├── admin/          # Admin components
│   │   ├── event/          # Event components
│   │   └── ui/             # UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & configurations
│   └── styles/             # Global styles
├── scripts/                # Automation scripts
└── monitoring/             # System monitoring
```

## 🌟 **Key Components**

### **Photo Management**
- Smart image optimization and compression
- Multi-format support (JPEG, WebP, AVIF)
- Automatic thumbnail generation
- Cloud storage with redundancy

### **Event System**
- QR code generation for easy access
- Password-protected galleries
- Real-time photo uploads
- Guest messaging system

### **Admin Features**
- Real-time dashboard monitoring
- Automated status management
- Performance analytics
- Storage optimization tools

## 📱 **Mobile Experience**

- **Progressive Web App** capabilities
- **Touch-optimized** interfaces
- **Offline-ready** core features
- **Fast loading** with image optimization

## 🔧 **Configuration**

### **Environment Variables**
```env
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key

# Real-time
SOCKETIO_PORT=3001
NEXT_PUBLIC_SOCKETIO_URL=ws://localhost:3001
```

## 📄 **License**

This project is proprietary software for HafiPortrait Photography.

## 🤝 **Support**

For support and inquiries, please contact the development team.

---

**Made with ❤️ for professional photography workflows**