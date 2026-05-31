import Link from 'next/link'
import { ArrowRight, BarChart3, Wallet } from 'lucide-react'
import type { ExperienceLevel } from '@prisma/client'
import { getSalaryForRole } from '@/lib/salary/queries'

const idrFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function fmt(v: number | null): string {
  if (v == null) return '—'
  return idrFmt.format(v)
}

export type SalaryWidgetProps = {
  title: string
  experienceLevel?: ExperienceLevel | null
  location?: string | null
}

/**
 * Compact card showing salary insights for a specific role title.
 * Server component: fetches its own data via {@link getSalaryForRole}.
 *
 * Renders gracefully when there is no data ("Data tidak cukup untuk role ini")
 * so it can be safely embedded in any sidebar without conditional wrapping.
 */
export async function SalaryWidget({
  title,
  experienceLevel,
  location,
}: SalaryWidgetProps) {
  const stats = await getSalaryForRole({
    title,
    experienceLevel: experienceLevel ?? undefined,
    location: location ?? undefined,
  })

  const insufficient = stats.count < 3 || stats.median == null

  return (
    <div className="border-border bg-card rounded-2xl border p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="bg-primary/10 text-primary inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        >
          <Wallet className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-heading text-foreground text-sm font-semibold">
            Gaji untuk {title}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            Estimasi pasar berdasarkan lowongan PUBLISHED
          </p>
        </div>
      </div>

      {insufficient ? (
        <p className="text-muted-foreground mt-4 text-xs">
          Data tidak cukup untuk role ini.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
              Gaji median
            </div>
            <div className="font-heading text-foreground mt-0.5 text-lg font-semibold tabular-nums">
              {fmt(stats.median)}
              <span className="text-muted-foreground ml-1 text-xs font-normal">
                /bulan
              </span>
            </div>
          </div>

          {stats.p25 != null && stats.p75 != null ? (
            <div>
              <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Rentang umum (P25–P75)
              </div>
              <div className="text-foreground mt-0.5 text-xs font-medium tabular-nums">
                {fmt(stats.p25)} – {fmt(stats.p75)}
              </div>
            </div>
          ) : null}

          <p className="text-muted-foreground border-border border-t pt-3 text-[11px]">
            Dari {stats.count.toLocaleString('id-ID')} lowongan
            {stats.sampleSize > stats.count
              ? ` (dari ${stats.sampleSize.toLocaleString('id-ID')} total)`
              : ''}
            .
          </p>
        </div>
      )}

      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={'/dashboard/salary-insights' as any}
        className="text-primary mt-4 inline-flex items-center gap-1 text-xs font-medium hover:underline"
      >
        <BarChart3 className="h-3 w-3" aria-hidden="true" />
        Lihat detail
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  )
}
