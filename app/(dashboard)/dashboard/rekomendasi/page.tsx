import Link from 'next/link'
import { MapPin, Sparkles } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  recommendJobsForUser,
  topContributors,
} from '@/lib/recommendations/queries'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent } from '@/components/atoms/card'
import { Tag } from '@/components/atoms/tag'
import { formatRupiah } from '@/lib/utils'
import { SaveJobButton } from './save-button'

export const metadata = { title: 'Rekomendasi Lowongan — Dasbor' }

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

function formatSalaryRange(
  min: number | null,
  max: number | null,
): string | null {
  if (min == null && max == null) return null
  if (min != null && max != null)
    return `${formatRupiah(min)} – ${formatRupiah(max)}`
  if (min != null) return `Mulai ${formatRupiah(min)}`
  if (max != null) return `Hingga ${formatRupiah(max)}`
  return null
}

export default async function RecommendationsPage() {
  const session = await requireAuth('/dashboard/rekomendasi')
  const userId = session.user.id

  const [recommendations, savedRows] = await Promise.all([
    recommendJobsForUser({ userId, limit: 20 }),
    prisma.savedJob
      .findMany({ where: { userId }, select: { jobId: true } })
      .catch(() => [] as Array<{ jobId: string }>),
  ])

  const savedSet = new Set(savedRows.map((s) => s.jobId))

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl flex items-center gap-2">
            <Sparkles className="text-primary h-6 w-6" aria-hidden="true" />
            Rekomendasi untuk Anda
          </h1>
          <p className="text-muted-foreground mt-1">
            {recommendations.length > 0
              ? `${recommendations.length.toLocaleString('id-ID')} lowongan dipilih berdasarkan profil, CV, dan lokasi Anda.`
              : 'Lengkapi profil + CV untuk mendapat rekomendasi yang lebih relevan.'}
          </p>
        </div>
      </header>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Sparkles
              className="text-muted-foreground mx-auto mb-3 h-10 w-10"
              aria-hidden="true"
            />
            <h2 className="font-heading text-lg">
              Belum ada rekomendasi tersedia
            </h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
              Lengkapi headline, lokasi, dan tambahkan skill ke CV utama Anda
              untuk mendapatkan rekomendasi yang lebih relevan.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={'/dashboard/profil' as any}
                className="text-primary text-sm font-medium hover:underline"
              >
                Lengkapi profil
              </Link>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={'/dashboard/cv' as any}
                className="text-primary text-sm font-medium hover:underline"
              >
                Buat CV
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((job) => {
            const salary = formatSalaryRange(job.salaryMin, job.salaryMax)
            const contributors = topContributors(job.breakdown)
            const isSaved = savedSet.has(job.id)
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
                        {job.tenant.name}
                      </p>
                    </div>

                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>{locationTypeLabel[job.locationType]}</span>
                      <span>•</span>
                      <span>{employmentLabel[job.employmentType]}</span>
                      <span>•</span>
                      <span>{experienceLevelLabel[job.experienceLevel]}</span>
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

                    {contributors.length > 0 && (
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
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/jobs/${job.slug}` as any}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Lihat detail
                      </Link>
                      <SaveJobButton jobId={job.id} initiallySaved={isSaved} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
