import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatNumber, formatDate } from '@/lib/i18n/format'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Pagination: any = safeRequire('@/components/molecules/pagination', 'Pagination')

export const metadata = { title: 'Audit Log' }

const PAGE_SIZE = 50

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const ta = t.admin.audit
  const cols = t.admin.common.auditCols
  const action = typeof searchParams.action === 'string' ? searchParams.action : undefined
  const resource = typeof searchParams.resource === 'string' ? searchParams.resource : undefined
  const pageRaw = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1
  const page = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1)

  const where: Prisma.AuditLogWhereInput = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(action ? ({ action: action as any } as Prisma.AuditLogWhereInput) : {}),
    ...(resource ? { resource } : {}),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { email: true, name: true } },
          tenant: { select: { slug: true, name: true } },
        },
      })
      .catch(() => []),
    prisma.auditLog.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{ta.title}</h1>
          <p className="text-muted-foreground mt-1">
            {ta.subtitle.replace('{n}', formatNumber(total, locale))}
          </p>
        </div>
        <form className="flex gap-2" action="/admin/audit">
          <select
            name="action"
            defaultValue={action ?? ''}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          >
            <option value="">{ta.allActions}</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="INVITE">INVITE</option>
            <option value="REVOKE">REVOKE</option>
            <option value="PERMISSION_CHANGE">PERMISSION_CHANGE</option>
          </select>
          <input
            name="resource"
            defaultValue={resource ?? ''}
            placeholder={ta.resourcePlaceholder}
            className="border-border bg-background rounded-md border px-3 py-1.5 text-sm"
          />
          <button className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm">
            {t.admin.common.filter}
          </button>
        </form>
      </header>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">{cols.time}</th>
              <th className="p-3">{cols.action}</th>
              <th className="p-3">{cols.resource}</th>
              <th className="p-3">{cols.user}</th>
              <th className="p-3">{cols.tenant}</th>
              <th className="p-3">{cols.ip}</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="p-3 whitespace-nowrap">
                  {formatDate(l.createdAt, locale, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="p-3 font-mono text-xs">{l.action}</td>
                <td className="p-3 font-mono text-xs">
                  {l.resource}
                  {l.resourceId ? `#${l.resourceId.slice(0, 8)}` : ''}
                </td>
                <td className="p-3">{l.user?.email ?? '—'}</td>
                <td className="p-3">{l.tenant?.slug ?? '—'}</td>
                <td className="p-3 font-mono text-xs">{l.ip ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={6}>
                  {ta.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}
