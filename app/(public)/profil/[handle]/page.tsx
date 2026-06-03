import Image from 'next/image'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Award,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Share2,
  Sparkles,
  UserRound,
} from 'lucide-react'

import { findPublicProfile } from '@/lib/profile/public-queries'
import { ShareProfileBar } from '@/components/organisms/share-profile-bar'
import { ReportFlagButton } from '@/components/organisms/report-flag-button'
import { getMyPassedAssessmentBadges } from '@/lib/assessments/attempt-actions'
import { AssessmentBadge } from '@/components/organisms/assessment-badge'

type Params = { handle: string }

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const profile = await findPublicProfile(params.handle)
  if (!profile) {
    return {
      title: 'Profil tidak ditemukan',
      robots: { index: false, follow: false },
    }
  }
  const desc =
    profile.headline?.trim() ||
    profile.bio?.slice(0, 160).trim() ||
    `Profil publik ${profile.displayName} di RPI.`
  return {
    title: `${profile.displayName} — Profil RPI`,
    description: desc,
    openGraph: {
      title: `${profile.displayName} — Profil RPI`,
      description: desc,
      type: 'profile',
      images: profile.image ? [{ url: profile.image }] : undefined,
    },
    twitter: {
      card: profile.image ? 'summary_large_image' : 'summary',
      title: `${profile.displayName} — Profil RPI`,
      description: desc,
    },
  }
}

function formatDateRange(start: string, end?: string, current?: boolean): string {
  const tail = current ? 'Sekarang' : end ?? 'Sekarang'
  if (!start) return tail
  return `${start} – ${tail}`
}

function formatIssued(d: Date): string {
  try {
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

export default async function PublicProfilePage({
  params,
}: {
  params: Params
}) {
  const profile = await findPublicProfile(params.handle)
  if (!profile) notFound()

  const initials = profile.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?'

  const hasResume = profile.resume !== null
  const summary = profile.resume?.summary ?? null
  const experiences = profile.resume?.experiences ?? []
  const educations = profile.resume?.educations ?? []
  const skills = profile.resume?.skills ?? []
  const languages = profile.resume?.languages ?? []
  const certificates = profile.certificates
  const assessmentBadges = await getMyPassedAssessmentBadges(profile.id)

  return (
    <div className="bg-background">
      {/* HERO */}
      <section
        aria-label="Profil kandidat"
        className="border-border relative overflow-hidden border-b"
        style={{
          background:
            'linear-gradient(135deg, hsl(220, 50%, 14%) 0%, hsl(220, 50%, 22%) 100%)',
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            background:
              'radial-gradient(700px 350px at 85% -10%, hsl(43, 74%, 55%), transparent 60%), radial-gradient(600px 350px at -10% 110%, hsl(220, 65%, 35%), transparent 60%)',
          }}
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center text-white md:py-20">
          <div className="grid size-28 place-items-center overflow-hidden rounded-full border-4 border-white/20 bg-white/10 shadow-2xl backdrop-blur">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={`Foto ${profile.displayName}`}
                className="h-full w-full object-cover"
                width={112}
                height={112}
                unoptimized
              />
            ) : (
              <span className="font-heading text-4xl font-bold text-white">
                {initials}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold md:text-5xl">
              {profile.displayName}
            </h1>
            {profile.headline && (
              <p className="text-base text-white/85 md:text-lg">
                {profile.headline}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/80">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {profile.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              Profil publik RPI
            </span>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      {(profile.bio || summary) && (
        <section
          aria-label="Tentang"
          className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14"
        >
          <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
            Tentang
          </h2>
          <div className="text-foreground/85 mt-5 space-y-4 text-base leading-relaxed">
            {profile.bio && <p className="whitespace-pre-line">{profile.bio}</p>}
            {summary && <p className="whitespace-pre-line">{summary}</p>}
          </div>
        </section>
      )}

      {/* EXPERIENCES */}
      {experiences.length > 0 && (
        <section
          aria-label="Pengalaman kerja"
          className="border-border border-t bg-muted/30"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
            <div className="mb-8 flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-lg text-white"
                style={{ background: 'hsl(220, 50%, 14%)' }}
                aria-hidden
              >
                <Briefcase className="h-5 w-5" />
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Pengalaman
              </h2>
            </div>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {experiences.map((exp, idx) => (
                <li key={idx} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[31px] top-2 grid size-3 place-items-center rounded-full"
                    style={{ background: 'hsl(43, 74%, 55%)' }}
                  />
                  <article className="border-border bg-card rounded-xl border p-5 shadow-sm">
                    <header className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {exp.title}
                      </h3>
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                      </span>
                    </header>
                    <p className="text-foreground/80 mt-1 text-sm font-medium">
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </p>
                    {exp.description && (
                      <p className="text-foreground/75 mt-3 whitespace-pre-line text-sm leading-relaxed">
                        {exp.description}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* EDUCATION */}
      {educations.length > 0 && (
        <section
          aria-label="Pendidikan"
          className="border-border border-t"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
            <div className="mb-8 flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-lg text-white"
                style={{ background: 'hsl(220, 50%, 14%)' }}
                aria-hidden
              >
                <GraduationCap className="h-5 w-5" />
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Pendidikan
              </h2>
            </div>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {educations.map((edu, idx) => (
                <li key={idx} className="relative">
                  <span
                    aria-hidden
                    className="absolute -left-[31px] top-2 grid size-3 place-items-center rounded-full"
                    style={{ background: 'hsl(43, 74%, 55%)' }}
                  />
                  <article className="border-border bg-card rounded-xl border p-5 shadow-sm">
                    <header className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground">
                        {edu.school}
                      </h3>
                      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </span>
                    </header>
                    {(edu.degree || edu.field) && (
                      <p className="text-foreground/80 mt-1 text-sm font-medium">
                        {[edu.degree, edu.field].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-foreground/75 mt-3 whitespace-pre-line text-sm leading-relaxed">
                        {edu.description}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* SKILLS + LANGUAGES */}
      {(skills.length > 0 || languages.length > 0) && (
        <section
          aria-label="Keahlian dan bahasa"
          className="border-border border-t bg-muted/30"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-12 md:grid-cols-2 md:py-14">
            {skills.length > 0 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-lg text-white"
                    style={{ background: 'hsl(220, 50%, 14%)' }}
                    aria-hidden
                  >
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                    Keahlian
                  </h2>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <li
                      key={`${s}-${i}`}
                      className="border-border bg-card text-foreground/85 inline-flex rounded-full border px-3 py-1.5 text-sm"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span
                    className="grid size-9 place-items-center rounded-lg text-white"
                    style={{ background: 'hsl(220, 50%, 14%)' }}
                    aria-hidden
                  >
                    <LanguagesIcon className="h-5 w-5" />
                  </span>
                  <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                    Bahasa
                  </h2>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {languages.map((l, i) => (
                    <li
                      key={`${l}-${i}`}
                      className="border-border bg-card text-foreground/85 inline-flex rounded-full border px-3 py-1.5 text-sm"
                    >
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CERTIFICATES */}
      {certificates.length > 0 && (
        <section
          aria-label="Sertifikat"
          className="border-border border-t"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
            <div className="mb-8 flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-lg text-white"
                style={{ background: 'hsl(220, 50%, 14%)' }}
                aria-hidden
              >
                <Award className="h-5 w-5" />
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Sertifikat
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {certificates.map((c, i) => (
                <li
                  key={`${c.title}-${i}`}
                  className="border-border bg-card rounded-xl border p-5 shadow-sm"
                >
                  <h3 className="font-heading text-base font-semibold leading-snug text-foreground">
                    {c.title}
                  </h3>
                  {c.courseTitle && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Kursus: {c.courseTitle}
                    </p>
                  )}
                  <dl className="text-muted-foreground mt-3 flex flex-col gap-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" aria-hidden />
                      <span>{c.issuer}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      <span>{formatIssued(c.issuedAt)}</span>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* SERTIFIKASI & ASESMEN — lencana dari standalone assessments */}
      {assessmentBadges.length > 0 && (
        <section
          aria-label="Sertifikasi dan Asesmen"
          className="border-border border-t bg-muted/30"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
            <div className="mb-8 flex items-center gap-3">
              <span
                className="grid size-9 place-items-center rounded-lg text-white"
                style={{ background: 'hsl(220, 50%, 14%)' }}
                aria-hidden
              >
                <Award className="h-5 w-5" />
              </span>
              <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">
                Sertifikasi & Asesmen
              </h2>
            </div>
            <p className="text-muted-foreground -mt-4 mb-6 text-sm">
              Lencana di bawah dikeluarkan oleh RPI setelah kandidat lulus
              asesmen keterampilan resmi.
            </p>
            <ul className="flex flex-wrap gap-2">
              {assessmentBadges.map((b) => (
                <li key={b.assessmentSlug}>
                  <AssessmentBadge
                    title={b.title}
                    category={b.category}
                    score={b.score}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* EMPTY-STATE FALLBACK if no resume + no certs */}
      {!hasResume &&
        certificates.length === 0 &&
        assessmentBadges.length === 0 &&
        !profile.bio && (
        <section className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
          <div className="border-border bg-card rounded-2xl border p-10 text-center">
            <UserRound
              className="text-muted-foreground mx-auto h-10 w-10"
              aria-hidden
            />
            <h3 className="font-heading text-foreground mt-3 text-lg font-semibold">
              Profil masih kosong
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Kandidat belum melengkapi pengalaman, pendidikan, atau sertifikat.
            </p>
          </div>
        </section>
      )}

      {/* SHARE FOOTER */}
      <section
        aria-label="Bagikan profil"
        className="border-border border-t bg-muted/30"
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-12 md:py-14">
          <div className="border-border bg-card rounded-2xl border p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Share2
                    className="h-5 w-5 text-foreground/70"
                    aria-hidden
                  />
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    Bagikan profil
                  </h2>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Salin tautan atau kirim ke perekrut lewat email.
                </p>
              </div>
              <Link
                href="/mitra"
                className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 hover:underline"
              >
                Jelajahi mitra RPI &rarr;
              </Link>
            </div>
            <div className="mt-5">
              <ShareProfileBar
                url={profile.shareUrl}
                displayName={profile.displayName}
              />
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <ReportFlagButton resourceType="profile" resourceId={profile.id} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
