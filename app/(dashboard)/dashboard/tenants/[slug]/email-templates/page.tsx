import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Mail, Info } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import {
  EmailTemplateForm,
  AVAILABLE_VARIABLES,
} from '@/components/organisms/tenant-email-template-form'
import { getDefaultApplicationStatusContent } from '@/lib/mailer'
import type { TemplateStatus } from '@/lib/tenants/email-template-actions'

export const metadata = { title: 'Template Email Tenant — Dasbor' }

/**
 * The 6 ApplicationStatus values that trigger a candidate notification.
 * Matches `TEMPLATE_STATUS_VALUES` in lib/tenants/email-template-actions.ts.
 */
const STATUSES: {
  status: TemplateStatus
  label: string
  description: string
  tone: string
}[] = [
  {
    status: 'REVIEWED',
    label: 'Sedang ditinjau',
    description: 'Dikirim saat lamaran mulai ditinjau tim rekrutmen.',
    tone: 'bg-blue-100 text-blue-800',
  },
  {
    status: 'SHORTLISTED',
    label: 'Masuk shortlist',
    description: 'Dikirim saat kandidat lolos ke tahap shortlist.',
    tone: 'bg-violet-100 text-violet-800',
  },
  {
    status: 'INTERVIEW',
    label: 'Diundang wawancara',
    description: 'Dikirim saat kandidat diundang untuk wawancara.',
    tone: 'bg-amber-100 text-amber-800',
  },
  {
    status: 'OFFERED',
    label: 'Diberi penawaran',
    description: 'Dikirim saat tenant mengajukan penawaran kerja.',
    tone: 'bg-emerald-100 text-emerald-800',
  },
  {
    status: 'HIRED',
    label: 'Diterima bekerja',
    description: 'Dikirim saat kandidat resmi diterima.',
    tone: 'bg-green-100 text-green-800',
  },
  {
    status: 'REJECTED',
    label: 'Tidak diteruskan',
    description: 'Dikirim saat lamaran tidak dilanjutkan ke tahap berikutnya.',
    tone: 'bg-red-100 text-red-800',
  },
]

export default async function TenantEmailTemplatesPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/email-templates`,
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

  const rows = await prisma.tenantEmailTemplate
    .findMany({
      where: { tenantId: tenant.id },
      select: { status: true, subject: true, body: true, enabled: true },
    })
    .catch(() => [])
  const byStatus = new Map(rows.map((r) => [r.status, r]))

  const customCount = rows.length
  const enabledCount = rows.filter((r) => r.enabled).length

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke {tenant.name}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <Mail className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">Template Email Kandidat</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Sesuaikan isi email otomatis yang dikirim ke kandidat saat status lamaran
          mereka di{' '}
          <span className="font-medium text-foreground">{tenant.name}</span> berubah.
          Jika sebuah status tidak memiliki template kustom, RPI akan memakai template
          default kami.
        </p>
      </header>

      <section className="border-border bg-muted/40 rounded-2xl border p-5">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-base">Cara kerja</h2>
        </div>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          <li>
            Setiap status di bawah dapat memiliki satu template kustom. Saat Anda
            mengubah status lamaran kandidat, RPI akan mengirimkan email memakai
            template kustom (jika diaktifkan) atau template default.
          </li>
          <li>
            Variabel seperti{' '}
            <code className="bg-background rounded px-1 font-mono text-xs">
              {'{{jobTitle}}'}
            </code>{' '}
            akan diganti otomatis. Variabel yang tidak dikenali tetap dicetak apa adanya
            agar mudah diketahui jika ada salah ketik.
          </li>
          <li>
            Daftar lengkap variabel:{' '}
            {AVAILABLE_VARIABLES.map((v, i) => (
              <span key={v.name}>
                <code className="bg-background rounded px-1 font-mono text-xs">
                  {'{{'}
                  {v.name}
                  {'}}'}
                </code>
                {i < AVAILABLE_VARIABLES.length - 1 ? ', ' : ''}
              </span>
            ))}
            .
          </li>
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">
          {customCount === 0
            ? 'Belum ada template kustom — semua status memakai default RPI.'
            : `${customCount} template kustom tersimpan (${enabledCount} aktif).`}
        </p>
      </section>

      <section
        aria-label="Template per status"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">Template per status</h2>
        <div className="space-y-3">
          {STATUSES.map((s) => {
            const row = byStatus.get(s.status)
            const defaults = getDefaultApplicationStatusContent(s.status)
            const initial = row
              ? { subject: row.subject, body: row.body, enabled: row.enabled }
              : null
            const stateLabel = !initial
              ? { text: 'Pakai default', tone: 'bg-muted text-muted-foreground' }
              : initial.enabled
                ? { text: 'Custom aktif', tone: 'bg-emerald-100 text-emerald-800' }
                : { text: 'Custom (nonaktif)', tone: 'bg-amber-100 text-amber-800' }
            return (
              <details
                key={s.status}
                className="border-border group rounded-md border bg-background"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.tone}`}
                  >
                    {s.status}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-muted-foreground text-xs">{s.description}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${stateLabel.tone}`}
                  >
                    {stateLabel.text}
                  </span>
                  <span className="text-muted-foreground text-xs underline">
                    Edit / Lihat default
                  </span>
                </summary>

                <div className="border-border space-y-5 border-t p-5">
                  <details className="bg-muted/40 border-border rounded-md border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      Lihat template default
                    </summary>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="text-muted-foreground text-xs uppercase">
                          Subjek default
                        </div>
                        <div className="text-sm font-mono">{defaults.subject}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs uppercase">
                          Isi default
                        </div>
                        <pre className="bg-background border-border whitespace-pre-wrap break-words rounded border p-3 font-mono text-xs leading-relaxed">
                          {defaults.body}
                        </pre>
                      </div>
                    </div>
                  </details>

                  <EmailTemplateForm
                    tenantSlug={tenant.slug}
                    status={s.status}
                    initial={initial}
                    defaultSubject={defaults.subject}
                    defaultBody={defaults.body}
                  />
                </div>
              </details>
            )
          })}
        </div>
      </section>
    </div>
  )
}
