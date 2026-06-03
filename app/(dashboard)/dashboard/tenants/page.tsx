import Link from 'next/link'
import { Plus, Users, Building2 } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { getServerT } from '@/lib/i18n/server-dictionary'

export const metadata = { title: 'Tenant Saya — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

export default async function MyTenantsPage() {
  const session = await requireAuth('/dashboard/tenants')
  const t = await getServerT()

  const memberships = await prisma.userTenant
    .findMany({
      where: { userId: session.user.id },
      orderBy: { joinedAt: 'desc' },
      select: {
        role: true,
        joinedAt: true,
        tenant: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            planTier: true,
            _count: { select: { users: true, jobs: true } },
          },
        },
      },
    })
    .catch(() => [])

  const statusLabels: Record<string, { label: string; tone: string }> = {
    ACTIVE: { label: t.pagesTenant1.tenantsList.statusActive, tone: 'bg-green-100 text-green-800' },
    SUSPENDED: { label: t.pagesTenant1.tenantsList.statusSuspended, tone: 'bg-red-100 text-red-800' },
    PROVISIONING: { label: t.pagesTenant1.tenantsList.statusProvisioning, tone: 'bg-amber-100 text-amber-800' },
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">{t.pagesTenant1.tenantsList.heading}</h1>
          <p className="text-muted-foreground mt-1">
            {memberships.length === 0
              ? t.pagesTenant1.tenantsList.subtitleEmpty
              : t.pagesTenant1.tenantsList.subtitleCount.replace('{n}', String(memberships.length))}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.pagesTenant1.tenantsList.createBtn}
        </Link>
      </header>

      {memberships.length === 0 ? (
        <div className="border-border bg-card flex flex-col items-center gap-3 rounded-2xl border p-10 text-center">
          <div className="bg-muted grid size-12 place-items-center rounded-full">
            <Building2 className="text-muted-foreground h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg">{t.pagesTenant1.tenantsList.emptyTitle}</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {t.pagesTenant1.tenantsList.emptyDesc}
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.pagesTenant1.tenantsList.createFirstBtn}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {memberships.map((m) => {
            const statusInfo =
              statusLabels[m.tenant.status] ?? {
                label: m.tenant.status,
                tone: 'bg-muted text-muted-foreground',
              }
            return (
              <Link
                key={m.tenant.id}
                href={`/dashboard/tenants/${m.tenant.slug}` as never}
                className="border-border bg-card hover:border-foreground/20 rounded-2xl border p-5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg leading-tight">{m.tenant.name}</h2>
                    <p className="text-muted-foreground font-mono text-xs">{m.tenant.slug}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.tone}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
                <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.pagesTenant1.tenantsList.memberCount.replace('{n}', String(m.tenant._count.users))}
                  </span>
                  <span>·</span>
                  <span>{t.pagesTenant1.tenantsList.jobCount.replace('{n}', String(m.tenant._count.jobs))}</span>
                  <span>·</span>
                  <span>{m.tenant.planTier}</span>
                </div>
                <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                  <span>
                    {t.pagesTenant1.tenantsList.yourRole}{' '}
                    <span className="text-foreground font-medium">{m.role}</span>
                  </span>
                  <span>{t.pagesTenant1.tenantsList.joinedDate.replace('{date}', dateFmt.format(m.joinedAt))}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
