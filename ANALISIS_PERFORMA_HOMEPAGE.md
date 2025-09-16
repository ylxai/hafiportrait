# Analisis Performa Homepage dan Instruksi Perbaikan

Dokumen ini berisi hasil analisis performa homepage dan memberikan instruksi teknis kepada AI Asisten (Claude Sonnet 4) untuk melakukan perbaikan.

**Target**: Mengurangi waktu muat halaman utama (Largest Contentful Paint & Time to Interactive) dengan mengoptimalkan strategi rendering dan pengambilan data.

**Penyebab Utama Masalah**:
1.  **Server-Side Rendering (SSR) Dinonaktifkan**: Hampir semua komponen utama di `page.tsx` menggunakan `dynamic` import dengan opsi `ssr: false`. Ini menyebabkan server mengirimkan halaman yang hampir kosong, dan semua rendering terjadi di sisi klien.
2.  **Data Fetching di Sisi Klien**: Karena SSR nonaktif, komponen seperti `HeroSlideshow` dan `GallerySection` melakukan fetch data menggunakan `useQuery` setelah di-mount di browser. Ini menciptakan "network waterfall" yang signifikan: `HTML -> JS -> Render -> Fetch API -> Render Final`.
3.  **Potensi Over-Eager Loading pada Gambar**: `gallery-section.tsx` memuat 8 gambar pertama dengan `loading="eager"`, yang mungkin terlalu banyak untuk viewport awal.

---

## Instruksi untuk AI Asisten (Claude Sonnet 4)

Berikut adalah langkah-langkah yang harus Anda ambil untuk memperbaiki masalah performa. Lakukan secara berurutan.

### Langkah 1: Mengaktifkan SSR dan Memindahkan Data Fetching ke Server Component

Tujuan dari langkah ini adalah mengubah `page.tsx` menjadi Server Component untuk mengambil data di server dan mengirimkan HTML yang sudah ter-render ke klien.

1.  **Ubah `page.tsx` menjadi Server Component:**
    *   Hapus baris `'use client';` dari file `/home/eouser/hafiportrait/src/app/page.tsx`.
    *   Ubah deklarasi fungsi `HomePage` menjadi `async`: `export default async function HomePage() { ... }`.
    *   Hapus `QueryClientProvider` yang membungkus konten halaman. Komponen server tidak menggunakan React Query hooks.

2.  **Buat Fungsi Data Fetching Terpusat:**
    *   Buat fungsi `async` baru di dalam `page.tsx` (atau di file `lib` terpisah) untuk mengambil data untuk `HeroSlideshow` dan `GallerySection` secara paralel.

    ```javascript
    // Di dalam /home/eouser/hafiportrait/src/app/page.tsx

    async function getHomepageData() {
      // Gunakan URL absolut untuk fetch di sisi server
      const baseUrl = process.env.NEXTAUTH_URL_INTERNAL || 'http://localhost:3000';
      const slideshowPromise = fetch(`${baseUrl}/api/slideshow`, { cache: 'no-store' });
      const galleryPromise = fetch(`${baseUrl}/api/photos/homepage`, { cache: 'no-store' });

      const [slideshowRes, galleryRes] = await Promise.all([slideshowPromise, galleryPromise]);

      if (!slideshowRes.ok || !galleryRes.ok) {
        console.error('Failed to fetch homepage data');
        return { slideshowPhotos: [], galleryPhotos: [] };
      }

      const slideshowPhotos = await slideshowRes.json();
      const galleryPhotos = await galleryRes.json();

      return { 
        slideshowPhotos: Array.isArray(slideshowPhotos) ? slideshowPhotos : slideshowPhotos.photos || [],
        galleryPhotos 
      };
    }
    ```

3.  **Panggil Fungsi Fetching di `HomePage`:**
    *   Di dalam komponen `HomePage`, panggil fungsi `getHomepageData` dan teruskan datanya sebagai *props* ke komponen anak.

    ```javascript
    // Di dalam /home/eouser/hafiportrait/src/app/page.tsx

    export default async function HomePage() {
      const { slideshowPhotos, galleryPhotos } = await getHomepageData();

      return (
        <div className="min-h-screen bg-white">
          <Header />
          <main className="relative">
            <HeroSlideshow 
              photos={slideshowPhotos}
              className="h-screen"
              autoplay={true}
              interval={6000}
              showControls={true}
            />
            <EventsSection />
            <GallerySection photos={galleryPhotos} />
            <PricingSection />
            <ContactSection />
          </main>
          <Footer />
        </div>
      );
    }
    ```

### Langkah 2: Menyesuaikan Komponen Anak untuk Menerima Data via Props

Sekarang komponen anak akan menerima data sebagai props, bukan mengambilnya sendiri.

1.  **Modifikasi `HeroSlideshow` (`/home/eouser/hafiportrait/src/components/hero-slideshow.tsx`):**
    *   Hapus hook `useQuery` sepenuhnya.
    *   Ubah *props interface* untuk menerima `photos` secara langsung.
    *   Hapus `isLoading` dan `error` states yang berasal dari `useQuery`. Komponen sekarang akan selalu menerima data (meskipun array kosong).

    ```typescript
    // Perubahan pada hero-slideshow.tsx
    interface HeroSlideshowProps {
      photos: SlideshowPhoto[]; // Terima photos sebagai prop
      autoplay?: boolean;
      interval?: number;
      showControls?: boolean;
      className?: string;
    }

    export default function HeroSlideshow({ 
      photos, // Gunakan photos dari props
      autoplay = true, 
      interval = 5000,
      showControls = true,
      className = ''
    }: HeroSlideshowProps) {
      // ... (HAPUS useQuery)

      // Handle jika tidak ada foto
      if (!photos || photos.length === 0) {
        // Tampilkan fallback UI
        return ( ... );
      }
      
      // Sisa logika komponen tetap sama...
    }
    ```

2.  **Modifikasi `GallerySection` (`/home/eouser/hafiportrait/src/components/gallery-section.tsx`):**
    *   Lakukan hal yang sama: hapus `useQuery` dan terima `photos` sebagai prop.

    ```typescript
    // Perubahan pada gallery-section.tsx
    interface GallerySectionProps {
      photos: Photo[]; // Terima photos sebagai prop
    }

    export default function GallerySection({ photos }: GallerySectionProps) {
      // ... (HAPUS useQuery dan state isLoading/isError-nya)

      // Handle jika tidak ada foto
      if (!photos || photos.length === 0) {
        // Tampilkan fallback UI
        return ( ... );
      }

      // Sisa logika komponen tetap sama...
    }
    ```

### Langkah 3: Mengoptimalkan Penggunaan `next/dynamic`

Karena data sekarang dimuat di server, kita bisa mengizinkan komponen utama untuk di-render di server juga.

1.  **Ubah Opsi `dynamic` di `page.tsx`:**
    *   Hapus semua `dynamic` import dari `/home/eouser/hafiportrait/src/app/page.tsx`.
    *   Gantilah dengan *import* statis biasa di bagian atas file. SSR akan menangani rendering awal. Kita akan mengandalkan lazy-loading bawaan pada gambar untuk performa.

    ```javascript
    // Perubahan pada /home/eouser/hafiportrait/src/app/page.tsx

    // Hapus semua 'dynamic' import
    // import dynamic from 'next/dynamic';

    // Gunakan import statis
    import Header from "@/components/header";
    import Footer from "@/components/footer";
    import HeroSlideshow from "@/components/hero-slideshow";
    import EventsSection from "@/components/events-section";
    import GallerySection from "@/components/gallery-section";
    import PricingSection from "@/components/modern-glassmorphism-pricing";
    import ContactSection from "@/components/contact-section";

    // ... sisa file seperti di Langkah 1
    ```

### Langkah 4: Finalisasi dan Verifikasi

1.  **Jalankan Aplikasi**: Setelah semua perubahan, jalankan server pengembangan.
2.  **Periksa "View Page Source"**: Buka homepage di browser, klik kanan, dan pilih "View Page Source". Anda sekarang seharusnya melihat konten HTML dari `HeroSlideshow` dan komponen lainnya, bukan hanya `div` kosong. Ini adalah bukti bahwa SSR berfungsi.
3.  **Analisis Network Tab**: Buka DevTools, lihat tab Network. Seharusnya tidak ada lagi request ke `/api/slideshow` atau `/api/photos/homepage` dari sisi klien saat halaman dimuat. Data sudah termasuk dalam payload HTML awal.

Dengan mengikuti langkah-langkah ini, Anda akan secara drastis mengurangi jumlah pekerjaan yang harus dilakukan browser dan secara signifikan mempercepat waktu pemuatan yang dirasakan pengguna.

---

## ✅ **PROGRESS IMPLEMENTASI - SELESAI**

### **Perubahan yang Telah Dilakukan:**

#### ✅ **Langkah 1: Ubah `page.tsx` menjadi Server Component** - [SELESAI]
- Hapus `'use client'`
- Hapus `QueryClientProvider`
- Hapus semua `dynamic` imports
- Tambah fungsi `getHomepageData()` untuk parallel data fetching
- Teruskan data sebagai props ke komponen anak

#### ✅ **Langkah 2: Update HeroSlideshow** - [SELESAI]
- Tambah `'use client'` (karena menggunakan hooks)
- Hapus `useQuery` hook
- Update interface untuk menerima `photos` props
- Hapus loading dan error state

#### ✅ **Langkah 3: Update GallerySection** - [SELESAI]
- Hapus `useQuery` hook
- Update interface untuk menerima `photos` props
- Hapus loading dan error state

#### ✅ **Langkah 4: Verifikasi Komponen Lain** - [SELESAI]
- Semua komponen lain sudah memiliki `'use client'`
- Tidak perlu perubahan tambahan

#### ✅ **Langkah 5: Perbaiki Syntax Error** - [SELESAI]
- Hapus duplikat `'use client'` di hero-slideshow.tsx
- Hapus whitespace di awal page.tsx
- Build berhasil tanpa error

### **Hasil yang Diharapkan:**
- ⚡ **Loading time jauh lebih cepat** - tidak ada network waterfall
- 🔄 **SSR aktif** - HTML ter-render di server
- 📱 **Mobile performance lebih baik** - loading skeleton tidak perlu
- 🔍 **SEO lebih baik** - konten tersedia untuk search engine
- 📊 **Lighthouse score meningkat** - terutama LCP dan FCP

### **File yang Diupdate:**
- `/home/eouser/hafiportrait/src/app/page.tsx` - Server Component dengan data fetching
- `/home/eouser/hafiportrait/src/components/hero-slideshow.tsx` - Menerima photos via props
- `/home/eouser/hafiportrait/src/components/gallery-section.tsx` - Menerima photos via props

---

## 🔄 **Langkah Selanjutnya: Optional Optimizations**

### **Langkah 6: Optimasi Image Loading (Optional)**
1.  **Reduce eager loading**: Ubah `loading="eager"` menjadi `loading="lazy"` untuk gambar di luar viewport
2.  **Add priority attribute**: Gunakan `priority={true}` hanya untuk above-the-fold images
3.  **Optimize image sizes**: Pastikan gambar memiliki ukuran yang tepat untuk device

### **Langkah 7: Add Loading States (Optional)**
1.  **Streaming SSR**: Implementasi streaming untuk skeleton loading
2.  **Progressive enhancement**: Tambahkan loading states untuk components yang masih fetch data

### **Langkah 8: Cache Strategy (Optional)**
1.  **Implement cache headers**: Tambah cache headers yang lebih agresif
2.  **Stale-while-revalidate**: Gunakan pattern untuk data yang tidak real-time
