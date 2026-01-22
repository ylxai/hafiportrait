# Landing Page Update Brief (Palette + Icons)

## Goal
Update landing page styling agar mengikuti tema **Detranium-style** dengan:
1) **Penggantian color palette Tailwind** (brand colors).
2) **Penggantian ikon “Our Services”** menggunakan `@heroicons/react` (Outline).

> Catatan: Project menggunakan **Next.js** + **TailwindCSS v3.4** dan dependency `@heroicons/react` sudah tersedia.

---

## A) Color Palette (Tailwind)
Tambahkan/replace di `theme.extend.colors` (Tailwind config):

- `detra-black`: `#121212`
- `detra-dark`: `#1E1E1E`
- `detra-gray`: `#2C2C2C`
- `detra-light`: `#E5E5E5`
- `detra-gold`: `#C5A059`

### Usage guidance
Refactor class di landing page agar konsisten memakai warna di atas:
- Background utama: `bg-detra-black` / `bg-detra-dark`
- Surface/card: `bg-detra-gray`
- Text utama: `text-detra-light` atau `text-white`
- Accent/highlight: `text-detra-gold`, `border-detra-gold`, `bg-detra-gold/10`, `hover:bg-detra-gold`

Boleh tetap memakai utilitas netral bila diperlukan:
- `bg-black/50`, `bg-white/5`, `text-white/50`, dll.

---

## B) Our Services Icons (Heroicons Outline)
Gunakan **Heroicons Outline**:

```ts
import {
  CameraIcon,
  HeartIcon,
  UserGroupIcon,
  GiftIcon,
  HandRaisedIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
```

### Icon mapping
- **Wedding Photography** → `CameraIcon`
- **Prewedding** → `HeartIcon`
- **Couple Photography** → `UserGroupIcon`
- **Ulang Tahun** → `GiftIcon`
- **Tasmiyah & Tasyakuran** → `HandRaisedIcon`
- **Wisuda** → `AcademicCapIcon`

### Icon UI guideline
- Ukuran ikon konsisten: `h-7 w-7` (atau `h-6 w-6` jika lebih rapat)
- Warna ikon: `text-detra-gold`
- Wrapper/badge (opsional tapi recommended): `bg-detra-gold/10 rounded-lg p-3`

---

## Notes
- Outline vs Solid tidak mempengaruhi interaksi/klik. Yang menentukan clickable adalah wrapper (`button`, `a`, `Link`, atau `onClick`).
- Fokus update hanya untuk landing page (komponen/section terkait).
