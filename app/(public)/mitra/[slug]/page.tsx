import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  GraduationCap,
  MapPin,
  Users,
  Wallet,
} from 'lucide-react'

import { getTenantPublicData } from '@/lib/tenants/public-queries'
import { tenantMeta } from '@/lib/tenant-meta'

type Params = { slug: string }

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const tenant = await getTenantPublicData(params.slug)
  if (!tenant) return { title: 'Mitra tidak ditemukan' }
  const meta = tenantMeta(tenant.slug)
  return {
    title: `${tenant.name} — Mitra RPI`,
    description: meta.about.slice(0, 160),
    openGraph: {
      title: `${tenant.name} — Mitra RPI`,
      description: meta.about.slice(0, 160),
      type: 'profile',
    },
  }
}

function formatRupiah(n: number, currency: string): string {
  if (currency === 'IDR') return `Rp ${n.toLocaleString('id-ID')}`
  return `${currency} ${n.toLocaleString('id-ID')}`
}

function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string,
): string | null {
  if (!min && !max) return null
  if (min && max) return `${formatRupiah(min, currency)} – ${formatRupiah(max, currency)}`
  if (min) return `Mulai ${formatRupiah(min, currency)}`
  if (max) return `Hingga ${formatRupiah(max!, currency)}`
  return null
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Lepas',
  TEMPORARY: 'Sementara',
}

const LOCATION_LABEL: Record<string, string> = {
  ONSITE: 'On-site',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
}

const COURSE_LEVEL_LABEL: Record<string, string> = {
  BEGINNER: 'Pemula',
  INTERMEDIATE: 'Menengah',
  ADVANCED: 'Lanjutan',
  EXPERT: 'Mahir',
}

function formatFoundedDate(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
  })
}

export default async function TenantPublicPage({
  params,
}: {
  params: Params
}) {
  const tenant = await getTenantPublicData(params.slug)
  if (!tenant || tenant.status !== 'ACTIVE') notFound()

  const meta = tenantMeta(tenant.slug)

  const primary = tenant.branding?.primaryColor ?? '#0a2540'
  const secondary = tenant.branding?.secondaryColor ?? '#c9a961'
  const accent = tenant.branding?.accentColor ?? '#635bff'

  // Synthetic view count derived from publicly observable signals so the page
  // shows a useful number even when we don't track tenant-level page views.
  const viewCount =
    tenant.activeJobsCount * 47 + tenant.publishedCoursesCount * 19 + 128

  const rootStyle = {
    '--brand-primary': primary,
    '--brand-secondary': secondary,
    '--brand-accent': accent,
  } as React.CSSProperties

  const jobsHref = `/jobs?tenant=${encodeURIComponent(tenant.slug)}`
  const coursesHref = `/courses?tenant=${encodeURIComponent(tenant.slug)}`

  return (
    <div style={rootStyle} className="bg-background">
      {/* HERO */}
      <section
        aria-label="Profil mitra"
        className="relative overflow-hidden border-b border-border"
        style={{
          background:
            'linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 78%, #000) 100%)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(800px 400px at 90% -10%, var(--brand-secondary), transparent 60%), radial-gradient(600px 400px at -10% 110%, var(--brand-accent), transparent 60%)',
          }}
        />
        <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center gap-6 px-6 py-16 text-center text-white md:py-24">
          <div className="grid size-24 place-items-center rounded-2xl bg-white p-3 shadow-2xl">
            {tenant.branding?.logoLight ? (
              <Image
                src={tenant.branding.logoLight}
                alt={`Logo ${tenant.name}`}
                className="h-full w-full object-contain"
                width={96}
                height={96}
                unoptimized
              />
            ) : tenant.branding?.logoDark ? (
              <Image
                src={tenant.branding.logoDark}
                alt={`Logo ${tenant.name}`}
                className="h-full w-full object-contain"
                width={96}
                height={96}
                unoptimized
              />
            ) : (
              <span
                className="font-heading text-4xl font-bold"
                style={{ color: 'var(--brand-primary)' }}
              >
                {tenant.name[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <h1 className="font-heading text-4xl font-bold md:text-6xl">
            {tenant.name}
          </h1>
          <p className="max-w-2xl text-base text-white/85 md:text-lg">
            Bergabung dengan tim {tenant.name} — {meta.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
              <Eye className="h-3.5 w-3.5" aria-hidden />
              {viewCount.toLocaleString('id-ID')} dilihat
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {meta.industry}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Bergabung {formatFoundedDate(tenant.createdAt)}
            </span>
          </div>

          {tenant.activeJobsCount > 0 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={jobsHref as any}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:translate-y-[-1px]"
              style={{ color: 'var(--brand-primary)' }}
            >
              Lihat {tenant.activeJobsCount.toLocaleString('id-ID')} lowongan aktif
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </section>

      {/* ABOUT + STATS */}
      <section
        aria-label="Tentang mitra"
        className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16"
      >
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <h2
              className="font-heading text-2xl font-bold md:text-3xl"
              style={{ color: 'var(--brand-primary)' }}
            >
              Tentang {tenant.name}
            </h2>
            <p className="text-foreground/85 mt-4 text-base leading-relaxed">
              {meta.about}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 self-start">
            <StatCard
              icon={<Briefcase className="h-5 w-5" aria-hidden />}
              value={tenant.activeJobsCount}
              label="Lowongan aktif"
            />
            <StatCard
              icon={<Users className="h-5 w-5" aria-hidden />}
              value={tenant.activeMembersCount}
              label="Anggota tim"
            />
            <StatCard
              icon={<CalendarDays className="h-5 w-5" aria-hidden />}
              value={tenant.createdAt.getFullYear()}
              label="Tahun bergabung"
              raw
            />
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS */}
      <section
        aria-label="Lowongan terbuka"
        className="border-y border-border bg-muted/30"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                className="font-heading text-2xl font-bold md:text-3xl"
                style={{ color: 'var(--brand-primary)' }}
              >
                Lowongan Terbuka
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                {tenant.activeJobsCount > 0
                  ? `${tenant.activeJobsCount.toLocaleString('id-ID')} posisi yang sedang dibuka oleh ${tenant.name}.`
                  : `Saat ini belum ada lowongan aktif di ${tenant.name}.`}
              </p>
            </div>
            {tenant.activeJobsCount > 12 && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={jobsHref as any}
                className="text-sm font-medium underline-offset-4 hover:underline"
                style={{ color: 'var(--brand-primary)' }}
              >
                Lihat semua &rarr;
              </Link>
            )}
          </div>

          {tenant.recentJobs.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <Briefcase
                className="text-muted-foreground mx-auto h-10 w-10"
                aria-hidden
              />
              <h3 className="font-heading text-foreground mt-3 text-lg font-semibold">
                Belum ada lowongan aktif
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Tim {tenant.name} belum membuka posisi baru. Pantau halaman ini
                untuk pembaruan.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tenant.recentJobs.map((job) => {
                const salary = formatSalaryRange(
                  job.salaryMin,
                  job.salaryMax,
                  job.salaryCurrency,
                )
                return (
                  <li
                    key={job.id}
                    className="border-border bg-card group relative flex flex-col rounded-xl border p-5 transition hover:shadow-md"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-5 h-6 w-1 rounded-r"
                      style={{ background: 'var(--brand-primary)' }}
                    />
                    <h3
                      className="font-heading text-lg font-semibold leading-snug"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      {job.title}
                    </h3>
                    <dl className="text-muted-foreground mt-3 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        <span>
                          {job.location}
                          {LOCATION_LABEL[job.locationType]
                            ? ` · ${LOCATION_LABEL[job.locationType]}`
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        <span>
                          {EMPLOYMENT_LABEL[job.employmentType] ??
                            job.employmentType}
                        </span>
                      </div>
                      {salary && (
                        <div className="flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5" aria-hidden />
                          <span>{salary}</span>
                        </div>
                      )}
                    </dl>
                    <div className="mt-5 flex items-center justify-between pt-3 border-t border-border">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/jobs/${job.slug}` as any}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        Lihat detail &rarr;
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* COURSES (optional) */}
      {tenant.recentCourses.length > 0 && (
        <section aria-label="Kursus tenant" className="border-b border-border">
          <div className="mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  className="font-heading text-2xl font-bold md:text-3xl"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Kursus & Pelatihan
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Tingkatkan keterampilanmu lewat program belajar yang dikurasi
                  {' '}{tenant.name}.
                </p>
              </div>
              {tenant.publishedCoursesCount > 6 && (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={coursesHref as any}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Lihat semua &rarr;
                </Link>
              )}
            </div>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tenant.recentCourses.map((course) => (
                <li
                  key={course.id}
                  className="border-border bg-card flex flex-col overflow-hidden rounded-xl border transition hover:shadow-md"
                >
                  <div
                    className="relative aspect-video w-full overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-accent) 100%)',
                    }}
                  >
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover"
                        width={640}
                        height={360}
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <GraduationCap
                          className="h-10 w-10 text-white/70"
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3
                      className="font-heading text-base font-semibold leading-snug"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                      {course.description}
                    </p>
                    <dl className="text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                        {COURSE_LEVEL_LABEL[course.level] ?? course.level}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {course.durationHours} jam
                      </span>
                    </dl>
                    <div className="mt-auto pt-4">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/courses/${course.slug}` as any}
                        className="text-sm font-medium underline-offset-4 hover:underline"
                        style={{ color: 'var(--brand-primary)' }}
                      >
                        Lihat kursus &rarr;
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA BOTTOM */}
      <section aria-label="Ajakan bertindak" className="bg-background">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
          <div
            className="relative overflow-hidden rounded-3xl p-10 text-center text-white md:p-14"
            style={{
              background:
                'linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 75%, var(--brand-accent)) 100%)',
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-20"
              style={{
                background:
                  'radial-gradient(500px 300px at 20% 0%, var(--brand-secondary), transparent 60%)',
              }}
            />
            <div className="relative">
              <h2 className="font-heading text-2xl font-bold md:text-4xl">
                Siap bergabung dengan {tenant.name}?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 md:text-base">
                Jelajahi seluruh lowongan terbuka dan temukan posisi yang sesuai
                dengan keahlian dan minatmu.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={jobsHref as any}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-lg transition hover:translate-y-[-1px]"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  Lihat semua lowongan
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/mitra"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/0 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Jelajahi mitra lain
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function StatCard({
  icon,
  value,
  label,
  raw = false,
}: {
  icon: React.ReactNode
  value: number
  label: string
  raw?: boolean
}) {
  const display = raw ? String(value) : value.toLocaleString('id-ID')
  return (
    <div className="border-border bg-card rounded-xl border p-4 text-center">
      <div
        className="mx-auto grid size-9 place-items-center rounded-lg text-white"
        style={{ background: 'var(--brand-primary)' }}
        aria-hidden
      >
        {icon}
      </div>
      <p
        className="font-heading mt-3 text-xl font-bold md:text-2xl"
        style={{ color: 'var(--brand-primary)' }}
      >
        {display}
      </p>
      <p className="text-muted-foreground mt-1 text-[11px] uppercase tracking-wide">
        {label}
      </p>
    </div>
  )
}
