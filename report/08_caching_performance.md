# Analisis Bottleneck Cache dan Performa pada Proyek Hafiportrait

## Overview
Dokumen ini menganalisis secara mendalam isu-isu terkait cache dan performa dalam sistem Hafiportrait, termasuk kekurangan caching, N+1 problems, dan potensi bottleneck pada beban tinggi.

## 1. Tidak Ada Cache Layer yang Signifikan

### Deskripsi Masalah
Tidak ditemukan implementasi cache yang komprehensif untuk data yang sering diakses, menyebabkan banyak query database yang tidak perlu.

### Lokasi Kode
- `/app/api/*` - Semua API routes
- `/lib/prisma.ts` - Database access
- Component loading di berbagai halaman

### Penyebab
- Tidak ada Redis cache untuk data yang sering diakses
- Query database dilakukan secara langsung tanpa layer cache
- Data statis seperti hero slideshow di-query setiap request

### Dampak
- Database load tinggi
- Response time lambat
- Resource server terbuang untuk query berulang

### Solusi Rekomendasi
```typescript
// Implementasi caching service
class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour default
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null; // Fallback to DB if cache fails
    }
  }
  
  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error('Cache set error:', error);
      // Log tapi jangan hentikan proses
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}

// Gunakan di service layer
class EventService {
  private cache: CacheService;
  
  constructor() {
    this.cache = new CacheService();
  }
  
  async getEventBySlug(slug: string) {
    const cacheKey = `event:${slug}`;
    
    // Coba ambil dari cache dulu
    let event = await this.cache.get<any>(cacheKey);
    if (event) {
      return event;
    }
    
    // Jika tidak ada di cache, ambil dari database
    event = await prisma.events.findUnique({
      where: { slug },
      include: {
        users: {
          select: { name: true, email: true }
        }
      }
    });
    
    // Simpan ke cache jika ditemukan
    if (event) {
      await this.cache.set(cacheKey, event, 1800); // 30 menit
    }
    
    return event;
  }
  
  async invalidateEventCache(slug: string) {
    await this.cache.delete(`event:${slug}`);
    await this.cache.delete(`event:${slug}:photos`);
  }
}

// Gunakan di API route
export const GET = asyncHandler(async (request: NextRequest) => {
  const { eventSlug } = await getParams(request);
  const eventService = new EventService();
  
  const event = await eventService.getEventBySlug(eventSlug);
  
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  return NextResponse.json(event);
});
```

## 2. N+1 Problem pada Query Kompleks

### Deskripsi Masalah
Banyak query yang menyebabkan N+1 problem, terutama saat mengambil data dengan relasi dalam jumlah besar.

### Lokasi Kode
- `/app/[eventSlug]/gallery/page.tsx`
- Query foto dan komentar
- Component yang menampilkan banyak data terkait

### Penyebab
```typescript
// Contoh potensi N+1 problem
const photos = await prisma.photos.findMany({
  where: { event_id: eventId }
});

// Jika di frontend, setiap photo mengakses comments atau likes terpisah
photos.forEach(photo => {
  // Ini akan menyebabkan query tambahan untuk setiap photo
  const comments = await prisma.comments.findMany({
    where: { photo_id: photo.id }
  });
});
```

### Dampak
- Banyak query tambahan ke database
- Performance degradation
- Database connection pool exhaustion

### Solusi Rekomendasi
```typescript
// Gunakan eager loading untuk query kompleks
const getPhotosWithRelations = async (eventId: string, options: {
  includeComments?: boolean;
  includeLikes?: boolean;
  includeUser?: boolean;
} = {}) => {
  return await prisma.photos.findMany({
    where: {
      event_id: eventId,
      deleted_at: null
    },
    include: {
      // Gunakan include untuk eager loading
      comments: options.includeComments ? {
        where: { status: 'approved' },
        select: {
          id: true,
          guest_name: true,
          message: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      } : false,
      photo_likes: options.includeLikes ? {
        select: {
          id: true,
          guest_id: true
        }
      } : false,
      users_photos_uploaded_by_idTousers: options.includeUser ? {
        select: {
          name: true
        }
      } : false
    },
    orderBy: [
      { is_featured: 'desc' },
      { display_order: 'asc' },
      { created_at: 'desc' }
    ]
  });
};

// Gunakan di page component
export default async function GalleryPage({ params }: PageProps) {
  const { eventSlug } = await params;
  
  // Ambil event dan foto dengan relasi sekaligus
  const event = await prisma.events.findUnique({
    where: { slug: eventSlug },
    include: {
      photos: {
        where: { deleted_at: null },
        include: {
          comments: {
            where: { status: 'approved' },
            select: { 
              guest_name: true, 
              message: true, 
              created_at: true 
            }
          },
          photo_likes: { select: { guest_id: true } }
        },
        orderBy: [
          { is_featured: 'desc' },
          { display_order: 'asc' },
          { created_at: 'desc' }
        ]
      }
    }
  });
  
  if (!event) {
    notFound();
  }
  
  return (
    // Render component dengan data lengkap
  );
}
```

## 3. Database Connection Pool Issues

### Deskripsi Masalah
Tidak ada konfigurasi connection pool yang optimal, bisa menyebabkan bottleneck saat concurrent request tinggi.

### Lokasi Kode
- `/lib/prisma.ts`

### Penyebab
- Konfigurasi default Prisma tanpa optimasi
- Tidak ada monitoring usage
- Tidak ada connection pooling strategy

### Dampak
- Connection timeout saat beban tinggi
- Database unavailable saat connection pool penuh
- Performance degradation

### Solusi Rekomendasi
```typescript
// Optimasi konfigurasi Prisma
import { PrismaClient } from '@prisma/client';

// Gunakan connection pooling di database URL
const getDatabaseUrl = () => {
  const url = new URL(process.env.DATABASE_URL);
  
  // Tambahkan parameter connection pooling
  url.searchParams.set('connection_limit', '20');
  url.searchParams.set('pool_timeout', '60');
  url.searchParams.set('command_timeout', '60000'); // 60 seconds
  
  return url.toString();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  // Tambahkan connection pool configuration
  __internal: {
    // Ini adalah konfigurasi internal, bisa berubah di versi Prisma selanjutnya
    // Gunakan environment variables untuk konfigurasi pooling
  }
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Tambahkan monitoring connection pool
class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  
  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
      DatabaseMonitor.instance.startMonitoring();
    }
    return DatabaseMonitor.instance;
  }
  
  async startMonitoring() {
    // Monitoring interval
    setInterval(async () => {
      try {
        await prisma.$queryRaw`SELECT 1`; // Health check
        console.log('Database connection: OK');
      } catch (error) {
        console.error('Database connection error:', error);
        // Kirim alert jika koneksi bermasalah
      }
    }, 30000); // Cek setiap 30 detik
  }
}
```

## 4. Tidak Ada HTTP Caching Headers

### Deskripsi Masalah
Tidak ada HTTP caching headers yang jelas untuk response API dan tidak ada cache invalidation.

### Lokasi Kode
- Semua API routes
- Static asset serving
- Data yang tidak berubah-ubah

### Penyebab
- Tidak ada cache headers
- Tidak ada mechanism cache invalidation
- Client harus request ulang setiap kali

### Dampak
- Bandwidth terbuang
- Response time tinggi
- Server load tinggi untuk data statis

### Solusi Rekomendasi
```typescript
// Middleware untuk caching headers
const addCacheHeaders = (res: NextResponse, options: {
  maxAge?: number;
  staleWhileRevalidate?: number;
  isStatic?: boolean;
} = {}) => {
  const {
    maxAge = 3600, // 1 hour default
    staleWhileRevalidate = 86400, // 24 hours
    isStatic = false
  } = options;
  
  if (isStatic) {
    // Untuk asset statis, gunakan cache lama
    res.headers.set('Cache-Control', `public, immutable, max-age=${31536000}`); // 1 year
  } else {
    // Untuk data dinamis, gunakan cache lebih pendek
    res.headers.set('Cache-Control', 
      `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
    );
  }
  
  res.headers.set('Vary', 'Accept-Encoding'); // Untuk compression
  
  return res;
};

// Gunakan di API routes
export const GET = asyncHandler(async (request: NextRequest) => {
  const data = await getEventData(request);
  
  const response = NextResponse.json(data);
  
  // Tambahkan caching headers
  addCacheHeaders(response, { 
    maxAge: 1800, // 30 menit untuk event data
    isStatic: false 
  });
  
  return response;
});

// Next.js cache headers untuk page routes
export async function generateStaticParams() {
  // Tambahkan revalidate untuk ISR
  return { revalidate: 3600 }; // 1 hour
}
```

## 5. Performance pada Query Kompleks

### Deskripsi Masalah
Tidak ada optimasi query untuk halaman gallery dengan ribuan foto, dan tidak ada pagination yang efektif.

### Lokasi Kode
- `/app/[eventSlug]/gallery/page.tsx`
- Query photos dengan banyak data

### Penyebab
- Query semua foto sekaligus
- Tidak ada pagination atau lazy loading
- Tidak ada query optimization

### Dampak
- Memory usage tinggi
- Response time sangat lama
- Potensi timeout

### Solusi Rekomendasi
```typescript
// Implementasi pagination untuk gallery
interface PhotoQueryOptions {
  page?: number;
  limit?: number;
  includeFeatured?: boolean;
  includeComments?: boolean;
  orderBy?: 'newest' | 'oldest' | 'featured';
}

class PhotoService {
  async getPaginatedPhotos(
    eventId: string, 
    options: PhotoQueryOptions = {}
  ) {
    const {
      page = 1,
      limit = 24, // 24 foto per page (bento grid friendly)
      includeFeatured = true,
      orderBy = 'newest'
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Hitung total untuk pagination info
    const total = await prisma.photos.count({
      where: {
        event_id: eventId,
        deleted_at: null
      }
    });
    
    // Query dengan pagination dan optimasi
    const photos = await prisma.photos.findMany({
      where: {
        event_id: eventId,
        deleted_at: null
      },
      include: {
        comments: options.includeComments ? {
          where: { status: 'approved' },
          select: { 
            guest_name: true, 
            message: true, 
            created_at: true 
          },
          take: 5 // Batasi komentar per foto
        } : false
      },
      orderBy: this.getOrderBy(orderBy),
      skip,
      take: limit
    });
    
    return {
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + photos.length < total
      }
    };
  }
  
  private getOrderBy(orderBy: 'newest' | 'oldest' | 'featured') {
    switch (orderBy) {
      case 'featured':
        return [
          { is_featured: 'desc' },
          { display_order: 'asc' },
          { created_at: 'desc' }
        ];
      case 'oldest':
        return { created_at: 'asc' };
      default: // newest
        return { created_at: 'desc' };
    }
  }
}

// Gunakan di page component dengan server actions
'use server'
export async function getGalleryPhotos(
  eventSlug: string,
  page: number = 1,
  limit: number = 24
) {
  // Validasi input
  if (page < 1 || limit < 1 || limit > 100) {
    throw new Error('Invalid pagination parameters');
  }
  
  const event = await prisma.events.findUnique({
    where: { slug: eventSlug }
  });
  
  if (!event) {
    return { photos: [], pagination: null };
  }
  
  const photoService = new PhotoService();
  return await photoService.getPaginatedPhotos(event.id, { page, limit });
}
```

## 6. Memory Usage pada Real-time Features

### Deskripsi Masalah
Socket server menyimpan state di memory tanpa batas, bisa terjadi memory leak saat jumlah pengguna real-time meningkat.

### Lokasi Kode
- `/server/socket-server.js`

### Penyebab
- State disimpan di memory Map tanpa batas
- Tidak ada cleanup mechanism untuk data lama
- Tidak ada monitoring memory usage

### Dampak
- Memory leak seiring waktu
- Server crash karena out of memory
- Performance degradation

### Solusi Rekomendasi
```javascript
// Implementasi memory management di socket server
class MemoryManager {
  constructor() {
    // Jalankan cleanup setiap 5 menit
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    // Monitor memory usage
    setInterval(() => this.monitorMemory(), 30 * 1000);
  }
  
  cleanup() {
    const MAX_ROOMS = 1000;
    const MAX_GUEST_COUNTS = 1000;
    
    // Batasi jumlah room
    if (eventRooms.size > MAX_ROOMS) {
      // Hapus room yang paling tidak aktif
      const sortedRooms = Array.from(eventRooms.entries())
        .sort(([_, room], [__, otherRoom]) => 
          (room.lastAccess || 0) - (otherRoom.lastAccess || 0)
        );
      
      for (let i = 0; i < Math.floor(MAX_ROOMS * 0.1); i++) {
        const [roomName] = sortedRooms[i];
        eventRooms.delete(roomName);
        guestCounts.delete(roomName);
      }
    }
    
    // Cleanup guest counts jika terlalu banyak
    if (guestCounts.size > MAX_GUEST_COUNTS) {
      // Hapus yang tidak aktif
      const now = Date.now();
      const timeout = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const [slug, count] of guestCounts.entries()) {
        const lastAccess = lastAccessMap.get(slug) || 0;
        if (now - lastAccess > timeout) {
          guestCounts.delete(slug);
          lastAccessMap.delete(slug);
        }
      }
    }
  }
  
  monitorMemory() {
    const used = process.memoryUsage();
    const mbUsed = Math.round(used.heapUsed / 1024 / 1024);
    const mbTotal = Math.round(used.heapTotal / 1024 / 1024);
    
    console.log(`Memory Usage: ${mbUsed} MB / ${mbTotal} MB`);
    
    // Jika memory usage terlalu tinggi, lakukan force cleanup
    if (mbUsed > 500) { // 500MB threshold
      console.warn('High memory usage detected, running cleanup');
      this.cleanup();
    }
  }
}

// Gunakan di socket server
const memoryManager = new MemoryManager();

// Update access time saat ada aktivitas
socket.on('event:join', (eventSlug) => {
  // ... existing code ...
  
  // Update last access time
  lastAccessMap.set(eventSlug, Date.now());
});
```

## 7. Image Loading dan Asset Optimization

### Deskripsi Masalah
Foto dan asset mungkin tidak di-optimize, tidak ada lazy loading, dan tidak ada responsive image loading.

### Lokasi Kode
- Image components di berbagai halaman
- Gallery components
- Homepage components

### Penyebab
- Tidak ada lazy loading untuk gambar di luar viewport
- Tidak ada image optimization
- Tidak ada responsive image serving

### Dampak
- Page load time tinggi
- Bandwidth terbuang
- User experience buruk di koneksi lambat

### Solusi Rekomendasi
```typescript
// Custom image component dengan optimization
interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  className?: string;
}

// Gunakan Next.js Image dengan fallback
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  className = '',
  ...props
}) => {
  // Buat src untuk berbagai ukuran
  const imageSrc = getOptimizedImageSrc(src, { width, quality });
  
  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={`${className} transition-opacity duration-300`}
      {...props}
    />
  );
};

// Fungsi untuk membuat URL gambar yang dioptimasi
const getOptimizedImageSrc = (
  originalSrc: string, 
  options: { width?: number; quality?: number; format?: string } = {}
) => {
  const { width, quality = 75, format } = options;
  
  // Jika Next.js image optimization tersedia
  if (process.env.NODE_ENV === 'production') {
    const params = new URLSearchParams();
    
    if (width) params.append('w', width.toString());
    if (quality) params.append('q', quality.toString());
    if (format) params.append('f', format);
    
    return `${originalSrc}?${params.toString()}`;
  }
  
  // Fallback untuk external images
  return originalSrc;
};

// Implementasi gallery virtualization untuk foto banyak
'use client';
import { useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface VirtualizedGalleryProps {
  photos: Array<any>;
  loadMore?: () => void;
  hasMore?: boolean;
}

const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({ 
  photos, 
  loadMore, 
  hasMore 
}) => {
  const [ref, inView] = useInView();
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  // Load more saat component terlihat
  useEffect(() => {
    if (inView && hasMore && loadMore) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);
  
  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId));
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="relative">
          <OptimizedImage
            src={photo.thumbnail_url || photo.original_url}
            alt={photo.caption || 'Photo'}
            width={300}
            height={300}
            className={`w-full h-auto ${loadedImages.has(photo.id) ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => handleImageLoad(photo.id)}
          />
          {photo.caption && (
            <p className="text-sm text-gray-600 mt-1 truncate">{photo.caption}</p>
          )}
        </div>
      ))}
      
      {hasMore && <div ref={ref} className="w-full h-4" />}
    </div>
  );
};
```

## 8. Tidak Ada Query Indexing yang Optimal

### Deskripsi Masalah
Index database mungkin tidak optimal untuk query kompleks yang dilakukan di sistem.

### Lokasi Kode
- `/prisma/schema.prisma`
- Query kompleks di service layer

### Penyebab
- Index tidak disesuaikan dengan pattern query yang sering digunakan
- Tidak ada monitoring slow queries
- Composite index kurang optimal

### Dampak
- Query performance buruk
- Database load tinggi
- Response time lambat

### Solusi Rekomendasi
```prisma
// Optimasi schema dengan indexing yang tepat
model photos {
  id                                 String        @id @default(uuid())
  filename                           String
  original_url                       String
  thumbnail_url                      String?
  display_order                      Int           @default(0)
  likes_count                        Int           @default(0)
  created_at                         DateTime      @default(now())
  updated_at                         DateTime      @updatedAt
  event_id                           String
  caption                            String?
  deleted_at                         DateTime?
  download_count                     Int           @default(0)
  file_size                          Int?
  height                             Int?
  is_featured                        Boolean       @default(false)
  mime_type                          String?
  thumbnail_large_url                String?
  thumbnail_medium_url               String?
  thumbnail_small_url                String?
  uploaded_by_id                     String?
  views_count                        Int           @default(0)
  width                              Int?
  exif_data                          Json?
  deleted_by_id                      String?
  deleted_by                         String?

  // Optimasi indexing berdasarkan query pattern
  @@index([event_id, created_at], map: "idx_photos_event_created")
  @@index([event_id, display_order], map: "idx_photos_event_order")
  @@index([event_id, is_featured, created_at], map: "idx_photos_event_featured")
  @@index([is_featured, created_at], map: "idx_photos_featured_created_newest")
  @@index([event_id, deleted_at], map: "idx_photos_event_deleted")
  @@index([created_at, event_id], map: "idx_photos_created_event") // Untuk query global
  @@index([likes_count], map: "idx_photos_popular") // Untuk query foto populer
  
  // Foreign key indexes
  @@index([event_id])
  @@index([uploaded_by_id])
  @@index([deleted_by_id])
  
  // Soft delete index
  @@index([deleted_at])
}

model events {
  id                    String           @id @default(uuid())
  name                  String
  slug                  String           @unique
  access_code           String           @unique
  qr_code_url           String?
  storage_duration_days Int              @default(30)
  status                EventStatus      @default(DRAFT)
  created_at            DateTime         @default(now())
  updated_at            DateTime         @updatedAt
  expires_at            DateTime?
  client_id             String
  client_email          String?
  client_phone          String?
  description           String?
  event_date            DateTime?
  location              String?
  cover_photo_id        String?
  
  // Optimasi indexing untuk events
  @@index([client_id, status, created_at], map: "idx_events_client_status_created")
  @@index([status, created_at], map: "idx_events_status_created")
  @@index([slug])
  @@index([access_code])
  @@index([expires_at]) // Untuk query event yang akan expired
  @@index([event_date, status]) // Untuk query upcoming events
}

// Tambahkan monitoring query performance
// Gunakan Prisma middleware untuk logging slow queries
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const end = Date.now();
  const duration = end - start;
  
  // Log query yang lebih lambat dari threshold
  if (duration > 1000) { // 1 detik
    console.warn(`Slow query detected: ${duration}ms`, {
      model: params.model,
      action: params.action,
      duration,
      // Jangan log args karena mungkin berisi data sensitif
    });
  }
  
  return result;
});
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Implementasi cache layer (Redis) untuk data yang sering diakses
2. Perbaiki N+1 problems dengan eager loading
3. Tambahkan pagination untuk query data besar
4. Optimasi database indexing

**Prioritas Menengah:**
1. Tambahkan HTTP caching headers
2. Implementasi connection pool optimization
3. Gunakan virtualized list untuk gallery
4. Tambahkan image optimization

**Prioritas Rendah:**
1. Memory management monitoring
2. Query performance monitoring
3. Advanced cache invalidation
4. Database connection monitoring