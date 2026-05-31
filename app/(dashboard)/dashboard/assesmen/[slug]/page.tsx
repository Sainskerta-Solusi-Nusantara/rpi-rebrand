import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, ChevronLeft, Clock, ListChecks, Trophy } from 'lucide-react'

import { requireAuth } from '@/lib/auth/session'
import {
  getActiveAttempt,
  getAssessmentBySlug,
  getAttemptHistory,
  getBestPassedAttempt,
} from '@/lib/assessments/queries'
import { StartAssessmentButton } from '@/components/organisms/start-assessment-button'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Teknis',
  soft: 'Soft skill',
  language: 'Bahasa',
  cognitive: 'Kognitif',
}

function formatDateTime(d: Date | null): string {
  if (!d) return '-'
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return d.toISOString().slice(0, 10)
  }
}

export default async function AssessmentIntroPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/assesmen/${params.slug}`)
  const userId = session.user.id

  const assessment = await getAssessmentBySlug(params.slug)
  if (!assessment) notFound()

  const [activeAttempt, bestPassed, history] = await Promise.all([
    getActiveAttempt(userId, assessment.id),
    getBestPassedAttempt(userId, assessment.id),
    getAttemptHistory(userId, assessment.id, 10),
  ])

  const isPublished = assessment.status === 'PUBLISHED'
  const canStart = isPublished && assessment.questionCount > 0

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={'/dashboard/assesmen' as any}
        className="text-muted-foreground inline-flex items-center gap-1 text-xs hover:underline"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Kembali ke daftar asesmen
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-[10px] font-medium uppercase">
            {CATEGORY_LABELS[assessment.category] ?? assessment.category}
          </span>
          {!isPublished && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
              Status: {assessment.status}
            </span>
          )}
        </div>
        <h1 className="font-heading text-2xl md:text-3xl">{assessment.title}</h1>
        <p className="text-foreground/80 text-sm leading-relaxed">
          {assessment.description}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border-border bg-card rounded-lg border p-3">
          <dt className="text-muted-foreground inline-flex items-center gap-1 text-[11px] uppercase">
            <Clock className="h-3 w-3" aria-hidden="true" /> Durasi
          </dt>
          <dd className="font-heading mt-1 text-lg font-semibold">
            {assessment.durationMin} mnt
          </dd>
        </div>
        <div className="border-border bg-card rounded-lg border p-3">
          <dt className="text-muted-foreground inline-flex items-center gap-1 text-[11px] uppercase">
            <ListChecks className="h-3 w-3" aria-hidden="true" /> Pertanyaan
          </dt>
          <dd className="font-heading mt-1 text-lg font-semibold">
            {assessment.questionCount}
          </dd>
        </div>
        <div className="border-border bg-card rounded-lg border p-3">
          <dt className="text-muted-foreground inline-flex items-center gap-1 text-[11px] uppercase">
            <Trophy className="h-3 w-3" aria-hidden="true" /> Skor lulus
          </dt>
          <dd className="font-heading mt-1 text-lg font-semibold">
            {assessment.passingScore}
          </dd>
        </div>
        <div className="border-border bg-card rounded-lg border p-3">
          <dt className="text-muted-foreground text-[11px] uppercase">
            Percobaan saya
          </dt>
          <dd className="font-heading mt-1 text-lg font-semibold">
            {history.length}
          </dd>
        </div>
      </dl>

      {/* Active in-flight attempt → "Lanjutkan" */}
      {activeAttempt && (
        <section className="rounded-lg border border-sky-300 bg-sky-50 p-4">
          <p className="text-sky-900 text-sm font-semibold">
            Anda memiliki percobaan yang belum selesai.
          </p>
          <p className="text-sky-900/80 mt-1 text-xs">
            Dimulai pada {formatDateTime(activeAttempt.startedAt)}.
          </p>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={
              `/dashboard/assesmen/${assessment.slug}/attempt/${activeAttempt.id}` as any
            }
            className="bg-primary text-primary-foreground mt-3 inline-flex items-center rounded-md px-3 py-2 text-xs font-semibold"
          >
            Lanjutkan percobaan
          </Link>
        </section>
      )}

      {/* Passed already → certificate-like card */}
      {bestPassed && (
        <section className="rounded-lg border border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-start gap-3">
            <BadgeCheck
              className="mt-0.5 h-6 w-6 text-emerald-700"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="font-heading text-emerald-900 text-base font-semibold">
                Anda telah lulus asesmen ini
              </p>
              <p className="text-emerald-900/80 mt-1 text-sm">
                Skor terbaik: <strong>{bestPassed.score}/100</strong> · diselesaikan{' '}
                {formatDateTime(bestPassed.completedAt)}.
              </p>
              <p className="text-emerald-900/70 mt-1 text-xs">
                Lencana muncul di profil publik Anda (jika dipublikasikan).
              </p>
            </div>
          </div>
        </section>
      )}

      {/* START button */}
      {!activeAttempt && canStart && (
        <section className="border-border bg-card rounded-lg border p-5">
          <p className="text-foreground text-sm">
            {bestPassed
              ? 'Anda dapat mencoba ulang untuk meningkatkan skor terbaik Anda.'
              : 'Siap mengerjakan? Tekan tombol di bawah untuk memulai percobaan baru. Anda hanya dapat mengumpulkan jawaban sekali per percobaan.'}
          </p>
          <div className="mt-3">
            <StartAssessmentButton
              assessmentId={assessment.id}
              slug={assessment.slug}
              label={bestPassed ? 'Coba lagi' : 'Mulai'}
            />
          </div>
        </section>
      )}

      {!isPublished && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
          Asesmen ini belum dipublikasikan. Anda dapat melihat detailnya, namun
          percobaan baru tidak dapat dimulai.
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="border-border bg-card rounded-lg border p-4">
          <h2 className="font-heading text-base font-semibold">
            Riwayat percobaan
          </h2>
          <ul className="text-muted-foreground mt-3 divide-y text-sm">
            {history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span>
                  {formatDateTime(h.completedAt ?? h.startedAt)}
                  {!h.completedAt && (
                    <span className="ml-2 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-900">
                      Belum selesai
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {h.completedAt ? (
                    <>
                      {h.score}/100 ·{' '}
                      <span
                        className={
                          h.passed ? 'text-emerald-700' : 'text-rose-700'
                        }
                      >
                        {h.passed ? 'Lulus' : 'Tidak lulus'}
                      </span>
                    </>
                  ) : (
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={
                        `/dashboard/assesmen/${assessment.slug}/attempt/${h.id}` as any
                      }
                      className="text-primary text-xs underline"
                    >
                      Lanjutkan
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
