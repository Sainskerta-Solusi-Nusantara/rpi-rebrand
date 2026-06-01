import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, History } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import {
  AuditRetentionForm,
  DeleteRetentionPolicyButton,
  RETENTION_DAY_OPTIONS,
} from '@/components/organisms/audit-retention-form'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Retensi Audit Global — Dasbor' }

export default async function GlobalAuditRetentionPage() {
  const session = await requireAuth('/dashboard/audit-retention')

  if (session.user.globalRole !== 'SUPERADMIN') {
    notFound()
  }
  const t = await getServerT()

  function retentionLabel(days: number): string {
    const match = RETENTION_DAY_OPTIONS.find((o) => o.value === days)
    if (match) return match.label
    return days === 0
      ? t.dashboard.auditRetention.forever
      : t.dashboard.auditRetention.daysSuffix.replace('{n}', String(days))
  }

  const policies = await prisma.auditRetentionPolicy
    .findMany({
      where: { scope: 'global' },
      orderBy: [{ resourceType: 'asc' }],
    })
    .catch(() => [])

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.auditRetention.backToDashboard}
        </Link>
      </div>

      <header>
        <div className="flex items-center gap-2">
          <History className="h-6 w-6" aria-hidden="true" />
          <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.auditRetention.title}</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          {t.dashboard.auditRetention.subtitle}
        </p>
      </header>

      <div
        role="note"
        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
      >
        {t.dashboard.auditRetention.cleanupNote}
      </div>

      <section
        aria-label={t.dashboard.auditRetention.globalPoliciesLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">
          {t.dashboard.auditRetention.globalPoliciesTitle.replace('{n}', String(policies.length))}
        </h2>
        {policies.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.dashboard.auditRetention.emptyPolicies}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{t.dashboard.auditRetention.headers.resourceType}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.auditRetention.headers.retention}</th>
                  <th className="py-2 pr-3 font-medium">{t.dashboard.auditRetention.headers.archive}</th>
                  <th className="py-2 font-medium text-right">{t.dashboard.auditRetention.headers.actions}</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr key={p.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-xs">{p.resourceType}</td>
                    <td className="py-2 pr-3 text-xs">{retentionLabel(p.retentionDays)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {p.archiveEnabled ? t.dashboard.auditRetention.yes : t.dashboard.auditRetention.no}
                    </td>
                    <td className="py-2 text-right">
                      <DeleteRetentionPolicyButton id={p.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        aria-label={t.dashboard.auditRetention.addLabel}
        className="border-border bg-card rounded-2xl border p-6"
      >
        <h2 className="font-heading mb-4 text-lg">{t.dashboard.auditRetention.addTitle}</h2>
        <AuditRetentionForm scope="global" />
      </section>
    </div>
  )
}
