# Progress — RumahPekerja SaaS (rpi-rebrand)

> **Source of truth progress project. Update setiap kali ada perubahan status fase.**

---

## Ringkasan

| Item            | Status                                             |
| --------------- | -------------------------------------------------- |
| **Project**     | `RumahPekerja SaaS (rpi-rebrand)`                  |
| **Fase Aktif**  | `05-AUDIT`                                         |
| **Status Loop** | `paused — menunggu approval user (gate audit)`     |
| **Dimulai**     | `2026-06-30 07:49`                                 |
| **Mode**        | `Self-paced, existing project (masuk di Phase 05)` |
| **Progress**    | `~85% (audit selesai, deploy pending)`             |

---

## Fase

### ✅ Fase 00–04: Init → Backend → Frontend — `Selesai (pre-existing)`

Project sudah dibangun sebelum loop dimulai (Next.js 14, Prisma/Postgres+RLS, NextAuth, Stripe, Calendar OAuth, LMS, 47 API routes, CI+Vitest+husky). Ditandai selesai sebagai baseline.

### ➡️ Fase 05: Audit — `Selesai — 👀 menunggu approval`

- [✅] Security check (XSS, SQLi, tenant isolation, webhook)
- [✅] Performance review (sampling)
- [✅] Code review + tooling
- [✅] Sainskerta rules compliance
- [✅] Database review
- [✅] Laporan audit → `audit-report.md`
- [👀] **Review & approval user atas laporan audit**

### ⬜ Fase 06: Deployment — `Belum`

- [ ] Build production
- [ ] Deploy ke target (butuh kredensial server/domain dari user)
- [ ] Domain & SSL, env vars, health check

### ⬜ Fase 07: Improvement — `Belum`

---

## Issue & Blocker

| #   | Issue                                                              | Severity | Status                      |
| --- | ------------------------------------------------------------------ | -------- | --------------------------- |
| 1   | Cron secret pakai `!==` bukan `timingSafeEqual` (7 route)          | low      | open                        |
| 2   | Konvensi header cron tidak konsisten (`x-cron-secret` vs `Bearer`) | low      | open                        |
| 3   | DB pakai FK — deviasi Sainskerta Rule #2                           | medium   | open (butuh keputusan user) |
| 4   | `bcrypt` + `bcryptjs` terpasang bersamaan                          | low      | open                        |

Detail lengkap: `audit-report.md`.

---

## Catatan

Loop berhenti di **gate audit** (mandatory approval gate). Tidak auto-advance ke Phase 06 (Deploy) karena: (a) deploy butuh approval + kredensial server dari user, (b) Issue #3 butuh keputusan arsitektur user.

---

## Log Perubahan

| Tanggal            | Fase             | Perubahan                                                                                                                                                                                                                                                                                                                                                            |
| ------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2026-06-30 07:49` | `05-AUDIT`       | Loop dimulai di Phase 05 (existing project). Audit selesai, laporan dibuat, parkir di gate approval.                                                                                                                                                                                                                                                                 |
| `2026-06-30 08:10` | `05-AUDIT`       | Audit 404/undeveloped. FIX: KPI cards (5 hal) export-name `KpiCard`; 5 link nav slug-404 (moderasi/sistem/profil/tentang/mitra). Typecheck PASS. Kategori C (12 halaman belum ada) menunggu keputusan user. Detail: `audit-report.md` Addendum.                                                                                                                      |
| `2026-06-30 08:30` | `05-AUDIT→build` | Kategori C dikerjakan. REPOINT 5 link (jobs→/jobs, talents→/partner/talent, analytics→/partner/analitik, jobs/new→/partner/lowongan/baru, team/invite→/partner/tim) + hapus nav calendar. BUILD 6 halaman baru: /dashboard/settings, /admin/settings, /help, /dashboard/messages (inbox real-data), /admin/billing, /admin/analytics. `npm run build` PASS (exit 0). |
