import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Download,
  Activity,
} from 'lucide-react'
import { ApplicationStatus } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  ApplicationNoteForm,
  ApplicationStatusSelect,
} from '@/components/organisms/application-status-form'

export const metadata = { title: 'Detail Lamaran — Dasbor' }

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: 'Dilamar',
  REVIEWED: 'Ditinjau',
  SHORTLISTED: 'Shortlist',
  INTERVIEW: 'Wawancara',
  OFFERED: 'Penawaran',
  HIRED: 'Diterima',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Dibatalkan',
}

const STATUS_TONE: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-slate-100 text-slate-800',
  REVIEWED: 'bg-sky-100 text-sky-800',
  SHORTLISTED: 'bg-indigo-100 text-indigo-800',
  INTERVIEW: 'bg-violet-100 text-violet-800',
  OFFERED: 'bg-amber-100 text-amber-800',
  HIRED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-zinc-100 text-zinc-800',
}

const SELECT_OPTIONS = (
  [
    'APPLIED',
    'REVIEWED',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED',
  ] as const
).map((v) => ({ value: v, label: STATUS_LABELS[v] }))

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function metadataPreview(value: unknown): string {
  if (!value) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export default async function TenantApplicationDetailPage({
  params,
}: {
  params: { slug: string; id: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/lamaran/${params.id}`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    notFound()
  }
  const canManage = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'job.update',
  )

  const application = await prisma.application
    .findFirst({
      where: { id: params.id, tenantId: tenant.id },
      select: {
        id: true,
        status: true,
        resumeUrl: true,
        coverLetter: true,
        notes: true,
        appliedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            bio: true,
            headline: true,
            location: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            employmentType: true,
            locationType: true,
          },
        },
      },
    })
    .catch(() => null)
  if (!application) notFound()

  const auditEntries = await prisma.auditLog
    .findMany({
      where: {
        tenantId: tenant.id,
        resource: 'application',
        resourceId: application.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })
    .catch(() => [])

  const tone = STATUS_TONE[application.status]
  const applicantName = application.user.name ?? application.user.email

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}/lamaran` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar lamaran
        </Link>
      </div>

      <header className="border-border bg-card flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {application.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={application.user.image}
              alt=""
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted size-14 rounded-full" />
          )}
          <div>
            <h1 className="font-heading text-2xl">{applicantName}</h1>
            {application.user.headline && (
              <p className="text-muted-foreground text-sm">
                {application.user.headline}
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Dilamar {dateFmt.format(application.appliedAt)} · Diperbarui{' '}
              {dateFmt.format(application.updatedAt)}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-medium ${tone}`}
        >
          {STATUS_LABELS[application.status]}
        </span>
      </header>

      <section
        aria-label="Profil pelamar"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Profil pelamar</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-start gap-2">
            <Mail
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Email</dt>
              <dd>{application.user.email}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Telepon
              </dt>
              <dd>{application.user.phone ?? '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">
                Lokasi
              </dt>
              <dd>{application.user.location ?? '—'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <FileText
              className="text-muted-foreground mt-0.5 h-4 w-4"
              aria-hidden="true"
            />
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Bio</dt>
              <dd className="whitespace-pre-line">
                {application.user.bio ?? '—'}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <section
        aria-label="Lowongan yang dilamar"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Lowongan</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs uppercase block">
              Judul
            </span>
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={
                `/dashboard/tenants/${tenant.slug}/jobs/${application.job.id}` as any
              }
              className="font-medium hover:underline"
            >
              {application.job.title}
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground text-xs uppercase block">
                Lokasi
              </span>
              <span>
                {application.job.location} · {application.job.locationType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground text-xs uppercase block">
                Tipe kerja
              </span>
              <span>{application.job.employmentType}</span>
            </div>
          </div>
        </div>
      </section>

      {(application.resumeUrl || application.coverLetter) && (
        <section
          aria-label="Berkas lamaran"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Berkas lamaran</h2>
          {application.resumeUrl && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                Resume
              </span>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-foreground inline-flex items-center gap-2 hover:underline"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Unduh resume
              </a>
            </div>
          )}
          {application.coverLetter && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs uppercase block">
                Cover letter
              </span>
              <p className="whitespace-pre-line">{application.coverLetter}</p>
            </div>
          )}
        </section>
      )}

      {canManage && (
        <section
          aria-label="Ubah status"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Status lamaran</h2>
          <p className="text-muted-foreground text-sm">
            Perubahan status akan tercatat di log audit tenant.
          </p>
          <ApplicationStatusSelect
            applicationId={application.id}
            current={application.status}
            options={SELECT_OPTIONS}
            className="max-w-xs"
          />
        </section>
      )}

      {canManage && (
        <section
          aria-label="Catatan rekruter"
          className="border-border bg-card rounded-2xl border p-6 space-y-4"
        >
          <h2 className="font-heading text-lg">Catatan internal</h2>
          <ApplicationNoteForm
            applicationId={application.id}
            initial={application.notes}
          />
        </section>
      )}

      <section
        aria-label="Aktivitas terbaru"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Aktivitas terbaru</h2>
        </div>
        {auditEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada catatan aktivitas untuk lamaran ini.
          </p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {auditEntries.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-muted text-foreground rounded-full px-2 py-0.5 font-mono text-xs">
                    {e.action}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {dateFmt.format(e.createdAt)}
                  </span>
                  {e.user && (
                    <span className="text-muted-foreground text-xs">
                      · {e.user.name ?? e.user.email}
                    </span>
                  )}
                </div>
                {Boolean(e.metadata) && (
                  <p className="text-muted-foreground mt-1 font-mono text-xs">
                    {metadataPreview(e.metadata)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
