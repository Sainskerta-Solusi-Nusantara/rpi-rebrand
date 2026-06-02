import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatNumber, formatDate } from '@/lib/i18n/format'

export const metadata = { title: 'Manajemen Tenant' }

export default async function AdminTenantsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.globalRole !== 'SUPERADMIN') {
    redirect('/admin')
  }

  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const tt = t.admin.tenants
  const statusLabels: Record<string, string> = t.admin.tenantStatus
  const planLabels: Record<string, string> = t.admin.plans

  const tenants = await prisma.tenant
    .findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, jobs: true, applications: true } },
      },
    })
    .catch(() => [])

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{tt.title}</h1>
        <p className="text-muted-foreground mt-1">
          {tt.subtitle.replace('{n}', formatNumber(tenants.length, locale))}
        </p>
      </header>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">{tt.colTenant}</th>
              <th className="p-3">{tt.colSlug}</th>
              <th className="p-3">{tt.colPlan}</th>
              <th className="p-3">{tt.colStatus}</th>
              <th className="p-3">{tt.colUsers}</th>
              <th className="p-3">{tt.colJobs}</th>
              <th className="p-3">{tt.colApplications}</th>
              <th className="p-3">{tt.colCreated}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-medium">
                  <Link
                    href={`/admin/tenants/${t.id}` as never}
                    className="hover:underline"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="p-3 font-mono text-xs">{t.slug}</td>
                <td className="p-3">{planLabels[t.planTier] ?? t.planTier}</td>
                <td className="p-3">{statusLabels[t.status] ?? t.status}</td>
                <td className="p-3">{t._count.users}</td>
                <td className="p-3">{t._count.jobs}</td>
                <td className="p-3">{t._count.applications}</td>
                <td className="p-3">{formatDate(t.createdAt, locale)}</td>
                <td className="p-3 text-right">
                  <Link
                    href={`/admin/tenants/${t.id}` as never}
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    {tt.detail}
                  </Link>
                </td>
              </tr>
            ))}
            {tenants.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={9}>
                  {tt.empty}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
