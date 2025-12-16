# Hafiportrait Photography Platform - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** December 2024  
**Status:** Draft  
**Author:** Product Management Team

---

## Table of Contents

1. [Goals and Background Context](#goals-and-background-context)
2. [Requirements](#requirements)
3. [User Interface Design Goals](#user-interface-design-goals)
4. [Technical Assumptions](#technical-assumptions)
5. [Epic List](#epic-list)
6. [Epic Details](#epic-details)
7. [Next Steps](#next-steps)

---

## Goals and Background Context

### Goals

- **Instant Access**: Memberikan akses instan kepada tamu undangan untuk melihat dan mengunduh foto pernikahan melalui galeri web tanpa registrasi
- **Mobile-First Experience**: Menyediakan pengalaman yang optimal di perangkat mobile (Android/iOS) sebagai prioritas utama
- **Simplified Workflow**: Mempermudah alur kerja fotografer dalam mengunggah dan mengelola foto acara dengan dashboard yang intuitif
- **Client Empowerment**: Memungkinkan klien (mempelai) untuk mengunduh foto secara batch dan mengelola permintaan editing dengan mudah
- **Engagement & Interaction**: Meningkatkan engagement melalui fitur like, comment, dan ucapan dari tamu tanpa hambatan registrasi
- **Business Growth**: Menampilkan portofolio, daftar harga, dan kontak untuk mendukung pertumbuhan bisnis fotografi
- **Flexible Access**: Menyediakan berbagai metode akses (QR Code, link, kode unik) untuk kenyamanan maksimal
- **Analytics Insights**: Memberikan insight melalui analytics tentang download statistics dan engagement metrics

### Background Context

Platform fotografi pernikahan tradisional sering kali memiliki hambatan dalam hal aksesibilitas dan kecepatan. Tamu undangan harus menunggu berhari-hari atau berminggu-minggu untuk mendapatkan akses ke foto, dan seringkali harus melalui proses registrasi yang rumit. Hafiportrait Photography Platform hadir untuk mengatasi masalah ini dengan menyediakan solusi instant gallery yang mobile-first.

Platform ini dirancang khusus untuk fotografer pernikahan profesional yang ingin memberikan nilai tambah kepada klien mereka dengan menyediakan akses real-time atau near-real-time ke foto acara. Dengan fokus pada pengalaman mobile yang seamless, tanpa registrasi untuk tamu, dan alur kerja yang efisien untuk fotografer dan klien, platform ini bertujuan untuk menjadi solusi end-to-end untuk manajemen galeri foto pernikahan dari upload hingga delivery dan engagement.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| Dec 2024 | 1.0 | Initial PRD creation | Product Team |

---

## Requirements

### Functional Requirements

**FR1**: Landing page harus menampilkan hero section yang menarik, price list yang jelas, gallery portofolio (dengan upload manual), daftar event yang tersedia, dan informasi kontak.

**FR2**: Sistem harus mendukung pembuatan halaman galeri event unik dengan URL pattern `/namaclient` yang dapat diakses oleh tamu.

**FR3**: Admin/fotografer dapat mengunggah foto melalui dashboard web interface atau melalui API untuk integrasi dengan aplikasi eksternal.

**FR4**: Tamu dapat mengakses galeri event melalui tiga metode: QR Code, shared link, atau kode unik event tanpa perlu registrasi atau login.

**FR5**: Halaman galeri event harus menampilkan foto dalam grid layout yang responsive dan mobile-optimized dengan kemampuan view detail foto.

**FR6**: Tamu dapat memberikan like pada foto dan menambahkan komentar/ucapan tanpa perlu registrasi akun.

**FR7**: Klien (mempelai) dapat mengunduh foto secara batch/multiple selection untuk efisiensi download.

**FR8**: Klien dapat mengajukan permintaan editing foto melalui interface yang tersedia, yang akan memicu notifikasi di dashboard dan WhatsApp fotografer.

**FR9**: Admin dashboard harus menyediakan fitur manajemen event termasuk create, edit, delete, dan configure event settings.

**FR10**: Admin dapat melakukan moderasi komentar dengan kemampuan approve, reject, atau delete komentar yang tidak sesuai.

**FR11**: Sistem harus menyediakan analytics dashboard yang menampilkan statistik download, jumlah views, engagement metrics (likes, comments), dan aktivitas per event.

**FR12**: Admin dapat mengatur durasi penyimpanan foto per event dengan minimum 1 bulan.

**FR13**: Sistem harus terintegrasi dengan WhatsApp API untuk mengirimkan notifikasi permintaan editing kepada fotografer.

**FR14**: Sistem menyediakan REST API endpoints yang terdokumentasi untuk memungkinkan integrasi dengan aplikasi mobile atau third-party.

**FR15**: Admin dapat mengelola portfolio gallery di landing page dengan upload, delete, dan reorder foto portfolio.

**FR16**: Sistem harus mendukung bulk upload foto untuk efisiensi saat mengunggah ratusan foto sekaligus.

**FR17**: Tamu dapat mengunduh foto individual dalam full resolution tanpa watermark (sesuai konfigurasi event).

**FR18**: Sistem harus menyediakan preview/thumbnail untuk performa loading yang cepat di mobile devices.

**FR19**: Admin dapat generate dan regenerate QR Code dan kode akses unik untuk setiap event.

**FR20**: Halaman galeri harus memiliki fitur pencarian dan filter (misalnya: filter by date uploaded, most liked).

### Non-Functional Requirements

**NFR1**: Platform harus mobile-first dengan prioritas pada browser Android dan iOS, memastikan layout responsive dan touch-friendly interactions.

**NFR2**: Sistem tidak boleh membatasi ukuran download foto untuk memastikan klien mendapatkan full quality images.

**NFR3**: Waktu load halaman galeri tidak boleh melebihi 3 detik pada koneksi 4G untuk mobile devices.

**NFR4**: Sistem harus dapat menangani minimum 100 concurrent users per event tanpa degradasi performa yang signifikan.

**NFR5**: Upload foto harus mendukung batch upload hingga 500 foto dalam satu session dengan progress indicator.

**NFR6**: Sistem harus menyimpan foto dengan redundancy untuk memastikan durability dan availability (99.9% uptime).

**NFR7**: Interface admin dashboard harus kompatibel dengan desktop browsers (Chrome, Firefox, Safari, Edge) versi terbaru.

**NFR8**: Semua foto yang diupload harus otomatis di-generate thumbnail dalam multiple sizes untuk optimasi loading.

**NFR9**: Sistem harus menggunakan CDN untuk delivery foto untuk memastikan kecepatan akses global.

**NFR10**: Security: Akses ke event gallery harus ter-proteksi dengan kode akses atau authentication token untuk mencegah akses unauthorized.

**NFR11**: Sistem harus dapat scale untuk menangani hingga 50 event aktif secara simultan dengan rata-rata 300 foto per event.

**NFR12**: Database backup harus dilakukan setiap hari dengan retention period minimum 30 hari.

**NFR13**: API response time tidak boleh melebihi 500ms untuk 95% requests.

**NFR14**: Sistem harus menggunakan lazy loading untuk foto di gallery view untuk optimasi bandwidth dan performa.

**NFR15**: WhatsApp notification harus terkirim dalam waktu maksimal 30 detik setelah event trigger.

---

## User Interface Design Goals

### Overall UX Vision

Platform Hafiportrait mengusung desain **modern, elegant, professional, dan soft** yang mencerminkan nilai estetika fotografi pernikahan premium. Pengalaman pengguna dirancang untuk memberikan kesan mewah namun tetap approachable, dengan fokus utama pada kemudahan navigasi di perangkat mobile. Setiap interaksi harus terasa smooth dan intuitive, dengan minimal friction untuk tamu yang ingin melihat dan mengunduh foto.

Untuk admin/fotografer, dashboard dirancang dengan prinsip efficiency dan clarity - memungkinkan manajemen multiple events dan ratusan foto dengan alur kerja yang streamlined. Klien (mempelai) mendapatkan experience yang empowering dengan kontrol penuh atas foto mereka dan komunikasi yang seamless dengan fotografer.

### Key Interaction Paradigms

- **Touch-First Mobile Interactions**: Semua gesture standar mobile (swipe, pinch-to-zoom, tap, long-press) didukung dengan feedback yang jelas
- **Progressive Disclosure**: Informasi dan fitur ditampilkan secara bertahap untuk menghindari overwhelming users, terutama di mobile screens
- **Instant Feedback**: Setiap action (like, comment, download) memberikan immediate visual feedback
- **Gesture-Based Navigation**: Swipe untuk navigasi antar foto, pull-to-refresh untuk update content
- **Bottom Sheet Modals**: Untuk mobile, gunakan bottom sheet untuk forms dan actions (comments, download options)
- **Floating Action Buttons**: Primary actions (upload, create event) menggunakan FAB pattern di admin dashboard
- **Infinite Scroll**: Gallery menggunakan infinite scroll dengan loading indicators yang smooth

### Core Screens and Views

#### Public Facing
1. **Landing Page**: Hero dengan call-to-action, price list section, portfolio gallery showcase, active events list, contact form
2. **Event Gallery Page** (`/namaclient`): Photo grid dengan lazy loading, photo detail modal/page, comments/ucapan section, like buttons
3. **Photo Detail View**: Full-screen photo viewer dengan zoom, navigation arrows, download button, like & comment actions
4. **Access Entry Page**: Form untuk input kode akses atau automatic redirect dari QR scan

#### Admin/Photographer
5. **Admin Dashboard Home**: Overview cards (active events, total photos, recent activity), quick actions, analytics summary
6. **Event Management Page**: List/grid of all events dengan search/filter, create new event button, event status indicators
7. **Event Detail/Edit Page**: Event information form, photo upload area, gallery management, access codes & QR display
8. **Photo Upload Interface**: Drag-and-drop area, bulk upload progress, thumbnail previews, upload queue management
9. **Analytics Dashboard**: Charts dan metrics (downloads, views, engagement), filterable by event dan date range
10. **Comment Moderation Page**: List of comments dengan approve/reject actions, filter by event dan status

#### Client/Mempelai
11. **Client Dashboard**: Simplified view dengan access to their event(s), download batch interface, editing request form
12. **Batch Download Interface**: Multiple photo selection dengan checkboxes, select all option, download button dengan size indicator

### Accessibility

**WCAG AA Compliance** - Platform akan memenuhi standar WCAG 2.1 Level AA untuk memastikan aksesibilitas bagi pengguna dengan berbagai kebutuhan, termasuk:
- Sufficient color contrast ratios (minimum 4.5:1 untuk text)
- Keyboard navigation support untuk semua interactive elements
- Screen reader compatibility dengan proper ARIA labels
- Alt text untuk semua foto (auto-generated atau admin-provided)
- Focus indicators yang jelas untuk navigation
- Responsive text sizing tanpa loss of functionality

### Branding

**Color Palette**: Platform menggunakan color scheme yang sudah ditentukan untuk menciptakan visual identity yang cohesive dan professional:

- **Primary**: `#54ACBF` - Teal yang vibrant untuk primary actions dan accents
- **Secondary**: `#26658C` - Blue yang lebih dalam untuk secondary elements
- **Accent Light**: `#A7EBF2` - Light cyan untuk highlights dan hover states
- **Accent Dark**: `#023859` - Deep blue untuk headers dan footers
- **Background Dark**: `#011C40` - Navy untuk dark mode atau contrast sections

**Typography**: Modern sans-serif fonts yang readable di berbagai sizes (e.g., Inter, Poppins, atau SF Pro untuk consistency dengan mobile OS).

**Visual Style**:
- Soft shadows dan subtle gradients untuk depth tanpa overwhelming
- Rounded corners (border-radius: 8-16px) untuk friendly appearance
- Generous white space untuk elegant dan clean look
- High-quality imagery sebagai focal point
- Smooth transitions dan animations (300-400ms duration) untuk polish

**Iconography**: Consistent icon set (misalnya Feather Icons atau Heroicons) untuk wayfinding dan actions.

### Target Device and Platforms

**Primary**: **Mobile Web Responsive** (Android dan iOS browsers - Chrome, Safari)
- Design-first approach untuk mobile screens (320px - 428px width)
- Progressive enhancement untuk tablet (768px - 1024px)
- Full desktop support untuk admin functions (1280px+)

**Browser Support**:
- Mobile: Chrome (Android), Safari (iOS) - 2 latest versions
- Desktop: Chrome, Firefox, Safari, Edge - latest versions

**Touch Optimization**: Minimum touch target size 44x44px sesuai iOS dan Android guidelines.

---

## Technical Assumptions

### Repository Structure

**Monorepo** - Project akan menggunakan monorepo structure untuk memudahkan code sharing dan dependency management antara frontend, backend, dan shared utilities. Ini juga memfasilitasi atomic commits yang mencakup changes di multiple layers.

### Service Architecture

**Service Architecture**: Hybrid Architecture dengan kombinasi:

1. **Backend**: Monolithic application dengan modular structure untuk manajemen event, foto, users, dan analytics
2. **Frontend**: Separate modern SPA (Single Page Application) untuk web interface
3. **API Layer**: RESTful API untuk komunikasi frontend-backend dan third-party integrations
4. **Storage Service**: Object storage integration (S3-compatible) untuk foto storage
5. **Queue Service**: Background job queue untuk processing tasks (thumbnail generation, notifications)
6. **CDN Layer**: Content Delivery Network untuk serving photos dan static assets

Arsitektur ini memberikan flexibility untuk scale individual components sambil maintaining simplicity untuk MVP development.

### Testing Requirements

**Testing Strategy**: Comprehensive testing approach dengan focus pada reliability dan quality:

1. **Unit Testing**: Required untuk business logic, utilities, dan pure functions (target: >80% coverage)
2. **Integration Testing**: API endpoints testing, database interactions, external service mocks (WhatsApp, storage)
3. **E2E Testing**: Critical user journeys (guest access & download, admin upload, client batch download)
4. **Manual Testing**: UI/UX validation di actual devices (minimum 2 Android + 2 iOS devices)
5. **Performance Testing**: Load testing untuk concurrent users dan large file uploads
6. **Security Testing**: Access control validation, injection attack prevention

**Testing Tools**: Jest/Vitest untuk unit & integration, Playwright/Cypress untuk E2E, manual testing checklist untuk UX validation.

### Additional Technical Assumptions and Requests

**Tech Stack Preferences**:

- **Backend Framework**: Node.js dengan Express atau Fastify untuk performance dan ecosystem maturity, ATAU Python dengan FastAPI untuk type safety dan modern async support
- **Frontend Framework**: React dengan Vite untuk fast development dan HMR, atau Next.js jika SSR/SSG needed untuk landing page SEO
- **Database**: PostgreSQL untuk relational data (events, users, comments) + Redis untuk caching dan session management
- **Object Storage**: AWS S3 atau compatible alternative (MinIO untuk self-hosted, Cloudflare R2 untuk cost efficiency)
- **Image Processing**: Sharp (Node.js) atau Pillow (Python) untuk thumbnail generation dan image optimization
- **CDN**: Cloudflare atau AWS CloudFront untuk global photo delivery
- **Queue System**: BullMQ (Redis-based) atau AWS SQS untuk background jobs
- **Authentication**: JWT-based authentication untuk admin/client dengan secure httpOnly cookies
- **WhatsApp Integration**: WhatsApp Business API atau third-party service (Twilio, MessageBird)

**Deployment**:
- **Containerization**: Docker untuk consistent environments
- **Hosting**: Cloud platform (AWS, Google Cloud, DigitalOcean) atau VPS dengan managed services
- **CI/CD**: GitHub Actions atau GitLab CI untuk automated testing dan deployment
- **Monitoring**: Logging service (e.g., Winston, Pino) + monitoring (e.g., Sentry for errors, analytics dashboard)

**API Design**:
- RESTful principles dengan clear resource naming
- Versioned API (e.g., `/api/v1/...`) untuk backward compatibility
- Comprehensive OpenAPI/Swagger documentation
- Rate limiting untuk abuse prevention
- CORS configuration untuk security

**Security Considerations**:
- HTTPS only untuk all connections
- Input validation dan sanitization untuk prevent XSS/injection
- Rate limiting pada API endpoints
- Secure random generation untuk access codes
- File upload validation (type, size, virus scanning for production)
- CSRF protection untuk state-changing operations

**Performance Optimizations**:
- Image lazy loading dengan IntersectionObserver
- Progressive image loading (blur-up technique)
- Database query optimization dengan proper indexing
- Caching strategy (CDN, browser cache headers, Redis caching)
- Compression untuk API responses (gzip/brotli)
- Code splitting untuk frontend bundles

**Data Management**:
- Automated photo retention policy dengan configurable duration per event
- Soft delete untuk photos dan events (recovery window before permanent deletion)
- Database backup automation dengan point-in-time recovery capability
- GDPR compliance considerations (data export, deletion requests)

---

## Epic List

### Epic 1: Foundation & Core Infrastructure
Establish project setup dengan repository structure, development environment, basic authentication untuk admin, dan deployment pipeline. Deliver simple landing page sebagai first deployable artifact yang menunjukkan aplikasi berjalan dengan baik di production environment.

### Epic 2: Landing Page & Public Portfolio
Create public-facing landing page lengkap dengan hero section, price list display, manually managed portfolio gallery, dan contact form. Ini adalah first major user-facing feature yang mendukung business marketing.

### Epic 3: Event Management & Admin Dashboard
Build comprehensive admin dashboard untuk fotografer dengan kemampuan create/edit/delete events, generate access codes & QR codes, dan view basic event information. Foundation untuk semua event-centric features.

### Epic 4: Photo Upload & Storage
Implement photo upload system dengan bulk upload support, thumbnail generation, storage integration, dan photo management interface di admin dashboard. Core functionality untuk photographers.

### Epic 5: Guest Gallery Experience
Create guest-facing event gallery pages dengan photo grid display, photo detail view, access control via codes/QR/links, dan download functionality. Primary value delivery untuk end users (tamu).

### Epic 6: Engagement Features (Like & Comments)
Enable social engagement dengan like functionality dan comment/ucapan system untuk tamu, plus comment moderation tools untuk admin. Meningkatkan interactivity dan user engagement.

### Epic 7: Client Features & Batch Download
Build client-specific features termasuk batch photo download, editing request submission, dan WhatsApp notification integration untuk komunikasi dengan photographer.

### Epic 8: Analytics & Reporting
Implement analytics dashboard dengan metrics tracking (downloads, views, likes, comments) dan visualization untuk memberikan insights kepada fotografer tentang event performance.

### Epic 9: API & External Integrations
Create documented REST API endpoints untuk external application integration, plus refinement untuk WhatsApp integration dan potential future third-party services.

### Epic 10: Polish, Optimization & Launch Preparation
Final polish untuk UI/UX, performance optimization, security hardening, comprehensive testing, dan documentation untuk production readiness.

---

## Epic Details

[See Sharded Files in `docs/prd/` directory]
- [Epic 1: Foundation & Core Infrastructure](./prd/epic-1-foundation.md)
- [Epic 2: Landing Page & Public Portfolio](./prd/epic-2-landing-page.md)
- [Epic 3: Event Management & Admin Dashboard](./prd/epic-3-event-management.md)
- [Epic 4: Photo Upload & Storage](./prd/epic-4-photo-upload.md)
- [Epic 5: Guest Gallery Experience](./prd/epic-5-guest-gallery.md)
- [Epic 6: Engagement Features](./prd/epic-6-engagement-features.md)
- [Epic 7: Client Features & Batch Download](./prd/epic-7-client-features.md)
- [Epic 8: Analytics & Reporting](./prd/epic-8-analytics.md)
- [Epic 9: API & External Integrations](./prd/epic-9-api-integrations.md)
- [Epic 10: Polish, Optimization & Launch](./prd/epic-10-polish-launch.md)

---

## Next Steps

### UX Expert Prompt

```
Hai @ux, saya sudah menyiapkan Product Requirements Document (PRD) lengkap untuk Hafiportrait Photography Platform di docs/prd.md.

Tolong review PRD ini dan create comprehensive UX/UI specifications yang detail, termasuk:
- Wireframes atau mockup descriptions untuk core screens
- Detailed component specifications
- Interaction flows dan user journeys
- Mobile-first design patterns
- Color palette implementation guidelines
- Typography scales dan spacing system

Fokus pada mobile-first experience dengan color palette yang sudah defined: #A7EBF2, #54ACBF, #26658C, #023859, #011C40. Style harus modern-elegant-professional-soft.

Gunakan template yang sesuai untuk create front-end architecture atau UI specification document.
```

### Architect Prompt

```
Hai @architect, saya sudah menyiapkan Product Requirements Document (PRD) lengkap untuk Hafiportrait Photography Platform di docs/prd.md.

Tolong review PRD ini dan create detailed technical architecture document yang mencakup:
- System architecture diagram dan component interactions
- Database schema design (PostgreSQL + Redis)
- API design dan endpoint specifications
- Storage architecture untuk photo management
- Authentication & authorization flow
- Background job processing architecture
- Deployment architecture dan infrastructure

Technical stack yang direkomendasikan sudah ada di PRD section Technical Assumptions. Prioritaskan scalability, performance, dan security untuk handling large photo files dan concurrent users.

Gunakan template fullstack-architecture untuk create comprehensive architecture document.
```

---

**Document Status**: Ready for Epic Story Details Generation
**Next Action**: Populate individual epic files dengan detailed user stories dan acceptance criteria
