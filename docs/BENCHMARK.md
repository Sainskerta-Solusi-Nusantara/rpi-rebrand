# BENCHMARK — Rumah Pekerja Indonesia (RPI)

> Analisis pasar, kompetitor, dan strategi diferensiasi untuk platform SaaS Job Seeker + LMS terintegrasi di Indonesia.

**Versi:** 1.0 — Mei 2026
**Pemilik dokumen:** Strategy & Product
**Ulas ulang:** Setiap kuartal

---

## 1. Ringkasan Eksekutif

Rumah Pekerja Indonesia (RPI) memposisikan diri sebagai **SaaS job-seeker platform multi-tenant** yang menjembatani sektor pemerintah, BUMN, dan swasta — dilengkapi **Learning Management System (LMS) terintegrasi** dengan jalur sertifikasi BNSP. Kompetitor existing (Glints, Jobstreet, Indeed, LinkedIn) berfokus pada job matching murni; pemain LMS (Skill Academy, Pintaria, RevoU) berfokus pada pelatihan saja. RPI menutup *gap* dengan **single-funnel discover-learn-certify-hire** sekaligus **white-label SaaS untuk partner** (universitas, BLK, dinas tenaga kerja, korporasi).

**TAM (Total Addressable Market) Indonesia 2026:**
- 144 juta angkatan kerja (BPS)
- ~9.9 juta pengangguran terbuka
- ~64 juta tenaga kerja di sektor informal yang ingin formalisasi
- Pasar HR tech Indonesia: USD 1.2 B (2024) tumbuh 18% CAGR menuju USD 2.7 B (2029)
- Pasar online learning Indonesia: USD 0.95 B (2024) → USD 2.1 B (2029)

**SAM (Serviceable):** ~28 juta pekerja aktif mencari pekerjaan + 12 juta fresh graduate per tahun.

**SOM (Serviceable Obtainable, 3 tahun):** 2-4% dari SAM = 800k-1.6 juta MAU.

---

## 2. Segmentasi Pasar

| Segmen | Estimasi Populasi | Pain Point Utama | Willingness to Pay | Channel |
|---|---|---|---|---|
| **Fresh Graduate (D3/S1)** | ~12 jt/tahun | Pengalaman nol, CV lemah, butuh sertifikasi | Rendah (gratis + freemium course) | Kampus, social media, BEM |
| **Blue-collar / Vocational** | ~40 jt | Akses lowongan terbatas, sertifikasi BNSP mahal | Sangat rendah (subsidi pemerintah/CSR) | BLK, dinas, agen TKI |
| **Mid-career Professional** | ~18 jt | Career switch, upskilling, headhunt visibility | Sedang (Rp 99-499k/bulan untuk premium) | LinkedIn, alumni network |
| **Executive / Senior** | ~2 jt | Konfidensialitas, executive search, board roles | Tinggi (Rp 1-5 jt/bulan) | Private network, headhunter |
| **Tenaga Kerja Migran (PMI)** | ~9 jt | Verifikasi penyalur, pelatihan bahasa, legalitas | Rendah (subsidi BP2MI) | BP2MI, P3MI |
| **UMKM Owner Hiring** | ~64 jt UMKM | Akses talenta terjangkau, no HR team | Rendah (Rp 99-299k untuk post) | Marketplace, komunitas |

---

## 3. Lanskap Kompetitor (Deep-Dive)

### 3.1 Matriks Posisi

```
                  High Skill Focus
                        |
        LinkedIn ID  •  |  • RevoU
                        |  • Pintaria
        Kalibrr    •    |
                        |  • Skill Academy
   --- Job Match -------+------- Learning ---
                        |
        Glints     •    |
        Jobstreet  •    |
        JobsDB     •    |
                        |
        Indeed     •    |
        Karir.com  •    |
                        |
                  Mass Market
```

### 3.2 Glints

- **Positioning:** Career discovery platform untuk Gen-Z & Millennials Asia Tenggara.
- **USP:** UI/UX modern, komunitas aktif, kategori jobs untuk fresh grad & part-time, *Glints ExpertClass* untuk live learning.
- **Pricing (Employer):**
  - Job Post Basic: Rp 0 (limited visibility)
  - Job Post Boost: Rp 199k-499k per post
  - Talent Search: Rp 2.5 jt-15 jt/bulan
  - TalentHunt (managed recruitment): commission 15-25% annual salary
- **Monetisasi:** Job posting, talent search subscription, recruitment service fee, training revenue share.
- **Kekuatan:** Brand strong di kalangan muda; UI/UX terbaik; konten edukasi.
- **Kelemahan:**
  - Fokus white-collar urban (Jakarta, Surabaya, Bandung)
  - Sertifikasi BNSP tidak terintegrasi
  - Tidak ada white-label untuk partner pemerintah/CSR
  - Coverage daerah Tier 2/3 lemah

### 3.3 Jobstreet (by SEEK)

- **Positioning:** Job board mass-market, generasi millennial-X, legacy player.
- **USP:** Database CV terbesar (>15 jt resume Indonesia), brand recognition, partnership dengan korporasi besar.
- **Pricing (Employer):**
  - Classic Job Ad: Rp 1.8 jt/30 hari
  - Premium Job Ad: Rp 3.5 jt
  - Talent Search: Rp 8-25 jt/bulan
  - Branded Talent Search & Sourcing: enterprise quote
- **Monetisasi:** Job ad listing dominant (~70% revenue), talent search, employer branding ads.
- **Kekuatan:** Database & brand recall tertinggi di mass-market; SEO domain authority.
- **Kelemahan:**
  - UX legacy, mobile experience suboptimal
  - Tidak ada LMS native
  - Pricing tinggi untuk SME/UMKM
  - Fitur AI-matching tertinggal vs Glints/LinkedIn

### 3.4 Indeed

- **Positioning:** Aggregator job board global, "the world's #1 job site".
- **USP:** Volume listing terbesar (scraping + direct post), Indeed Resume, Indeed Hire (managed).
- **Pricing:** PPC-based (Pay-Per-Click) Rp 5k-50k per click, sponsored jobs, Resume Search subscription.
- **Monetisasi:** PPC ads, sponsored listing, talent search.
- **Kekuatan:** SEO global, volume listing, gratis untuk posting basic.
- **Kelemahan:**
  - Tidak ada localized features Indonesia (BNSP, BPJS, NIK verifikasi)
  - Quality jobs lower (banyak duplikat scraping)
  - Tidak ada komunitas atau learning
  - Customer support minim

### 3.5 LinkedIn Indonesia

- **Positioning:** Professional networking + executive recruitment.
- **USP:** Network effect global, employer branding, InMail, LinkedIn Learning.
- **Pricing:**
  - LinkedIn Premium Career: USD 39.99/bulan (~Rp 620k)
  - LinkedIn Recruiter Lite: USD 170/bulan (~Rp 2.6 jt)
  - LinkedIn Recruiter Corporate: USD 825/bulan (~Rp 12.8 jt)
  - LinkedIn Learning: USD 39.99/bulan (~Rp 620k)
- **Monetisasi:** Recruiter subscription dominant, Premium career, Learning, Sales Navigator, ads.
- **Kekuatan:** Network global, kualitas profil senior/eksekutif, employer branding.
- **Kelemahan:**
  - Mahal untuk pasar Indonesia (USD-pricing)
  - Tidak fokus pada blue-collar atau fresh grad daerah
  - LinkedIn Learning kontennya kurang lokal (BNSP, kurikulum Kemnaker)
  - Tidak ada multi-tenant untuk partner lokal

### 3.6 Kalibrr

- **Positioning:** AI-driven recruitment platform untuk mid-to-senior professionals (originating Philippines, expand Indonesia).
- **USP:** ATS-like features untuk employer, assessment tests, AI candidate matching.
- **Pricing (Employer):** Subscription Rp 5-20 jt/bulan untuk recruiter tools; job posting per-slot.
- **Monetisasi:** Recruiter subscription, job posting, assessment add-ons.
- **Kekuatan:** Quality candidate pool mid-senior, AI matching.
- **Kelemahan:**
  - Brand awareness Indonesia lebih rendah
  - Tidak ada LMS
  - Coverage entry-level kurang

### 3.7 Karir.com

- **Positioning:** Local Indonesia job board, partnership dengan korporasi besar Indonesia.
- **USP:** Job fair fisik & virtual, partnership BUMN, headhunter service.
- **Pricing:** Job posting Rp 1-3 jt/30 hari, Recruiter package, Job Fair sponsorship.
- **Monetisasi:** Job posting, recruitment service, event sponsorship.
- **Kekuatan:** Hubungan dengan korporasi Indonesia.
- **Kelemahan:** UI/UX outdated, mobile UX lemah, fitur AI nyaris tidak ada.

### 3.8 JobsDB (legacy, sudah merge dengan Jobstreet/SEEK)

- Praktis menjadi sub-brand SEEK; relevansi menurun, traffic dialihkan ke Jobstreet.

### 3.9 Skill Academy (Ruangguru)

- **Positioning:** Online learning skill-based untuk profesional & jobseeker, Indonesia.
- **USP:** Pricing terjangkau (Rp 99k-499k per course), instruktur lokal, sertifikat dapat di-redeem Kartu Prakerja.
- **Pricing:** Per-course Rp 99k-499k; bundle Rp 999k; subscription model under-explored.
- **Monetisasi:** Course sales, Prakerja partnership, B2B corporate training.
- **Kekuatan:** Brand Ruangguru, konten lokal, Prakerja partnership.
- **Kelemahan:** Tidak ada integrasi job matching (placement); LMS only.

### 3.10 Pintaria (Cakap Group)

- **Positioning:** Online degree + skill course; sebagian besar konten degree program partnership universitas.
- **USP:** Online degree resmi, mikro-kredensial, language learning.
- **Pricing:** Degree program Rp 5-25 jt/semester; short course Rp 199k-999k.
- **Monetisasi:** Degree tuition, course sales.
- **Kelemahan:** Tidak ada job board; bukan one-stop solution.

### 3.11 RevoU

- **Positioning:** Bootcamp digital skills (Data Analytics, Digital Marketing, Product Management, SWE).
- **USP:** Job-guarantee bootcamp, mentor industri, ISA (Income Share Agreement) option.
- **Pricing:** Full-stack bootcamp Rp 18-35 jt; mini-course Rp 1-3 jt.
- **Monetisasi:** Tuition fees, B2B training, ISA.
- **Kelemahan:** Mahal, hanya untuk segmen narrow (digital roles), tidak ada job board generic.

---

## 4. Matriks Fitur Komparatif

| Fitur | Glints | Jobstreet | Indeed | LinkedIn | Kalibrr | Skill Academy | RPI (target) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Job board public | YES | YES | YES | YES | YES | NO | YES |
| AI job matching | YES | partial | YES | YES | YES | NO | YES |
| ATS untuk employer | partial | YES | partial | YES | YES | NO | YES |
| Talent search | YES | YES | YES | YES | YES | NO | YES |
| LMS native | partial | NO | NO | YES (global) | NO | YES | YES |
| Sertifikasi BNSP | NO | NO | NO | NO | NO | partial | YES |
| Kartu Prakerja integration | NO | NO | NO | NO | NO | YES | YES |
| Multi-tenant / White-label | NO | NO | NO | NO | NO | NO | YES |
| Partner SaaS (univ/BLK/dinas) | NO | NO | NO | NO | NO | NO | YES |
| Komunitas / forum | YES | NO | NO | YES | NO | partial | YES |
| Mentor / coaching | partial | NO | NO | YES | NO | YES | YES |
| Job fair virtual | partial | YES | NO | partial | NO | NO | YES |
| NIK / KTP verification | NO | NO | NO | NO | NO | NO | YES |
| BPJS / payroll integration | NO | NO | NO | NO | NO | NO | YES (v1.5) |
| Multi-language (id/en) | partial | YES | YES | YES | YES | YES (id) | YES |
| Blue-collar focus | partial | partial | partial | NO | NO | NO | YES |
| Executive search | partial | YES | partial | YES | partial | NO | YES (v2.0) |
| Mobile-first PWA | partial | partial | YES | YES | partial | YES | YES |
| Programmatic SEO | partial | YES | YES | YES | partial | YES | YES |

---

## 5. Analisis Gap & Peluang

1. **Tidak ada pemain yang menyatukan job + LMS + sertifikasi BNSP** dalam satu funnel terintegrasi.
2. **Multi-tenant SaaS untuk partner institusional** (universitas, BLK, dinas tenaga kerja, perusahaan dengan internal mobility) belum ada di pasar Indonesia.
3. **Coverage blue-collar dan daerah Tier 2/3** kurang terlayani — Glints/LinkedIn fokus urban; Indeed/Jobstreet kurang lokalisasi.
4. **Integrasi pemerintah (Kemnaker, BNSP, BP2MI, Kartu Prakerja, BPJS)** tidak digarap serius oleh pemain swasta global.
5. **Pricing predictable & terjangkau untuk SME/UMKM** masih jadi pain point — Jobstreet & LinkedIn terlalu mahal.

---

## 6. Strategi Diferensiasi RPI

### 6.1 Bridge Pemerintah-Swasta
- Partnership formal dengan Kemnaker (BPJS Ketenagakerjaan, BLK, Kartu Prakerja).
- Integrasi data sertifikasi BNSP — kandidat dapat menampilkan sertifikat resmi langsung di profil.
- API publik untuk dinas tenaga kerja daerah & BP2MI.

### 6.2 LMS Terintegrasi — "Learn to Earn"
- Setiap job listing dapat menyarankan *learning path* untuk skill yang missing.
- Sertifikat hasil training auto-attach ke CV.
- Partnership BNSP & LSP untuk sertifikasi resmi end-to-end (asesmen, hasil, blockchain credential).

### 6.3 White-Label SaaS untuk Partner
- Setiap partner (universitas, BLK, korporasi) mendapat **subdomain** (e.g. `telkom.rumahpekerja.id`, `ui.rumahpekerja.id`).
- Branding partner (logo, warna), namun infrastruktur shared.
- Partner mengelola alumni/karyawan/peserta sendiri dengan privacy isolation (Postgres RLS).

### 6.4 Multi-tenant Native
- Tenant_id everywhere, Postgres RLS untuk isolasi data.
- Single codebase, single deployment — economies of scale.

### 6.5 AI-Native Matching
- Embedding-based semantic search (vector DB), LLM untuk JD-to-CV scoring & feedback.
- Personalized learning recommendation per kandidat.

### 6.6 Localized Hyper-Verticals
- Hyper-vertical untuk: PMI (Pekerja Migran Indonesia), Tenaga Kesehatan, IT/Tech, F&B, Manufaktur, Kreatif.

---

## 7. Monetisasi

### 7.1 Partner SaaS Tier (B2B2C Multi-tenant)

| Tier | Harga / bulan | Target | Fitur Utama |
|---|---|---|---|
| **Free** | Rp 0 | Komunitas kecil, UMKM, BEM | 1 admin, 10 job post/bln, 100 user, branding RPI |
| **Pro** | Rp 990k | UMKM growing, sekolah vokasi | 3 admin, 50 job post, 1k user, custom subdomain, basic ATS |
| **Business** | Rp 3.9 jt | Universitas, BLK, korporasi medium | 10 admin, unlimited job post, 10k user, full ATS, talent search, LMS, custom branding |
| **Enterprise** | Custom (mulai Rp 15 jt) | BUMN, korporasi besar, dinas | Unlimited, SSO/SAML, SLA 99.9%, dedicated CSM, custom integration, on-prem option |

### 7.2 Add-on Per-tenant
- **Job Boost:** Rp 99k-299k per posting untuk top-of-feed
- **Talent Search seat:** Rp 1.9 jt/seat/bulan
- **AI Screening Add-on:** Rp 990k/bulan untuk auto-shortlist
- **LMS Course Hosting:** Rp 0 (revenue share 30%)
- **Sertifikasi BNSP Brokering:** Rp 500k-2 jt/sertifikasi (commission)

### 7.3 Direct B2C (Job Seeker)
- **Free:** Apply unlimited, basic profile
- **Premium Rp 49k/bulan:** Profile boost, AI CV review, mock interview AI, no-ads
- **Premium Pro Rp 149k/bulan:** Career coaching call, salary benchmark, executive privacy mode

### 7.4 LMS Revenue Share
- Course price ditetapkan instructor; RPI ambil 30% commission.
- Bundle subscription "All-access" Rp 199k/bulan dengan revenue distribution per-completion.

### 7.5 Estimasi Revenue Mix (Y3 target)
- Partner SaaS subscription: 55%
- Job posting add-on (per-tenant): 20%
- LMS revenue share: 12%
- B2C Premium: 8%
- Recruiter / talent search seat: 5%

---

## 8. Roadmap 4 Fase

### Phase 1 — MVP (Bulan 0-3)
- Auth (NextAuth credentials + Google)
- Multi-tenant base: subdomain routing, tenant_id, RLS dasar
- Job board: list, detail, apply
- Profile + CV builder dasar
- Partner dashboard: post jobs, view applicants
- Email notifikasi (Resend)
- Free tier launch, 5-10 partner pilot
- **Tujuan:** Validate product-market fit, 1k DAU

### Phase 2 — v1.0 (Bulan 4-7)
- LMS module: course catalog, video lessons, quiz, sertifikat
- AI CV review (LLM)
- AI job matching (embedding)
- ATS untuk partner: pipeline, scoring, comments
- Job boost (paid)
- Pro tier launch
- Komunitas / forum dasar
- **Tujuan:** 10k DAU, 50 paying partner, MRR Rp 200 jt

### Phase 3 — v1.5 (Bulan 8-12)
- BNSP sertifikasi integration
- Kartu Prakerja partnership
- Talent Search untuk recruiter
- Mobile PWA + push notifikasi
- Programmatic SEO (location/salary/company pages)
- Business tier launch
- API publik (v1)
- BPJS Ketenagakerjaan verification API
- **Tujuan:** 50k DAU, 200 partner, MRR Rp 1 M

### Phase 4 — v2.0 (Bulan 13-24)
- Enterprise tier (SSO, SLA, dedicated)
- Executive search confidential mode
- Marketplace freelance / project-based
- Mentor marketplace
- Native mobile app (React Native / Expo)
- Internationalization beyond ID (MY, PH)
- AI Interview Bot
- Blockchain credential
- **Tujuan:** 200k DAU, 1k partner, MRR Rp 5 M

---

## 9. Risiko & Mitigasi

| Risiko | Likelihood | Impact | Mitigasi |
|---|---|---|---|
| Kompetitor incumbent (Glints, Jobstreet) replikasi LMS+job | High | High | Speed-to-market, partnership pemerintah eksklusif, network effect partner |
| Regulasi data privacy (UU PDP) | Medium | High | DPO sejak hari-1, audit kepatuhan, enkripsi at-rest, RLS, data residency Jakarta |
| Customer acquisition cost (CAC) tinggi B2C | High | Medium | Channel B2B2C via partner — partner bring users |
| Multi-tenant data leak | Low | Critical | RLS strict, automated tenant isolation tests, pentest tahunan |
| Konten LMS kurang quality | Medium | Medium | Kurasi instruktur, partnership BNSP/LSP, peer review |
| Kandidat fraud (fake CV) | High | Medium | KTP/NIK verifikasi, BPJS check, mutual rating |
| Partner churn | Medium | High | Onboarding success team, quarterly business review, value-add features |

---

## 10. Success Metrics (North Star + Driver)

### North Star
**Active Successful Placements per Month** — jumlah job seeker yang mendapat pekerjaan terverifikasi via RPI tiap bulan.

### Driver Metrics
| Kategori | Metric | Target Y1 | Target Y3 |
|---|---|---|---|
| Growth | MAU | 50k | 1 M |
| Growth | DAU | 10k | 200k |
| Engagement | DAU/MAU ratio | 20% | 25% |
| Engagement | Avg session/user/bln | 3 | 8 |
| Conversion | Apply rate (view → apply) | 8% | 15% |
| Conversion | Application → interview rate | 12% | 20% |
| Conversion | Interview → hire rate | 30% | 35% |
| Quality | Time-to-hire (median) | 28 hari | 14 hari |
| Quality | Fill rate (jobs filled %) | 35% | 60% |
| LMS | Course completion rate | 25% | 45% |
| LMS | Cert → job placement % | 15% | 30% |
| Monetisasi | Paying partner count | 50 | 1000 |
| Monetisasi | MRR | Rp 200 jt | Rp 5 M |
| Retention | Partner net retention | 95% | 115% |
| NPS | Job seeker NPS | 30 | 55 |
| NPS | Partner NPS | 35 | 60 |

---

## 11. Go-to-Market Strategy

### 11.1 Channel Acquisition

| Channel | Segmen Target | Biaya | KPI |
|---|---|---|---|
| **Partnership B2B2C** (univ, BLK, dinas, korporasi) | Fresh grad, vocational, alumni | Sales-led, deal-based | Partner signed, MAU per partner |
| **SEO programmatic** | Mass-market jobseeker | Low (konten + dev) | Organic sessions, indexed pages |
| **Konten Instagram/TikTok** | Gen-Z, fresh grad | Medium (creator fees) | Followers, engagement, sign-up |
| **Komunitas / event kampus** | Mahasiswa tingkat akhir | Medium (event ops) | Hadirin, lead capture |
| **Performance marketing** (Meta, Google Ads) | Active jobseeker | High (CAC Rp 30-80k/sign-up) | CAC, LTV ratio |
| **Influencer / KOL** | Profesional muda | Medium-high | Reach, brand recall |
| **Referral / loyalty** | Existing user | Low | Viral coefficient |
| **PR & thought leadership** | B2B decision maker | Medium | Press mentions, demo request |

### 11.2 Phase-wise Channel Mix

- **Phase 1 (MVP):** Partnership pilot (5 partner), SEO foundation, content marketing.
- **Phase 2:** Tambah performance marketing (testing), influencer.
- **Phase 3:** Scale paid + komunitas, sponsor event nasional (Hari Karir, Job Fair Kemnaker).
- **Phase 4:** Brand campaign mainstream, TV/OOH selective.

### 11.3 Partnership Funnel (B2B Sales)

```
Prospect → Discovery call → Demo → Pilot (30 hari free) → Paid conversion
   500           150            80           40                20
```

Target conversion rate end-to-end: ~4% di Phase 2; 8% di Phase 3 setelah case study established.

---

## 12. Pricing Psychology & Anchoring

- **Free tier** sebagai gateway — tanpa Free tier, partner enggan coba (jangan dihilangkan terlalu cepat).
- **Pro tier (Rp 990k)** = price point yang "feels affordable" untuk UMKM/sekolah dengan budget Rp 1 jt/bulan untuk software.
- **Business tier (Rp 3.9 jt)** = di bawah Rp 5 jt psychological barrier untuk decision-maker enterprise middle-management.
- **Enterprise (Custom 15 jt+)** = ruang negosiasi untuk procurement; tampilkan "starting from" tanpa cap.

### 12.1 Discount Strategy
- Annual prepay: -15%
- Komitmen 3 tahun: -25%
- Non-profit / pemerintah daerah: -30% (CSR positioning)
- Pelanggan early adopter (Year 1): -50% lock-in 2 tahun

### 12.2 Upsell Path

```
Free → Pro (CTA: usage limit hit)
Pro → Business (CTA: butuh talent search / LMS / ATS advanced)
Business → Enterprise (CTA: SSO, SLA, dedicated CSM)
```

---

## 13. Kesimpulan & Action Items

1. **Window of opportunity:** 18-24 bulan sebelum kompetitor membangun LMS native serius.
2. **Moat:** partnership pemerintah + multi-tenant SaaS + integrated funnel.
3. **Priority Q1:** MVP launch, 5 pilot partner, validate retention.
4. **Priority Q2:** LMS + AI matching, growth to 10k DAU.
5. **Priority Q3-Q4:** Monetisasi (Pro/Business tier), 50 paying partner.

> Document ini akan di-review setiap kuartal oleh tim Strategy & Product. Update terakhir: Mei 2026.
