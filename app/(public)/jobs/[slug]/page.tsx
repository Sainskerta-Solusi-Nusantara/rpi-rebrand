import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Briefcase,
  Building2,
  Clock,
  Eye,
  MapPin,
  Send,
  Share2,
  Sparkles,
  Tag,
  Users,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import {
  DUMMY_JOBS,
  EMPLOYMENT_TYPE_LABEL,
  LOCATION_TYPE_LABEL,
  type DummyJob,
  findJob,
  relatedJobs,
} from '@/lib/jobs-data'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return DUMMY_JOBS.map((j) => ({ slug: j.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const j = findJob(params.slug)
  if (!j) return { title: 'Lowongan Tidak Ditemukan' }
  return {
    title: `${j.title} — ${j.company}`,
    description: j.description.slice(0, 160),
    openGraph: {
      title: `${j.title} — ${j.company}`,
      description: j.description.slice(0, 160),
      type: 'article',
    },
  }
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatSalary(min: number, max: number): string {
  return `${formatRupiah(min)} – ${formatRupiah(max)}`
}

function companyColor(company: string): string {
  const palette = [
    '#0A2540', '#635BFF', '#10B981', '#F59E0B',
    '#EC4899', '#0EA5E9', '#8B5CF6', '#EF4444',
    '#003D7A', '#E60000',
  ]
  let h = 0
  for (let i = 0; i < company.length; i++) h = (h << 5) - h + company.charCodeAt(i)
  return palette[Math.abs(h) % palette.length]
}

export default function JobDetailPage({ params }: { params: Params }) {
  const job = findJob(params.slug)
  if (!job) notFound()

  const related = relatedJobs(params.slug, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: new Date(Date.now() - job.postedDaysAgo * 86_400_000).toISOString(),
    employmentType: job.employmentType.replace('-', '_').toUpperCase(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location,
        addressCountry: 'ID',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'IDR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: 'MONTH',
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="job-detail-heading"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, color-mix(in oklab, var(--border) 70%, transparent) 1px, transparent 1px)',
            backgroundSize: '100% 96px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 14%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/jobs"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke semua lowongan
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="flex items-start gap-5">
            <span
              aria-hidden
              className="font-heading grid size-16 shrink-0 place-items-center rounded-2xl text-2xl font-semibold text-white shadow-sm md:size-20 md:text-3xl"
              style={{
                background: `linear-gradient(135deg, ${companyColor(job.company)} 0%, color-mix(in oklab, ${companyColor(job.company)} 70%, black) 100%)`,
              }}
            >
              {job.company[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {job.category}
                </span>
              </div>
              <h1
                id="job-detail-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.1] tracking-tight md:text-4xl lg:text-5xl"
              >
                {job.title}
              </h1>
              <div className="text-foreground/85 mt-2 text-base font-medium">
                {job.company}{' '}
                <span className="text-muted-foreground text-sm font-normal">
                  · {job.companyTagline}
                </span>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <MetaItem icon={MapPin} text={`${job.location} · ${LOCATION_TYPE_LABEL[job.locationType]}`} />
            <MetaItem icon={Briefcase} text={EMPLOYMENT_TYPE_LABEL[job.employmentType]} />
            <MetaItem icon={BadgeCheck} text={job.experienceLevel} />
            <MetaItem icon={Wallet} text={`${formatSalary(job.salaryMin, job.salaryMax)}/bulan`} />
            <MetaItem icon={Clock} text={`Diposting ${job.postedAt}`} />
            <MetaItem icon={Users} text={`${job.applicants} pelamar`} muted />
            <MetaItem icon={Eye} text={`${job.views.toLocaleString('id-ID')} dilihat`} muted />
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main */}
            <article className="space-y-12">
              <Block heading={`Tentang ${job.company}`}>
                <p className="text-foreground/85 text-base leading-relaxed">
                  {job.companyAbout}
                </p>
              </Block>

              <Block heading="Deskripsi pekerjaan">
                <p className="text-foreground/85 text-base leading-relaxed">
                  {job.description}
                </p>
              </Block>

              <Block heading="Tanggung jawab">
                <BulletList items={job.responsibilities} />
              </Block>

              <Block heading="Kualifikasi">
                <BulletList items={job.requirements} />
              </Block>

              {job.niceToHave.length > 0 && (
                <Block heading="Nilai tambah (tidak wajib)">
                  <BulletList items={job.niceToHave} muted />
                </Block>
              )}

              <Block heading="Tunjangan & benefit">
                <div className="grid gap-2 sm:grid-cols-2">
                  {job.benefits.map((b) => (
                    <div
                      key={b}
                      className="border-border bg-card flex items-start gap-2 rounded-lg border p-3 text-sm"
                    >
                      <Sparkles
                        className="text-[color:var(--ring)] mt-0.5 h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="text-foreground/85">{b}</span>
                    </div>
                  ))}
                </div>
              </Block>

              {job.tags.length > 0 && (
                <Block heading="Skill & keyword">
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="border-border bg-muted/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                      >
                        <Tag className="text-[color:var(--ring)] h-3 w-3" aria-hidden />
                        {t}
                      </span>
                    ))}
                  </div>
                </Block>
              )}

              <Block heading="Cara melamar">
                <p className="text-foreground/85 text-sm leading-relaxed">
                  Klik tombol <strong>Lamar Sekarang</strong> dan unggah CV terbaru
                  Anda. Aplikasi membutuhkan ~5 menit. Tim rekrutmen{' '}
                  {job.company} akan menghubungi Anda kembali dalam 5-7 hari
                  kerja jika profil Anda cocok.
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  Lowongan ini dipublikasikan di Rumah Pekerja Indonesia.
                  Pastikan profil Anda lengkap untuk meningkatkan peluang dilirik.
                </p>
              </Block>
            </article>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="font-heading text-foreground text-base font-semibold">
                  Lamar lowongan ini
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Aplikasi membutuhkan ~5 menit. Profil lengkap akan dilirik
                  lebih cepat.
                </p>

                <Button asChild size="lg" className="mt-5 w-full">
                  <a href="/login?next=/apply">
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                    Lamar Sekarang
                  </a>
                </Button>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <a href="/login?next=/save-job">
                    <Bookmark className="mr-2 h-4 w-4" aria-hidden />
                    Simpan Lowongan
                  </a>
                </Button>

                <dl className="border-border mt-6 space-y-3 border-t pt-5 text-xs">
                  <SidebarRow icon={Building2} label="Perusahaan" value={job.company} />
                  <SidebarRow icon={Briefcase} label="Industri" value={job.industry} />
                  <SidebarRow icon={MapPin} label="Lokasi" value={job.location} />
                  <SidebarRow
                    icon={Tag}
                    label="Tipe"
                    value={EMPLOYMENT_TYPE_LABEL[job.employmentType]}
                  />
                  <SidebarRow icon={BadgeCheck} label="Level" value={job.experienceLevel} />
                  <SidebarRow
                    icon={Wallet}
                    label="Gaji /bulan"
                    value={formatSalary(job.salaryMin, job.salaryMax)}
                  />
                </dl>

                <div className="text-muted-foreground border-border mt-5 border-t pt-5 text-xs">
                  <p className="inline-flex items-center gap-1.5 font-medium">
                    <Share2 className="h-3.5 w-3.5" aria-hidden /> Bagikan
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['LinkedIn', 'Twitter', 'WhatsApp', 'Salin link'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="border-border text-foreground/70 hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] rounded-md border px-2.5 py-1 text-[10px] font-medium transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-border mt-5 border-t pt-5">
                  <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                    Aktivitas
                  </div>
                  <div className="text-foreground/85 mt-2 text-xs">
                    {job.applicants} pelamar · {job.views.toLocaleString('id-ID')} dilihat
                  </div>
                  <div className="bg-muted relative mt-3 h-1 overflow-hidden rounded-full">
                    <div
                      className="bg-[color:var(--ring)] absolute inset-y-0 left-0"
                      style={{
                        width: `${Math.min(100, (job.applicants / 200) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-2 text-[10px]">
                    {job.applicants < 20
                      ? 'Kompetisi rendah — lamar segera'
                      : job.applicants < 80
                        ? 'Kompetisi sedang'
                        : 'Kompetisi tinggi — pastikan CV menonjol'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Tertarik dengan posisi ini?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm">
            Klik lamar dan biarkan {job.company} melihat profil Anda. Tidak
            perlu cover letter formal — profil RPI Anda sudah cukup.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="/login?next=/apply">
                <Send className="mr-2 h-4 w-4" aria-hidden />
                Lamar Sekarang
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/jobs">
                Lihat lowongan lain
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related jobs */}
      {related.length > 0 && (
        <section className="bg-background py-20 md:py-24" aria-label="Lowongan terkait">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Lowongan Terkait
                  </span>
                </div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Mungkin juga cocok untuk Anda
                </h2>
              </div>
              <Link
                href="/jobs"
                className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
              >
                Lihat semua
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <RelatedCard job={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}

function MetaItem({
  icon: Icon,
  text,
  muted,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
  muted?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon
        className={
          muted ? 'h-4 w-4' : 'text-[color:var(--ring)] h-4 w-4'
        }
        aria-hidden
      />
      {text}
    </span>
  )
}

function Block({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-foreground text-xl font-semibold tracking-tight md:text-2xl">
        {heading}
      </h2>
      <div>{children}</div>
    </section>
  )
}

function BulletList({ items, muted }: { items: string[]; muted?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3">
          <span
            aria-hidden
            className={
              muted
                ? 'border-border text-muted-foreground mt-1.5 size-1.5 shrink-0 rounded-full border-2'
                : 'bg-[color:var(--ring)] mt-2 size-1.5 shrink-0 rounded-full'
            }
          />
          <span
            className={
              muted
                ? 'text-muted-foreground text-sm leading-relaxed'
                : 'text-foreground/85 text-sm leading-relaxed'
            }
          >
            {it}
          </span>
        </li>
      ))}
    </ul>
  )
}

function SidebarRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-[color:var(--ring)] mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
          {label}
        </dt>
        <dd className="text-foreground text-xs font-medium">{value}</dd>
      </div>
    </div>
  )
}

function RelatedCard({ job }: { job: DummyJob }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col gap-3 rounded-2xl border p-5 transition"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${companyColor(job.company)} 0%, color-mix(in oklab, ${companyColor(job.company)} 70%, black) 100%)`,
          }}
        >
          {job.company[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground text-xs">{job.company}</div>
          <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] line-clamp-2 text-sm font-semibold leading-snug transition">
            {job.title}
          </h3>
        </div>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" aria-hidden />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <BadgeCheck className="h-3 w-3" aria-hidden />
          {job.experienceLevel}
        </span>
      </div>
      <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs">
        <span className="text-foreground font-medium">
          {formatRupiah(job.salaryMin)} –{' '}
          {formatRupiah(job.salaryMax).replace('Rp ', '')}
        </span>
        <Badge variant="secondary" size="sm">
          {EMPLOYMENT_TYPE_LABEL[job.employmentType]}
        </Badge>
      </div>
    </Link>
  )
}
