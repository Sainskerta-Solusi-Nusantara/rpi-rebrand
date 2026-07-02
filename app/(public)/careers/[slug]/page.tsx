import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  Mail,
  MapPin,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { Badge } from '@/components/atoms/badge'
import {
  CAREER_OPENINGS,
  SHARED_BENEFITS,
  findOpening,
  relatedOpenings,
} from '@/lib/careers-data'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return CAREER_OPENINGS.map((o) => ({ slug: o.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const o = findOpening(params.slug)
  if (!o) return { title: 'Posisi Tidak Ditemukan' }
  return {
    title: `${o.title} — Karier SSN`,
    description: o.summary.slice(0, 160),
  }
}

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatSalary(min: number, max: number): string {
  return `${formatRupiah(min)} – ${formatRupiah(max)}`
}

export default function CareerDetailPage({ params }: { params: Params }) {
  const opening = findOpening(params.slug)
  if (!opening) notFound()

  const related = relatedOpenings(params.slug, 3)

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="career-detail-heading"
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
            href="/careers"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke semua posisi
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {opening.team}
            </span>
          </div>
          <h1
            id="career-detail-heading"
            className="font-heading text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl"
          >
            {opening.title}
          </h1>

          <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
              {opening.location}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
              {opening.type}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
              {opening.level}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="text-[color:var(--ring)] h-4 w-4" aria-hidden />
              {formatSalary(opening.salaryMin, opening.salaryMax)}/bulan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              Diposting {opening.postedAt}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main content */}
            <article className="space-y-12">
              <Block heading="Tentang peran ini">
                <p className="text-foreground/85 text-base leading-relaxed">
                  {opening.summary}
                </p>
              </Block>

              <Block heading="Apa yang akan Anda kerjakan">
                <BulletList items={opening.responsibilities} />
              </Block>

              <Block heading="Yang kami cari">
                <BulletList items={opening.requirements} />
              </Block>

              {opening.niceToHave.length > 0 && (
                <Block heading="Nilai tambah (tidak wajib)">
                  <BulletList items={opening.niceToHave} muted />
                </Block>
              )}

              <Block heading="Yang Anda dapatkan">
                <div className="grid gap-2 sm:grid-cols-2">
                  {SHARED_BENEFITS.map((b) => (
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

              <Block heading="Proses rekrutmen">
                <ol className="space-y-3">
                  {[
                    { step: 'Aplikasi', t: '5 menit' },
                    { step: 'Intro Call dengan recruiter', t: '30 menit' },
                    { step: 'Studi kasus berbayar (Rp 1.5jt)', t: '3–5 hari' },
                    { step: 'Wawancara tim', t: '2 jam' },
                    { step: 'Penawaran', t: '1 minggu' },
                  ].map((s, i) => (
                    <li
                      key={s.step}
                      className="border-border bg-card flex items-center gap-4 rounded-lg border p-4"
                    >
                      <span
                        aria-hidden
                        className="bg-[color:var(--ring)]/10 text-[color:var(--ring)] font-heading grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-foreground text-sm font-semibold">
                          {s.step}
                        </div>
                      </div>
                      <span className="text-muted-foreground text-xs">⏱ {s.t}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-muted-foreground mt-4 text-xs">
                  Total 2–4 minggu sejak aplikasi sampai penawaran. Transparan,
                  tanpa kejutan.
                </p>
              </Block>

              <Block heading="Pernyataan kesetaraan">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  SSN adalah pemberi kerja yang setara. Kami merayakan
                  keberagaman dan berkomitmen menciptakan lingkungan inklusif —
                  tidak peduli gender, identitas, asal, agama, status keluarga,
                  atau disabilitas. Jika Anda butuh akomodasi selama proses
                  rekrutmen, beri tahu recruiter Anda.
                </p>
              </Block>
            </article>

            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="border-border bg-card rounded-2xl border p-6">
                <div className="font-heading text-foreground text-base font-semibold">
                  Lamar posisi ini
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Aplikasi membutuhkan ~5 menit. Kami membalas setiap aplikasi
                  dalam 5 hari kerja.
                </p>

                <Button asChild size="lg" className="mt-5 w-full">
                  <a href={`mailto:careers@pekerja.sainskerta.net?subject=Lamaran: ${encodeURIComponent(opening.title)}`}>
                    <Send className="mr-2 h-4 w-4" aria-hidden />
                    Kirim Lamaran
                  </a>
                </Button>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <a href={`mailto:careers@pekerja.sainskerta.net?subject=Tanya tentang ${encodeURIComponent(opening.title)}`}>
                    <Mail className="mr-2 h-4 w-4" aria-hidden />
                    Tanya recruiter
                  </a>
                </Button>

                <dl className="border-border mt-6 space-y-3 border-t pt-5 text-xs">
                  <SidebarRow icon={Building2} label="Tim" value={opening.team} />
                  <SidebarRow icon={MapPin} label="Lokasi" value={opening.location} />
                  <SidebarRow icon={Briefcase} label="Tipe" value={opening.type} />
                  <SidebarRow icon={BadgeCheck} label="Level" value={opening.level} />
                  <SidebarRow
                    icon={Wallet}
                    label="Gaji /bulan"
                    value={formatSalary(opening.salaryMin, opening.salaryMax)}
                  />
                </dl>

                <div className="text-muted-foreground border-border mt-5 border-t pt-5 text-xs">
                  <p className="font-medium">Bagikan posisi ini</p>
                  <div className="mt-3 flex gap-2">
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
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto w-full max-w-3xl px-6 text-center">
          <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            Siap melangkah ke tahap berikutnya?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-sm">
            Kirim CV dan ceritakan kenapa peran ini cocok untuk Anda. Tidak
            perlu cover letter formal — paragraf singkat sudah cukup.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={`mailto:careers@pekerja.sainskerta.net?subject=Lamaran: ${encodeURIComponent(opening.title)}`}>
                <Send className="mr-2 h-4 w-4" aria-hidden />
                Kirim Lamaran
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/careers">
                Lihat posisi lain
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Related openings */}
      {related.length > 0 && (
        <section className="bg-background py-20 md:py-24" aria-label="Posisi terkait">
          <div className="container mx-auto w-full max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Posisi Terkait
                  </span>
                </div>
                <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                  Mungkin juga cocok untuk Anda
                </h2>
              </div>
              <Link
                href="/careers"
                className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
              >
                Lihat semua
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ul className="grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link
                    href={`/careers/${r.slug}`}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full flex-col gap-3 rounded-2xl border p-5 transition"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" size="sm">
                        {r.level}
                      </Badge>
                      <span className="text-muted-foreground text-xs">{r.team}</span>
                    </div>
                    <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold leading-snug transition">
                      {r.title}
                    </h3>
                    <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {r.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-3 w-3" aria-hidden />
                        {r.type}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
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
            className={muted ? 'text-muted-foreground text-sm leading-relaxed' : 'text-foreground/85 text-sm leading-relaxed'}
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
