# DESIGN BRIEF

## PACKAGE LIST (ACCORDION) – MOBILE FIRST

---

### 🎯 TUJUAN UTAMA

* Pengguna **langsung memahami harga & paket**
* Mudah dibandingkan di layar kecil
* Minim scroll, minim kebingungan
* **Chat WhatsApp dapat dilakukan < 10 detik**

Target utama: **pengguna mobile (one-hand usage)**

---

## 4️⃣ PACKAGE LIST (ACCORDION)

### A. CATEGORY SELECTOR

**Fungsi:** Memfilter paket berdasarkan jenis acara

**Bentuk UI:**

* Segmented control / pill button
* Sticky di atas saat scroll

**Kategori:**

* 💍 Akad
* 🎉 Resepsi
* 💍🎉 Akad + Resepsi
* 📸 Digital Only

**UX Rules:**

* Default aktif: **Akad**
* Saat ganti kategori → accordion reset (semua tertutup)
* Animasi ringan (150–200ms)

---

### B. ACCORDION CARD – COLLAPSED

**1 kartu = 1 paket**

**Isi wajib (ringkas):**

1. Nama paket (semibold)
2. Badge (optional): ⭐ Best Seller / 👑 Signature
3. Harga (paling kontras)
4. Chevron icon (▾)

**UX Rules:**

* Tinggi card ideal untuk thumb tap
* Harga selalu terlihat tanpa expand

---

### C. ACCORDION CARD – EXPANDED

**Konten saat dibuka:**

* 3–4 poin highlight saja (ikon + teks)
* Detail lengkap boleh ditampilkan lebih kecil di bawah

**Highlight Contoh:**

* 📷 Jumlah photographer
* ⏱ Jam / hari kerja
* 📖 Album / Digital only
* 🖼 Jumlah foto

**Divider:**

* Line tipis / dotted / gradient lembut

**CTA:**

* Tombol full-width
* Teks spesifik paket
* Contoh: "📲 Chat WhatsApp – Sacred Vow"

---

## 5️⃣ DIGITAL ONLY PACKAGE

**Perbedaan visual wajib:**

* Background bisa disesuaikan
* Icon cloud / download
* Label kecil: "Digital Only • No Print"

**UX Rules:**

* Tidak dicampur dengan paket cetak
* Tetap menggunakan accordion

---

## 6️⃣ ADDITIONAL SERVICES

**Default:** Collapsed

**Expanded:**

* List sederhana
* Harga rata kanan
* Tanpa deskripsi panjang

**Tujuan:** Upsell tanpa mengganggu keputusan utama

---

## 7️⃣ MICROCOPY

Diletakkan di bawah section:

> *Harga dapat disesuaikan dengan kebutuhan acara*
> *Konsultasi gratis & cepat via WhatsApp*

Berfungsi untuk **menurunkan barrier chat**.

---

## ❌ HAL YANG HARUS DIHINDARI

* Semua accordion terbuka bersamaan
* Tabel panjang
* CTA kecil atau tidak kontras
* Scroll horizontal di dalam card
* Terlalu banyak teks

---

## ✅ UX RULE RINGKAS

* 1 kategori → beberapa paket
* 1 paket → 1 CTA
* 1 layar → 1 keputusan
