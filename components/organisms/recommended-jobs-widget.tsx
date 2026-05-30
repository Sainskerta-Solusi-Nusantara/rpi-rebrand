import Link from 'next/link'
import { Info, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/atoms/badge'
import { Card, CardContent } from '@/components/atoms/card'
import { formatRupiah } from '@/lib/utils'
import {
  recommendJobsForUser,
  topContributors,
  type RecommendedJob,
} from '@/lib/recommendations/queries'

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

function MatchBadge({ job }: { job: RecommendedJob }) {
  if (job.totalUserSkills > 0 && job.matchedSkills.length > 0) {
    return (
      <Badge variant="success" size="sm">
        <Sparkles className="h-3 w-3" aria-hidden="true" />
        {job.matchedSkills.length} dari {job.totalUserSkills} skill cocok
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" size="sm">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      Rekomendasi
    </Badge>
  )
}

function WhyTooltip({ job }: { job: RecommendedJob }) {
  const top = topContributors(job.breakdown)
  if (top.length === 0) return null
  const tooltipText = top.map((c) => `${c.label} (+${c.value})`).join(' • ')
  return (
    <span
      className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
      title={`Mengapa direkomendasikan? ${tooltipText}`}
      aria-label={`Mengapa direkomendasikan: ${tooltipText}`}
    >
      <Info className="h-3 w-3" aria-hidden="true" />
      Mengapa?
    </span>
  )
}

export async function RecommendedJobsWidget({
  userId,
  limit = 6,
  showScore = false,
  heading = 'Rekomendasi untuk Anda',
  emptyMessage = 'Lengkapi profil + CV untuk mendapat rekomendasi yang lebih relevan.',
}: {
  userId: string
  limit?: number
  showScore?: boolean
  heading?: string
  emptyMessage?: string
}) {
  const recommendations = await recommendJobsForUser({ userId, limit })

  return (
    <section aria-labelledby="recommended-jobs-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="recommended-jobs-heading"
          className="font-heading text-xl flex items-center gap-2"
        >
          <Sparkles className="text-primary h-5 w-5" aria-hidden="true" />
          {heading}
        </h2>
        {recommendations.length > 0 && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/rekomendasi' as any}
            className="text-primary text-sm font-medium hover:underline"
          >
            Lihat semua
          </Link>
        )}
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Sparkles
              className="text-muted-foreground mx-auto mb-3 h-8 w-8"
              aria-hidden="true"
            />
            <p className="text-muted-foreground">{emptyMessage}</p>
            <div className="mt-4 flex justify-center gap-3">
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
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((job) => {
            const salary = formatSalaryRange(job.salaryMin, job.salaryMax)
            return (
              <li key={job.id}>
                <Card className="flex h-full flex-col hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <MatchBadge job={job} />
                      {showScore && (
                        <span className="text-muted-foreground text-xs font-semibold">
                          {job.score}/100
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-heading text-foreground line-clamp-2 text-base font-semibold">
                        {job.title}
                      </h3>
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
                    </div>

                    {salary && (
                      <p className="text-foreground text-sm font-semibold">
                        {salary}
                        <span className="text-muted-foreground ml-1 text-xs font-normal">
                          /bulan
                        </span>
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/jobs/${job.slug}` as any}
                        className="text-primary text-sm font-medium hover:underline"
                      >
                        Lihat detail
                      </Link>
                      <WhyTooltip job={job} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default RecommendedJobsWidget
