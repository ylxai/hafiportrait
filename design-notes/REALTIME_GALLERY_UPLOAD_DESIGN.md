# Realtime Gallery Upload Design (Admin Upload Only)

## Tujuan
Membuat foto yang di-upload oleh admin/photographer (melalui Admin Dashboard atau API) **muncul realtime** di halaman event untuk client/guest/tamu **tanpa refresh**, sehingga mereka bisa langsung **view / like / comment / download** selama sesi pemotretan (hingga 8 jam+).

## Konteks & Constraint
- Deployment: **VPS** (PM2), bukan serverless.
- Storage utama: **Cloudflare R2** untuk original (dan download tamu).
- Upload hanya oleh **Admin/Photographer**.
- Gallery perlu menampilkan **foto terbaru di atas** (newest-first).
- UX realtime: tampilkan toast **"New Images Added"**, klik toast → **scroll ke top**.
- Realtime reliability: **Socket trigger + polling fallback 30–45 detik**.
- Publish: **otomatis** (tanpa approval).
- Kesederhanaan diutamakan (minim perubahan besar).

---

## Analisa Kondisi Saat Ini (Sudah Ada vs Belum Ada)

### Yang sudah ada
1) **Socket.IO room per event**
- Room naming sudah konsisten: `event:${eventSlug}`
- Client hook `useSocket({ eventSlug })` otomatis melakukan `event:join` saat connect.

2) **Event Socket untuk upload complete sudah ada**
- Event: `photo:upload:complete`
- Ada juga `photo:upload:progress`.

3) **Schema DB sudah memadai untuk publish cepat**
- Tabel `photos` sudah punya:
  - `created_at`, `deleted_at`
  - `original_url`
  - `thumbnail_*_url` (small/medium/large)
  - `event_id`
- Untuk “publish otomatis”, saat ini cukup memastikan record photo dibuat dan `deleted_at = null`.

4) **Gallery API sudah menyediakan newest-first**
- `GET /api/gallery/[eventSlug]/photos` mendukung `sort=newest` (orderBy `created_at desc`).

### Yang belum ada / gap
1) **Gallery UI belum memanfaatkan socket event upload complete**
- Komponen gallery (`components/gallery/PhotoGrid.tsx`, `EditorialPhotoGrid.tsx`) belum mendengarkan `photo:upload:complete`, sehingga foto baru tidak muncul realtime.

2) **Upload route belum melakukan broadcast socket setelah insert DB**
- Route upload admin membuat record photo di DB, namun tidak memanggil util broadcast ke Socket.IO.
- Akibatnya walau socket server mendukung event, tidak ada sinyal otomatis ke guest.

3) **Belum ada API “delta fetch” yang efisien**
- API gallery saat ini pagination berbasis `page` + `limit`.
- Untuk realtime, lebih ideal ada parameter seperti `since` (cursor) agar client bisa mengambil foto yang lebih baru dari foto teratas yang sudah tampil.

4) **Ada dua implementasi Socket server di repo**
- `server/socket-server.ts` (standalone server port 3001) dengan auth/authorization lebih ketat.
- `lib/socket/socket-server.ts` (in-app server) mengasumsikan path `/api/socket`, tetapi route Next untuk itu tidak terlihat ada.
- Untuk menghindari konflik, perlu diputuskan mana yang menjadi “source of truth” operasional (kemungkinan besar standalone `server/socket-server.ts`).

---

## Desain Solusi yang Disepakati

### 1) Publish cepat (tanpa menunggu thumbnail)
- Begitu upload sukses (original tersimpan di R2 + record photo masuk DB), foto dianggap **publish** dan boleh tampil di gallery.
- Thumbnail/EXIF boleh menyusul; selama itu, gallery boleh menampilkan fallback (misalnya pakai `thumbnail_medium_url` jika ada; jika belum ada, fallback ke ukuran lain sesuai kebijakan yang sudah ada di UI).

### 2) Realtime: socket sebagai trigger + delta fetch
- Setelah insert DB untuk foto baru, backend mengirim **socket event** ke room `event:${eventSlug}`.
- Client menampilkan toast **"New Images Added"**.
- Saat toast diklik, client:
  - fetch foto baru (delta)
  - prepend ke list
  - scroll ke top

### 3) Polling fallback (30–45 detik)
- Untuk mengatasi socket putus / missed message:
  - client melakukan polling delta setiap 30–45 detik
  - bila ada foto baru, tampilkan toast yang sama

---

## Rekomendasi Model Data (Minim Konflik)
Tujuan bagian ini: membuat rencana yang jelas untuk DB tabel/kolom tanpa bentrok dengan schema yang sudah ada.

### Pilihan paling minimal (tanpa perubahan schema)
- Tidak menambah kolom baru.
- Anggap foto sudah “published” jika:
  - `deleted_at IS NULL` dan
  - record sudah ada
- Anggap thumbnail belum siap jika:
  - `thumbnail_small_url/thumbnail_medium_url/...` masih `NULL`

Kelebihan: tidak ada migration.
Kekurangan: status processing tidak eksplisit.

### Pilihan minimal + eksplisit (opsional, fase lanjut)
Jika nanti butuh status lebih jelas tanpa konflik:
- Tambah kolom di `photos`:
  - `processing_status` (mis. `UPLOADED`, `THUMBNAILS_READY`, `FAILED`)
  - atau `thumbnails_ready_at` (DateTime nullable)
  - atau `processing_error` (String nullable)

Catatan: ini opsional dan sebaiknya dilakukan setelah realtime dasar berjalan.

---

## Rekomendasi API (Minim Konflik)

### Kondisi saat ini
- `GET /api/gallery/[eventSlug]/photos?page=1&limit=...&sort=newest` sudah bisa mengambil batch terbaru.

### Tambahan yang disarankan untuk realtime (delta)
Tambahkan dukungan query parameter untuk delta fetch:
- `since`: timestamp `created_at` foto teratas yang sudah ada di client
- response tetap newest-first

Tujuan: client hanya mengambil foto yang benar-benar baru, bukan refetch seluruh halaman.

---

## Rencana Implementasi Bertahap (Phase 1/2/3)

### Phase 1 — Realtime dasar (tanpa perubahan schema DB)
Fokus: “foto baru muncul tanpa refresh” dengan perubahan minimal.

1) **Backend: broadcast setelah upload sukses**
- Setelah photo record berhasil dibuat, kirim socket event ke room event.
- Gunakan event yang sudah ada: `photo:upload:complete`.

2) **Frontend (gallery): dengarkan event socket**
- Di `PhotoGrid`/`EditorialPhotoGrid`, tambahkan listener ke `photo:upload:complete`.
- Saat event diterima:
  - tampilkan toast "New Images Added".
  - jangan langsung memaksa refetch (sesuai UX keputusan Anda).

3) **On click toast: refresh minimal**
- Paling sederhana (tanpa API delta): fetch ulang `page=1&sort=newest` lalu merge di client (dedupe by `photo.id`).
- Setelah merge, scroll ke top.

Output Phase 1:
- Realtime sudah terasa, tanpa perubahan DB dan tanpa perubahan kontrak API.

---

### Phase 2 — Delta fetch + polling fallback (lebih efisien & robust)
Fokus: efisiensi jaringan dan reliability jangka panjang.

1) **API: dukungan `since`**
- Tambah query param `since` agar API mengembalikan hanya foto yang lebih baru.

2) **Frontend: implement delta fetch**
- Client simpan `latestCreatedAt` (created_at foto teratas).
- Saat toast diklik: panggil API `since=latestCreatedAt`.

3) **Polling fallback 30–45 detik**
- Polling menggunakan `since=latestCreatedAt`.
- Jika response ada foto baru: tampilkan toast.

Output Phase 2:
- Realtime stabil dan murah (tidak refetch page 1 terus).

---

### Phase 3 — Hardening (opsional) + status processing yang lebih jelas
Fokus: kualitas operasional dan mengurangi edge-case.

1) **Status processing eksplisit (opsional migration)**
- Tambahkan `processing_status` atau `thumbnails_ready_at` untuk memudahkan observability.

2) **Worker thumbnails lebih terukur**
- Pastikan worker memprioritaskan thumbnail kecil/medium terlebih dahulu agar gallery cepat ringan.
- Tambahkan retry policy dan pencatatan error.

3) **Dedup & UX refinement**
- Pastikan notifikasi tidak double (socket + polling) via dedupe berdasarkan cursor.
- Tampilkan counter (opsional) jumlah foto baru jika diperlukan nanti.

Output Phase 3:
- Sistem lebih mudah dipantau, lebih tahan error, dan lebih nyaman di skala event besar.

---

## Kontrak Event Socket (Disepakati)
- Field identifier foto pada payload socket distandarkan menjadi: **`photo_id`**.
- Untuk masa transisi, server dapat menerima input `photoId` atau `photo_id`, tetapi **yang di-emit ke client hanya `photo_id`**.
- Tujuan: menghindari mismatch dan membuat typing/kompatibilitas lebih jelas.

## Catatan Penting untuk Menghindari Konflik Socket Server
- Repo memiliki dua jalur socket server (`server/socket-server.ts` vs `lib/socket/socket-server.ts`).
- Untuk implementasi realtime gallery, sebaiknya pilih satu jalur operasional (umumnya standalone `server/socket-server.ts` karena sudah ada auth/authorization yang lebih ketat).
- Pastikan mekanisme broadcast dari Next API menuju server socket jelas (misalnya menggunakan satu util broadcasting yang disepakati).

