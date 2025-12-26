# Audit Report (Manual) — Hafiportrait

> Format: **Masalah — Risiko — Dampak — Rekomendasi** (tanpa contoh kode)

## 1) Temuan Keamanan (Critical/High)

### 1.1 Secrets/kredensial nyata tersimpan di `.env.example`
- **Masalah:** File environment contoh berisi nilai kredensial yang tampak nyata (database URL, R2 access/secret key).
- **Risiko:** Kebocoran kredensial melalui repo, backup, atau distribusi source.
- **Dampak:** Akses tidak sah ke database dan storage (pencurian data, penghapusan file, biaya tak terduga, kompromi sistem).
- **Rekomendasi:** Anggap kredensial sudah bocor dan lakukan rotasi; ubah `.env.example` menjadi placeholder; audit history git dan akses pihak ketiga.

### 1.2 CSRF middleware berpotensi mengonsumsi body request
- **Masalah:** Middleware CSRF mencoba membaca `request.json()` untuk mencari token.
- **Risiko:** Body stream tidak bisa dibaca ulang → request handler dapat menerima body kosong/invalid.
- **Dampak:** Bug intermiten pada endpoint state-changing (upload, update, delete), false-negative CSRF, atau kegagalan request.
- **Rekomendasi:** Wajibkan token CSRF lewat header untuk browser; hindari parsing body di middleware; jika perlu, lakukan strategi parsing terpusat yang menjamin body tetap tersedia.

### 1.3 Kebocoran data sensitif pada endpoint API Keys
- **Masalah:** Endpoint detail API key mengembalikan `key_hash`.
- **Risiko:** Hash tetap informasi sensitif (membantu verifikasi/serangan offline, memperkecil ruang tebakan).
- **Dampak:** Risiko kompromi API key meningkat jika attacker mendapatkan data hash.
- **Rekomendasi:** Jangan pernah mengembalikan hash; tampilkan hanya `key_prefix` dan metadata non-sensitif; pastikan logging tidak memuat hash/plaintext.

### 1.4 Rate limiting dinonaktifkan/diturunkan pada endpoint sensitif
- **Masalah:** Rate limiting login dapat “fallback allow” saat Redis error; rate limit upload dinyatakan “disabled” (praktis unlimited).
- **Risiko:** Brute force login dan DoS (CPU/mem/disk/bandwidth) melalui upload masif.
- **Dampak:** Akun admin berisiko dibobol; server melambat/crash; biaya storage dan egress melonjak.
- **Rekomendasi:** Samakan satu sistem rate limiting; untuk login gunakan fail-closed atau fallback yang tetap membatasi; untuk upload gunakan limit bertingkat (per-user/per-event/per-IP) + burst control.

### 1.5 Middleware proteksi route admin belum menyeluruh
- **Masalah:** Middleware hanya melindungi beberapa route admin, sedangkan banyak halaman admin lain tidak tercakup.
- **Risiko:** Akses UI admin tanpa redirect login (walau API mungkin masih menolak), meningkatkan risiko info leak dan UX buruk.
- **Dampak:** Kemungkinan bocor data dari halaman yang melakukan fetch client-side; inkonsistensi proteksi.
- **Rekomendasi:** Proteksi semua prefix `/admin` kecuali `/admin/login`; selaraskan dengan guard di server (layout/page) dan API.

### 1.6 `next.config.js` mengizinkan remote images dari semua host
- **Masalah:** `images.remotePatterns` memperbolehkan `https://**`.
- **Risiko:** Memperluas attack surface (tracking pixel/abuse), melemahkan kontrol CSP dan kebijakan content.
- **Dampak:** Potensi kebocoran privasi user, beban jaringan tidak terkontrol.
- **Rekomendasi:** Whitelist domain yang benar-benar dibutuhkan (R2 public domain + domain internal).

### 1.7 CSP masih mengizinkan inline style dan (di dev) unsafe-eval/unsafe-inline
- **Masalah:** Kebijakan CSP production masih mengizinkan `unsafe-inline` untuk style; dev mengizinkan eval/inline script.
- **Risiko:** `unsafe-inline` melemahkan mitigasi XSS; konfigurasi dev dapat terseret ke production jika salah env.
- **Dampak:** Jika ada celah XSS, dampaknya lebih parah.
- **Rekomendasi:** Minimalkan `unsafe-inline` (pakai nonce/hash jika memungkinkan); pastikan dev-only tidak mungkin aktif di production.

## 2) Temuan API (AuthZ, Validasi, Konsistensi)

### 2.1 Endpoint admin comments tidak terlihat memiliki autentikasi
- **Masalah:** Route moderasi komentar admin tidak terlihat melakukan `getUserFromRequest`/cek role admin.
- **Risiko:** Akses tanpa otorisasi (IDOR/unauthorized moderation/export).
- **Dampak:** Data komentar bisa diekspos, dimodifikasi, atau diekspor oleh pihak tidak berwenang.
- **Rekomendasi:** Terapkan autentikasi + otorisasi admin secara eksplisit pada semua method; tambahkan validasi input query/body.

### 2.2 Validasi input tidak konsisten di banyak endpoint admin
- **Masalah:** Sebagian endpoint admin menggunakan Zod, sebagian menerima body mentah (contoh: update event, update message status, update kategori/package/service).
- **Risiko:** Data kotor/invalid masuk DB, potensi injection logic-level, dan error runtime.
- **Dampak:** Korupsi data, bug UI, error 500, dan potensi eksploitasi.
- **Rekomendasi:** Standarkan validasi Zod untuk semua input (body, query params, route params), termasuk batasan panjang string dan enumerasi.

### 2.3 Status code dan struktur response tidak konsisten
- **Masalah:** Campuran pola `{success: true}` vs `NextResponse.json(data)` polos; ada tempat yang mengembalikan 401 untuk “forbidden”.
- **Risiko:** Client sulit menangani error secara konsisten; debugging lebih sulit.
- **Dampak:** UX buruk dan bug di admin/guest karena asumsi response shape.
- **Rekomendasi:** Terapkan kontrak response standar untuk semua API (success/data/error/meta) dan status code yang tepat.

### 2.4 Cron endpoints bergantung pada CRON_SECRET tetapi perilaku tidak konsisten
- **Masalah:** Satu cron endpoint mengizinkan tanpa secret jika env tidak diset, yang lain fail dengan 500 bila secret tidak ada.
- **Risiko:** Salah konfigurasi menyebabkan endpoint terbuka atau cron mati.
- **Dampak:** Cleanup tidak berjalan atau dapat dipanggil tanpa otorisasi (jika salah set).
- **Rekomendasi:** Wajibkan secret di semua cron endpoint; fail-closed; dokumentasikan dan validasi env saat startup.

## 3) Upload & Storage

### 3.1 Batas upload “produksi” sangat besar tanpa pembatasan memadai
- **Masalah:** Batas file 200MB, batch 5GB, jumlah file besar; concurrency juga ditingkatkan.
- **Risiko:** DoS resource (RAM/CPU/IO), timeouts, dan biaya storage/egress.
- **Dampak:** Kegagalan upload massal pada jam sibuk; server crash; biaya melonjak.
- **Rekomendasi:** Tetapkan kebijakan bertingkat: limit per-file/per-batch/per-event/per-user; gunakan upload resumable/chunked yang benar-benar stream (bukan buffer penuh), dan kontrol concurrency berdasarkan resource.

### 3.2 Verifikasi MIME/magic bytes dinonaktifkan default pada R2 upload
- **Masalah:** Verifikasi konten terhadap MIME type dimatikan default demi performa.
- **Risiko:** File non-gambar dapat lolos dan memicu masalah ketika diproses/ditampilkan.
- **Dampak:** Potensi crash pemrosesan, penyimpanan file berbahaya, dan risiko supply-chain konten.
- **Rekomendasi:** Aktifkan verifikasi untuk tipe selain HEIC/HEIF; gunakan jalur fast-path hanya untuk trusted admin dengan pembatasan ketat.

### 3.3 Inkonsistensi storage backend (R2 vs Vercel Blob vs VPS local)
- **Masalah:** Upload dan cleanup menggunakan beberapa backend: R2, local storage, dan Vercel Blob (untuk delete).
- **Risiko:** File orphan (tidak terhapus), atau delete gagal karena backend tidak sesuai URL.
- **Dampak:** Storage membengkak; data tidak konsisten; proses cleanup tidak efektif.
- **Rekomendasi:** Satu sumber kebenaran storage; cleanup harus menghapus sesuai backend yang dipakai; simpan metadata backend pada record atau normalisasi URL.

### 3.4 Potensi memory leak di admin uploader (preview URL)
- **Masalah:** Preview dibuat via object URL per file tanpa terlihat mekanisme revoke.
- **Risiko:** Memory leak pada sesi upload besar.
- **Dampak:** Browser admin menjadi berat, hang, atau crash saat upload ratusan file.
- **Rekomendasi:** Revoke object URL saat file dihapus/selesai/unmount; batasi jumlah preview render.

## 4) Database (Prisma Schema, Relasi, Integritas)

### 4.1 Duplikasi konsep `deleted_by` vs `deleted_by_id` pada tabel photos
- **Masalah:** Schema memiliki dua kolom untuk “siapa yang menghapus”: `deleted_by_id` (FK) dan `deleted_by` (string), dan code menggunakan keduanya berbeda-beda.
- **Risiko:** Data audit trail tidak konsisten, query/index salah sasaran.
- **Dampak:** Laporan trash/restore dan audit menjadi tidak akurat; potensi bug pada delete event.
- **Rekomendasi:** Pilih satu representasi (disarankan `deleted_by_id` FK) dan migrasikan data; hapus kolom yang tidak dipakai.

### 4.2 Tabel photo_downloads dan photo_views tidak memiliki foreign key di schema
- **Masalah:** Model tidak mendefinisikan relasi FK ke photos/events.
- **Risiko:** Data orphan (photo_id mengacu ke foto yang sudah dihapus) dan integritas lemah.
- **Dampak:** Analytics menjadi salah, query berat, cleanup sulit.
- **Rekomendasi:** Tambahkan FK ke photos (dan event bila diperlukan) dengan onDelete Cascade; tambahkan index komposit yang sesuai kebutuhan laporan.

### 4.3 Inkonsistensi tipe id (`uuid()` vs `cuid()`) pada refresh_tokens
- **Masalah:** `refresh_tokens.id` menggunakan `cuid()` sementara tabel lain mayoritas `uuid()`.
- **Risiko:** Inkonistensi pola id, potensi asumsi salah di code/tooling.
- **Dampak:** Maintenance lebih sulit, debugging dan integrasi lebih rawan error.
- **Rekomendasi:** Standarkan tipe id untuk semua tabel (pilih uuid atau cuid) dan migrasikan bila perlu.

### 4.4 Seed menyertakan password default yang dapat diprediksi
- **Masalah:** Seed membuat user dengan password statis.
- **Risiko:** Jika seed dipakai di environment non-dev, akun mudah dibobol.
- **Dampak:** Kompromi admin/akun.
- **Rekomendasi:** Jangan gunakan password statis; gunakan env var untuk seed atau generate acak dan hanya tampilkan sekali di console pada dev.

## 5) Frontend (RSC/Client Components, Performa, UX Mobile)

### 5.1 Banyak halaman admin dan landing dijadikan client component
- **Masalah:** Banyak page/layout admin menggunakan `'use client'` sehingga data fetching cenderung terjadi di client.
- **Risiko:** Beban JS besar, TTFB bagus tapi interaksi lambat pada mobile; lebih banyak request dari client.
- **Dampak:** Performa mobile menurun (bundle besar, hydration mahal), UX lebih lambat.
- **Rekomendasi:** Pindahkan fetching awal ke Server Components bila memungkinkan; gunakan client component hanya untuk interaktif.

### 5.2 TanStack Query ada dependency tapi tidak terlihat digunakan
- **Masalah:** Proyek bergantung pada TanStack Query namun implementasi tampak memakai `fetch` manual.
- **Risiko:** Tidak ada caching/invalidasi terstandar; duplikasi logic; state server tidak konsisten.
- **Dampak:** UI admin dan gallery rawan stale data; beban network lebih tinggi.
- **Rekomendasi:** Konsolidasikan fetch ke TanStack Query untuk area interaktif; atau hilangkan dependency bila tidak dipakai.

### 5.3 Infinite scroll tanpa virtualisasi
- **Masalah:** Gallery memuat foto per halaman dan append ke array tanpa virtualisasi.
- **Risiko:** DOM membengkak pada event dengan ribuan foto.
- **Dampak:** Scrolling lag, memory tinggi, crash di device low-end.
- **Rekomendasi:** Gunakan virtualized list/grid; batasi jumlah node render; pertimbangkan masonry virtualized untuk editorial grid.

### 5.4 Analytics view tracking dapat duplikat
- **Masalah:** Tracking view dipanggil dari beberapa komponen/hook dan memiliki dependency yang berpotensi tidak lengkap.
- **Risiko:** Overcount analytics.
- **Dampak:** Data views tidak akurat.
- **Rekomendasi:** Pastikan tracking dipanggil sekali per session/page view (idempotent) dan dependency hook benar.

### 5.5 `dangerouslySetInnerHTML` digunakan untuk GA snippet
- **Masalah:** Inline script injection via `dangerouslySetInnerHTML`.
- **Risiko:** Jika parameter dinamis masuk, menjadi vektor XSS.
- **Dampak:** XSS pada root layout (dampak luas).
- **Rekomendasi:** Pastikan konten benar-benar statis; pertimbangkan integrasi analytics yang lebih aman/terstandar.

### 5.6 Lint warnings pada hook dependency
- **Masalah:** Ada beberapa warning `react-hooks/exhaustive-deps`.
- **Risiko:** Stale closure dan perilaku tidak konsisten.
- **Dampak:** Bug UI/analytics (mis. eventSlug berubah tapi callback tidak update).
- **Rekomendasi:** Perbaiki dependency hook atau refactor supaya callback stabil.

## 6) Testing & Quality Gate

### 6.1 Test suite tidak terdeteksi
- **Masalah:** `vitest` tidak menemukan file test; folder `tests/` tidak ada.
- **Risiko:** Perubahan tidak terjaga; regresi mudah lolos.
- **Dampak:** Bug produksi meningkat, khususnya pada area upload/auth.
- **Rekomendasi:** Tambahkan unit/integration tests minimal untuk auth, CSRF, rate limit, dan upload validator; pastikan pola nama test sesuai Vitest.

---

## Ringkasan Prioritas (Disarankan)
1) Rotasi secrets & bersihkan `.env.example`.
2) Perbaiki CSRF middleware agar tidak consume body.
3) Kunci endpoint admin comments + hilangkan `key_hash` dari response API key.
4) Satukan rate limiting dan aktifkan pembatasan minimal pada login/upload.
5) Standarkan storage backend (hapus Vercel Blob jika tidak dipakai) + rapikan cleanup.
6) Rapikan schema: satu `deleted_by_id` saja; tambah FK untuk downloads/views.
7) Tambahkan virtualisasi gallery dan perbaiki leak object URL di uploader.

