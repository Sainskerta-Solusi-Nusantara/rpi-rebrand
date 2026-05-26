import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Briefcase, Compass } from 'lucide-react'

import { Button } from '@/components/atoms/button'
import { CAREER_OPENINGS } from '@/lib/careers-data'
import {
  CAREER_TEAM_META,
  findCareerTeam,
} from '@/lib/careers-teams-meta'

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return CAREER_TEAM_META.map((t) => ({ slug: t.slug }))
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const team = findCareerTeam(params.slug)
  if (!team) return { title: 'Tim Tidak Ditemukan' }
  return {
    title: `${team.name} — Karier di RPI`,
    description: team.tagline,
  }
}

export default function TeamPage({ params }: { params: Params }) {
  const team = findCareerTeam(params.slug)
  if (!team) notFound()

  const openings = CAREER_OPENINGS.filter((o) => o.team === team.name)
  const otherTeams = CAREER_TEAM_META.filter((t) => t.slug !== team.slug)

  return (
    <>
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden bg-background"
        aria-labelledby="team-heading"
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
              'radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklab, var(--ring) 16%, transparent), transparent 65%)',
          }}
        />

        <div className="container mx-auto w-full max-w-5xl px-6 pt-12 md:pt-16">
          <Link
            href="/careers#openings"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali ke semua tim
          </Link>
        </div>

        <div className="container mx-auto w-full max-w-5xl px-6 pb-12 pt-8 md:pb-16 md:pt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-px w-8 bg-[color:var(--ring)]"
                />
                <span className="text-[color:var(--ring)] text-xs font-medium uppercase tracking-[0.2em]">
                  Tim Karier
                </span>
              </div>
              <h1
                id="team-heading"
                className="font-heading text-balance text-3xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
              >
                {team.name}
              </h1>
              <p className="text-foreground mt-5 text-balance text-lg font-semibold leading-relaxed md:text-xl">
                {team.tagline}
              </p>
              <p className="text-muted-foreground mt-3 text-balance text-base leading-relaxed">
                {team.description}
              </p>
              <div className="text-muted-foreground mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase
                    className="text-[color:var(--ring)] h-4 w-4"
                    aria-hidden
                  />
                  <strong className="text-foreground font-medium">
                    {openings.length}
                  </strong>{' '}
                  lowongan terbuka di tim ini
                </span>
              </div>
            </div>

            {/* Big emoji visual */}
            <div
              aria-hidden
              className="hidden h-40 w-40 shrink-0 place-items-center rounded-3xl text-6xl shadow-xl lg:grid"
              style={{
                background:
                  'linear-gradient(135deg, var(--ring) 0%, color-mix(in oklab, var(--ring) 65%, black) 100%)',
              }}
            >
              <span className="grid place-items-center">{team.emoji}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Openings list */}
      <section className="bg-background pb-16 md:pb-20">
        <div className="container mx-auto w-full max-w-5xl px-6">
          {openings.length === 0 ? (
            <div className="border-border bg-card rounded-2xl border p-12 text-center">
              <Briefcase
                className="text-muted-foreground mx-auto h-8 w-8"
                aria-hidden
              />
              <h2 className="font-heading text-foreground mt-4 text-lg font-semibold">
                Belum ada lowongan terbuka di tim ini
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Cek kembali nanti — atau jelajahi tim lain di bawah.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/careers#openings">Lihat semua lowongan</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {openings.map((o) => (
                <li key={o.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/careers/${o.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] group block rounded-2xl border p-5 transition"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                          {o.title}
                        </h3>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {o.location} · {o.type} · {o.level}
                        </p>
                      </div>
                      <span className="text-foreground/80 shrink-0 text-sm font-medium">
                        Rp {(o.salaryMin / 1_000_000).toFixed(0)} jt – Rp{' '}
                        {(o.salaryMax / 1_000_000).toFixed(0)} jt
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Other teams */}
      <section className="bg-muted/30 py-20 md:py-24" aria-label="Tim lain">
        <div className="container mx-auto w-full max-w-6xl px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-[color:var(--ring)]" />
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  <Compass className="inline h-3.5 w-3.5" aria-hidden /> Jelajahi
                </span>
              </div>
              <h2 className="font-heading text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
                Tim lainnya di RPI
              </h2>
            </div>
            <Link
              href="/careers#openings"
              className="text-foreground/80 hover:text-[color:var(--ring)] inline-flex items-center gap-1 text-sm font-medium transition"
            >
              Semua lowongan
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ul className="flex flex-wrap gap-2">
            {otherTeams.map((t) => (
              <li key={t.slug}>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={`/careers/team/${t.slug}` as any}
                  className="border-border bg-card hover:border-[color:var(--ring)] hover:text-[color:var(--ring)] text-foreground/80 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition"
                >
                  <span aria-hidden>{t.emoji}</span>
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherTeams.map((t) => {
              const count = CAREER_OPENINGS.filter((o) => o.team === t.name).length
              return (
                <li key={t.slug}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    href={`/careers/team/${t.slug}` as any}
                    className="border-border bg-card hover:border-[color:var(--ring)] group flex h-full items-start gap-4 rounded-2xl border p-5 transition"
                  >
                    <span
                      aria-hidden
                      className="grid size-12 shrink-0 place-items-center rounded-xl bg-[color:var(--ring)]/10 text-[color:var(--ring)] text-xl"
                    >
                      {t.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-foreground group-hover:text-[color:var(--ring)] text-base font-semibold transition">
                        {t.name}
                      </h3>
                      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-relaxed">
                        {t.description}
                      </p>
                      <div className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                        <Briefcase className="h-3 w-3" aria-hidden />
                        {count} lowongan
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>
    </>
  )
}
