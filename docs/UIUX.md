# UIUX.md — SSN Pekerja (SSN)

Sistem desain SSN untuk platform SaaS multi-tenant. Identitas: **Premium Corporate Indonesia**. Dokumen ini adalah sumber kebenaran untuk warna, tipografi, spasi, komponen, dan tone — tim engineering & desain wajib merujuk ke sini.

---

## 1. Prinsip Brand

| Prinsip              | Penjelasan                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **Trusted**          | Hierarki yang jelas, warna pekat berwibawa (navy), data transparan. Tidak pernah "norak".          |
| **Premium**          | Spacing lega, serif elegan untuk heading, sentuhan emas (gold) sebagai aksen, bukan dominan.       |
| **Indonesian Pride** | Bahasa Indonesia first, ilustrasi & fotografi pekerja lokal, motif batik subtil di asset opsional. |
| **Effortless**       | Setiap aksi maks 2 klik dari dashboard, kosakata sederhana, error helpful & manusiawi.             |

Kata kunci pembeda: **"Wibawa, hangat, profesional"**. Hindari: cartoonish, neon, gradien jenuh, stock photo Caucasian generik.

---

## 2. Color Tokens

### 2.1 Skala Penuh

#### Navy (Primary)

```
navy-50   #F0F4FA
navy-100  #DCE5F0
navy-200  #B5C4DC
navy-300  #8AA0C5
navy-400  #5F7DAD
navy-500  #3B5C8F
navy-600  #2A4470
navy-700  #1C3052
navy-800  #122036
navy-900  #0A2540   ← brand
navy-950  #061528
```

#### Gold (Accent Premium)

```
gold-50   #FBF7EE
gold-100  #F5ECD1
gold-200  #ECDBA4
gold-300  #E0C674
gold-400  #D4B14E
gold-500  #C9A961   ← brand
gold-600  #A8893F
gold-700  #846A2E
gold-800  #604D22
gold-900  #3F3216
gold-950  #211A0B
```

#### Indigo (Interactive / CTA Secondary)

```
indigo-50   #F0EFFF
indigo-100  #DEDDFF
indigo-200  #BFBCFF
indigo-300  #9C97FF
indigo-400  #7C76FF
indigo-500  #635BFF   ← brand
indigo-600  #4F46E5
indigo-700  #3E37B8
indigo-800  #2D288A
indigo-900  #1F1B66
indigo-950  #110E3D
```

#### Neutral

```
white     #FFFFFF
stone-50  #FAFAF9
stone-100 #F5F5F4   ← --muted
stone-200 #E7E5E4
stone-300 #D6D3D1
stone-400 #A8A29E
stone-500 #78716C
stone-600 #57534E
stone-700 #44403C
stone-800 #292524
stone-900 #1C1917
stone-950 #0C0A09
border    #E5E7EB
```

#### Semantic

```
success-500  #16A34A   success-50 #F0FDF4
warning-500  #F59E0B   warning-50 #FFFBEB
danger-500   #DC2626   danger-50  #FEF2F2
info-500     #2563EB   info-50    #EFF6FF
```

### 2.2 Token Semantik (CSS Variables — HSL)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 213 76% 15%; /* navy-900 */
  --primary: 213 76% 15%;
  --primary-foreground: 0 0% 100%;
  --secondary: 42 49% 60%; /* gold-500 */
  --secondary-foreground: 213 76% 15%;
  --accent: 244 100% 68%; /* indigo-500 */
  --accent-foreground: 0 0% 100%;
  --muted: 30 9% 96%; /* stone-100 */
  --muted-foreground: 25 5% 45%; /* stone-500 */
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 244 100% 68%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --success: 142 71% 36%;
  --warning: 38 92% 50%;
  --info: 217 91% 60%;
  --card: 0 0% 100%;
  --card-foreground: 213 76% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: 213 76% 15%;
}

[data-theme='dark'] {
  --background: 213 50% 6%;
  --foreground: 30 20% 96%;
  --primary: 42 49% 60%;
  --primary-foreground: 213 76% 15%;
  --secondary: 213 30% 18%;
  --secondary-foreground: 30 20% 96%;
  --accent: 244 100% 75%;
  --muted: 213 25% 12%;
  --muted-foreground: 30 10% 70%;
  --border: 213 25% 18%;
  --input: 213 25% 18%;
  --ring: 244 100% 75%;
  --card: 213 50% 8%;
  --card-foreground: 30 20% 96%;
}
```

### 2.3 Tailwind Config Snippet

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4FA',
          100: '#DCE5F0',
          200: '#B5C4DC',
          300: '#8AA0C5',
          400: '#5F7DAD',
          500: '#3B5C8F',
          600: '#2A4470',
          700: '#1C3052',
          800: '#122036',
          900: '#0A2540',
          950: '#061528',
        },
        gold: {
          50: '#FBF7EE',
          100: '#F5ECD1',
          200: '#ECDBA4',
          300: '#E0C674',
          400: '#D4B14E',
          500: '#C9A961',
          600: '#A8893F',
          700: '#846A2E',
          800: '#604D22',
          900: '#3F3216',
          950: '#211A0B',
        },
        indigo: {
          50: '#F0EFFF',
          100: '#DEDDFF',
          200: '#BFBCFF',
          300: '#9C97FF',
          400: '#7C76FF',
          500: '#635BFF',
          600: '#4F46E5',
          700: '#3E37B8',
          800: '#2D288A',
          900: '#1F1B66',
          950: '#110E3D',
        },
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
      },
    },
  },
}
```

---

## 3. Tipografi

### 3.1 Font Family

| Peran   | Font             | Fallback                              |
| ------- | ---------------- | ------------------------------------- |
| Heading | Playfair Display | Georgia, "Times New Roman", serif     |
| Body    | Inter            | system-ui, -apple-system, "Segoe UI"  |
| Mono    | JetBrains Mono   | "SF Mono", Menlo, Consolas, monospace |

### 3.2 Skala

| Token       | Px             | Line-Height | Weight | Tracking         | Penggunaan           |
| ----------- | -------------- | ----------- | ------ | ---------------- | -------------------- |
| display-2xl | 72 / 4.5rem    | 80 / 1.1    | 700    | -0.02em          | Hero homepage utama  |
| display-xl  | 60 / 3.75rem   | 72 / 1.2    | 700    | -0.02em          | Hero secondary       |
| display-lg  | 48 / 3rem      | 56 / 1.16   | 600    | -0.015em         | Section heading      |
| h1          | 36 / 2.25rem   | 44 / 1.2    | 600    | -0.01em          | Halaman              |
| h2          | 30 / 1.875rem  | 38 / 1.27   | 600    | -0.01em          | Block heading        |
| h3          | 24 / 1.5rem    | 32 / 1.33   | 600    | -0.005em         | Card heading         |
| h4          | 20 / 1.25rem   | 28 / 1.4    | 600    | 0                | Sub-section          |
| h5          | 18 / 1.125rem  | 26 / 1.44   | 600    | 0                | Label besar          |
| h6          | 16 / 1rem      | 24 / 1.5    | 600    | 0                | Inline label         |
| body-lg     | 18 / 1.125rem  | 28 / 1.55   | 400    | 0                | Paragraf hero / lead |
| body        | 16 / 1rem      | 26 / 1.625  | 400    | 0                | Default              |
| body-sm     | 14 / 0.875rem  | 22 / 1.57   | 400    | 0                | Sekunder, helper     |
| caption     | 12 / 0.75rem   | 16 / 1.33   | 500    | 0.01em           | Meta, timestamp      |
| overline    | 11 / 0.6875rem | 16 / 1.45   | 600    | 0.08em uppercase | Section eyebrow      |
| code        | 14 / 0.875rem  | 22 / 1.57   | 500    | 0                | Inline code, kbd     |

Heading **selalu** Playfair Display. Body **selalu** Inter. Tidak campur.

### 3.3 Aturan Penggunaan

- Maks 2 heading level per viewport.
- Paragraf body maksimal 70 karakter per baris (`max-w-prose`).
- Tidak ada `font-weight: 300` (terlalu tipis di layar Indonesia rata-rata).
- Italic Playfair untuk kutipan / testimonial.

---

## 4. Spacing & Layout

### 4.1 Basis 4px

```
0   = 0
0.5 = 2px
1   = 4px
1.5 = 6px
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
10  = 40px
12  = 48px
16  = 64px
20  = 80px
24  = 96px
32  = 128px
```

Komponen interior memakai kelipatan 4. Section antar block memakai kelipatan 8 (32, 48, 64, 96).

### 4.2 Grid 12 Kolom

- Container max-width: `1280px` (custom: `1440px` untuk dashboard wide screens).
- Gutter: `24px` (desktop), `16px` (tablet), `16px` (mobile).
- Margin luar: `auto` (`max-w-screen-xl mx-auto px-6`).

### 4.3 Breakpoints

| Token | Min-Width | Target                          |
| ----- | --------- | ------------------------------- |
| sm    | 640px     | Phablet landscape               |
| md    | 768px     | Tablet portrait                 |
| lg    | 1024px    | Tablet landscape / laptop kecil |
| xl    | 1280px    | Desktop                         |
| 2xl   | 1536px    | Desktop besar                   |

Mobile-first selalu. Dashboard menyembunyikan mini-sidebar di < `md` dan menampilkan bottom-nav.

---

## 5. Radius

```
none  = 0
sm    = 4px      ← chip, kbd
md    = 8px      ← input, badge
lg    = 12px     ← button, card kecil
xl    = 16px     ← card, modal
2xl   = 24px     ← hero illustration frame
full  = 9999px   ← avatar, pill
```

Default komponen: `lg`. Modal: `xl`. Avatar: `full`. Hindari `none` kecuali untuk data-table cell.

---

## 6. Shadow

Bayangan menggunakan tint navy (bukan hitam murni) agar konsisten dengan brand.

```css
--shadow-xs: 0 1px 2px 0 hsl(213 50% 15% / 0.05);
--shadow-sm: 0 1px 3px 0 hsl(213 50% 15% / 0.08), 0 1px 2px -1px hsl(213 50% 15% / 0.06);
--shadow-md: 0 4px 8px -2px hsl(213 50% 15% / 0.1), 0 2px 4px -2px hsl(213 50% 15% / 0.06);
--shadow-lg: 0 12px 20px -4px hsl(213 50% 15% / 0.12), 0 4px 8px -4px hsl(213 50% 15% / 0.08);
--shadow-xl: 0 20px 36px -8px hsl(213 50% 15% / 0.15), 0 8px 12px -6px hsl(213 50% 15% / 0.1);
--shadow-2xl: 0 32px 64px -16px hsl(213 50% 15% / 0.25);
--shadow-inner: inset 0 2px 4px 0 hsl(213 50% 15% / 0.06);
--shadow-focus: 0 0 0 3px hsl(244 100% 68% / 0.35); /* ring */
```

Penggunaan:

- `xs`: divider tipis pada tabel.
- `sm`: card default.
- `md`: hover card, dropdown.
- `lg`: popover, tooltip besar.
- `xl`: modal.
- `2xl`: command palette.

---

## 7. Component Specs

### 7.1 Button — Matrix Lengkap

| Variant     | Background  | Text       | Border             | Hover                 | Disabled                         |
| ----------- | ----------- | ---------- | ------------------ | --------------------- | -------------------------------- |
| Primary     | navy-900    | white      | none               | navy-800              | navy-900/40 + cursor-not-allowed |
| Secondary   | gold-500    | navy-900   | none               | gold-600 + text white | gold-500/40                      |
| Outline     | transparent | navy-900   | border-1 stone-300 | muted bg              | opacity-50                       |
| Ghost       | transparent | navy-900   | none               | muted bg              | opacity-50                       |
| Destructive | danger-500  | white      | none               | danger-600            | danger-500/40                    |
| Link        | transparent | indigo-500 | none               | underline             | opacity-50                       |

**Sizes**: sm (h-8, px-3, text-sm), md (h-10, px-4), lg (h-12, px-6, text-base), icon (10x10 / 8x8 / 12x12).

**State**: idle, hover, active, focus-visible (ring), loading (spinner + label), disabled.

**Loading**: spinner di kiri label, label tidak berubah, button `aria-busy="true"`, `disabled`.

**Icon**: leftSlot/rightSlot. Icon ukuran 16px untuk md, 14px untuk sm, 18px untuk lg.

### 7.2 Input — Field

| State     | Border                   | Background | Text       | Icon       |
| --------- | ------------------------ | ---------- | ---------- | ---------- |
| Default   | border                   | background | foreground | stone-400  |
| Hover     | stone-400                | background | foreground | stone-500  |
| Focus     | ring + indigo-500 border | background | foreground | indigo-500 |
| Filled    | border                   | background | foreground | stone-500  |
| Error     | danger-500               | danger-50  | foreground | danger-500 |
| Disabled  | border                   | muted      | muted-fg   | stone-300  |
| Read-only | border                   | muted      | foreground | stone-400  |

Tinggi: 40px default, 32px compact density. Padding x: 12px. Radius: lg.

**Helper text** di bawah, `text-sm`, warna `muted-foreground`. **Error text** warna `destructive` + ikon alert.

### 7.3 Card

- Background: `card` (white default).
- Border: 1px `border` token.
- Radius: `xl` (16px).
- Padding: 24px default, 16px compact.
- Hover (jika clickable): `shadow-md` + border `stone-300`.
- Header: title (h4) + description (body-sm muted).
- Footer: separator atas + action area (justify-end).

### 7.4 Badge

```
solid:    bg-{color}-500 text-white
soft:     bg-{color}-50  text-{color}-700 border border-{color}-200
outline:  bg-transparent text-{color}-700 border border-{color}-300
dot:      diawali dot 6px sebelum label
```

Sizes: sm (h-5, text-xs, px-2), md (h-6, text-xs, px-2.5).

### 7.5 Modal / Dialog

- Backdrop: `bg-navy-950/60 backdrop-blur-sm`.
- Container: `bg-card rounded-xl shadow-2xl max-w-lg w-full p-6`.
- Header: title (h3) + close icon button top-right.
- Body: scroll internal jika konten panjang.
- Footer: separator + action group (Cancel ghost + Primary).
- Animasi: fade + scale (0.96 → 1) 200ms ease-out-quint.
- Trap focus, ESC menutup, click backdrop menutup (configurable).

### 7.6 Tooltip

- Background: navy-900 / dark.
- Text: white, body-sm.
- Padding: 6px 10px.
- Radius: md.
- Delay open: 300ms, close: 100ms.
- Arrow 6x6px.
- Posisi default: top, fallback bottom.

### 7.7 Toast

- Container: top-right desktop, bottom mobile, stack 8px gap, max 5.
- Variants: success (border-left success-500), warning, danger, info, default.
- Width: 360px desktop, full-bleed mobile.
- Auto dismiss 5s (success), 7s (warning/info), manual (danger).
- Animasi: slide-in dari kanan 250ms, slide-out 200ms.

### 7.8 Tabs

- Trigger: h-10, px-4, radius md, border-bottom 2px transparent.
- Active: border-bottom indigo-500, text navy-900 font-semibold.
- Inactive: text muted-foreground hover:text-foreground.
- Variant `pills`: bg muted, active bg-white shadow-sm.
- Keyboard: arrow left/right, Home/End.

### 7.9 Table (Data Table)

- Header: bg-muted, text-sm font-semibold, text-muted-foreground, sticky atas.
- Row: h-12 (default density), h-10 (compact).
- Divider: border-b border (per row).
- Hover row: bg-muted/50.
- Selection: leftmost checkbox column.
- Sort: header clickable, ikon panah aktif.
- Pagination: footer separator + total + page navigator.
- Empty: row tunggal dengan `EmptyState` component.
- Loading: 5 row skeleton.

### 7.10 Empty State

- Ilustrasi 120x120px (line art monoton).
- Title h4 navy-900.
- Description body-sm muted-foreground, max 1 kalimat.
- Primary action button (opsional).
- Padding y: 64px desktop, 48px mobile.

### 7.11 Skeleton

- Background: `bg-muted`.
- Animation: shimmer linear 1.5s infinite.
- Radius mengikuti komponen yang ditiru.

---

## 8. Prinsip Motion

| Aspek          | Aturan                                                                      |
| -------------- | --------------------------------------------------------------------------- |
| Durasi mikro   | 150ms (hover, focus, tap)                                                   |
| Durasi makro   | 250-350ms (modal, drawer, page transition)                                  |
| Easing default | `cubic-bezier(0.16, 1, 0.3, 1)` — ease-out-quint                            |
| Easing enter   | ease-out                                                                    |
| Easing exit    | ease-in                                                                     |
| Spring (rare)  | hanya untuk elemen "celebrate" (confetti, badge unlock). Avoid bouncy spam. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` → durasi 0.01ms, fade saja.       |

Story scroll (homepage) memakai scroll-linked animation via `motion`'s `useScroll`. Parallax depth maksimal 30px translate.

---

## 9. Iconography

- Library: **lucide-react** (line, 2px stroke, 24px artboard).
- Ukuran in-app: 16 / 20 / 24 / 32 px.
- Warna mengikuti currentColor — atur via `text-*` Tailwind class.
- Custom icon (logo, ilustrasi mikro batik) sebagai komponen SVG terkoreksi optical.
- Tidak campur style outline & filled di satu layout.

---

## 10. Photography & Illustration

### 10.1 Photography

- Subjek: pekerja Indonesia nyata di lingkungan kerja (kantor, workshop, lapangan, kafe, WFH).
- Tonalitas: warm, kontras moderate, tidak over-saturated.
- Skin tone diversity: Aceh sampai Papua.
- Aspect ratio: 16:9 hero, 4:3 card, 1:1 avatar/testimonial.
- Hindari handshake klise & "thumbs-up" pose.

### 10.2 Illustration

- Style: line + soft fill (navy outline + gold/indigo accent fill).
- Komposisi: minimalis, 1-2 fokus utama.
- Background: transparent atau muted.
- Tidak pakai isometric 3D over-render.

---

## 11. Logo System

- **Primary**: wordmark "SSN Pekerja" + mark rumah-stilisasi.
- **Stack**: mark di atas wordmark untuk square slot.
- **Mono**: navy on light, white on dark, gold reserved untuk anniversary/special.
- **Clearspace**: minimal = tinggi huruf "R".
- **Minimum size**: 24px mark, 96px wordmark horizontal.
- **Misuse**: tidak boleh stretch, gradient, drop shadow berlebihan, ditempel di foto noisy.
- **Tenant logo**: SVG only, max 256x256 (sanitized SVG saat upload, hapus script/event).

---

## 12. Voice & Tone

### 12.1 Prinsip

- **Bahasa Indonesia primer**, formal namun hangat. Sapaan "Anda" — bukan "kamu" (kecuali komunikasi marketing target Gen-Z opsional).
- Singkat, jelas, action-oriented.
- Tidak meremehkan: hindari "mudah", lebih baik "praktis" / "ringkas".
- Tidak gimmicky: hindari emoji di UI inti (hanya boleh di celebration moments).

### 12.2 Contoh Lexicon

| Konteks           | Hindari              | Pakai                                                 |
| ----------------- | -------------------- | ----------------------------------------------------- |
| Empty state job   | "Kosong nih bro"     | "Belum ada lowongan yang cocok. Coba ubah filter."    |
| Error 500         | "Oops, server gagal" | "Terjadi gangguan. Tim kami sudah diberitahu."        |
| Konfirmasi delete | "Yakin nih?"         | "Hapus permanen? Tindakan ini tidak bisa dibatalkan." |
| Button apply      | "Apply sekarang!"    | "Lamar Pekerjaan"                                     |
| Success register  | "Yay! Akun jadi"     | "Akun berhasil dibuat. Selamat bergabung."            |

### 12.3 Microcopy CTA

| Aksi                | Label                                |
| ------------------- | ------------------------------------ |
| Submit form lamaran | "Kirim Lamaran"                      |
| Lanjut wizard       | "Lanjut" / "Lanjutkan"               |
| Kembali wizard      | "Kembali"                            |
| Batal               | "Batal"                              |
| Simpan draft        | "Simpan Draf"                        |
| Publish             | "Terbitkan"                          |
| Cari                | "Cari pekerjaan, kursus, partner..." |
| Logout              | "Keluar"                             |

---

## 13. Dark Mode

- Trigger: switch di user menu + sistem preference detect.
- Token mirror `[data-theme="dark"]` di section 2.2.
- Hindari pure black (#000) — pakai `navy-950` (`#061528`).
- Elevasi tetap pakai shadow, namun opacity dinaikkan + sedikit border highlight putih 5%.
- Image: aset SVG line — pakai `text-*` agar otomatis kontras. Foto: dim 10% di dark mode dengan `brightness-90`.

---

## 14. Density Modes

| Mode        | Row height | Input | Card padding | Tujuan                                  |
| ----------- | ---------- | ----- | ------------ | --------------------------------------- |
| Comfortable | 48px       | 40px  | 24px         | Default — premium feel                  |
| Compact     | 36px       | 32px  | 16px         | Admin/superadmin power user, data-heavy |

Switch di setting profil per user, persist di server.

---

## 15. Accessibility

### 15.1 Kontras Minimum

- Body text vs background: ≥ 4.5:1.
- Heading large: ≥ 3:1.
- Icon meaningful: ≥ 3:1.
- UI components (border, focus): ≥ 3:1.
- Gold-500 di atas white = 3.2:1 → boleh untuk heading/icon, **tidak boleh** untuk body text. Gunakan gold-700 untuk body bila perlu.

### 15.2 Focus Ring

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px hsl(244 100% 68% / 0.35);
  border-radius: inherit;
}
```

Visible di semua background — indigo dipilih karena kontras tinggi vs navy & white.

### 15.3 Keyboard Map (Global)

| Key                 | Aksi                                |
| ------------------- | ----------------------------------- |
| `Cmd/Ctrl + K`      | Buka Command Palette                |
| `Cmd/Ctrl + /`      | Tampilkan keyboard shortcut overlay |
| `Esc`               | Tutup modal/drawer/popover/menu     |
| `Tab` / `Shift+Tab` | Navigasi fokus                      |
| `Enter` / `Space`   | Aktifkan button/link                |
| `Arrow keys`        | Navigasi list/menu/tabs             |
| `Home` / `End`      | Awal/akhir list                     |
| `G then D`          | Go to Dashboard (sequence)          |
| `G then J`          | Go to Jobs                          |
| `G then C`          | Go to Courses                       |
| `?`                 | Help overlay                        |

---

## 16. Responsive

### 16.1 Aturan Layout per Breakpoint

| Komponen          | Mobile (<md)                             | Tablet (md-lg)         | Desktop (≥lg)               |
| ----------------- | ---------------------------------------- | ---------------------- | --------------------------- |
| Public nav        | Hamburger drawer                         | Inline links           | Inline links + CTA          |
| Hero split-screen | Stack vertikal (hero atas, ticker bawah) | Stack                  | Split 6:6 atau 7:5          |
| Job list          | 1 kol                                    | 2 kol                  | 3 kol                       |
| Dashboard sidebar | Bottom nav 5 item                        | Mini-sidebar collapsed | Mini-sidebar + hover expand |
| Kanban            | Horizontal scroll, 1 kol per viewport    | 2 kol scroll           | 3-5 kol fit                 |
| Data table        | Card per row                             | Scroll horizontal      | Full table                  |

### 16.2 Touch Target

Minimum 44x44px (iOS HIG). Spacing antar target ≥ 8px.

---

## 17. Email Template Tokens

Karena email client membatasi CSS, token email diturunkan dari sistem utama:

| Token            | Value (inline)                                              |
| ---------------- | ----------------------------------------------------------- |
| Email max-width  | 600px                                                       |
| Email background | `#F5F5F4`                                                   |
| Card background  | `#FFFFFF`                                                   |
| Card radius      | 12px                                                        |
| Heading font     | Georgia, serif (fallback aman)                              |
| Body font        | Arial, Helvetica, sans-serif                                |
| Heading color    | `#0A2540`                                                   |
| Body color       | `#1C1917`                                                   |
| Muted color      | `#78716C`                                                   |
| Primary button   | bg `#0A2540`, text `#FFFFFF`, radius 8px, padding 12px 24px |
| Secondary button | bg `#C9A961`, text `#0A2540`                                |
| Link             | `#635BFF` underline                                         |
| Divider          | `#E5E7EB` 1px                                               |

Logo email: PNG 2x (retina), max width 160px, fallback alt "SSN Pekerja".

---

## 18. Tone Brand Visual Examples (Do / Don't)

| Do                                                        | Don't                                                |
| --------------------------------------------------------- | ---------------------------------------------------- |
| Hero photo pekerja batik di workshop modern               | Stock photo Caucasian generic handshake              |
| Gold sebagai aksen 5-10% area                             | Gold full background button utama (terlalu mencolok) |
| Empty state: ilustrasi rumah + "Belum ada..."             | Empty state: emoji sad 😔                            |
| Cmd+K placeholder: "Cari pekerjaan, kursus..."            | Cmd+K placeholder: "Search anything"                 |
| Microcopy: "Lamaran terkirim. Tim partner akan meninjau." | "Done!"                                              |

---

## 19. Asset Pipeline Ringkas

- SVG icon: optimised via SVGO, manual remove `width`/`height` → biar diatur Tailwind.
- Foto raster: AVIF + WebP dual output, ukuran 1x/2x.
- Lottie: hanya untuk celebration (apply success, certificate unlock).

---

## 20. Token Naming Convention Singkat

- **Primitive**: `navy-900`, `gold-500` — tidak dipakai langsung di komponen (kecuali edge case).
- **Semantic**: `primary`, `muted`, `destructive` — komponen merujuk ini.
- **Component**: `--button-primary-bg` (opsional jika perlu override granular).

Aturan: komponen UI **selalu** pakai semantic token. Tema override mengganti semantic, bukan primitive.

---

Akhir dokumen UIUX.md.
