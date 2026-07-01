# Laporan Audit — RumahPekerja SaaS (rpi-rebrand)

**Tanggal:** 2026-06-30 07:49
**Auditor:** Sainskerta Loop Workflow — Phase 05 (AUDIT)
**Commit:** `4ccb0d3` (branch `fix/dashboard-session-provider`)
**Scope:** Multi-tenant SaaS (Next.js 14 App Router, Prisma/Postgres + RLS, NextAuth, Stripe, Google/Microsoft Calendar OAuth, LMS, 47 API routes). Audit fokus pada surface berisiko tinggi, bukan baca seluruh file.

---

## Summary

| Area                        | Status       | Catatan                                                                     |
| --------------------------- | ------------ | --------------------------------------------------------------------------- |
| Security (XSS)              | ✅ Pass      | Semua `dangerouslySetInnerHTML` escape-first + tag/URL allowlist            |
| Security (SQL Injection)    | ✅ Pass      | Prisma ORM; satu-satunya raw SQL (RLS) pakai escaper yang benar             |
| Security (Tenant Isolation) | ✅ Pass      | Postgres RLS via `SET LOCAL` GUC, transaction-scoped                        |
| Security (Auth/Webhook)     | ⚠️ Warning   | Stripe/OAuth/token timing-safe; **cron routes tidak**                       |
| Code Quality                | ✅ Pass      | Terdokumentasi rapi, ada CI + Vitest + husky + tsc strict                   |
| Sainskerta Rules Compliance | ⚠️ Deviation | Database memakai foreign key (langgar Rule #2) — keputusan arsitektur sadar |
| Database                    | ✅ Pass      | `deletedAt` (soft delete) + `@@index` hadir luas                            |

**Kesimpulan:** Kode dalam kondisi sehat. Tidak ada temuan severity HIGH. Dua temuan LOW (hardening cron auth) dan satu deviasi ruleset MEDIUM yang perlu keputusan user.

---

## 1. Security Scan

| Check                   | Status         | Detail                                                                                                                                                                                                                                                 |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| XSS Protection          | ✅ Aman        | `lib/blog/markdown.ts`, `lib/applications/mention-parser.ts`: HTML-escape dulu, baru re-introduce tag allowlist; URL divalidasi terhadap scheme allowlist (http/https/mailto/relative). JSON-LD via `safeJsonLd()`.                                    |
| SQL Injection           | ✅ Aman        | Semua query lewat Prisma. Raw SQL hanya di `lib/tenant-context.ts` (`$executeRawUnsafe`) untuk `set_config`, dan nilainya di-escape via `quote()` (double single-quote). Sisanya `$queryRaw\`SELECT 1\`` (health checks, tanpa input).                 |
| Tenant Isolation        | ✅ Aman        | `withTenantContext` set GUC `app.current_tenant_id/user_id/is_superadmin` via `SET LOCAL` di dalam `$transaction` — reset bersih saat commit/rollback walau koneksi pool dipakai ulang. RLS policy di `migrations/manual/002_rls_policies.sql`.        |
| Auth Middleware         | ✅ OK          | NextAuth + Prisma adapter; calendar OAuth callback verifikasi `state` pakai `timingSafeEqual`.                                                                                                                                                         |
| Webhook Signature       | ✅ Aman        | `lib/billing/stripe.ts:272` Stripe signature pakai `crypto.timingSafeEqual`.                                                                                                                                                                           |
| **Cron Secret Compare** | ⚠️ **Warning** | 7 route `app/api/cron/*` membandingkan secret dengan `!==` biasa (mis. `digest/route.ts:42`), **bukan** timing-safe — padahal Stripe/OAuth/unsubscribe-token di repo yang sama sudah `timingSafeEqual`. Inkonsistensi + permukaan timing-attack kecil. |

---

## 2. Performance

| Check            | Status                 | Detail                                                |
| ---------------- | ---------------------- | ----------------------------------------------------- |
| Raw SQL overhead | ✅                     | RLS pakai `SET LOCAL` ringan, sekali per transaksi    |
| Pagination       | ✅                     | Cron digest pakai cursor pagination, `BATCH_SIZE=100` |
| Indexing         | ✅                     | `@@index` hadir luas di schema (lihat §5)             |
| N+1              | ⚪ Tidak diaudit penuh | Perlu pass terpisah per-route bila diminta            |

---

## 3. Code Quality & Tooling

- ✅ TypeScript strict (`tsc --noEmit` via husky pre-commit + lint-staged).
- ✅ CI: GitHub Actions + Vitest smoke suite (commit `47958cc`).
- ✅ Dokumentasi lengkap: `docs/SECURITY.md`, `docs/ARCHITECTURE.md`, `docs/BACKEND.md`, `docs/FRONTEND.md`, `docs/SEO.md`.
- ✅ OAuth token di-encrypt at rest AES-256-GCM (commit `cd3a39b`).
- ⚠️ Dua dependency bcrypt sekaligus: `bcrypt` **dan** `bcryptjs` di `package.json`. Pilih salah satu untuk kurangi bundle/ambiguitas.

---

## 4. Sainskerta Rules Compliance

| Rule                       | Status           | Detail                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1 Modular Monolith        | ✅               | Satu codebase Next.js, modul terpisah                                                                                                                                                                                                                                                                   |
| #2 No Foreign Keys         | ❌ **Deviation** | `schema.prisma` provider `postgresql` **tanpa** `relationMode = "prisma"` → relasi Prisma menghasilkan FK constraint asli di DB. Bertentangan dengan Rule #2. Namun ini dipadukan dengan RLS + integritas DB nyata — kemungkinan keputusan arsitektur sadar, bukan kelalaian. **Butuh keputusan user.** |
| #3 Soft Delete             | ✅               | `deletedAt` hadir di schema                                                                                                                                                                                                                                                                             |
| #7 No Hardcoded Dummy Data | ✅               | Data via Prisma/API; ada seed terpisah                                                                                                                                                                                                                                                                  |
| #15 Git                    | ✅               | Versioned, commit per fitur                                                                                                                                                                                                                                                                             |
| #16 Progress Tracking      | ✅               | Mulai sekarang via `progress.md` ini                                                                                                                                                                                                                                                                    |

---

## 5. Database

| Check              | Status | Detail                                                              |
| ------------------ | ------ | ------------------------------------------------------------------- |
| Soft delete column | ✅     | `deletedAt`                                                         |
| Index coverage     | ✅     | Banyak `@@index` (209 occurrence gabungan deletedAt/index/relation) |
| FK constraint      | ⚠️     | Ada (lihat Rule #2)                                                 |

---

## Issues Found

| #   | Issue                                                                                          | Severity            | Status                      |
| --- | ---------------------------------------------------------------------------------------------- | ------------------- | --------------------------- |
| 1   | Cron secret dibandingkan dengan `!==` (bukan `timingSafeEqual`) di 7 route `app/api/cron/*`    | LOW                 | open                        |
| 2   | Konvensi header cron tidak konsisten: 4 route `x-cron-secret`, 3 route `Authorization: Bearer` | LOW                 | open                        |
| 3   | DB memakai FK constraint — deviasi dari Sainskerta Rule #2 (No Foreign Keys)                   | MEDIUM (vs ruleset) | open — butuh keputusan user |
| 4   | Dua lib hashing terpasang bersamaan: `bcrypt` + `bcryptjs`                                     | LOW                 | open                        |

---

## Rekomendasi

1. **Cron auth (Issue #1+#2):** seragamkan jadi satu konvensi header dan bandingkan secret dengan `crypto.timingSafeEqual` (helper bersama). Effort kecil, satu file util + edit 7 route.
2. **FK rule (Issue #3):** keputusan user — (a) terima deviasi & dokumentasikan di `architecture-decisions.md` (rekomendasi: project ini pakai RLS + Postgres asli, FK wajar), atau (b) set `relationMode = "prisma"` + drop FK (sesuai Sainskerta ketat).
3. **bcrypt (Issue #4):** pilih satu (rekomendasi `bcryptjs`, pure-JS, tanpa native build di Vercel), hapus yang lain.

---

## Kesimpulan

❌ **Belum auto-pass** — bukan karena bug kritis, tapi karena ada deviasi ruleset (Issue #3) yang butuh keputusan user, plus 3 hardening LOW. Secara keamanan & kualitas teknis: **siap dilanjutkan**. Menunggu approval user di gate audit (lihat `progress.md`).

---

# ADDENDUM — Audit Halaman 404 / Belum Terdevelop (2026-06-30)

> Permintaan user: audit halaman yang masih 404 / belum terdevelop, prioritaskan pengerjaannya.

## A. Bug komponen: KPI cards render sebagai skeleton — ✅ DIPERBAIKI

Pattern `safeRequire(path, exportName)` me-resolve komponen secara defensif; kalau export tidak ketemu → render skeleton `data-todo`. 12 dependency dicek; **11 cocok**, **1 salah nama**:

- `components/molecules/kpi-card.tsx` meng-export **`KpiCard`**, tapi 5 halaman memanggil `safeRequire(..., 'KPICard')` → undefined → skeleton.
- **Dampak:** KPI metric cards tampil sebagai kotak pulsing (bukan angka) di: `/dashboard`, `/admin`, `/admin/sistem`, `/partner`, `/partner/analitik`.
- **Fix:** ubah argumen export `'KPICard'` → `'KpiCard'` di 5 halaman. Props (`label`, `value`) sudah cocok dengan `KpiCardProps`. Typecheck PASS. ✅

## B. Link navigasi 404 — slug mismatch (halaman ADA, href salah) — ✅ DIPERBAIKI

Nav memakai segmen Inggris, halaman asli pakai slug Indonesia:

| Lokasi                  | href lama (404)      | href baru (✅ ada)  |
| ----------------------- | -------------------- | ------------------- |
| `admin-layout.tsx`      | `/admin/moderation`  | `/admin/moderasi`   |
| `admin-layout.tsx`      | `/admin/system`      | `/admin/sistem`     |
| `mobile-bottom-nav.tsx` | `/dashboard/profile` | `/dashboard/profil` |
| `footer-public.tsx`     | `/about`             | `/tentang`          |
| `footer-public.tsx`     | `/partners`          | `/mitra`            |

## C. Halaman benar-benar BELUM ADA (butuh keputusan: build / repoint / hapus dari nav)

Link nav aktif yang menunjuk route tanpa `page.tsx`:

| href                     | Sumber nav                           | Catatan / kandidat repoint                                                  |
| ------------------------ | ------------------------------------ | --------------------------------------------------------------------------- |
| `/dashboard/jobs`        | dashboard sidebar, mobile nav, cmd-k | Browsing publik `/jobs` sudah ada — repoint? atau view dashboard sendiri    |
| `/dashboard/messages`    | dashboard sidebar                    | Inbox pesan — hanya ada `lamaran/[id]/pesan` (per-lamaran), belum ada inbox |
| `/dashboard/calendar`    | dashboard sidebar                    | Integrasi calendar (API) ada, halaman dashboard belum                       |
| `/dashboard/talents`     | dashboard sidebar (PARTNER+)         | Mirip `tenants/[slug]/talent-pool` / `partner/talent`                       |
| `/dashboard/analytics`   | dashboard sidebar (PARTNER+)         | `partner/analitik` sudah ada — repoint?                                     |
| `/dashboard/settings`    | dashboard footer, cmd-k              | Settings terpecah (keamanan, profil, notifikasi) — perlu hub                |
| `/dashboard/jobs/new`    | cmd-k palette                        | Buat lowongan — ada di `tenants/[slug]/jobs/new`                            |
| `/dashboard/team/invite` | cmd-k palette                        | Undang tim — ada `partner/tim` (InviteForm)                                 |
| `/admin/billing`         | admin sidebar                        | Penagihan admin — belum ada                                                 |
| `/admin/analytics`       | admin sidebar                        | Analitik admin — belum ada                                                  |
| `/admin/settings`        | admin footer                         | Pengaturan admin — belum ada                                                |
| `/help`                  | dashboard footer                     | Halaman bantuan — belum ada                                                 |

**Status:** Kategori C menunggu keputusan user (gate). Tidak di-build/hapus sepihak karena tiap entry = keputusan produk (build vs repoint ke halaman setara vs hapus dari nav).
