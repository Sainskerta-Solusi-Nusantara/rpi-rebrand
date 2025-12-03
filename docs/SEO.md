# SEO — Rumah Pekerja Indonesia (RPI)

> Strategi SEO teknis dan konten untuk platform multi-tenant job board + LMS, target domain authority kompetitif dengan Jobstreet/Indeed/Glints.

**Versi:** 1.0 — Mei 2026
**Pemilik dokumen:** Growth & Engineering
**KPI:** Organic traffic (sessions), indexed pages, avg position, CTR, Core Web Vitals.

---

## 1. Filosofi SEO RPI

1. **Server-first rendering** dengan React Server Components — semua konten primer hadir di HTML awal.
2. **Programmatic SEO** — generate halaman terstruktur (kota × kategori × salary) yang bersaing di long-tail.
3. **Tenant-aware** — apex domain (`rumahpekerja.id`) untuk authority utama; subdomain partner di-`noindex` opt-out.
4. **Performance is SEO** — Core Web Vitals masuk ranking factor.
5. **Structured data first-class** — JobPosting, Course, Organization, FAQ — agar muncul di Google Jobs & Rich Results.
6. **Tidak hack** — white-hat only, no doorway pages, no cloaking.

---

## 2. Technical Foundation

### 2.1 Rendering Strategy (Next.js App Router)

| Page | Strategy | Revalidate |
|---|---|---|
| `/` (landing) | Static (RSC build-time) | 1 jam (ISR) |
| `/jobs` (list) | ISR | 5 menit |
| `/jobs/[slug]` (detail) | ISR + on-demand revalidate | 1 jam, revalidate on update |
| `/companies/[slug]` | ISR | 1 jam |
| `/learn` | ISR | 30 menit |
| `/learn/[course-slug]` | ISR | 1 jam |
| `/locations/[city]` (programmatic) | ISR | 6 jam |
| `/salary/[role]-[city]` | ISR | 12 jam |
| `/dashboard/*` | Dynamic SSR, `noindex` | n/a |

Server actions & route handlers ditandai `dynamic = 'force-dynamic'` only when needed.

### 2.2 sitemap.xml

Generate dinamis via `app/sitemap.ts`, split jika >50k URL ke sub-sitemaps:

```ts
// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await prisma.job.findMany({
    where: { status: 'published', tenant: { isPublic: true } },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: 'https://rumahpekerja.id', changeFrequency: 'daily', priority: 1 },
    { url: 'https://rumahpekerja.id/jobs', changeFrequency: 'hourly', priority: 0.9 },
    { url: 'https://rumahpekerja.id/learn', changeFrequency: 'daily', priority: 0.9 },
    ...jobs.map(j => ({
      url: `https://rumahpekerja.id/jobs/${j.slug}`,
      lastModified: j.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ];
}
```

Untuk volume >50k, split:
- `/sitemap.xml` (index) → `/sitemaps/jobs-1.xml`, `/sitemaps/jobs-2.xml`, `/sitemaps/courses.xml`, `/sitemaps/companies.xml`, `/sitemaps/locations.xml`.

### 2.3 robots.txt

```
# app/robots.ts
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/
Disallow: /partner/
Disallow: /*?utm_*
Disallow: /*?ref=*

Sitemap: https://rumahpekerja.id/sitemap.xml
```

Per tenant subdomain (`telkom.rumahpekerja.id`): defaultnya `noindex` kecuali partner aktif opt-in di settings → `isPublic = true`.

### 2.4 Canonical URLs

- Setiap halaman wajib `<link rel="canonical">`.
- Untuk job detail yang muncul di apex + subdomain partner: canonical menuju apex.
- Filter/sort query params: canonical menuju URL bersih tanpa query.

```ts
// app/jobs/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    alternates: { canonical: `https://rumahpekerja.id/jobs/${params.slug}` },
  };
}
```

### 2.5 hreflang

- Default `id-ID`.
- Phase 4: `en-ID` untuk konten profesional internasional.

```html
<link rel="alternate" hreflang="id-ID" href="https://rumahpekerja.id/jobs/abc" />
<link rel="alternate" hreflang="en-ID" href="https://rumahpekerja.id/en/jobs/abc" />
<link rel="alternate" hreflang="x-default" href="https://rumahpekerja.id/jobs/abc" />
```

### 2.6 URL Structure

| Pola | Contoh | Catatan |
|---|---|---|
| `/jobs/[slug]` | `/jobs/backend-engineer-tokopedia-jakarta-abc123` | slug = `{role}-{company}-{city}-{shortid}` |
| `/companies/[slug]` | `/companies/tokopedia` | |
| `/learn/[course-slug]` | `/learn/data-analytics-fundamentals` | |
| `/locations/[city]` | `/locations/jakarta-pusat` | programmatic |
| `/lowongan-[role]-di-[city]` | `/lowongan-perawat-di-surabaya` | programmatic, Indonesia-vernacular |
| `/gaji-[role]-[city]` | `/gaji-software-engineer-jakarta` | programmatic salary page |

Slug rules:
- Lowercase, alphanumeric + dash
- Max 60 char (SEO)
- Stable forever (jika title berubah, redirect 301 dari slug lama)

---

## 3. Structured Data (JSON-LD)

Wajib di setiap page tipe.

### 3.1 JobPosting (Google Jobs)

```tsx
// components/seo/JobPostingJsonLd.tsx
import { Job } from '@prisma/client';

export function JobPostingJsonLd({ job }: { job: Job & { company: Company } }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString(),
    validThrough: job.expiresAt?.toISOString(),
    employmentType: job.workType, // FULL_TIME | PART_TIME | CONTRACTOR | INTERN
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      sameAs: job.company.website,
      logo: job.company.logoUrl,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        streetAddress: job.address ?? undefined,
        addressLocality: job.city,
        addressRegion: job.province,
        postalCode: job.postalCode ?? undefined,
        addressCountry: 'ID',
      },
    },
    baseSalary: job.salaryMin && job.salaryMax ? {
      '@type': 'MonetaryAmount',
      currency: 'IDR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: 'MONTH',
      },
    } : undefined,
    directApply: true,
    identifier: {
      '@type': 'PropertyValue',
      name: 'RPI',
      value: job.id,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

Pastikan:
- `validThrough` ada — Google indexed lebih agresif.
- `description` HTML (boleh paragraf, list).
- `directApply: true` ketika apply 1-click via RPI.
- Remove dari index ketika `status != 'published'` → `noindex` + remove sitemap.

### 3.2 Course (Google Learn / Bing)

```tsx
const data = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: course.title,
  description: course.summary,
  provider: {
    '@type': 'Organization',
    name: 'Rumah Pekerja Indonesia',
    sameAs: 'https://rumahpekerja.id',
  },
  educationalCredentialAwarded: course.certificateType, // 'Certificate' | 'BNSP'
  hasCourseInstance: course.instances.map(ci => ({
    '@type': 'CourseInstance',
    courseMode: ci.mode, // 'online' | 'blended'
    instructor: { '@type': 'Person', name: ci.instructorName },
    startDate: ci.startDate,
    endDate: ci.endDate,
  })),
  offers: {
    '@type': 'Offer',
    price: course.priceIdr,
    priceCurrency: 'IDR',
    availability: 'https://schema.org/InStock',
  },
};
```

### 3.3 Organization (di layout root)

```ts
{
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Rumah Pekerja Indonesia',
  alternateName: 'RPI',
  url: 'https://rumahpekerja.id',
  logo: 'https://rumahpekerja.id/logo.png',
  sameAs: [
    'https://www.linkedin.com/company/rumah-pekerja-indonesia',
    'https://www.instagram.com/rumahpekerja.id',
    'https://twitter.com/rumahpekerja',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+62-21-1234-5678',
    contactType: 'customer service',
    areaServed: 'ID',
    availableLanguage: ['Indonesian', 'English'],
  },
}
```

### 3.4 BreadcrumbList

```ts
{
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rumahpekerja.id' },
    { '@type': 'ListItem', position: 2, name: 'Lowongan', item: 'https://rumahpekerja.id/jobs' },
    { '@type': 'ListItem', position: 3, name: job.title },
  ],
}
```

### 3.5 FAQ

Untuk halaman programmatic (e.g. `/gaji-software-engineer-jakarta`), tambahkan FAQ JSON-LD untuk featured snippet:

```ts
{
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Berapa gaji software engineer di Jakarta?',
      acceptedAnswer: { '@type': 'Answer', text: 'Rata-rata Rp 8-25 juta tergantung level.' },
    },
    // ...
  ],
}
```

---

## 4. Core Web Vitals Budget

| Metric | Target | Hard Limit |
|---|---|---|
| **LCP** (Largest Contentful Paint) | <2.0s | 2.5s |
| **INP** (Interaction to Next Paint) | <150ms | 200ms |
| **CLS** (Cumulative Layout Shift) | <0.05 | 0.1 |
| **FCP** | <1.5s | 1.8s |
| **TTFB** | <500ms | 800ms |
| **JS bundle (initial)** | <100KB gzip | 150KB |

### Optimisasi
- **Image:** `next/image` wajib, AVIF/WebP, `priority` di LCP image, `loading="lazy"` untuk below-the-fold.
- **Font:** Playfair + Inter via `next/font` dengan `display: swap`, preload kritis.
- **Code splitting:** dynamic import komponen heavy (rich text editor, video player).
- **Cache:** ISR untuk semua halaman SEO-targeted.
- **Streaming:** RSC streaming via `Suspense` boundary.
- **Hindari JS hydration besar:** prioritaskan RSC, gunakan client component minimal.
- **Defer 3rd-party:** Sentry, PostHog load deferred (`next/script strategy="lazyOnload"`).

### Monitor
- Web Vitals API → PostHog event
- Vercel Analytics RUM
- Google Search Console Core Web Vitals report
- Lighthouse CI di setiap PR (target score ≥90)

---

## 5. Meta Tags Strategy

### 5.1 Template per Page Type

```ts
// app/jobs/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const job = await getJob(params.slug);
  if (!job) return { title: 'Lowongan Tidak Ditemukan' };

  const title = `${job.title} di ${job.company.name} - ${job.city} | RPI`;
  const desc = `${job.title} di ${job.company.name}. ${job.workType}, ${job.city}. Apply sekarang via Rumah Pekerja Indonesia.`;

  return {
    title,
    description: desc.slice(0, 160),
    keywords: [job.title, job.company.name, `lowongan ${job.city}`, 'karir', 'kerja'],
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `https://rumahpekerja.id/jobs/${job.slug}`,
      images: [{ url: job.ogImageUrl ?? `/api/og/job?id=${job.id}`, width: 1200, height: 630 }],
      locale: 'id_ID',
      siteName: 'Rumah Pekerja Indonesia',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      creator: '@rumahpekerja',
    },
    alternates: { canonical: `https://rumahpekerja.id/jobs/${job.slug}` },
    robots: job.status === 'published'
      ? { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } }
      : { index: false, follow: false },
  };
}
```

### 5.2 Dynamic OG Image

Generate via `@vercel/og`:

```ts
// app/api/og/job/route.ts
import { ImageResponse } from 'next/og';
export const runtime = 'edge';

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  const job = await fetchJobLite(id);
  return new ImageResponse(
    (
      <div style={{ /* layout dgn brand color */ }}>
        <h1>{job.title}</h1>
        <p>{job.company} · {job.city}</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### 5.3 Title Patterns

| Page | Pattern |
|---|---|
| Job detail | `{Title} di {Company} - {City} \| RPI` |
| Job list | `Lowongan Kerja {Category} di {City} - RPI` |
| Course | `{Course Name} - Kursus {Category} \| RPI` |
| Company | `Lowongan & Karir di {Company} \| RPI` |
| Location | `Lowongan Kerja di {City} - {Count} Posisi Terbaru \| RPI` |
| Salary | `Gaji {Role} di {City} - Rentang & Statistik 2026 \| RPI` |

Max 60 char display, sisanya boleh terpotong.

---

## 6. Tenant-Aware SEO

### 6.1 Aturan Dasar
- **Apex domain `rumahpekerja.id`** mengindex semua konten publik (jobs, courses, profiles aktif).
- **Subdomain tenant** (`telkom.rumahpekerja.id`) default `noindex, nofollow` kecuali partner setting `isPublic = true`.
- Jika partner public: konten **wajib unique** atau canonical menuju apex untuk hindari duplicate content.

### 6.2 Multi-tenant Sitemap
- Apex sitemap include semua public jobs & courses dari semua tenant.
- Subdomain public tenant punya sitemap sendiri yang men-canonical ke apex.

### 6.3 Robots Logic
```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  const host = headers().get('host') ?? '';
  const isApex = host === 'rumahpekerja.id' || host === 'www.rumahpekerja.id';

  if (isApex) {
    return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api', '/dashboard'] }], sitemap: '...' };
  }
  // Subdomain
  const tenant = await resolveTenant(host);
  if (!tenant?.isPublic) {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return { rules: [{ userAgent: '*', allow: '/' }], sitemap: `https://${host}/sitemap.xml` };
}
```

---

## 7. Programmatic SEO

Generate halaman terstruktur dari data, target long-tail keywords.

### 7.1 Location Pages
URL: `/locations/{city-slug}`
Konten:
- Heading: "Lowongan Kerja di {City}"
- Jumlah open positions
- Top categories di kota tsb
- Top companies hiring
- Avg salary by role
- Featured jobs (latest 20)
- FAQ JSON-LD
- Breadcrumb
- Internal link ke kategori (top 10) & companies (top 10)

Target keyword: "lowongan kerja {city}", "kerja di {city}"

### 7.2 Salary Pages
URL: `/gaji-{role}-{city}`
Konten:
- Range gaji (min, median, max, p25, p75)
- Distribusi berdasarkan level (junior, mid, senior)
- Skill yang paling berkorelasi dengan gaji tinggi
- Open jobs untuk role tsb di kota
- Related courses
- FAQ

Target keyword: "gaji {role} {city}", "berapa gaji {role}"

### 7.3 Company Pages
URL: `/companies/{slug}`
Konten:
- Profil perusahaan (about, industri, ukuran, alamat)
- Open positions
- Karyawan testimoni (jika aktif)
- Gaji benchmarks
- Internal link ke role-role serupa

### 7.4 Category Pages
URL: `/kategori/{slug}` (e.g. `/kategori/it-software`)
Konten:
- Definisi karir kategori
- Sub-roles
- Avg salary
- Top hiring companies
- Related courses

### 7.5 Volume Targets
- Phase 2: 1k programmatic pages live
- Phase 3: 10k pages live
- Phase 4: 50k pages live

**Kualitas guard:** halaman programmatic harus punya minimal 300 kata unique content + data segar (refresh weekly). Hindari thin content yang bisa dianggap doorway.

---

## 8. Internal Linking & Breadcrumbs

### 8.1 Breadcrumb Component
Setiap page memiliki breadcrumb visual + JSON-LD:
```
Home > Lowongan > IT & Software > Backend Engineer Tokopedia Jakarta
```

### 8.2 Internal Linking Strategy
- Job detail → 5 related jobs (same role/city/company)
- Job detail → company page
- Job detail → relevant courses ("upskill untuk role ini")
- Course detail → relevant jobs ("apply ke role yang butuh skill ini")
- Location page → top categories di kota
- Footer: link ke top 20 kota & top 20 kategori

### 8.3 Anchor Text
- Variasi & natural — hindari over-optimization
- Gunakan bahasa Indonesia kontekstual: "lihat lowongan di Surabaya", bukan exact-match "lowongan kerja Surabaya" repetitif

---

## 9. Performance Instrumentation

### 9.1 Web Vitals Reporter

```ts
// app/web-vitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';
import { posthog } from '@/lib/analytics';

export function WebVitals() {
  useReportWebVitals((metric) => {
    posthog.capture('web_vital', {
      name: metric.name, // CLS | LCP | INP | FCP | TTFB
      value: metric.value,
      rating: metric.rating,
      path: window.location.pathname,
    });
  });
  return null;
}
```

### 9.2 Lighthouse CI
- `lighthouserc.json` di repo
- Run di setiap PR via GitHub Actions, fail jika perf <85 atau SEO <95
- Track regression via Lighthouse CI Server (self-host atau Treo)

### 9.3 Search Console
- Submit sitemap weekly via API
- Monitor: indexed pages, coverage errors, query CTR, position avg
- Alert jika indexed pages drop >10% week-over-week

---

## 10. Content & E-E-A-T

Google E-E-A-T (Experience, Expertise, Authoritativeness, Trust):

- **Author byline** di semua artikel blog & course landing — link ke author profile dengan kredensial.
- **Editorial guideline** publik di `/about/editorial`.
- **Sumber data:** cite BPS, Kemnaker, BNSP untuk angka statistik.
- **Trust signals:** logo partner, ISO 27001 (target Phase 4), testimoni dengan foto + nama lengkap.
- **HTTPS wajib**, HSTS, dnssec.
- **About / Contact / Privacy / Terms** mudah diakses.

---

## 11. Mobile SEO

- Mobile-first indexing — semua konten desktop tersedia di mobile.
- Tap targets ≥48px (Tailwind `min-h-12`).
- Viewport meta wajib: `width=device-width, initial-scale=1`.
- AMP **tidak** digunakan (deprecated by Google, RSC sudah cepat).
- PWA + manifest.json untuk install prompt (Phase 2).

---

## 12. International (Phase 4)

- `/en/*` untuk konten English Indonesia, hreflang setup.
- Hindari machine translation buruk — translate manual untuk top 500 pages, programmatic untuk sisanya dengan disclaimer.

---

## 13. Beyond Standard Recommendations

### 13.1 Indeed-style Job Aggregator Integration
- Submit sitemap khusus ke Google for Jobs feed (gabungan apex + tenant public)
- Google Indexing API untuk push update <1 menit untuk job baru
- Bing IndexNow protocol untuk push ke Bing/Yandex

### 13.2 LLM Optimization (LLMO / GEO)
- Konten well-structured (H1-H3 hierarchy, tabel, list) sehingga ChatGPT/Perplexity citation lebih akurat
- File `/llms.txt` ringkasan untuk crawler LLM
- Schema markup lengkap → meningkatkan kemungkinan dijadikan reference

### 13.3 First-party Data SEO
- User-generated review perusahaan (moderated) → unique content tinggi-volume
- Salary submission anonymous dari user (verified via employment proof) → unique data
- Career story long-form dari user successful placement → editorial content

### 13.4 Job Expiration Strategy
- Job expired → set `noindex`, hapus dari sitemap
- Page tetap accessible via direct link tapi tampil "Posisi ini sudah ditutup", suggest similar jobs (canonical tidak diubah agar backlink tetap menjurus ke RPI)
- Redirect 301 hanya jika job di-repost dengan slug baru

### 13.5 Voice Search
- FAQ schema agresif → triggered di voice answer
- Conversational queries di salary page ("berapa gaji ... di ...")

### 13.6 Brand SERP
- Wikidata entry untuk Rumah Pekerja Indonesia (Phase 2)
- Knowledge panel claim via Google Business Profile

---

## 14. SEO Audit Checklist (Per Release)

- [ ] Lighthouse SEO score ≥95 di top 10 page
- [ ] Core Web Vitals di hijau (75th percentile)
- [ ] No console error di production HTML
- [ ] Sitemap up-to-date (URLs published <24h muncul)
- [ ] robots.txt valid (Google Search Console tester)
- [ ] Structured data tanpa error (Rich Results Test)
- [ ] No `noindex` accidental di public page (automated test)
- [ ] Internal link broken <0.1% (Screaming Frog scan monthly)
- [ ] OG image render ok (Twitter validator, Facebook debugger)
- [ ] Canonical correct di setiap page type
- [ ] Mobile usability passes (no horizontal scroll, no small text)

---

## 15. KPI & Reporting

| KPI | Baseline | 6 bulan | 12 bulan |
|---|---|---|---|
| Organic sessions / bulan | 0 | 50k | 500k |
| Indexed pages | 0 | 10k | 100k |
| Avg position top-10 keyword | n/a | 25 | 8 |
| Top 100 ranking keywords | 0 | 50 | 500 |
| Domain Rating (Ahrefs) | n/a | 25 | 50 |
| Backlinks (referring domains) | n/a | 200 | 2000 |
| Job posting Rich Result CTR | n/a | 4% | 7% |
| Core Web Vitals "Good" % | n/a | 80% | 95% |

Reporting cadence:
- Weekly: Search Console + PostHog dashboard
- Monthly: Full audit + Ahrefs/Semrush competitor comparison
- Quarterly: Strategi review + content roadmap update

---

Dokumen ini hidup dan akan di-update tiap rilis besar.
