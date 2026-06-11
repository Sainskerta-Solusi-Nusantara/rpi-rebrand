import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { recommendJobsForUser } from '@/lib/recommendations/queries'
import { isAiConfigured } from '@/lib/ai/client'
import { Card, CardContent } from '@/components/atoms/card'
import {
  RecommendationsList,
  type RecommendationView,
} from './recommendations-list'

export const metadata = { title: 'Rekomendasi Lowongan — Dasbor' }

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

  // Trim to the serializable shape the client list renders. The deterministic
  // ranking is computed here on load (cheap); the AI reasons are fetched only
  // on demand from inside the client component.
  const items: RecommendationView[] = recommendations.map((job) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    location: job.location,
    locationType: job.locationType,
    employmentType: job.employmentType,
    experienceLevel: job.experienceLevel,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    tags: job.tags,
    tenantName: job.tenant.name,
    score: job.score,
    breakdown: job.breakdown,
    matchedSkills: job.matchedSkills,
    totalUserSkills: job.totalUserSkills,
    isSaved: savedSet.has(job.id),
  }))

  return (
    <div className="space-y-8 p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl flex items-center gap-2">
            <Sparkles className="text-primary h-6 w-6" aria-hidden="true" />
            Rekomendasi untuk Anda
          </h1>
          <p className="text-muted-foreground mt-1">
            {items.length > 0
              ? `${items.length.toLocaleString('id-ID')} lowongan dipilih berdasarkan profil, CV, dan lokasi Anda.`
              : 'Lengkapi profil + CV untuk mendapat rekomendasi yang lebih relevan.'}
          </p>
        </div>
      </header>

      {items.length === 0 ? (
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
        <RecommendationsList items={items} aiEnabled={isAiConfigured()} />
      )}
    </div>
  )
}
