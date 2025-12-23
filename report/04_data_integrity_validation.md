# Analisis Isu Integritas Data dan Validasi pada Proyek Hafiportrait

## Overview
Dokumen ini menjelaskan secara rinci isu-isu terkait integritas data dan validasi input dalam sistem Hafiportrait yang bisa menyebabkan data korup, input berbahaya, dan potensi eksploitasi keamanan.

## 1. Validasi Input Tidak Konsisten

### Deskripsi Masalah
Validasi input hanya diterapkan di beberapa endpoint, tidak konsisten di seluruh sistem.

### Lokasi Kode
- `/lib/validation/schemas.ts`
- API routes di `/app/api/*`

### Penyebab
- Tidak semua endpoint menggunakan Zod validation schemas
- Beberapa input mungkin tidak melalui validasi sebelum masuk ke database
- Validasi hanya diterapkan di sisi client untuk beberapa kasus

### Dampak
- Input berbahaya bisa masuk ke database
- Data tidak valid menyebabkan error saat pemrosesan
- Potensi SQL injection atau XSS

### Solusi Rekomendasi
```typescript
// Gunakan middleware validasi universal
const validateRequest = (schema: z.ZodSchema) => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return { data: validatedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
};
```

## 2. File Upload Validasi Lemah

### Deskripsi Masalah
Tidak ada validasi ukuran file yang ketat sebelum upload ke S3, dan tidak ada validasi MIME type yang menyeluruh.

### Lokasi Kode
- `/lib/upload/*`
- Upload services

### Penyebab
- Validasi ukuran hanya setelah file di-upload
- Tidak ada validasi ekstensi file yang ketat
- Tidak ada validasi file header untuk memastikan tipe sebenarnya

### Dampak
- File berukuran besar mengkonsumsi bandwidth dan storage
- File berbahaya bisa di-upload
- Potensi eksploitasi melalui file upload

### Solusi Rekomendasi
```typescript
// Tambahkan validasi sebelum memberikan presigned URL
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const validateFileForUpload = (fileName: string, contentType: string, size: number) => {
  // Validasi ukuran
  if (size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE} bytes`);
  }
  
  // Validasi MIME type
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error('Invalid file type');
  }
  
  // Validasi ekstensi
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension');
  }
  
  return true;
};
```

## 3. Validasi Event Slug Tidak Adeguat

### Deskripsi Masalah
Tidak ada validasi komprehensif untuk slug event, karakter khusus bisa menyebabkan masalah routing.

### Lokasi Kode
- `/app/[eventSlug]/page.tsx`
- Event creation services

### Penyebab
- Tidak ada sanitasi sebelum menyimpan slug ke database
- Tidak ada validasi format slug yang diizinkan
- Karakter khusus mungkin tidak di-filter

### Dampak
- Routing error atau unexpected behavior
- Potensi security issue pada URL manipulation
- SEO impact karena slug tidak bersih

### Solusi Rekomendasi
```typescript
// Schema validation untuk slug
const eventSlugSchema = z.string()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens"
  });

const generateValidSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Hapus karakter khusus
    .replace(/[\s_-]+/g, '-') // Ganti spasi dengan hyphen
    .replace(/^-+|-+$/g, ''); // Hapus leading/trailing hyphen
};
```

## 4. Tidak Ada Validasi Relasi Data

### Deskripsi Masalah
Beberapa operasi tidak memvalidasi bahwa relasi data masih valid sebelum operasi database dijalankan.

### Lokasi Kode
- `/app/api/comments/route.ts` (asumsi)
- `/app/api/photos/[photoId]/comments/route.ts`
- Lainnya yang berurusan dengan relasi

### Penyebab
- Tidak ada validasi bahwa photo_id dan event_id masih valid sebelum membuat komentar
- Operasi dilakukan tanpa pengecekan eksistensi entitas terkait

### Dampak
- Data orphaned (relasi yang tidak valid)
- Error saat mengakses data
- Database integrity constraint violation

### Solusi Rekomendasi
```typescript
// Validasi relasi sebelum operasi
const validatePhotoExists = async (photoId: string, eventId: string) => {
  const photo = await prisma.photos.findFirst({
    where: {
      id: photoId,
      event_id: eventId,
      deleted_at: null
    }
  });
  
  if (!photo) {
    throw new Error('Photo does not exist or does not belong to this event');
  }
  
  return photo;
};
```

## 5. Tidak Ada Validasi Tipe Data Ketat

### Deskripsi Masalah
Kolom seperti `features` di tabel packages menyimpan JSON tanpa schema validation.

### Lokasi Kode
- `/prisma/schema.prisma`
- API routes yang menangani package data

### Penyebab
- Data JSON disimpan tanpa validasi struktur dalam
- Tidak ada schema validation untuk field JSON

### Dampak
- Struktur data tidak konsisten
- Error saat parsing atau mengakses nested properties
- Potensi keamanan jika JSON berisi script

### Solusi Rekomendasi
```typescript
// Schema validation untuk JSON fields
const packageFeatureSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  included: z.boolean().default(true)
});

const packageSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  features: z.array(packageFeatureSchema).default([])
});
```

## 6. Validasi Business Logic Tidak Lengkap

### Deskripsi Masalah
Tidak ada validasi bahwa event tidak bisa diakses setelah expired atau durasi storage tidak melebihi batas.

### Lokasi Kode
- `/app/[eventSlug]/page.tsx`
- `/lib/gallery/auth.ts`

### Penyebab
- Tidak ada pengecekan expired event sebelum memberikan akses
- Tidak ada validasi durasi storage foto

### Dampak
- Akses ke event yang seharusnya sudah diarsipkan
- Foto tetap tersedia setelah durasi storage habis

### Solusi Rekomendasi
```typescript
// Validasi event access
const validateEventAccess = async (eventId: string) => {
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      status: true,
      expires_at: true,
      storage_duration_days: true
    }
  });
  
  if (!event) {
    throw new Error('Event not found');
  }
  
  // Cek status
  if (event.status === 'ARCHIVED') {
    throw new Error('Event has been archived');
  }
  
  // Cek expired
  if (event.expires_at && new Date() > event.expires_at) {
    throw new Error('Event access has expired');
  }
  
  return true;
};
```

## 7. Input Sanitization Tidak Lengkap

### Deskripsi Masalah
Beberapa input teks tidak disanitasi sebelum disimpan, risiko script injection.

### Lokasi Kode
- Komentar: `/app/api/comments/route.ts`
- Nama tamu: `/components/gallery/...`
- Keterangan foto: Di berbagai tempat

### Penyebab
- Tidak semua input melalui proses sanitization
- Sanitization hanya dilakukan saat render, bukan saat simpan

### Dampak
- XSS vulnerability
- Cross-site scripting attack
- Data korup atau berbahaya di database

### Solusi Rekomendasi
```typescript
// Sanitization function
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string) => {
  // Sanitasi HTML
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
  
  // Validasi karakter berbahaya tambahan
  return sanitized.replace(/[<>'"&]/g, (match) => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return escapeMap[match] || match;
  });
};
```

## 8. Validasi Unique Constraints Tidak Adekuat

### Deskripsi Masalah
Field-field unik mungkin tidak divalidasi sebelum insert/update, hanya error saat query dieksekusi.

### Lokasi Kode
- Semua endpoint yang melakukan create/update pada field unique
- `/app/api/users/route.ts`
- `/app/api/events/route.ts`

### Penyebab
- Tidak ada validasi sebelum eksekusi query
- Error hanya ditangkap saat runtime

### Dampak
- User experience buruk karena error tidak informative
- Proses create/update gagal tanpa feedback yang jelas

### Solusi Rekomendasi
```typescript
// Validasi unique sebelum create
const validateUniqueEmail = async (email: string, excludeId?: string) => {
  const existing = await prisma.users.findFirst({
    where: {
      email,
      id: excludeId ? { not: excludeId } : undefined
    }
  });
  
  if (existing) {
    throw new Error('Email already exists');
  }
};
```

## 9. Tidak Ada Input Length Limitation

### Deskripsi Masalah
Beberapa input teks tidak memiliki batas panjang, bisa menyebabkan database overflow atau performance issue.

### Lokasi Kode
- Semua text field input
- Komentar, nama, deskripsi, dll

### Penyebab
- Tidak ada batas maksimum panjang input
- Tidak ada validasi di schema Prisma dan di API

### Dampak
- Database field overflow
- Performance degradation
- Potensi memory exhaustion

### Solusi Rekomendasi
```typescript
// Tambahkan batas panjang di Zod schema
const commentSchema = z.object({
  message: z.string().min(1).max(1000), // Batasi 1000 karakter
  name: z.string().min(1).max(100),     // Batasi 100 karakter
  email: z.string().email().max(255)    // Batasi 255 karakter
});
```

## 10. Tidak Ada Validasi Format Email dan Phone

### Deskripsi Masalah
Email dan phone number tidak divalidasi dengan format yang ketat.

### Lokasi Kode
- Contact form
- User registration
- Event creation

### Penyebab
- Validasi hanya format dasar, tidak ada pengecekan validitas sebenarnya
- Tidak ada format standardization

### Dampak
- Data kontak tidak valid
- Gagal saat pengiriman email/SMS
- Kualitas data buruk

### Solusi Rekomendasi
```typescript
// Validasi email dan phone yang ketat
const contactSchema = z.object({
  email: z.string().email().transform((str) => str.toLowerCase().trim()),
  phone: z.string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, { 
      message: "Invalid Indonesian phone number format" 
    })
    .transform((str) => {
      // Standardisasi format phone
      return str.replace(/^0/, '+62');
    })
});
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Implementasi sanitasi input universal
2. Validasi file upload yang ketat
3. Server-side validation untuk semua endpoint

**Prioritas Menengah:**
1. Validasi relasi data sebelum operasi
2. Schema validation untuk JSON fields
3. Validasi format data (email, phone, slug)

**Prioritas Rendah:**
1. Input length limitation
2. Business logic validation
3. Database constraint validation