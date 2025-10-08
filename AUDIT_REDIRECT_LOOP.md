# Laporan Audit: Masalah Redirect Loop Admin

Dokumen ini merangkum temuan audit terkait masalah di mana pengguna dialihkan kembali ke halaman login setelah otentikasi berhasil di `/admin`.

## Ringkasan Masalah

Pengguna berhasil memasukkan username dan password yang benar di halaman `/admin/login`. Setelah itu, pengguna sempat diarahkan ke dashboard admin (`/admin`), namun segera dialihkan kembali ke halaman login (`/admin/login`). Ini menciptakan sebuah "redirect loop" yang mencegah akses ke panel admin.

## Analisis Penyebab Utama

Penyebab utama dari masalah ini adalah **kesalahan fatal dalam logika pengaturan cookie sesi** pada file `src/app/api/auth/login/route.ts`.

Saat pengguna login, server mencoba mengatur cookie sesi di browser. Namun, cookie ini diatur dengan kombinasi atribut yang tidak valid, sehingga browser modern menolaknya dan tidak pernah menyimpannya.

#### Kesalahan Kritis pada Pengaturan Cookie

Di dalam file `login/route.ts`, terdapat logika untuk mendeteksi lingkungan produksi. Ketika permintaan datang dari domain `hafiportrait.photography`, kode tersebut melakukan kesalahan berikut:

1.  Ia mengatur atribut `domain` pada cookie menjadi `hafiportrait.photography`.
2.  Namun, ia secara keliru mengatur atribut `secure` menjadi `false`.

```javascript
// File: src/app/api/auth/login/route.ts (sekitar baris 260)

if (isHafiPortraitDomain) {
  // Domain access - ALWAYS use both domain and host-only cookies
  cookieOptions.domain = 'hafiportrait.photography';
  // CRITICAL FIX: Allow non-secure cookies for debugging
  cookieOptions.secure = false; // <--- INI PENYEBAB MASALAH
  cookieOptions.sameSite = 'lax';
  console.log('🌐 Domain access detected - Setting NON-SECURE domain cookie for testing');
}
```

**Aturan Keamanan Browser:** Browser modern (Chrome, Firefox, Safari) akan **menolak** cookie jika:
*   Cookie tersebut memiliki atribut `Domain` (misalnya, `.hafiportrait.photography`).
*   DAN diakses melalui koneksi aman (HTTPS).
*   TETAPI atribut `Secure` tidak diatur (`Secure;` flag tidak ada).

Karena Anda mengakses `https://hafiportrait.photography`, browser mengharapkan cookie yang aman. Dengan mengatur `secure: false`, server secara eksplisit meminta browser untuk mengatur cookie yang tidak aman, yang langsung ditolak oleh browser.

## Alur Kegagalan (Failure Flow)

1.  **Login Berhasil:** Pengguna mengirim kredensial yang valid ke `/api/auth/login`. Server memvalidasi kredensial dan membuat sesi.
2.  **Pengaturan Cookie Gagal:** Server mencoba mengatur cookie sesi dengan `domain` dan `secure: false`. Browser menolak cookie ini.
3.  **Redirect ke Admin:** Browser dialihkan ke halaman `/admin`.
4.  **Verifikasi Sesi:** Halaman `/admin` memanggil hook `useRequireAuth`, yang kemudian mengirim permintaan ke `/api/auth/me` untuk memverifikasi sesi.
5.  **Sesi Tidak Ditemukan:** Karena cookie tidak pernah disimpan, browser tidak mengirimkan cookie sesi apa pun ke `/api/auth/me`.
6.  **Kegagalan Otorisasi:** Endpoint `/api/auth/me` tidak menemukan cookie sesi, sehingga mengembalikan error `401 Unauthorized`.
7.  **Redirect Kembali ke Login:** Hook `useRequireAuth` menerima status "tidak terotentikasi" dan mengalihkan pengguna kembali ke `/admin/login`. Siklus ini pun berulang.

## Faktor Penyebab Lainnya

*   **Logika yang Terlalu Rumit:** Kode di `login/route.ts` memiliki logika yang sangat kompleks untuk mendeteksi lingkungan dan mengatur beberapa cookie (`admin_session`, `admin_session_backup`, `admin_session_fallback`, `admin_session_simple`). Ini tidak perlu dan membuat kode menjadi rapuh.

## Rekomendasi Perbaikan

1.  **Perbaiki Atribut `secure`:** Ubah baris `cookieOptions.secure = false;` menjadi `cookieOptions.secure = true;` di dalam blok `if (isHafiPortraitDomain)`. Ini adalah perbaikan utama.
2.  **Sederhanakan Logika Cookie:** Hapus semua logika deteksi lingkungan yang rumit dan standarkan pada satu metode pengaturan cookie yang andal. Cukup gunakan satu nama cookie (misalnya, `admin_session`).
3.  **Hapus Cookie Redundan:** Hentikan pengaturan cookie `_backup`, `_fallback`, dan `_simple`. Ini tidak perlu dan hanya menambah kebingungan.

Dengan menerapkan perbaikan ini, cookie sesi akan diatur dengan benar, dan masalah redirect loop akan teratasi.
