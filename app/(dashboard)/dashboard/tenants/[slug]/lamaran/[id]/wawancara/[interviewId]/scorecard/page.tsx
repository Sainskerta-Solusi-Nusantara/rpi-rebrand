import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ClipboardList } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { ScorecardForm } from '@/components/organisms/interview-scorecard-form'
import { getScorecardForInterview } from '@/lib/scorecards/queries'

export const metadata = { title: 'Scorecard Wawancara — Dasbor' }

const DEFAULT_CRITERIA = [
  'Pengetahuan teknis',
  'Pengalaman relevan',
  'Komunikasi',
  'Problem solving',
  'Kecocokan budaya',
]

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function TenantInterviewScorecardPage({
  params,
}: {
  params: { slug: string; id: string; interviewId: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran/${params.id}/wawancara/${params.interviewId}/scorecard`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.update')) {
    notFound()
  }

  const interview = await prisma.interviewSchedule
    .findFirst({
      where: {
        id: params.interviewId,
        applicationId: params.id,
        application: { tenantId: tenant.id },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        status: true,
        application: {
          select: {
            id: true,
            user: { select: { name: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
    })
    .catch(() => null)
  if (!interview) notFound()

  const scorecard = await getScorecardForInterview(interview.id)
  const candidateName =
    interview.application.user.name ?? interview.application.user.email
  const jobTitle = interview.application.job.title

  const backHref =
    `/dashboard/tenants/${tenant.slug}/lamaran/${interview.application.id}` as const

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={backHref as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke detail lamaran
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-2 rounded-2xl border p-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          <h1 className="font-heading text-2xl">
            {scorecard ? 'Ubah scorecard' : 'Buat scorecard'}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Wawancara untuk lowongan{' '}
          <span className="text-foreground font-medium">{jobTitle}</span> bersama
          kandidat{' '}
          <span className="text-foreground font-medium">{candidateName}</span>.
        </p>
        <dl className="text-muted-foreground mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <div>
            <dt className="uppercase">Jadwal</dt>
            <dd className="text-foreground">
              {dateFmt.format(interview.scheduledAt)}
            </dd>
          </div>
          <div>
            <dt className="uppercase">Durasi</dt>
            <dd className="text-foreground">{interview.durationMin} menit</dd>
          </div>
          <div>
            <dt className="uppercase">Jenis</dt>
            <dd className="text-foreground capitalize">{interview.type}</dd>
          </div>
        </dl>
      </header>

      <section
        aria-label="Form scorecard"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <ScorecardForm
          interviewId={interview.id}
          initial={
            scorecard
              ? {
                  ratings: scorecard.ratings,
                  notes: scorecard.notes,
                  recommendation: scorecard.recommendation,
                }
              : undefined
          }
          defaultCriteria={DEFAULT_CRITERIA}
        />
      </section>
    </div>
  )
}
