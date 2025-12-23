# Analisis Isu Konkurensi dan Race Condition pada Proyek Hafiportrait

## Overview
Dokumen ini mengidentifikasi dan menganalisis berbagai isu konkurensi dan race condition dalam sistem Hafiportrait yang bisa menyebabkan data inkonsistensi, perhitungan tidak akurat, dan potensi crash sistem saat beban tinggi.

## 1. Photo Like Counter Race Condition

### Deskripsi Masalah
Counter `likes_count` pada tabel `photos` diperbarui tanpa menggunakan operasi atomic yang benar-benar aman dari race condition.

### Lokasi Kode
- `/app/api/photos/[photoId]/like/route.ts` (asumsi berdasarkan struktur)
- Database operations di `lib/prisma.ts`

### Penyebab
```typescript
// Potensi implementasi yang rentan
const currentPhoto = await prisma.photos.findUnique({
  where: { id: photoId },
});
const newLikeCount = currentPhoto.likes_count + 1;
await prisma.photos.update({
  where: { id: photoId },
  data: { likes_count: newLikeCount }
});
```

### Dampak
- Perhitungan like tidak akurat saat banyak user like foto yang sama secara bersamaan
- Data inkonsistensi permanen di database
- Pengalaman pengguna tidak konsisten

### Solusi Rekomendasi
```typescript
// Gunakan atomic increment dari Prisma
await prisma.photos.update({
  where: { id: photoId },
  data: {
    likes_count: { increment: 1 }
  }
});
```

## 2. Photo Download Counter Race Condition

### Deskripsi Masalah
Sama seperti like counter, download counter juga rentan terhadap race condition.

### Lokasi Kode
- Bagian yang menangani download tracking di `photos` table

### Penyebab
Operasi read-modify-write tanpa locking atau atomic increment.

### Dampak
- Perhitungan download tidak akurat
- Statistik penggunaan tidak reliable

### Solusi Rekomendasi
Gunakan atomic increment Prisma: `{ increment: 1 }` untuk `download_count`

## 3. Guest Session Management Race Condition

### Deskripsi Masalah
Saat pengguna mengakses event gallery, sistem membuat atau memperbarui session guest tanpa proteksi race condition.

### Lokasi Kode
- `/lib/gallery/auth.ts`
- `/app/[eventSlug]/page.tsx`

### Penyebab
```typescript
// Potensi implementasi yang rentan
const existingSession = await prisma.guest_sessions.findUnique({
  where: { session_id: sessionId }
});

if (existingSession) {
  await prisma.guest_sessions.update({
    where: { session_id: sessionId },
    data: { last_access_at: new Date() }
  });
} else {
  await prisma.guest_sessions.create({...});
}
```

Jika dua request datang bersamaan:
1. Kedua request membaca `existingSession = null`
2. Kedua request mencoba membuat session baru
3. Salah satu akan gagal karena unique constraint

### Dampak
- Error saat pembuatan session
- Session tidak tercreate dengan benar
- Pengalaman pengguna terganggu

### Solusi Rekomendasi
```typescript
try {
  // Gunakan upsert untuk menghindari race condition
  await prisma.guest_sessions.upsert({
    where: { session_id: sessionId },
    update: { last_access_at: new Date() },
    create: {
      session_id: sessionId,
      event_id: eventId,
      guest_token: guestToken,
      // ... other fields
    }
  });
} catch (error) {
  if (error.code === 'P2002') { // Unique constraint violation
    // Retry logic atau handle appropriately
  }
}
```

## 4. Event Creation Race Condition

### Deskripsi Masalah
Saat membuat event baru, sistem menghasilkan `access_code` dan `slug` yang unik. Jika dua request datang bersamaan, bisa terjadi collision.

### Lokasi Kode
- `/app/api/events/create/route.ts` (asumsi)
- Atau endpoint pembuatan event lainnya

### Penyebab
Proses validasi duplikasi dilakukan setelah generate, bukan secara atomic.

### Dampak
- Pembuatan event gagal karena unique constraint
- Pengalaman pengguna terganggu
- Error handling tidak elegan

### Solusi Rekomendasi
```typescript
// Gunakan loop dengan retry untuk menghindari collision
let attempt = 0;
const maxAttempts = 5;

while (attempt < maxAttempts) {
  try {
    const newEvent = await prisma.$transaction(async (tx) => {
      // Generate unique values
      const accessCode = generateUniqueAccessCode();
      const slug = generateUniqueSlug();

      // Cek apakah sudah ada sebelum create
      const existingEvent = await tx.events.findFirst({
        where: {
          OR: [
            { access_code: accessCode },
            { slug: slug }
          ]
        }
      });

      if (existingEvent) {
        throw new Error('Collision detected, retrying...');
      }

      return await tx.events.create({
        data: {
          name: eventName,
          access_code: accessCode,
          slug: slug,
          // ... other fields
        }
      });
    });
    
    return newEvent;
  } catch (error) {
    if (error.message === 'Collision detected, retrying...') {
      attempt++;
      continue;
    }
    throw error;
  }
}
```

## 5. Real-time Guest Counter Race Condition

### Deskripsi Masalah
Di Socket.IO server, penghitungan jumlah pengunjung dilakukan secara local di memory dan tidak sinkron antar instances.

### Lokasi Kode
- `/server/socket-server.js`

### Penyebab
```javascript
// Dalam socket server
const guestCount = eventRooms.get(eventSlug).size;
guestCounts.set(eventSlug, guestCount);
```

Penghitungan dilakukan di memory local, bukan shared state.

### Dampak
- Jumlah pengunjung tidak akurat dalam multi-server setup
- Data tidak konsisten antar node
- Informasi real-time tidak akurat

### Solusi Rekomendasi
```javascript
// Gunakan Redis sebagai shared state
const incrementGuestCount = async (eventSlug) => {
  const key = `guest_count:${eventSlug}`;
  return await redis.incr(key);
};

const decrementGuestCount = async (eventSlug) => {
  const key = `guest_count:${eventSlug}`;
  const count = await redis.decr(key);
  if (count <= 0) {
    await redis.del(key); // Hapus key jika count <= 0
  }
  return count;
};
```

## 6. Comment Moderation Race Condition

### Deskripsi Masalah
Jika fitur `require_comment_moderation` aktif, bisa terjadi race condition antara approval dan tampilan komentar.

### Lokasi Kode
- `/lib/services/comments.ts` (asumsi)
- API routes komentar

### Penyebab
Tidak ada locking saat proses approval komentar.

### Dampak
- Komentar bisa muncul di UI sebelum benar-benar diapprove
- Data inkonsistensi antara state approval dan tampilan

### Solusi Rekomendasi
Gunakan status transisional dan atomic updates untuk approval process.

## 7. File Upload Race Condition

### Deskripsi Masalah
Saat file upload secara real-time, bisa terjadi race condition antara proses upload completion dan database update.

### Lokasi Kode
- Upload services di `/lib/upload/*`
- Socket events untuk progress

### Penyebab
Proses upload dan database update tidak atomic.

### Dampak
- File bisa tampil di gallery sebelum benar-benar selesai upload
- Data foto tidak lengkap ditampilkan ke pengguna

### Solusi Rekomendasi
Gunakan dua-phase commit atau status transisional untuk upload process.

## 8. Database Connection Pool Issues

### Deskripsi Masalah
Tidak ada konfigurasi connection pool yang optimal, bisa menyebabkan bottleneck saat beban tinggi.

### Lokasi Kode
- `/lib/prisma.ts`

### Penyebab
Konfigurasi default Prisma tanpa optimasi untuk concurrent access.

### Dampak
- Timeout saat concurrent request tinggi
- Performance degradation
- Connection exhaustion

### Solusi Rekomendasi
```typescript
// Di konfigurasi Prisma
new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  __internal: {
    // Konfigurasi connection pool
    engine: {
      // Jika perlu konfigurasi khusus
    }
  }
})
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Perbaiki photo like/download counter dengan atomic operations
2. Gunakan upsert untuk guest session management
3. Implementasi Redis untuk real-time counters

**Prioritas Menengah:**
1. Tambahkan retry logic untuk event creation
2. Gunakan database transactions untuk operasi kompleks
3. Implementasi distributed locking untuk operasi critical

**Prioritas Rendah:**
1. Tambahkan monitoring untuk mendeteksi race condition
2. Gunakan testing tools untuk stress testing konkurensi