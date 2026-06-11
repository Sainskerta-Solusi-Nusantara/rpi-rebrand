'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Loader2, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent } from '@/components/atoms/card'
import { Tag } from '@/components/atoms/tag'
import { formatRupiah } from '@/lib/utils'
import { explainMyRecommendations } from '@/lib/recommendations/actions'
import { SaveJobButton } from './save-button'

type Breakdown = {
  skill: number
  headline: number
  location: number
  recency: number
  experience: number
}

export type RecommendationView = {
  id: string
  title: string
  slug: string
  location: string
  locationType: string
  employmentType: string
  experienceLevel: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  tags: string[]
  tenantName: string
  score: number
  breakdown: Breakdown
  matchedSkills: string[]
  totalUserSkills: number
  isSaved: boolean
}

const employmentLabel: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Freelance',
}

const locationTypeLabel: Record<string, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
}

const experienceLevelLabel: Record<string, string> = {
  ENTRY: 'Entry',
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null) return `${formatRupiah(min)} – ${formatRupiah(max)}`
  if (min != null) return `Mulai ${formatRupiah(min)}`
  if (max != null) return `Hingga ${formatRupiah(max)}`
  return null
}

/** Top 2-3 contributing signals for the deterministic "Why?" block. */
function topContributors(b: Breakdown): Array<{ label: string; value: number }> {
  return [
    { label: 'Kecocokan skill', value: b.skill },
    { label: 'Kecocokan headline', value: b.headline },
    { label: 'Kecocokan lokasi', value: b.location },
    { label: 'Lowongan terbaru', value: b.recency },
    { label: 'Tingkat pengalaman', value: b.experience },
  ]
    .filter((e) => e.value > 0)
    .sort((a, b2) => b2.value - a.value)
    .slice(0, 3)
}

const AI_JOB_LIMIT = 12

export function RecommendationsList({
  items,
  aiEnabled,
}: {
  items: RecommendationView[]
  aiEnabled: boolean
}) {
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<{ kind: 'error' | 'info'; text: string } | null>(
    null,
  )
  const hasReasons = Object.keys(reasons).length > 0

  function handleExplain() {
    setBanner(null)
    startTransition(async () => {
      const jobs = items.slice(0, AI_JOB_LIMIT).map((j) => ({
        id: j.id,
        title: j.title,
        tags: j.tags,
        location: j.location,
        locationType: j.locationType,
        experienceLevel: j.experienceLevel,
      }))
      const r = await explainMyRecommendations({ jobs })
      if (!r.ok) {
        setBanner({ kind: 'error', text: r.error })
        return
      }
      if (r.data && r.data.source === 'ai' && Object.keys(r.data.reasons).length > 0) {
        setReasons(r.data.reasons)
        setBanner({ kind: 'info', text: 'Penjelasan AI ditambahkan ke rekomendasi teratas.' })
      } else {
        setBanner({
          kind: 'info',
          text: 'Penjelasan AI belum tersedia saat ini. Menampilkan skor berbasis aturan.',
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      {aiEnabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            Ingin alasan yang lebih personal? Biarkan AI menjelaskan kenapa tiap
            lowongan cocok untuk Anda.
          </p>
          <button
            type="button"
            onClick={handleExplain}
            disabled={pending}
            className="border-input hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {hasReasons ? 'Perbarui penjelasan AI' : 'Jelaskan dengan AI'}
          </button>
        </div>
      ) : null}

      {banner ? (
        <div
          role="status"
          className={`rounded-md border px-3 py-2 text-sm ${
            banner.kind === 'error'
              ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
              : 'border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300'
          }`}
        >
          {banner.text}
        </div>
      ) : null}

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((job) => {
          const salary = formatSalaryRange(job.salaryMin, job.salaryMax)
          const contributors = topContributors(job.breakdown)
          const aiReason = reasons[job.id]
          return (
            <li key={job.id}>
              <Card className="flex h-full flex-col hover:shadow-md">
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    {job.totalUserSkills > 0 && job.matchedSkills.length > 0 ? (
                      <Badge variant="success" size="sm">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {job.matchedSkills.length} dari {job.totalUserSkills} skill cocok
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Rekomendasi
                      </Badge>
                    )}
                    <span
                      className="text-foreground text-sm font-bold tabular-nums"
                      aria-label={`Skor kecocokan ${job.score} dari 100`}
                    >
                      {job.score}
                      <span className="text-muted-foreground text-xs font-normal">
                        /100
                      </span>
                    </span>
                  </div>

                  <div>
                    <h2 className="font-heading text-foreground line-clamp-2 text-base font-semibold">
                      {job.title}
                    </h2>
                    <p className="text-muted-foreground mt-0.5 truncate text-sm">
                      {job.tenantName}
                    </p>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {job.location}
                    </span>
                    <span>•</span>
                    <span>{locationTypeLabel[job.locationType] ?? job.locationType}</span>
                    <span>•</span>
                    <span>{employmentLabel[job.employmentType] ?? job.employmentType}</span>
                    <span>•</span>
                    <span>
                      {experienceLevelLabel[job.experienceLevel] ?? job.experienceLevel}
                    </span>
                  </div>

                  {salary && (
                    <p className="text-foreground text-sm font-semibold">
                      {salary}
                      <span className="text-muted-foreground ml-1 text-xs font-normal">
                        /bulan
                      </span>
                    </p>
                  )}

                  {job.matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.matchedSkills.slice(0, 6).map((s) => (
                        <Tag key={s}>{s}</Tag>
                      ))}
                    </div>
                  )}

                  {aiReason ? (
                    <div className="border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 mt-1 rounded-md border p-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Mengapa cocok untuk Anda
                        <span className="border-violet-300 dark:border-violet-500/40 ml-0.5 rounded-full border px-1.5 py-0 text-[10px] uppercase tracking-wide">
                          AI
                        </span>
                      </p>
                      <p className="text-foreground/90 text-xs leading-relaxed">
                        {aiReason}
                      </p>
                    </div>
                  ) : (
                    contributors.length > 0 && (
                      <div className="border-border bg-muted/40 mt-1 rounded-md border p-3">
                        <p className="text-muted-foreground mb-1 text-xs font-medium">
                          Mengapa direkomendasikan?
                        </p>
                        <ul className="space-y-0.5">
                          {contributors.map((c) => (
                            <li
                              key={c.label}
                              className="text-foreground flex items-center justify-between text-xs"
                            >
                              <span>{c.label}</span>
                              <span className="text-primary font-semibold tabular-nums">
                                +{c.value}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <Link
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      href={`/jobs/${job.slug}` as any}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Lihat detail
                    </Link>
                    <SaveJobButton jobId={job.id} initiallySaved={job.isSaved} />
                  </div>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
