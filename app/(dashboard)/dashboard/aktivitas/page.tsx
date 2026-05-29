import Link from 'next/link'
import { Activity, Download } from 'lucide-react'
import { AuditAction } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { listActivity } from '@/lib/auth/activity-queries'

export const metadata = { title: 'Aktivitas — Dasbor' }

const PAGE_SIZE = 25

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'INVITE',
  'REVOKE',
  'PERMISSION_CHANGE',
]

function parseDate(v: string | undefined): Date | undefined {
  if (!v) return undefined
  // Expect yyyy-mm-dd
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return '—'
  return value.length > max ? `${value.slice(0, max)}…` : value
}

function metadataPreview(value: unknown): string {
  if (!value) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function buildHref(
  base: string,
  searchParams: Record<string, string | undefined>,
  overrides: Record<string, string | undefined>,
): string {
  const merged = { ...searchParams, ...overrides }
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v) usp.set(k, v)
  }
  const qs = usp.toString()
  return qs ? `${base}?${qs}` : base
}

export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const session = await requireAuth('/dashboard/aktivitas')

  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined
  const resource = typeof searchParams.resource === 'string' ? searchParams.resource : undefined
  const from = typeof searchParams.from === 'string' ? searchParams.from : undefined
  const to = typeof searchParams.to === 'string' ? searchParams.to : undefined
  const pageRaw = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const validAction = action && ACTIONS.includes(action as AuditAction)
    ? (action as AuditAction)
    : undefined

  const fromDate = parseDate(from)
  const toDate = parseDate(to)
  // Make 'to' inclusive end-of-day if only date given.
  if (toDate && to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    toDate.setHours(23, 59, 59, 999)
  }

  const { items, total } = await listActivity(
    session.user.id,
    { action: validAction, resource, from: fromDate, to: toDate },
    { page, pageSize: PAGE_SIZE },
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const sp: Record<string, string | undefined> = {
    action: validAction,
    resource,
    from,
    to,
    page: String(page),
  }

  const exportHref = buildHref('/api/me/activity/export', sp, { page: undefined })

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">Aktivitas Akun</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {total.toLocaleString('id-ID')} kejadian tercatat.
          </p>
        </div>
        <a
          href={exportHref}
          className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </a>
      </header>

      <form
        action="/dashboard/aktivitas"
        className="border-border bg-card grid grid-cols-1 gap-3 rounded-2xl border p-4 sm:grid-cols-4"
      >
        <div className="space-y-1">
          <label htmlFor="f-action" className="text-muted-foreground text-xs uppercase">
            Aksi
          </label>
          <select
            id="f-action"
            name="action"
            defaultValue={validAction ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Semua aksi</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="f-resource" className="text-muted-foreground text-xs uppercase">
            Sumber
          </label>
          <input
            id="f-resource"
            name="resource"
            type="text"
            defaultValue={resource ?? ''}
            placeholder="contoh: account"
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-from" className="text-muted-foreground text-xs uppercase">
            Dari
          </label>
          <input
            id="f-from"
            name="from"
            type="date"
            defaultValue={from ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="f-to" className="text-muted-foreground text-xs uppercase">
            Sampai
          </label>
          <input
            id="f-to"
            name="to"
            type="date"
            defaultValue={to ?? ''}
            className="border-border bg-background block w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end gap-2 sm:col-span-4">
          <button
            type="submit"
            className="bg-primary text-primary-foreground inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
          >
            Filter
          </button>
          {(validAction || resource || from || to) && (
            <Link
              href="/dashboard/aktivitas"
              className="text-muted-foreground hover:text-foreground text-sm font-medium"
            >
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="border-border overflow-x-auto rounded-2xl border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Waktu</th>
              <th className="p-3 font-medium">Aksi</th>
              <th className="p-3 font-medium">Sumber</th>
              <th className="p-3 font-medium">Tenant</th>
              <th className="p-3 font-medium">IP</th>
              <th className="p-3 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {items.map((r) => (
              <tr key={r.id}>
                <td className="p-3 whitespace-nowrap text-xs">
                  {dateFmt.format(r.createdAt)}
                </td>
                <td className="p-3 font-mono text-xs">{r.action}</td>
                <td className="p-3 font-mono text-xs">
                  {r.resource}
                  {r.resourceId ? `#${r.resourceId.slice(0, 8)}` : ''}
                </td>
                <td className="p-3 text-xs">{r.tenantSlug ?? '—'}</td>
                <td className="p-3 font-mono text-xs">{r.ip ?? '—'}</td>
                <td className="text-muted-foreground max-w-[18rem] p-3 text-xs">
                  <span title={metadataPreview(r.metadata)}>
                    {truncate(metadataPreview(r.metadata), 80)}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={6}>
                  Tidak ada kejadian yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center justify-between gap-3 text-sm"
      >
        <p className="text-muted-foreground">
          Halaman {page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref('/dashboard/aktivitas', sp, { page: String(page - 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              ← Sebelumnya
            </Link>
          )}
          {page < totalPages && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={buildHref('/dashboard/aktivitas', sp, { page: String(page + 1) }) as any}
              className="border-border bg-background hover:bg-muted rounded-md border px-3 py-1.5"
            >
              Selanjutnya →
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
