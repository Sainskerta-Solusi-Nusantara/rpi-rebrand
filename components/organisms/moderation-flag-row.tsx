import Link from 'next/link'
import { ChevronRight, Flag } from 'lucide-react'
import type { FlagListItem } from '@/lib/moderation/queries'

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

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}

function resourceHref(resourceType: string, resourceId: string): string | null {
  switch (resourceType) {
    case 'user':
    case 'profile':
      return `/admin/users/${resourceId}`
    case 'job':
    case 'course':
    case 'application':
    case 'message':
    default:
      return null
  }
}

export function ModerationFlagRow({ flag }: { flag: FlagListItem }) {
  const reason = REASON_LABEL[flag.reason] ?? flag.reason
  const status = STATUS_LABEL[flag.status] ?? {
    label: flag.status,
    cls: 'bg-muted text-muted-foreground border-border',
  }
  const resourceLabel = RESOURCE_TYPE_LABEL[flag.resourceType] ?? flag.resourceType
  const reporterName =
    flag.reporter?.name?.trim() ||
    flag.reporter?.email ||
    (flag.reporter ? 'Pengguna' : 'Anonim')
  const href = resourceHref(flag.resourceType, flag.resourceId)

  return (
    <li className="border-border bg-card flex items-center justify-between gap-4 border-b p-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${status.cls}`}
          >
            <Flag className="h-3 w-3" aria-hidden />
            {status.label}
          </span>
          <span className="border-border bg-muted/40 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium">
            {reason}
          </span>
          <span className="text-muted-foreground text-xs">{resourceLabel}</span>
          <span className="text-muted-foreground font-mono text-[10px]">
            #{flag.resourceId.slice(0, 8)}
          </span>
        </div>
        {flag.description ? (
          <p className="text-foreground/80 mt-2 line-clamp-2 text-sm">
            {flag.description}
          </p>
        ) : null}
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span>Pelapor: {reporterName}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(flag.createdAt)}</span>
          {href ? (
            <>
              <span aria-hidden>·</span>
              <a className="text-primary hover:underline" href={href}>
                Buka konten
              </a>
            </>
          ) : null}
        </div>
      </div>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/admin/moderasi/${flag.id}` as any}
        className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
        aria-label={`Tinjau laporan ${flag.id}`}
      >
        Tinjau
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </li>
  )
}
