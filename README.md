# SSN Pekerja (SSN)

> Platform SaaS Job Seeker + LMS terintegrasi multi-tenant untuk Indonesia. Menghubungkan pencari kerja, perusahaan, dan institusi pelatihan/pemerintah dalam satu ekosistem.

[![Made with Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)

---

## Tentang Proyek

**SSN Pekerja (SSN)** adalah platform SaaS multi-tenant yang menyediakan:

- **Job board** untuk pencari kerja Indonesia (fresh grad sampai eksekutif).
- **Learning Management System (LMS)** dengan jalur sertifikasi BNSP & Kartu Prakerja.
- **White-label SaaS** bagi partner (universitas, BLK, dinas tenaga kerja, korporasi) dengan subdomain sendiri.
- **AI-native matching** menggunakan LLM dan vector embedding.

Bersaing dengan: Glints, Jobstreet, Indeed, LinkedIn ID, Kalibrr, Karir.com, Skill Academy, Pintaria, RevoU.

Detail strategi: lihat [`docs/BENCHMARK.md`](./docs/BENCHMARK.md).

---

## Quickstart

### Prasyarat

| Tools      | Versi                         |
| ---------- | ----------------------------- |
| Node.js    | 20.x LTS atau lebih baru      |
| npm        | 10.x (bundled dengan Node 20) |
| PostgreSQL | 15 atau lebih baru            |
| Redis      | 7.x (atau Upstash)            |
| Git        | 2.40+                         |

Opsional untuk fitur penuh:

- Docker Desktop (untuk Postgres + Redis lokal via Compose)
- Meilisearch (Phase 2+)

### Setup

```bash
# 1. Clone
git clone https://github.com/ssnpekerja/ssn.git
cd ssn

# 2. Install dependencies
npm install

# 3. Salin env template
cp .env.example .env.local
# Edit .env.local — isi nilai sesuai catatan di bawah

# 4. Start Postgres + Redis (Docker Compose)
docker compose up -d db redis

# 5. Generate Prisma client & jalankan migrasi
npx prisma generate
npx prisma migrate dev

# 6. Seed database (tenants demo, user demo, lowongan contoh)
npm run db:seed

# 7. Start dev server
npm run dev
```

Buka `http://localhost:3000`.

### Environment Variables

`.env.local` minimum:

```env
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APEX_DOMAIN=localhost:3000

# Database
DATABASE_URL=postgresql://ssn:ssn@localhost:5432/ssn?schema=public
DIRECT_URL=postgresql://ssn:ssn@localhost:5432/ssn?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Auth
NEXTAUTH_SECRET=ganti-dengan-string-acak-32char
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (opsional, lihat console.cloud.google.com)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=

# Storage (R2 / S3)
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=ssn-local
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# LLM (Anthropic)
ANTHROPIC_API_KEY=

# Observability
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

Lihat `.env.example` untuk daftar lengkap.

---

## Scripts

| Script                   | Deskripsi                              |
| ------------------------ | -------------------------------------- |
| `npm run dev`            | Start Next.js dev server (port 3000)   |
| `npm run build`          | Build production                       |
| `npm start`              | Jalankan production build              |
| `npm run lint`           | ESLint check                           |
| `npm run lint:fix`       | ESLint auto-fix                        |
| `npm run typecheck`      | TypeScript strict check                |
| `npm test`               | Unit tests (Vitest)                    |
| `npm run test:e2e`       | End-to-end tests (Playwright)          |
| `npx prisma generate`    | Generate Prisma client                 |
| `npx prisma migrate dev` | Buat & apply migration baru            |
| `npx prisma studio`      | Buka Prisma Studio GUI                 |
| `npm run db:seed`        | Seed database dgn data demo            |
| `npm run db:reset`       | Drop & re-create database              |
| `npm run worker:dev`     | Jalankan BullMQ worker lokal           |
| `npm run storybook`      | Storybook untuk komponen Atomic Design |

---

## Folder Structure

```
ssn-rebrand/
+- app/                    # Next.js App Router
|  +- (marketing)/         # public landing pages
|  +- (auth)/              # login, register, forgot
|  +- (app)/               # authenticated app
|  |  +- jobs/             # job board
|  |  +- learn/            # LMS
|  |  +- profile/          # user profile + CV
|  |  +- partner/          # partner dashboard
|  |  +- admin/            # superadmin
|  +- api/v1/              # REST routes
|  +- sitemap.ts
|  +- robots.ts
+- components/             # Atomic Design
|  +- atoms/
|  +- molecules/
|  +- organisms/
|  +- templates/
+- lib/
|  +- auth/                # NextAuth config
|  +- db/                  # Prisma client + tenant context
|  +- tenant/              # tenant resolution
|  +- cache/               # Redis + React cache
|  +- queue/               # BullMQ helpers
|  +- search/              # Meilisearch / Postgres FTS
|  +- storage/             # R2 / S3
|  +- llm/                 # Anthropic client
|  +- rbac/                # authorization
|  +- audit/               # audit log
+- prisma/
|  +- schema.prisma
|  +- migrations/
|  +- seed.ts
+- workers/                # BullMQ workers
+- public/
+- styles/
+- tests/
+- docs/
|  +- BENCHMARK.md
|  +- ARCHITECTURE.md
|  +- SEO.md
+- .env.example
+- docker-compose.yml
+- package.json
+- README.md
```

---

## Tech Stack

| Layer         | Pilihan                               | Catatan                            |
| ------------- | ------------------------------------- | ---------------------------------- |
| Framework     | Next.js 14 App Router                 | RSC + Server Actions               |
| Language      | TypeScript strict                     |                                    |
| Styling       | Tailwind CSS + Atomic Design          | Brand palette Navy + Gold + Indigo |
| Font          | Playfair Display + Inter              | via `next/font`                    |
| ORM           | Prisma                                | + raw SQL untuk RLS                |
| Database      | PostgreSQL 15 (Neon)                  | Row-Level Security                 |
| Auth          | NextAuth v5 (Auth.js)                 | Credentials + Google               |
| Cache         | Upstash Redis                         | session, rate-limit, hot keys      |
| Queue         | BullMQ + Redis                        | email, AI, indexing                |
| Search        | Postgres FTS (MVP) → Meilisearch      |                                    |
| Storage       | Cloudflare R2 (S3-compatible)         | CV, video, logo                    |
| Email         | Resend                                | transactional                      |
| Payment       | Xendit (primary), Midtrans (fallback) |                                    |
| LLM           | Anthropic Claude (Haiku/Sonnet)       | CV review, matching                |
| Observability | Sentry + PostHog + OpenTelemetry      |                                    |
| CI/CD         | GitHub Actions + Vercel               |                                    |
| Hosting       | Vercel + Neon + Upstash + R2          | region sin1                        |

---

## Dokumentasi Lanjutan

- **Strategi & kompetisi:** [`docs/BENCHMARK.md`](./docs/BENCHMARK.md)
- **Arsitektur teknis:** [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- **SEO:** [`docs/SEO.md`](./docs/SEO.md)

Dokumen tambahan akan ditambahkan tim:

- `docs/CONTRIBUTING.md` — alur kontribusi
- `docs/STYLE_GUIDE.md` — code & design guideline
- `docs/SECURITY.md` — kebijakan & disclosure
- `docs/adr/` — Architecture Decision Records

---

## Roles & Test Accounts

Setelah `npm run db:seed`, akun demo berikut tersedia:

| Role                   | Email                          | Password         | Tenant   |
| ---------------------- | ------------------------------ | ---------------- | -------- |
| Super Admin            | `super@pekerja.sainskerta.net` | `SuperRPI123!`   | (global) |
| Partner Admin (Telkom) | `admin@telkom.test`            | `TelkomDemo123!` | `telkom` |
| Partner Admin (UI)     | `admin@ui.test`                | `UIDemo123!`     | `ui`     |
| Recruiter (Telkom)     | `recruiter@telkom.test`        | `TelkomDemo123!` | `telkom` |
| Job Seeker             | `seeker@example.com`           | `SeekerDemo123!` | (public) |
| Job Seeker (UI alumni) | `alumni@ui.test`               | `AlumniDemo123!` | `ui`     |

**Penting:** akun demo HANYA untuk lingkungan dev/staging. Jangan dipakai di produksi.

### Hierarki Role

| Role         | Cakupan       | Hak Utama                                                         |
| ------------ | ------------- | ----------------------------------------------------------------- |
| `superadmin` | Global SSN    | Kelola semua tenant, billing, feature flag                        |
| `admin`      | 1 tenant      | Kelola tenant settings, billing tenant, user/admin tambahan       |
| `partner`    | 1 tenant      | Kelola job posts, applicants, LMS content (tergantung izin admin) |
| `user`       | (atau tenant) | Job seeker — apply, ikut course, kelola profil                    |

---

## Multi-Tenant Testing (Lokal)

Untuk mensimulasi subdomain partner di lokal:

### Windows

Edit `C:\Windows\System32\drivers\etc\hosts` (run as Administrator):

```
127.0.0.1   localhost
127.0.0.1   telkom.localhost
127.0.0.1   ui.localhost
127.0.0.1   blk-jakarta.localhost
```

Lalu buka:

- Apex (publik): `http://localhost:3000`
- Tenant Telkom: `http://telkom.localhost:3000`
- Tenant UI: `http://ui.localhost:3000`

### macOS / Linux

Edit `/etc/hosts`:

```
127.0.0.1   telkom.localhost
127.0.0.1   ui.localhost
127.0.0.1   blk-jakarta.localhost
```

### Verifikasi

Login sebagai partner admin (lihat tabel akun di atas) lalu cek bahwa session `tenantId` cocok dengan subdomain (lihat dev console banner).

---

## Kontribusi

1. Fork repo, branch dari `main` dengan nama `feat/...` atau `fix/...`.
2. Tulis kode dengan TypeScript strict, ikuti Atomic Design.
3. Tambah/update test (Vitest unit + Playwright e2e bila perlu).
4. Jalankan `npm run lint && npm run typecheck && npm test` sebelum push.
5. Buat Pull Request dengan deskripsi jelas + screenshot (jika UI).
6. Tunggu review minimal 1 maintainer. CI harus hijau.

### Standar Commit

Conventional Commits:

```
feat(jobs): tambah filter salary range
fix(auth): reset password expiry timezone
docs(architecture): update C4 diagram
refactor(prisma): split tenant context module
```

### Code Review Checklist

- [ ] `tenant_id` propagasi di setiap query
- [ ] RBAC check di setiap mutation
- [ ] Audit log untuk perubahan sensitive
- [ ] Test coverage tidak turun
- [ ] Tidak ada `console.log` tersisa
- [ ] Komentar bahasa Indonesia untuk konteks bisnis, English untuk teknis
- [ ] Metadata SEO (jika public page)

---

## Lisensi

Proprietary — © 2026 PT SSN Pekerja. Semua hak cipta dilindungi.

---

## Kontak

- Engineering: `engineering@pekerja.sainskerta.net`
- Security: `security@pekerja.sainskerta.net` (PGP key di `/.well-known/security.txt`)
- Partnership: `partner@pekerja.sainskerta.net`
