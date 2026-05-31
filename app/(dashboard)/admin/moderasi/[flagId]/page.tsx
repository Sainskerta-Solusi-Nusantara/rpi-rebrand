import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireRole } from '@/lib/auth/session'
import { getFlagWithContext } from '@/lib/moderation/queries'
import { ModerationActionsBar } from '@/components/organisms/moderation-actions-bar'

export const metadata = { title: 'Detail Laporan' }

const REASON_LABEL: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Tidak pantas',
  misleading: 'Menyesatkan',
  copyright: 'Hak cipta',
  other: 'Lainnya',
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: {
    label: 'Menunggu',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  reviewing: {
    label: 'Ditinjau',
    cls: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  resolved: {
    label: 'Selesai',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  dismissed: {
    label: 'Ditolak',
    cls: 'bg-muted text-muted-foreground border-border',
  },
}

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  job: 'Lowongan',
  course: 'Kursus',
  user: 'Pengguna',
  profile: 'Profil',
  message: 'Pesan',
  application: 'Lamaran',
}

function formatDateTime(d: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

export default async function ModerationFlagDetailPage({
  params,
}: {
  params: { flagId: string }
}) {
  await requireRole('SUPERADMIN', 'ADMIN')

  const flag = await getFlagWithContext(params.flagId)
  if (!flag) notFound()

  const status = STATUS_LABEL[flag.status] ?? {
    label: flag.status,
    cls: 'bg-muted text-muted-foreground border-border',
  }
  const reason = REASON_LABEL[flag.reason] ?? flag.reason
  const resourceLabel = RESOURCE_TYPE_LABEL[flag.resourceType] ?? flag.resourceType
  const reporterName =
    flag.reporter?.name?.trim() ||
    flag.reporter?.email ||
    (flag.reporter ? 'Pengguna' : 'Anonim')
  const resolverName =
    flag.resolver?.name?.trim() || flag.resolver?.email || null

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link
          href="/admin/moderasi"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali ke antrian
        </Link>
      </div>

      <header className="border-border bg-card rounded-xl border p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${status.cls}`}
          >
            {status.label}
          </span>
          <span className="border-border bg-muted/40 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium">
            {reason}
          </span>
          <span className="text-muted-foreground text-xs">{resourceLabel}</span>
        </div>
        <h1 className="font-heading text-xl md:text-2xl">Laporan #{flag.id.slice(0, 8)}</h1>
        {flag.description ? (
          <p className="text-foreground/85 whitespace-pre-line text-sm leading-relaxed">
            {flag.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Tidak ada deskripsi tambahan dari pelapor.
          </p>
        )}
        <dl className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
          <DLRow label="Pelapor" value={reporterName} />
          <DLRow label="Dilaporkan pada" value={formatDateTime(flag.createdAt)} />
          {flag.resolvedAt ? (
            <DLRow label="Diselesaikan pada" value={formatDateTime(flag.resolvedAt)} />
          ) : null}
          {resolverName ? <DLRow label="Diselesaikan oleh" value={resolverName} /> : null}
          {flag.resolution ? <DLRow label="Resolusi" value={flag.resolution} /> : null}
        </dl>
      </header>

      <section className="border-border bg-card rounded-xl border p-5 space-y-3">
        <h2 className="font-heading text-base font-semibold">Konten yang dilaporkan</h2>
        <ResourceSnapshot context={flag.context} />
      </section>

      <section className="border-border bg-card rounded-xl border p-5 space-y-3">
        <h2 className="font-heading text-base font-semibold">Ambil tindakan</h2>
        <ModerationActionsBar
          flagId={flag.id}
          currentStatus={flag.status}
          resourceType={flag.resourceType}
        />
      </section>

      <section className="border-border bg-card rounded-xl border p-5 space-y-3">
        <h2 className="font-heading text-base font-semibold">Riwayat aktivitas</h2>
        {flag.activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Belum ada catatan audit untuk sumber daya ini.
          </p>
        ) : (
          <ul className="divide-border divide-y text-sm">
            {flag.activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-xs">{a.action}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {a.resource}
                  </span>
                  {a.user ? (
                    <span className="text-muted-foreground ml-2 text-xs">
                      · {a.user.name ?? a.user.email}
                    </span>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-xs">
                  {formatDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DLRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}:</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  )
}

function ResourceSnapshot({
  context,
}: {
  context: Awaited<ReturnType<typeof getFlagWithContext>> extends infer T
    ? T extends { context: infer C }
      ? C
      : never
    : never
}) {
  if (!context) return null

  switch (context.kind) {
    case 'job':
      return (
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">{context.title}</div>
          <div className="text-muted-foreground text-xs">
            Status: <span className="font-mono">{context.status}</span>
            {context.tenantSlug ? ` · tenant: ${context.tenantSlug}` : ''}
          </div>
          <a
            className="text-primary text-xs underline"
            href={`/jobs/${context.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Buka halaman publik
          </a>
        </div>
      )
    case 'course':
      return (
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">{context.title}</div>
          <div className="text-muted-foreground text-xs">
            Status: <span className="font-mono">{context.status}</span>
            {context.tenantSlug ? ` · tenant: ${context.tenantSlug}` : ''}
          </div>
          <a
            className="text-primary text-xs underline"
            href={`/courses/${context.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Buka halaman publik
          </a>
        </div>
      )
    case 'user':
      return (
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">
            {context.name ?? context.email ?? context.id}
          </div>
          <div className="text-muted-foreground text-xs">
            Status: <span className="font-mono">{context.status}</span>
          </div>
          <a className="text-primary text-xs underline" href={`/admin/users/${context.id}`}>
            Buka profil admin
          </a>
        </div>
      )
    case 'profile':
      return (
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">
            {context.name ?? context.email ?? context.id}
          </div>
          <div className="text-muted-foreground text-xs">
            Status: <span className="font-mono">{context.status}</span>
          </div>
          {context.username ? (
            <a
              className="text-primary text-xs underline"
              href={`/profil/${context.username}`}
              target="_blank"
              rel="noreferrer"
            >
              Buka profil publik
            </a>
          ) : null}
          <a className="text-primary ml-2 text-xs underline" href={`/admin/users/${context.id}`}>
            Buka profil admin
          </a>
        </div>
      )
    case 'application':
      return (
        <div className="space-y-1 text-sm">
          <div className="text-foreground font-medium">
            {context.jobTitle ?? 'Lamaran'}
          </div>
          <div className="text-muted-foreground text-xs">
            Pelamar: {context.userEmail ?? '—'}
          </div>
        </div>
      )
    case 'message':
      return (
        <div className="text-muted-foreground text-sm">
          Pesan ID <span className="font-mono">{context.id}</span>
        </div>
      )
    case 'unknown':
    default:
      return (
        <p className="text-muted-foreground text-sm">
          Sumber daya tidak ditemukan atau sudah dihapus.{' '}
          <span className="font-mono text-xs">#{context.id.slice(0, 12)}</span>
        </p>
      )
  }
}
