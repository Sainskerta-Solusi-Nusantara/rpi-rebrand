import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export const metadata = { title: 'Manajemen Tenant' }

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktif',
  SUSPENDED: 'Ditangguhkan',
  PROVISIONING: 'Provisioning',
}

const planLabels: Record<string, string> = {
  FREE: 'Gratis',
  PRO: 'Pro',
  BUSINESS: 'Bisnis',
  ENTERPRISE: 'Enterprise',
}

export default async function AdminTenantsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.globalRole !== 'SUPERADMIN') {
    redirect('/admin')
  }

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
        <h1 className="font-heading text-2xl md:text-3xl">Manajemen Tenant</h1>
        <p className="text-muted-foreground mt-1">
          {tenants.length.toLocaleString('id-ID')} tenant terdaftar di platform.
        </p>
      </header>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Tenant</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Paket</th>
              <th className="p-3">Status</th>
              <th className="p-3">Pengguna</th>
              <th className="p-3">Lowongan</th>
              <th className="p-3">Lamaran</th>
              <th className="p-3">Dibuat</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {tenants.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 font-mono text-xs">{t.slug}</td>
                <td className="p-3">{planLabels[t.planTier] ?? t.planTier}</td>
                <td className="p-3">{statusLabels[t.status] ?? t.status}</td>
                <td className="p-3">{t._count.users}</td>
                <td className="p-3">{t._count.jobs}</td>
                <td className="p-3">{t._count.applications}</td>
                <td className="p-3">
                  {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(t.createdAt)}
                </td>
              </tr>
            ))}
            {tenants.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-6 text-center" colSpan={8}>
                  Belum ada tenant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
