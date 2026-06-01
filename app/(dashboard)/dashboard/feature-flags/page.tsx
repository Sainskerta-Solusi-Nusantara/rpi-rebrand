import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Flag, Plus } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { getAllFlags } from '@/lib/feature-flags/flag-queries'
import {
  FlagToggleSwitch,
  FlagDeleteButton,
} from '@/components/organisms/feature-flag-controls'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Feature Flags — Dasbor' }

export default async function FeatureFlagsListPage() {
  const session = await requireAuth('/dashboard/feature-flags')
  if (session.user.globalRole !== 'SUPERADMIN') {
    notFound()
  }
  const t = await getServerT()

  function typeLabel(type: string): string {
    switch (type) {
      case 'boolean':
        return t.dashboard.featureFlags.typeLabels.boolean
      case 'percentage':
        return t.dashboard.featureFlags.typeLabels.percentage
      case 'segment':
        return t.dashboard.featureFlags.typeLabels.segment
      default:
        return type
    }
  }

  const flags = await getAllFlags()

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard' as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t.dashboard.featureFlags.backToDashboard}
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flag className="h-6 w-6" aria-hidden="true" />
            <h1 className="font-heading text-2xl md:text-3xl">{t.dashboard.featureFlags.title}</h1>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {t.dashboard.featureFlags.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={'/dashboard/feature-flags/new' as any}
            className="bg-primary text-primary-foreground inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.dashboard.featureFlags.manageCta}
          </Link>
        </div>
      </header>

      <section
        aria-label={t.dashboard.featureFlags.listLabel}
        className="border-border bg-card rounded-2xl border"
      >
        {flags.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t.dashboard.featureFlags.emptyState}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="p-3 font-medium">{t.dashboard.featureFlags.headers.key}</th>
                  <th className="p-3 font-medium">{t.dashboard.featureFlags.headers.name}</th>
                  <th className="p-3 font-medium">{t.dashboard.featureFlags.headers.type}</th>
                  <th className="p-3 font-medium">{t.dashboard.featureFlags.headers.status}</th>
                  <th className="p-3 font-medium text-right">{t.dashboard.featureFlags.headers.overrides}</th>
                  <th className="p-3 font-medium text-right">{t.dashboard.featureFlags.headers.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {flags.map((f) => (
                  <tr key={f.id}>
                    <td className="p-3 font-mono text-xs">{f.key}</td>
                    <td className="p-3">
                      <div className="font-medium">{f.name}</div>
                      {f.description && (
                        <div className="text-muted-foreground line-clamp-1 text-xs">
                          {f.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {typeLabel(f.type)}
                      {f.type === 'percentage' && (
                        <span className="text-muted-foreground ml-1">({f.percentage}%)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <FlagToggleSwitch id={f.id} initialEnabled={f.enabled} />
                    </td>
                    <td className="p-3 text-right text-xs tabular-nums">
                      {f.overrideCount}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          href={`/dashboard/feature-flags/${f.id}` as any}
                          className="border-border bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium"
                        >
                          {t.dashboard.featureFlags.edit}
                        </Link>
                        <FlagDeleteButton id={f.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
