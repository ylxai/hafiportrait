# Rincian Teknologi Proyek HafiPortrait

Dokumen ini merinci framework, platform, dan versi library utama yang digunakan dalam proyek.

---

### Framework & Platform

*   **Framework Utama:** **Next.js** versi **14.2.15**
*   **Lingkungan Runtime:** **Node.js** versi **v22.19.0**

### Teknologi API & Backend

*   **Database & Auth:** **Supabase**
    *   Library Klien: `@supabase/supabase-js` versi `^2.45.4`
*   **Server Real-time:** **Socket.IO** versi `^4.8.1`
    *   Framework Server: **Express** versi `^5.1.0`
*   **Penyimpanan File Eksternal:**
    *   **Cloudflare R2** (diakses melalui `@aws-sdk/client-s3`)
    *   **Google Drive** (diakses melalui `googleapis`)

### Versi Library Frontend Utama

*   **React:** versi `^18.3.1`
*   **TypeScript:** versi `^5.9.2`
*   **Styling:** **Tailwind CSS** versi `^3.4.17`
