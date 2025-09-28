# GEMINI.md

## Ikhtisar Proyek

Proyek ini adalah platform berbagi foto acara bernama HafiPortrait Photography. Dibangun dengan Next.js untuk frontend dan Supabase sebagai backend. Fitur real-time diimplementasikan menggunakan Socket.IO. Aplikasi ini memungkinkan pengguna untuk melihat foto dari berbagai acara, mengunggah foto baru, dan berinteraksi dengan platform secara real-time.

**Teknologi Utama:**

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS
*   **Backend:** Supabase (PostgreSQL)
*   **Real-time:** Socket.IO, Express, Node.js
*   **Penyimpanan Gambar:** Cloudflare R2, Google Drive (untuk backup)
*   **Deployment:** PM2 untuk manajemen proses

## Membangun dan Menjalankan

Berikut adalah perintah utama untuk membangun, menjalankan, dan menguji proyek:

*   **Instalasi:**
    ```bash
    pnpm install
    ```

*   **Menjalankan (Development):**
    ```bash
    pnpm run dev
    ```
    Ini akan menjalankan aplikasi Next.js di `http://localhost:3002`.

*   **Menjalankan dengan Socket.IO (Development):**
    ```bash
    pnpm run dev:socketio
    ```
    Ini akan menjalankan aplikasi Next.js dan server Socket.IO secara bersamaan.

*   **Membangun (Production):**
    ```bash
    pnpm run build
    ```

*   **Menjalankan (Production):**
    ```bash
    pnpm run start
    ```
    Ini akan menjalankan aplikasi Next.js yang sudah di-build di `http://localhost:3000`.

*   **Manajemen Proses (PM2):**
    *   Memulai (Production): `pnpm run pm2:start:prod`
    *   Menghentikan: `pnpm run pm2:stop`
    *   Memulai ulang: `pnpm run pm2:restart`
    *   Melihat log: `pnpm run pm2:logs`
    *   Melihat status: `pnpm run pm2:status`

## Konvensi Pengembangan

*   **Struktur Kode:** Kode sumber utama berada di direktori `src`. Aplikasi Next.js berada di `src/app`, dengan komponen di `src/components` dan logika bisnis di `src/lib`.
*   **Gaya Kode:** Proyek ini menggunakan TypeScript dan mengikuti konvensi standar React/Next.js.
*   **Manajemen Dependensi:** Proyek ini menggunakan `pnpm` sebagai manajer paket.
*   **Konfigurasi Lingkungan:** Variabel lingkungan dikelola dalam file `.env.local` untuk development dan `.env.production` untuk produksi.
*   **Linting:** Jalankan `pnpm run lint` untuk memeriksa masalah gaya kode.
