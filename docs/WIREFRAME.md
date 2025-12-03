# WIREFRAME.md — Rumah Pekerja Indonesia (RPI)

Kumpulan wireframe ASCII untuk seluruh halaman & alur RPI. Setiap blok diikuti **anotasi**: interaksi, breakpoint, komponen yang dipakai. Layout di sini bersifat indikatif — proporsi presisi mengikuti UIUX.md & FRONTEND.md.

Legend:
```
[ Button ]     button
( Input    )   input
{ Card }       card
< Icon >       icon
~~~            divider
...            content placeholder
```

---

## A. PUBLIC

### A1. Homepage — Story Scroll Split-Screen (Desktop ≥ lg)

```
+--------------------------------------------------------------------------------+
| < RPI logo >   Lowongan   Kursus   Partner   Tentang   Harga      [Masuk] [Daftar] |
+================================================================================+
|                                          |                                     |
|  Eyebrow:  PLATFORM KARIR INDONESIA       |   < Live Job Ticker >              |
|                                          |   +-------------------------------+ |
|  Heading (Playfair display-2xl):         |   | < Logo > PT Maju Jaya         | |
|  "Bangun Karir Anda,                     |   |   Frontend Engineer · Jakarta | |
|   dari Rumah Pekerja                     |   |   Rp 12-18 jt · 2 menit lalu  | |
|   Indonesia."                            |   +-------------------------------+ |
|                                          |   +-------------------------------+ |
|  Sub (body-lg, max-w-prose):             |   | < Logo > Tokopedia            | |
|  Temukan lowongan, ikuti kelas,          |   |   Product Manager · Remote    | |
|  bangun CV — semua dalam satu tempat.    |   |   Rp 25-35 jt · 5 menit lalu  | |
|                                          |   +-------------------------------+ |
|  [ Lamar Pertama Saya ]  [ Lihat Kelas ] |   +-------------------------------+ |
|                                          |   | < Logo > Gojek                | |
|  ~ Dipercaya 5.000+ perusahaan ~         |   |   Data Analyst · Bandung      | |
|  < logo strip: 6 partner abu-abu >       |   |   Rp 10-15 jt · 8 menit lalu  | |
|                                          |   +-------------------------------+ |
|                                          |   ...auto-scroll ke atas tiap 4s  |
+==========================================+=====================================+
|                                                                                |
|   < SECTION 2: STORY TESTIMONIAL >                                             |
|   +-----------------------+        +--------------------------------------+    |
|   | < Photo Rina, batik > |        |  Eyebrow: KISAH NYATA                |    |
|   |   400x500             |        |  H2: "Dari magang ke senior engineer  |    |
|   |                       |        |        dalam 18 bulan."              |    |
|   +-----------------------+        |  Body: Rina, lulusan Politeknik...    |    |
|                                    |  — Rina Setiawati, Sr. Engineer Bukalapak |
|                                    |  [ Baca Cerita Lengkap > ]            |    |
|                                    +--------------------------------------+    |
+================================================================================+
|                                                                                |
|   < SECTION 3: LMS PATH TIMELINE >                                             |
|   H2 center: "Jalur Belajar yang Terbukti"                                     |
|                                                                                |
|   1 ----- 2 ----- 3 ----- 4 ----- 5                                            |
|   o------ o------ o------ o------ o                                            |
|   |       |       |       |       |                                            |
|   {Card}  {Card}  {Card}  {Card}  {Card}                                       |
|   Daftar  Pilih    Belajar Praktik  Lamar &                                   |
|   gratis  jalur    on-demand portofolio diterima                              |
+================================================================================+
|   < SECTION 4: STATS BAND >                                                    |
|   50.000+ pekerja   |   5.000+ partner   |   1.200+ kursus   |   95% retensi  |
+================================================================================+
|   < SECTION 5: PARTNER CTA >                                                   |
|   H2: "Cari talenta terbaik Indonesia?"                                        |
|   Sub. [ Jadi Partner ]   [ Lihat Harga ]                                      |
+================================================================================+
|   < FOOTER >                                                                   |
|   logo | Tentang | Karir | Blog | Privasi | Kontak     © 2026 RPI · id / en   |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Komponen: `Navbar Public`, `HeroSplitScreen`, `LiveJobTicker`, `StoryTestimonial`, `LmsPathTimeline`, `StatsBand`, `PartnerCta`, `FooterPublic`.
- Hero kiri: heading Playfair `display-2xl`, sub `body-lg`, CTA primary (navy) + secondary (gold outline → terisi).
- Live ticker (kanan): SWR poll 30 detik, scroll auto vertikal CSS keyframe, jeda saat hover.
- Story testimonial: image left (aspect 4:5), text right. `lg:`: dua kolom. `< md:` stack.
- Timeline LMS: horizontal di desktop, vertikal di mobile. Setiap node bisa diklik → anchor ke step detail.
- Scroll parallax: photo Rina translate-y 20px saat masuk viewport.

### A2. Homepage — Mobile (< md)

```
+----------------------------+
| < hamburger > RPI   [Masuk]|
+----------------------------+
| PLATFORM KARIR INDONESIA   |
| Bangun Karir Anda,         |
| dari Rumah Pekerja         |
| Indonesia.                 |
|                            |
| Temukan lowongan, ikuti... |
|                            |
| [ Lamar Pertama Saya     ] |
| [ Lihat Kelas            ] |
+----------------------------+
| LIVE — 3 lowongan baru     |
| +------------------------+ |
| | Maju Jaya — FE Eng     | |
| | Jakarta · Rp 12-18 jt  | |
| +------------------------+ |
| +------------------------+ |
| | Tokopedia — PM         | |
| +------------------------+ |
| [ Lihat Semua Lowongan > ] |
+----------------------------+
| < Story Testimonial >      |
| [ Photo Rina ]             |
| H3: Dari magang ke senior. |
| Body...                    |
| — Rina, Bukalapak          |
+----------------------------+
| < Timeline vertikal >      |
| 1. Daftar gratis           |
| |                          |
| 2. Pilih jalur belajar     |
| |                          |
| 3. Belajar on-demand       |
| ...                        |
+----------------------------+
| Stats band 2x2 grid        |
+----------------------------+
| Partner CTA                |
+----------------------------+
| Footer minimal             |
+----------------------------+
| [Home] [Jobs] [LMS] [Prof] |  ← bottom nav muncul setelah login
+----------------------------+
```

**Anotasi**:
- Stack vertikal. Hero ticker jadi card horizontal scroll.
- Bottom-nav hanya untuk user terotentikasi.
- Hamburger membuka drawer kiri.

### A3. Jobs List

```
+--------------------------------------------------------------------------------+
| < Navbar Public >                                                              |
+--------------------------------------------------------------------------------+
| H1: Lowongan Pekerjaan                                                         |
| ( < search > Cari posisi, perusahaan...                          ) [ Filter v ]|
+------------------+-------------------------------------------------------------+
| FILTER PANEL     |  SortBy: [Terbaru v]   Hasil: 1.248 lowongan                |
| Lokasi           |  +-------------------------------------------------------+  |
| [ ] Jakarta (320)|  | < Logo > Frontend Engineer · PT Maju Jaya             |  |
| [ ] Bandung (94) |  |  < pin > Jakarta · WFO · Full-time                    |  |
| [ ] Remote (220) |  |  < cash > Rp 12-18 jt · < clock > 2 jam lalu          |  |
|                  |  |  React | TypeScript | Tailwind  [ Lamar ]  [ Simpan ] |  |
| Tipe Kerja       |  +-------------------------------------------------------+  |
| [ ] Full-time    |  +-------------------------------------------------------+  |
| [ ] Part-time    |  | < Logo > Product Manager · Tokopedia ...              |  |
| [ ] Kontrak      |  +-------------------------------------------------------+  |
| [ ] Magang       |  +-------------------------------------------------------+  |
|                  |  | ... 10 card per page ...                              |  |
| Gaji             |  +-------------------------------------------------------+  |
| [ slider IDR  ]  |                                                             |
|                  |  < Pagination: < 1 2 3 ... 25 > >                           |
| Pengalaman       |                                                             |
| [ slider yr ]    |                                                             |
|                  |                                                             |
| [ Reset Filter ] |                                                             |
+------------------+-------------------------------------------------------------+
| Footer                                                                         |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Komponen: `JobList`, `JobCard`, `FilterPanel`, `Pagination`, `SearchBar`.
- Filter via URL searchParams (`?loc=jakarta&type=full-time`).
- Card hover: shadow-md + border darker.
- Mobile (<md): filter jadi bottom-sheet drawer dipicu `[ Filter ]` button.

### A4. Job Detail

```
+--------------------------------------------------------------------------------+
| < Navbar Public >                                                              |
+--------------------------------------------------------------------------------+
| Breadcrumb: Lowongan > Engineering > Frontend Engineer                         |
+--------------------------------------------------------------------------------+
|  +-------------------------------------------------+  +----------------------+ |
|  | < Logo besar 64px >                              |  | Ringkasan            | |
|  | Frontend Engineer                                |  | < pin > Jakarta      | |
|  | PT Maju Jaya · < verified tick >                 |  | < case > Full-time   | |
|  |                                                  |  | < home > WFO         | |
|  | Rp 12-18 jt / bulan · < clock > 2 jam lalu       |  | < cash > 12-18 jt    | |
|  |                                                  |  | < user > 1-3 yr      | |
|  | [ Lamar Sekarang ]  [ Simpan ]  [ Bagikan ]      |  | < deadline > 14 hari | |
|  +-------------------------------------------------+  +----------------------+ |
|                                                       |                      | |
|  H2: Deskripsi Pekerjaan                              | Skill Cocok          | |
|  Body...                                              | < pill > React ✓     | |
|                                                       | < pill > TypeScript ✓| |
|  H3: Kualifikasi                                      | < pill > GraphQL —   | |
|  - 1+ tahun pengalaman React                          | [ Pelajari Skill ]   | |
|  - Familiar dengan TypeScript                         |                      | |
|  ...                                                  | Tentang Perusahaan   | |
|                                                       | { Card mini company} | |
|  H3: Benefit                                          | [ Lihat Profil ]     | |
|  - Asuransi kesehatan keluarga                        |                      | |
|  - WFA 2 hari/minggu                                  | Lowongan Serupa      | |
|                                                       | { Card x 3 }         | |
|  H3: Tentang Tim                                      |                      | |
|  ...                                                  |                      | |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- 2 kolom desktop (8:4). Kanan sticky.
- `[Lamar Sekarang]` memicu intercepting modal `/jobs/[slug]/apply`.
- Mobile: ringkasan jadi accordion atas, deskripsi di bawah.

### A5. Courses List

```
+--------------------------------------------------------------------------------+
| < Navbar Public >                                                              |
+--------------------------------------------------------------------------------+
| Hero strip:  H1: Kursus untuk Setiap Tahap Karir                                |
|              ( < search > Cari kelas, instruktur, topik...               )    |
|              Pilih jalur: [Engineering] [Design] [Data] [Bisnis] [Soft Skill] |
+--------------------------------------------------------------------------------+
| Filter chips: [Gratis] [Sertifikat] [< 4 jam] [Pemula] [Live Class]            |
+--------------------------------------------------------------------------------+
| { Card }        { Card }        { Card }        { Card }                       |
| [ Thumbnail ]   ...             ...             ...                            |
| React Mastery                                                                  |
| 4.8 ★ · 12 jam · Rp 199.000                                                    |
| < pill > Engineering                                                           |
+--------------------------------------------------------------------------------+
| Pagination ...                                                                 |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Grid 4 kolom xl, 3 lg, 2 md, 1 sm.
- Thumbnail aspect 16:9.

### A6. Course Detail

```
+--------------------------------------------------------------------------------+
| < Navbar Public >                                                              |
+--------------------------------------------------------------------------------+
| Breadcrumb: Kursus > Engineering > React Mastery                               |
+--------------------------------------------------------------------------------+
|  +------------------------------------+  +-----------------------------------+ |
|  | < Video preview 16:9 >             |  | Rp 199.000                        | |
|  |   [ ▶ Tonton Preview ]             |  | < Original Rp 399.000 — diskon >  | |
|  +------------------------------------+  | [ Daftar Sekarang ]               | |
|  H1: React Mastery untuk Indonesia      | [ Tambah ke Wishlist ]            | |
|  Instruktur: Budi Santoso · 4.8 ★ (412) |                                   | |
|                                          | Anda akan dapat:                  | |
|  Tabs: [Kurikulum] [Tentang] [Review]    | < check > Sertifikat              | |
|                                          | < check > 12 jam video            | |
|  KURIKULUM (12 modul, 48 sesi)          | < check > 24 latihan              | |
|  v Modul 1: Dasar React                  | < check > Akses seumur hidup      | |
|    1.1 Pengenalan      05:23 < play >    |                                   | |
|    1.2 JSX             08:11 < play >    | Prasyarat:                        | |
|  > Modul 2: Hooks                        | - HTML/CSS dasar                  | |
|  > Modul 3: ...                          | - JavaScript ES6                  | |
|                                          |                                   | |
|  REVIEWS (412)                           | Cocok untuk:                      | |
|  ★★★★★ Sangat membantu! — Andi          | Frontend developer junior         | |
|                                          |                                   | |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Komponen: `CoursePlayer` (preview), `Tabs`, `CurriculumTree`, `ReviewList`.
- Kanan card sticky.

### A7. Partner Career Page (subdomain `tokopedia.rpi.id`)

```
+--------------------------------------------------------------------------------+
| < Tenant Logo > Tokopedia Careers   [Lowongan] [Tentang Kami]  [Powered by RPI]|
+================================================================================+
| Hero penuh tenant warna brand                                                  |
| H1: "Bangun Indonesia bersama Tokopedia"                                       |
| Sub. [ Lihat Lowongan ]                                                        |
+--------------------------------------------------------------------------------+
| Section: Kenapa Tokopedia                                                      |
| Section: Kultur & Benefit (carousel image)                                     |
| Section: Lowongan Aktif — list job card                                        |
+--------------------------------------------------------------------------------+
| Footer minimal: powered by Rumah Pekerja Indonesia                             |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- ThemeProvider override warna brand tenant.
- Footer tetap pakai jejak "Powered by RPI" sebagai trust signal.

### A8. About

```
+--------------------------------------------------------------------------------+
| Hero: H1 "Membangun jembatan antara talenta & peluang Indonesia"              |
+--------------------------------------------------------------------------------+
| Mission · Vision · Values (3 kolom)                                            |
+--------------------------------------------------------------------------------+
| Team grid (avatar + role)                                                       |
+--------------------------------------------------------------------------------+
| Investor & Partner logos                                                       |
+--------------------------------------------------------------------------------+
| Press mentions                                                                 |
+--------------------------------------------------------------------------------+
```

### A9. Pricing (Partner)

```
+--------------------------------------------------------------------------------+
| H1 center: Harga Partner                                                       |
| Toggle: [ Bulanan | Tahunan -20% ]                                             |
+--------------------------------------------------------------------------------+
|  { Starter }         { Growth (popular) }       { Enterprise }                 |
|  Rp 0                Rp 1.499.000/bln           Hubungi kami                   |
|  Maks 3 lowongan     20 lowongan                Unlimited                      |
|  Akses talent dasar  Talent search lengkap      SLA + dedicated CS             |
|  Branding default    Branding custom            Subdomain + SSO                |
|  [ Mulai Gratis ]    [ Pilih Growth ]           [ Bicara dengan Sales ]        |
+--------------------------------------------------------------------------------+
| Fitur Comparison Table                                                         |
+--------------------------------------------------------------------------------+
| FAQ accordion                                                                  |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Card "Growth" diberi border gold + badge "Paling Populer".

### A10. Help Center

```
+--------------------------------------------------------------------------------+
| Hero: H1 "Bagaimana kami bisa bantu?"                                          |
| ( < search > Ketik pertanyaan...                                             ) |
+--------------------------------------------------------------------------------+
| 6 kategori card grid (Akun, Lamaran, Kursus, Pembayaran, Partner, Teknis)      |
+--------------------------------------------------------------------------------+
| Article list dengan FAQ accordion                                              |
+--------------------------------------------------------------------------------+
| Kontak: [ Chat Live ] [ Email Support ]                                        |
+--------------------------------------------------------------------------------+
```

### A11. Login

```
+--------------------------------------------------------------------------------+
|                          < RPI logo >                                          |
|                                                                                |
|              +----------------------------------------+                        |
|              | H2: Masuk ke Akun Anda                  |                        |
|              |                                         |                        |
|              | Email                                   |                        |
|              | ( budi@example.com                    ) |                        |
|              |                                         |                        |
|              | Kata Sandi              [Lupa?]         |                        |
|              | ( ••••••••                            ) |                        |
|              |                                         |                        |
|              | [ ] Ingat saya                          |                        |
|              |                                         |                        |
|              | [ Masuk ]                                |                        |
|              |                                         |                        |
|              | --- atau ---                            |                        |
|              | [ < Google > Masuk dengan Google ]       |                        |
|              |                                         |                        |
|              | Belum punya akun? Daftar di sini         |                        |
|              +----------------------------------------+                        |
|                                                                                |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Form: react-hook-form + Zod. Error inline di bawah field.
- Submit memanggil server action `signIn()` → redirect role-aware.

### A12. Register

```
+----------------------------------------+
| H2: Daftar Gratis                       |
| Pilih peran:                            |
|  ( ) Pencari Kerja  ( ) Partner         |
| Nama                                    |
| Email                                   |
| Kata Sandi                              |
| Konfirmasi Kata Sandi                   |
| [ ] Saya setuju Syarat & Privasi        |
| [ Buat Akun ]                            |
+----------------------------------------+
```

### A13. Forgot Password

```
+----------------------------------------+
| H2: Lupa Kata Sandi                     |
| Body: Masukkan email, kami kirim tautan |
| Email ( )                                |
| [ Kirim Tautan Reset ]                   |
| Kembali ke Masuk                         |
+----------------------------------------+
```

---

## B. USER DASHBOARD

### B1. Layout — Mini-Sidebar + Tabbed Workspace (Desktop ≥ md)

```
+---+----------------------------------------------------------------------------+
| < | Tabs: [Overview x] [Aplikasi x] [+ Tab baru]            [Cmd+K] [< notif >]|
| H |+--------------------------------------------------------------------------+|
| < ||                                                                          ||
| B ||                       MAIN CONTENT AREA                                  ||
| < ||                                                                          ||
| L ||                                                                          ||
| < ||                                                                          ||
| C ||                                                                          ||
| < ||                                                                          ||
| F ||                                                                          ||
| < ||                                                                          ||
| P ||                                                                          ||
| < |+--------------------------------------------------------------------------+|
| ⚙ |                                                                            |
| ⏻ |                                                                            |
+---+----------------------------------------------------------------------------+
```

Mini-sidebar kolom 56px. Hover/pin expand ke 240px dengan label di samping ikon. Item: Home, Briefcase (jobs), Bookmark (saved), Layers (LMS), FileText (CV), Award (cert), User (profile), Settings, Sign out.

### B2. User — Overview

```
+--------------------------------------------------------------------------------+
| Greeting: Halo, Budi!  Selamat datang kembali.                                 |
+--------------------------------------------------------------------------------+
| KPI strip (4 card):                                                            |
| Lamaran aktif: 7 | Interview minggu ini: 2 | Tawaran: 1 | Sertifikat: 3        |
+--------------------------------------------------------------------------------+
| { Rekomendasi Lowongan (carousel) }      { Lanjut Belajar }                    |
| job card x 4                              progress kelas + [Lanjut]            |
+--------------------------------------------------------------------------------+
| { Aktivitas Terbaru (timeline) }          { Tugas Hari Ini }                   |
| - Anda melamar X · 2 jam                  - Update CV (60% selesai)            |
| - Sertifikat React diterbitkan · kemarin  - Selesaikan modul Hooks             |
+--------------------------------------------------------------------------------+
```

### B3. User — Kanban Applications

```
+--------------------------------------------------------------------------------+
| H2: Lamaran Saya                       [Tampilan: Kanban | Tabel]   [+ Lamar] |
+--------------------------------------------------------------------------------+
| DRAFT (2)         | DIKIRIM (3)        | REVIEW (1)       | INTERVIEW (1)   | OFFER (0) | DITOLAK (3) |
| { card }          | { card }            | { card }          | { card }         |           | { card }    |
| { card }          | { card }            |                   |                  |           | { card }    |
|                   | { card }            |                   |                  |           | { card }    |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Drag & drop antar kolom (react-dnd). Update via server action.
- Card menampilkan logo, posisi, perusahaan, tanggal, badge urgensi.

### B4. User — Saved Jobs

```
+--------------------------------------------------------------------------------+
| H2: Lowongan Tersimpan                                                         |
| Sort: [Terbaru disimpan v]    Filter: [Semua | Masih buka | Hampir tutup]      |
+--------------------------------------------------------------------------------+
| List job card dengan tombol [ Lamar ] [ Hapus ] cepat                          |
+--------------------------------------------------------------------------------+
```

### B5. User — LMS

```
+--------------------------------------------------------------------------------+
| H2: Belajar Saya                                                               |
| Tabs: [Sedang Berlangsung] [Selesai] [Disimpan]                                |
+--------------------------------------------------------------------------------+
| { Course card with progress bar 40% }    [ Lanjut ]                            |
| { Course card 100% }                     [ Lihat Sertifikat ]                  |
+--------------------------------------------------------------------------------+
| Rekomendasi: Carousel kelas berdasarkan jalur karir                            |
+--------------------------------------------------------------------------------+
```

### B6. User — CV Builder

```
+--------------------------------------------------------------------------------+
| H2: CV Builder                                                                 |
| +----------------------+   +-----------------------------------------------+   |
| | Step nav (vertical)  |   |   PREVIEW LIVE                                 |   |
| | 1. Info Pribadi  ✓   |   |   +-------------------------------------+      |   |
| | 2. Pengalaman    ✓   |   |   | Budi Santoso                        |      |   |
| | 3. Pendidikan        |   |   | Frontend Engineer                   |      |   |
| | 4. Skill             |   |   | budi@... · +62 ...                  |      |   |
| | 5. Sertifikat        |   |   |                                     |      |   |
| | 6. Bahasa            |   |   | Pengalaman                          |      |   |
| | 7. Template          |   |   | PT Maju Jaya, Engineer 2023-...     |      |   |
| | 8. Export            |   |   ...                                            |
| +----------------------+   |   +-------------------------------------+      |   |
|                            |   [Template: Minimal v]  [Color: Navy v]       |   |
|                            |   [ Download PDF ]  [ Simpan ]                 |   |
|                            +-----------------------------------------------+   |
+--------------------------------------------------------------------------------+
```

**Anotasi**:
- Form left, preview right (sticky). Mobile: tab Form / Preview.
- Autosave per 5 detik via server action debounced.

### B7. User — Certificates

```
+--------------------------------------------------------------------------------+
| H2: Sertifikat Saya                                                            |
+--------------------------------------------------------------------------------+
| Grid 3 kolom: { Sertifikat thumbnail + nama + tanggal + [ Bagikan ] [ Unduh ]} |
+--------------------------------------------------------------------------------+
| [ Verifikasi sertifikat lain ]  → masukkan kode verifikasi                     |
+--------------------------------------------------------------------------------+
```

### B8. User — Profile

```
+--------------------------------------------------------------------------------+
| Tabs: [Akun] [Profesional] [Notifikasi] [Privasi] [Keamanan]                   |
+--------------------------------------------------------------------------------+
| Akun:                                                                          |
| Avatar 96px + [ Ganti Foto ]                                                   |
| Nama, Email, Telepon, Kota                                                     |
| Bahasa: id / en   Tema: Light / Dark / System   Density: Nyaman / Padat        |
| [ Simpan Perubahan ]                                                            |
+--------------------------------------------------------------------------------+
```

---

## C. PARTNER DASHBOARD

### C1. Partner — Overview

```
+--------------------------------------------------------------------------------+
| Greeting: Dashboard PT Maju Jaya              [+ Pasang Lowongan]              |
+--------------------------------------------------------------------------------+
| KPI 4 card: Lowongan aktif 12 | Pelamar baru 87 | Interview 9 | Hire 3         |
+--------------------------------------------------------------------------------+
| { FUNNEL CHART }                          { TOP TALENT }                       |
|  Apply ████████████████ 320               { avatar + name + match% }           |
|  Review ████████ 120                      x 5                                  |
|  Interview ████ 40                                                             |
|  Offer ██ 10                                                                   |
|  Hire █ 3                                                                       |
+--------------------------------------------------------------------------------+
| { ACTIVE JOBS TABLE }                                                          |
| Posisi | Lokasi | Pelamar | Status | Aksi                                      |
| FE Eng | JKT    | 42      | Aktif  | [Lihat] [Pause] [Tutup]                   |
| ...                                                                            |
+--------------------------------------------------------------------------------+
| { ACTIVITY FEED }                          { TIPS DARI RPI }                   |
| - 5 lamaran baru                            - Tips menulis JD efektif          |
+--------------------------------------------------------------------------------+
```

### C2. Partner — Jobs Management

```
+--------------------------------------------------------------------------------+
| H2: Lowongan                                  [+ Pasang Lowongan]              |
| Filter chips: [Aktif] [Draf] [Pause] [Tutup]   Search: ( ... )                 |
+--------------------------------------------------------------------------------+
| DATA TABLE:                                                                    |
| [ ] | Posisi | Departemen | Pelamar | Tampilan | Diposting | Status | Aksi    |
| [ ] | FE Eng | Engineering | 42 (8★)| 1.240    | 2 hari    | Aktif  | < ⋯ >    |
| [ ] | PM     | Product     | 18 (3★)|   620    | 5 hari    | Aktif  | < ⋯ >    |
+--------------------------------------------------------------------------------+
| Bulk action bar muncul saat ada checkbox terpilih:                             |
| 3 dipilih: [Tutup] [Duplikat] [Ekspor]                                         |
+--------------------------------------------------------------------------------+
| Pagination                                                                     |
+--------------------------------------------------------------------------------+
```

### C3. Partner — Talent Search

```
+--------------------------------------------------------------------------------+
| H2: Cari Talenta                                                               |
| ( < search > React, Jakarta, 2+ years...                              )        |
+------------------+-------------------------------------------------------------+
| FILTERS          | Hasil: 1.240 talenta                                        |
| Skill (multi)    | { Talent card }                                              |
| Pengalaman       |   Avatar | Nama (initial only sampai kontak) | Headline     |
| Lokasi           |   Skills pill | Match 92% | [ Hubungi ] [ Simpan ]          |
| Pendidikan       | { Talent card }                                              |
| Bahasa           | ...                                                          |
| Status: terbuka  |                                                              |
+------------------+-------------------------------------------------------------+
```

**Anotasi**:
- Privasi: kontak hidden sampai partner klik [Hubungi] (kredit dipotong).
- SWR untuk live result count saat filter berubah.

### C4. Partner — Team Management

```
+--------------------------------------------------------------------------------+
| H2: Tim                                          [+ Undang Anggota]            |
+--------------------------------------------------------------------------------+
| Tabs: [Anggota (12)] [Undangan tertunda (3)] [Peran & Izin]                    |
+--------------------------------------------------------------------------------+
| TABEL ANGGOTA:                                                                 |
| Avatar | Nama | Email | Peran | Login terakhir | Aksi                          |
| ...    | Sari | sari@ | Admin | 2 jam lalu     | [Ubah peran] [Nonaktifkan]    |
+--------------------------------------------------------------------------------+
```

### C5. Partner — Analytics

```
+--------------------------------------------------------------------------------+
| H2: Analitik                              Periode: [30 hari v]   [Ekspor]      |
+--------------------------------------------------------------------------------+
| KPI 4 card (impressions, clicks, applies, hires) + trend %                     |
+--------------------------------------------------------------------------------+
| { LINE CHART: Aplikasi per hari }                                              |
+--------------------------------------------------------------------------------+
| { FUNNEL }                            { CONVERSION RATE per stage }            |
+--------------------------------------------------------------------------------+
| { TOP SOURCES table }                 { GEOGRAPHIC HEATMAP Indonesia }         |
+--------------------------------------------------------------------------------+
```

### C6. Partner — Branding Settings

```
+--------------------------------------------------------------------------------+
| H2: Branding                                                                   |
+------------------------+-------------------------------------------------------+
| EDITOR                 |   PREVIEW (live, frame iframe)                        |
| Logo                   |   +------------------------------------------------+ |
|  [ Upload SVG ] preview|   | < Tenant Logo > Career     [Jobs] [About]      | |
|  [ Hapus ]             |   |================================================| |
|                        |   | Hero brand color                                | |
| Warna Primer           |   | "Bangun masa depan bersama kami"               | |
|  < color picker > #0A2540|   ...                                              | |
|                        |   +------------------------------------------------+ |
| Warna Aksen            |                                                       |
|  < color picker > #C9A961|                                                     |
|                        |                                                       |
| Tipografi              |                                                       |
|  Heading: [Playfair v] |                                                       |
|  Body:    [Inter v]    |                                                       |
|                        |                                                       |
| Subdomain              |                                                       |
|  ( tokopedia ).rpi.id  |                                                       |
|                        |                                                       |
| [ Simpan Perubahan ]   |                                                       |
| [ Reset ke Default ]   |                                                       |
+------------------------+-------------------------------------------------------+
```

**Anotasi**:
- Live preview via Zustand `useBrandingPreview` patching CSS vars di iframe.
- Submit → server action update tenant theme + revalidateTag.

### C7. Partner — Billing

```
+--------------------------------------------------------------------------------+
| H2: Penagihan                                                                  |
+--------------------------------------------------------------------------------+
| { CURRENT PLAN: Growth — Rp 1.499.000/bln · perpanjang 15 Jun }                |
| [ Ubah Paket ] [ Batalkan ]                                                    |
+--------------------------------------------------------------------------------+
| { USAGE METER }                                                                |
| Lowongan aktif: 12 / 20                                                        |
| Kredit talent search: 80 / 100                                                  |
+--------------------------------------------------------------------------------+
| { INVOICES TABLE }                                                             |
| No | Tanggal | Jumlah | Status | [ PDF ]                                      |
+--------------------------------------------------------------------------------+
| { METODE PEMBAYARAN }                                                          |
| Kartu •••• 4242  [ Ubah ]                                                      |
+--------------------------------------------------------------------------------+
```

---

## D. ADMIN / SUPERADMIN

### D1. Platform Overview

```
+--------------------------------------------------------------------------------+
| H2: Platform Overview                          Role: SuperAdmin                |
+--------------------------------------------------------------------------------+
| KPI 6 card: Tenants 124 | Users 52K | Jobs 3.2K | Apps 18K | MRR Rp 412jt | Churn 2.1%
+--------------------------------------------------------------------------------+
| { TENANT GROWTH CHART }                  { REVENUE CHART }                     |
+--------------------------------------------------------------------------------+
| { LATEST SIGNUPS table }                 { SYSTEM ALERTS }                     |
+--------------------------------------------------------------------------------+
```

### D2. User Management

```
+--------------------------------------------------------------------------------+
| H2: Pengguna                              [Ekspor CSV]   Search ( ... )        |
| Filter: Role [Semua v] · Status [Aktif v] · Tanggal daftar                     |
+--------------------------------------------------------------------------------+
| TABLE:                                                                         |
| [ ] | Avatar | Nama | Email | Role | Status | Daftar | Login | Aksi           |
| [ ] | Budi   | budi@... | User | Aktif | 1 Jan | 2j lalu | < ⋯ >              |
+--------------------------------------------------------------------------------+
| Bulk: [Suspend] [Verifikasi] [Hapus]                                           |
+--------------------------------------------------------------------------------+
| < ⋯ > popover: Lihat profil · Impersonate · Reset password · Suspend · Hapus  |
+--------------------------------------------------------------------------------+
```

### D3. Tenant Management (SuperAdmin only)

```
+--------------------------------------------------------------------------------+
| H2: Tenants                                       [+ Buat Tenant Manual]       |
+--------------------------------------------------------------------------------+
| Filter: Plan, Status, Created                                                   |
+--------------------------------------------------------------------------------+
| TABLE: Logo | Nama | Subdomain | Plan | Anggota | Lowongan | MRR | Status | < ⋯ >
+--------------------------------------------------------------------------------+
| Detail panel slide-in saat row klik:                                           |
| - Info dasar | Anggota | Billing | Branding | Audit                            |
+--------------------------------------------------------------------------------+
```

### D4. Job Moderation

```
+--------------------------------------------------------------------------------+
| H2: Moderasi Lowongan                                                          |
| Tabs: [Antrian (23)] [Disetujui] [Ditolak]                                     |
+--------------------------------------------------------------------------------+
| List card lowongan dengan tombol cepat:                                        |
| { Job preview + [ Setujui ] [ Tolak ] [ Tandai ] [ Lihat Detail ] }            |
| Tolak membuka modal alasan (template + free text).                             |
+--------------------------------------------------------------------------------+
```

### D5. Branding Global Default

```
+--------------------------------------------------------------------------------+
| H2: Branding Default Platform                                                  |
| Editor warna + preview (sama dengan partner branding namun untuk seluruh RPI). |
| Hanya superadmin.                                                              |
+--------------------------------------------------------------------------------+
```

### D6. Audit Logs

```
+--------------------------------------------------------------------------------+
| H2: Audit Logs                                          [Ekspor]               |
| Filter: Aktor, Aksi, Resource, Tanggal, IP                                     |
+--------------------------------------------------------------------------------+
| Timestamp | Aktor | Aksi | Resource | IP | Detail                              |
| 2026-05-19 10:21 | sari@maju | JOB_PUBLISH | job:abc | 103.x.x | [JSON]        |
+--------------------------------------------------------------------------------+
| Row expand → diff JSON before/after                                            |
+--------------------------------------------------------------------------------+
```

### D7. System Health

```
+--------------------------------------------------------------------------------+
| H2: System Health                          Auto-refresh 10s                    |
+--------------------------------------------------------------------------------+
| Status row: API < dot success > 200ms | DB < dot success > | Queue < dot warn >|
+--------------------------------------------------------------------------------+
| Charts: latency p95, error rate, queue depth, DB conn pool                     |
+--------------------------------------------------------------------------------+
| Active incidents (jika ada)                                                    |
+--------------------------------------------------------------------------------+
```

---

## E. MODAL FLOWS

### E1. Apply Job Modal (intercepting)

```
+-------------------------------------------------------------+
| H3: Lamar — Frontend Engineer di PT Maju Jaya       < × >   |
+-------------------------------------------------------------+
| Stepper:  [1. CV] - [2. Cover Letter] - [3. Pertanyaan] - [4. Review]
+-------------------------------------------------------------+
| Step 1 — Pilih CV:                                          |
| ( ) CV Utama (PDF) — diupload 12 Mei                        |
| ( ) Buat dari CV Builder                                    |
| ( ) Upload baru < dropzone >                                |
+-------------------------------------------------------------+
|                          [ Batal ]    [ Lanjut > ]          |
+-------------------------------------------------------------+
```

Step 2: textarea cover letter (min 20 char, max 2000) + AI assist [ Bantu Tulis ].
Step 3: pertanyaan custom partner (dinamis).
Step 4: ringkasan + checkbox setuju + [ Kirim Lamaran ].

### E2. Invite Team Modal

```
+-------------------------------------------------------------+
| H3: Undang Anggota Tim                              < × >   |
+-------------------------------------------------------------+
| Email (chips, bisa multi)                                   |
| ( sari@maju.com   andi@maju.com  + )                        |
|                                                             |
| Peran: ( ) Admin  ( ) Recruiter  ( ) Viewer                 |
|                                                             |
| Pesan opsional:                                             |
| ( Halo, mari bergabung di RPI dashboard kami...           )|
|                                                             |
| [ Batal ]                       [ Kirim Undangan ]          |
+-------------------------------------------------------------+
```

### E3. Upload Logo Modal

```
+-------------------------------------------------------------+
| H3: Unggah Logo                                     < × >   |
+-------------------------------------------------------------+
|  < Dropzone besar >                                         |
|  Tarik & lepas, atau [ Pilih File ]                         |
|  SVG, PNG transparan, maks 256x256, < 200 KB                |
+-------------------------------------------------------------+
| Preview di light + dark                                     |
| [ Light bg ▢ ]   [ Dark bg ▣ ]                              |
+-------------------------------------------------------------+
| [ Batal ]                              [ Simpan Logo ]      |
+-------------------------------------------------------------+
```

### E4. Color Picker Modal

```
+-------------------------------------------------------------+
| H3: Pilih Warna Primer                              < × >   |
+-------------------------------------------------------------+
| < HSV picker >                  Hex: ( #0A2540 )            |
|                                  RGB: 10, 37, 64            |
|                                                             |
| Swatches preset:                                            |
| [navy][gold][indigo][teal][maroon][custom]                  |
|                                                             |
| Kontras vs putih: 12.6:1 ✓ AA                                |
| Kontras vs hitam: 1.7:1 ✗  (gunakan untuk background saja)  |
+-------------------------------------------------------------+
| [ Batal ]                                       [ Terapkan ]|
+-------------------------------------------------------------+
```

---

## F. CMD+K PALETTE

```
                +---------------------------------------------------+
                | < search > Cari halaman, aksi, lowongan...   ⌘K  |
                +---------------------------------------------------+
                | Saran                                              |
                | < clock >  Buka lamaran saya            G then A   |
                | < file  >  Buat CV baru                            |
                | < plus  >  Pasang lowongan baru (partner)          |
                | Halaman                                            |
                | < home >   Dashboard                   G then D    |
                | < case >   Lowongan                    G then J    |
                | < layer >  Kursus                      G then C    |
                | Aksi                                               |
                | < gear >   Pengaturan                              |
                | < moon >   Ubah ke Dark Mode                       |
                | < signout> Keluar                                  |
                +---------------------------------------------------+
                | Footer: ↑↓ navigasi  · ↵ pilih · esc tutup          |
                +---------------------------------------------------+
```

**Anotasi**:
- Trigger global: Cmd+K / Ctrl+K.
- Width 640px, top 20vh, shadow-2xl.
- Fuzzy search (cmdk lib).
- Section: Saran (recent), Halaman, Aksi, Pencarian Live (jobs/courses).
- Keyboard: arrow nav, Enter execute, Esc close.

---

## G. MOBILE BOTTOM NAV

```
+----------------------------------+
|                                  |
|        CONTENT AREA              |
|                                  |
+----------------------------------+
| [Home] [Jobs] [+] [LMS] [Profil] |
+----------------------------------+
```

**Anotasi**:
- Tinggi 64px + safe-area-inset-bottom.
- Tombol tengah `[+]` floating gold — context-aware:
  - User: lamar cepat (jobs picker).
  - Partner: pasang lowongan.
  - Admin: tindakan moderasi.
- Aktif: ikon filled + label, indigo color.
- Visible hanya pada dashboard mobile (<md).

---

## H. ERROR STATES

### H1. 404

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                            < ilustrasi rumah hilang >                          |
|                                                                                |
|                   H1: Halaman tidak ditemukan                                  |
|                   Body: Mungkin tautannya sudah pindah                         |
|                         atau Anda salah ketik alamat.                          |
|                                                                                |
|                   [ Kembali ke Beranda ]   [ Hubungi Bantuan ]                 |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### H2. 500

```
+--------------------------------------------------------------------------------+
|                                                                                |
|                            < ilustrasi awan badai >                            |
|                                                                                |
|                   H1: Terjadi gangguan di server kami                          |
|                   Body: Tim teknis sudah diberitahu.                           |
|                         Mohon coba lagi sebentar.                              |
|                                                                                |
|                   [ Coba Lagi ]   [ Status Sistem > ]                          |
|                                                                                |
|                   Error ID: 8f3a-92b1 (sebutkan saat menghubungi support)      |
+--------------------------------------------------------------------------------+
```

### H3. Empty State (di dalam list)

```
+--------------------------------------------------------------------------------+
|                       < ilustrasi kotak kosong >                               |
|                       H4: Belum ada lamaran                                    |
|                       Body-sm: Mulailah dengan menjelajah lowongan terbaru.   |
|                       [ Cari Lowongan ]                                        |
+--------------------------------------------------------------------------------+
```

### H4. No Permission

```
+--------------------------------------------------------------------------------+
|                       < ilustrasi gembok >                                     |
|                       H4: Akses ditolak                                        |
|                       Body-sm: Anda tidak memiliki izin untuk halaman ini.    |
|                              Hubungi admin tim Anda jika perlu.                |
|                       [ Kembali ]   [ Hubungi Admin ]                          |
+--------------------------------------------------------------------------------+
```

### H5. Maintenance

```
+--------------------------------------------------------------------------------+
|                       < ilustrasi alat kerja >                                 |
|                       H1: Sedang dalam perawatan                               |
|                       Body: Kami sedang meningkatkan layanan.                  |
|                       Perkiraan kembali: 14:00 WIB                              |
|                       [ Status Sistem > ]                                       |
+--------------------------------------------------------------------------------+
```

### H6. Offline

```
+--------------------------------------------------------------------------------+
|     < icon wifi-off >  Anda sedang offline.                                    |
|     Aksi Anda akan dikirim otomatis saat koneksi pulih.                        |
|     [ Coba Sekarang ]                                                          |
+--------------------------------------------------------------------------------+
```

---

## I. CATATAN INTERAKSI LINTAS HALAMAN

- **Global hotkey**: Cmd+K membuka palette di mana saja kecuali saat fokus di input multiline (kecuali user menekan Cmd+K explicitly).
- **Sticky CTA**: di halaman public detail (Job, Course), tombol primary jadi sticky bar bottom saat hero sudah ter-scroll keluar viewport (mobile).
- **Skeleton**: setiap list memakai skeleton sesuai jumlah card terakhir yang dimuat (LCP-friendly).
- **Optimistic update**: kanban move, save job, like course — server action fail → toast destructive + revert.
- **Confirm destructive**: setiap delete/hapus permanen pakai modal konfirmasi dengan input ketik nama resource (untuk tenant/user) atau cukup tombol [Hapus] (untuk item kecil).

---

Akhir dokumen WIREFRAME.md.
