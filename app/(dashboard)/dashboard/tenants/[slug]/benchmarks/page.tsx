import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Gauge, ShieldCheck } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { canAccessTenant, hasTenantPermission } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { getTenantBenchmarks } from '@/lib/benchmarks/queries'
import { BenchmarksCard } from '@/components/organisms/benchmarks-card'

export const metadata = { title: 'Tolok Ukur Kinerja — Dasbor' }

const dateTimeFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default async function TenantBenchmarksPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(
    `/dashboard/tenants/${params.slug}/benchmarks`,
  )

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!canAccessTenant(globalRole, tenants, tenant.id)) {
    notFound()
  }
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'audit.view')) {
    notFound()
  }

  const benchmarks = await getTenantBenchmarks(tenant.id)

  const cards = [
    benchmarks.metrics.timeToHire,
    benchmarks.metrics.applicationToInterview,
    benchmarks.metrics.interviewToOffer,
    benchmarks.metrics.offerToHire,
    benchmarks.metrics.avgInterviewsPerHire,
    benchmarks.metrics.salaryVsMarket,
    benchmarks.metrics.timeToFirstApplication,
  ]

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/dashboard/tenants/${tenant.slug}` as any}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke kelola tenant
        </Link>
      </div>

      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Gauge className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">
              Tolok ukur kinerja
            </h1>
            <p className="text-muted-foreground text-sm">{tenant.name}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Dihitung {dateTimeFmt.format(benchmarks.computedAt)}
        </p>
      </header>

      <section aria-label="Metrik tolok ukur">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((metric) => (
            <BenchmarksCard key={metric.label} metric={metric} />
          ))}
        </div>
      </section>

      <section
        aria-label="Catatan privasi"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="font-heading text-base">Catatan privasi</h2>
            <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
              <li>
                Data tenant lain dianonimkan — hanya nilai median agregat yang
                ditampilkan.
              </li>
              <li>
                Pembandingan dilakukan terhadap median lintas tenant di
                platform, tidak per tenant individu.
              </li>
              <li>
                Metrik yang memiliki sampel kurang dari 5 entri tidak
                ditampilkan untuk menjaga privasi dan akurasi.
              </li>
              <li>
                Status &quot;sebanding&quot; menggunakan ambang ±20% dari median
                platform.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
