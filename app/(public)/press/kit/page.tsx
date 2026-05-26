import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Download, Mail, Phone, Quote } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Press Kit — RPI',
  description:
    'Press kit resmi Rumah Pekerja Indonesia: boilerplate, logo, statistik kunci, dan profil leadership untuk jurnalis dan mitra media.',
}

// ---------------------------------------------------------------------------
// Static content
// ---------------------------------------------------------------------------

const FACTS: ReadonlyArray<readonly [string, string]> = [
  ['2,4 juta+', 'Pekerja terdaftar'],
  ['12.000+', 'Mitra perekrut terverifikasi'],
  ['34 provinsi', 'Cakupan geografis'],
  ['USD 85 juta', 'Total pendanaan Seri C'],
  ['2021', 'Tahun didirikan'],
  ['200+', 'Karyawan tetap'],
  ['60.000+', 'Pelajar di RPI Academy'],
  ['5 kota', 'Ekspansi 2026'],
]

const BOILERPLATES: ReadonlyArray<{ label: string; meta: string; body: string }> = [
  {
    label: 'Boilerplate Pendek',
    meta: '~50 kata',
    body:
      'Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan untuk perekrutan dan pelatihan di Indonesia. Sejak 2021, RPI melayani 2,4 juta+ pekerja dan 12.000+ mitra perekrut di seluruh 34 provinsi, dengan dukungan dari East Ventures, Sequoia SEA, MDI, dan BRI Ventures.',
  },
  {
    label: 'Boilerplate Sedang',
    meta: '~120 kata',
    body:
      'Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan untuk perekrutan dan pelatihan di Indonesia. Sejak 2021, RPI menghubungkan 2,4 juta+ pekerja dengan 12.000+ mitra perekrut terverifikasi di seluruh 34 provinsi. Lewat sistem AI-powered matching, RPI memangkas waktu rekrutmen rata-rata dari 38 hari menjadi 11 hari. Program RPI Academy telah meluluskan 60.000+ pelajar dengan kurikulum vokasi yang diakui industri. Arsitektur multi-tenant kami memungkinkan mitra perekrut besar untuk meluncurkan portal white-label sendiri di atas infrastruktur RPI. Pada Q1 2026, RPI menutup pendanaan Seri C senilai USD 85 juta yang dipimpin Sequoia SEA, mempercepat ekspansi ke 5 kota tier-2 dan investasi produk berikutnya.',
  },
  {
    label: 'Boilerplate Panjang',
    meta: '~250 kata',
    body:
      'Rumah Pekerja Indonesia (RPI) adalah platform multi-tenant terdepan yang menghubungkan pekerja Indonesia dengan kesempatan kerja dan pelatihan yang adil. RPI didirikan pada 2021 oleh Naufal Hakim (ex-Gojek), Putri Anggraini (ex-Tokopedia), dan Dimas Wijaya (ex-Bukalapak, ex-Stripe) atas keprihatinan bahwa pasar kerja Indonesia masih bergantung pada jaringan personal yang lambat, tidak transparan, dan tidak terjangkau bagi pekerja di luar Jabodetabek. Misi RPI adalah membangun infrastruktur kerja digital yang adil dan transparan untuk semua provinsi. Saat ini, RPI melayani lebih dari 2,4 juta pekerja terdaftar dan 12.000+ mitra perekrut terverifikasi di 34 provinsi, dengan tiga lini produk utama: marketplace lowongan kerja (Jobs), program pelatihan vokasi bersertifikat (RPI Academy / Courses), dan dashboard rekrutmen white-label untuk mitra (Mitra). Platform RPI ditenagai oleh sistem AI matching domestik yang dilatih dengan data pasar kerja Indonesia, dan arsitektur multi-tenant yang memungkinkan korporasi besar serta dinas tenaga kerja untuk meluncurkan portal sendiri. RPI didukung oleh East Ventures, Sequoia SEA, MDI Ventures, dan BRI Ventures, dengan total pendanaan USD 142 juta sejak berdiri — termasuk Seri C senilai USD 85 juta pada Q1 2026. Kemitraan strategis mencakup Kementerian Ketenagakerjaan, Kadin, Telkom Group, dan 40+ universitas. Yang membedakan RPI: fokus Indonesia-first (bukan lokalisasi), arsitektur multi-tenant siap-skala, dan komitmen terbuka terhadap riset publik tentang pasar kerja domestik.',
  },
]

const PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['Navy', '#0A2540'],
  ['Indigo', '#635BFF'],
  ['Sky', '#0EA5E9'],
  ['Emerald', '#10B981'],
  ['Amber', '#F59E0B'],
]

const LEADERS: ReadonlyArray<{ name: string; initial: string; role: string; color: string; bio: string }> = [
  {
    name: 'Naufal Hakim',
    initial: 'N',
    role: 'Founder & CEO',
    color: '#0A2540',
    bio: 'Mantan engineer di Gojek dan Stripe. Mendirikan RPI pada 2021 dengan misi membangun infrastruktur kerja yang adil untuk Indonesia. Memimpin strategi produk dan visi jangka panjang perusahaan.',
  },
  {
    name: 'Putri Anggraini',
    initial: 'P',
    role: 'Co-Founder & COO',
    color: '#635BFF',
    bio: 'Eks-Operations Lead di Tokopedia. Membangun mesin pertumbuhan mitra RPI dari nol hingga 12.000+ perekrut terverifikasi. Bertanggung jawab atas operasi nasional dan kemitraan strategis.',
  },
  {
    name: 'Dimas Wijaya',
    initial: 'D',
    role: 'Co-Founder & CTO',
    color: '#10B981',
    bio: 'Sebelumnya Staff Engineer di Bukalapak. Mengarsiteki infrastruktur multi-tenant RPI yang melayani jutaan pengguna. Memimpin tim engineering yang tersebar di Jakarta, Bandung, dan Yogyakarta.',
  },
  {
    name: 'Maya Pratiwi',
    initial: 'M',
    role: 'VP Communications',
    color: '#EC4899',
    bio: 'Mantan tim komunikasi Traveloka. Memimpin hubungan media, narasi publik, dan riset terbuka RPI. Kontak resmi untuk seluruh permintaan press dan wawancara.',
  },
]

const LOGO_VARIANTS: ReadonlyArray<{ label: string; bg: string; fg: string; text: string }> = [
  { label: 'Logo Penuh (Light Background)', bg: '#ffffff', fg: '#0A2540', text: 'RPI' },
  { label: 'Logo Penuh (Dark Background)', bg: '#0A2540', fg: '#ffffff', text: 'RPI' },
  { label: 'Logo Mark (Tanpa Teks)', bg: '#635BFF', fg: '#ffffff', text: 'R' },
  { label: 'Logo Mark Mono', bg: '#ffffff', fg: '#0A0A0A', text: 'R' },
]

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Kicker({ children, centered }: { children: ReactNode; centered?: boolean }) {
  return (
    <div className={`mb-4 flex items-center gap-3${centered ? ' justify-center' : ''}`}>
      <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
      <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
        {children}
      </span>
      {centered && <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PressKitPage() {
  return (
    <>
      {/* ----------------------------- HERO ----------------------------- */}
      <section
        className="bg-background relative isolate overflow-hidden"
        aria-labelledby="kit-hero-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 14%, transparent), transparent 65%)',
          }}
        />
        <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
          <a
            href="/press"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition"
          >
            &larr; Kembali ke press
          </a>

          <div className="mt-8">
            <Kicker centered>Media Kit</Kicker>
          </div>

          <h1
            id="kit-hero-heading"
            className="font-heading mx-auto mt-6 max-w-3xl text-balance text-center text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
          >
            Kit Media untuk{' '}
            <span className="text-[color:var(--ring)]">Jurnalis</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-balance text-center text-lg md:text-xl">
            Semua yang Anda butuhkan untuk meliput Rumah Pekerja Indonesia —
            dari logo, boilerplate, hingga statistik resmi dan profil
            leadership.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:press@rumahpekerja.id?subject=Permintaan Boilerplate ZIP"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-medium shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download Boilerplate ZIP
            </a>
            <a
              href="mailto:press@rumahpekerja.id?subject=Hubungi Tim Press"
              className="border-input bg-background hover:bg-muted hover:text-foreground inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-6 text-base font-medium transition-colors"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Hubungi Tim Press
            </a>
          </div>
        </div>
      </section>

      {/* --------------------------- FACT SHEET --------------------------- */}
      <section
        className="bg-muted/30 py-16 md:py-20"
        aria-labelledby="kit-facts-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10">
            <Kicker>Fact Sheet</Kicker>
            <h2
              id="kit-facts-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Fakta Singkat
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
              Statistik resmi per Mei 2026. Semua angka dapat dikutip dengan
              atribusi &ldquo;Rumah Pekerja Indonesia&rdquo;.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map(([v, l]) => (
              <div key={l} className="border-border bg-card rounded-2xl border p-5">
                <dt className="font-heading text-3xl font-semibold">{v}</dt>
                <dd className="text-muted-foreground mt-1 text-sm">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------- BOILERPLATE --------------------------- */}
      <section
        className="bg-background py-16 md:py-20"
        aria-labelledby="kit-boilerplate-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10">
            <Kicker>Boilerplate</Kicker>
            <h2
              id="kit-boilerplate-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Boilerplate Resmi
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
              Tiga versi siap-pakai. Gunakan sesuai konteks artikel — pendek
              untuk box samping, panjang untuk profil perusahaan.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-3">
            {BOILERPLATES.map((bp) => (
              <article
                key={bp.label}
                className="border-border bg-card flex flex-col rounded-2xl border p-6"
              >
                <header className="border-border mb-4 flex items-start gap-3 border-b pb-4">
                  <Quote
                    className="text-[color:var(--ring)] mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {bp.label}
                    </h3>
                    <p className="text-muted-foreground mt-0.5 text-xs uppercase tracking-wider">
                      {bp.meta}
                    </p>
                  </div>
                </header>
                <p className="text-foreground/85 flex-1 text-sm leading-relaxed">
                  {bp.body}
                </p>
                <div className="mt-5 flex items-center justify-end">
                  <button
                    type="button"
                    className="border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition"
                    aria-label={`Salin ${bp.label}`}
                  >
                    Copy
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------- LOGOS & BRAND ----------------------- */}
      <section
        className="bg-muted/30 py-16 md:py-20"
        aria-labelledby="kit-brand-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10">
            <Kicker>Identitas Visual</Kicker>
            <h2
              id="kit-brand-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Logo &amp; Identitas
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
              Gunakan aset resmi tanpa modifikasi warna atau proporsi. Untuk
              format khusus, hubungi tim brand.
            </p>
          </div>

          {/* Logo grid */}
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LOGO_VARIANTS.map((v) => (
              <div
                key={v.label}
                className="border-border bg-card rounded-2xl border p-4"
              >
                <div
                  className="font-heading grid h-32 w-full place-items-center rounded-xl text-4xl font-semibold tracking-tight"
                  style={{
                    background: v.bg,
                    color: v.fg,
                    border:
                      v.bg === '#ffffff'
                        ? '1px solid color-mix(in oklab, var(--border) 80%, transparent)'
                        : 'none',
                  }}
                >
                  {v.text}
                </div>
                <h3 className="font-heading text-foreground mt-4 text-sm font-semibold">
                  {v.label}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  Download SVG &middot; PNG &middot; PDF
                </p>
              </div>
            ))}
          </div>

          {/* Palette */}
          <div className="mb-10">
            <h3 className="font-heading text-foreground text-lg font-semibold">
              Palet Warna
            </h3>
            <p className="text-muted-foreground mt-1 mb-5 text-sm">
              Lima warna utama brand RPI.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {PALETTE.map(([name, hex]) => (
                <div key={hex} className="border-border bg-card overflow-hidden rounded-xl border">
                  <div aria-hidden className="h-20 w-full" style={{ background: hex }} />
                  <div className="p-3">
                    <div className="font-heading text-foreground text-sm font-semibold">{name}</div>
                    <div className="text-muted-foreground mt-0.5 font-mono text-xs">{hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography sample */}
          <div className="border-border bg-card rounded-2xl border p-6">
            <h3 className="font-heading text-foreground text-lg font-semibold">
              Tipografi
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Heading font: Geist Sans Display. Body font: Inter.
            </p>
            <p className="font-heading text-foreground mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Cerita kerja Indonesia, ditulis bersama.
            </p>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">
              Body text — Rumah Pekerja Indonesia membangun infrastruktur kerja
              digital yang adil dan transparan untuk semua provinsi.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------- LEADERSHIP --------------------------- */}
      <section
        className="bg-background py-16 md:py-20"
        aria-labelledby="kit-leadership-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mb-10">
            <Kicker>Leadership</Kicker>
            <h2
              id="kit-leadership-heading"
              className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
            >
              Profil Kepemimpinan
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm">
              Bio resmi untuk dikutip. Untuk permintaan wawancara, hubungi tim
              komunikasi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LEADERS.map((l) => (
              <article
                key={l.name}
                className="border-border bg-card flex h-full flex-col rounded-2xl border p-6"
              >
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden
                    className="font-heading grid size-14 shrink-0 place-items-center rounded-full text-xl font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${l.color} 0%, color-mix(in oklab, ${l.color} 70%, black) 100%)`,
                    }}
                  >
                    {l.initial}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-heading text-foreground text-base font-semibold">
                      {l.name}
                    </h3>
                    <p className="text-[color:var(--ring)] mt-0.5 text-xs font-medium uppercase tracking-wider">
                      {l.role}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {l.bio}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- PRESS CONTACT --------------------------- */}
      <section
        className="bg-muted/30 py-16 md:py-20"
        aria-labelledby="kit-contact-heading"
      >
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="border-border bg-card relative overflow-hidden rounded-3xl border p-8 md:p-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-60"
              style={{
                background:
                  'radial-gradient(closest-side, color-mix(in oklab, var(--ring) 18%, transparent), transparent)',
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <Kicker>Press Contact</Kicker>
                <h2
                  id="kit-contact-heading"
                  className="font-heading text-3xl font-semibold tracking-tight md:text-4xl"
                >
                  Maya Pratiwi
                </h2>
                <p className="text-[color:var(--ring)] mt-1 text-sm font-medium uppercase tracking-wider">
                  VP Communications, RPI
                </p>
                <ul className="text-muted-foreground mt-6 space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Mail
                      className="text-[color:var(--ring)] h-4 w-4 shrink-0"
                      aria-hidden
                    />
                    <a
                      href="mailto:press@rumahpekerja.id"
                      className="text-foreground font-medium hover:underline"
                    >
                      press@rumahpekerja.id
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone
                      className="text-[color:var(--ring)] h-4 w-4 shrink-0"
                      aria-hidden
                    />
                    <a
                      href="tel:+622150001020"
                      className="text-foreground font-medium hover:underline"
                    >
                      +62 21 5000 1020
                    </a>
                  </li>
                  <li className="text-muted-foreground/90 text-xs">
                    Available 09.00&ndash;18.00 WIB, Mon-Fri
                  </li>
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href="mailto:press@rumahpekerja.id?subject=Permintaan Press"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-base font-medium shadow-sm transition-colors"
                >
                  <Mail className="h-4 w-4" aria-hidden />
                  Email Tim Press
                </a>
                <a
                  href="tel:+622150001020"
                  className="border-input bg-background hover:bg-muted hover:text-foreground inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-6 text-base font-medium transition-colors"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Telepon Langsung
                </a>
              </div>
            </div>
          </div>

          {/* Footer back link */}
          <div className="mt-10 text-center">
            <a
              href="/press"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition"
            >
              &larr; Kembali ke press
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
