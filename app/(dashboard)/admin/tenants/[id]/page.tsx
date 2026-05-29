import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Building2, Users, Briefcase, FileText } from 'lucide-react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { AdminTenantActions } from '@/components/organisms/admin-tenant-actions'

export const metadata = { title: 'Detail Tenant — Admin' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusLabels: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'Aktif', tone: 'bg-green-100 text-green-800' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'bg-red-100 text-red-800' },
  PROVISIONING: { label: 'Provisioning', tone: 'bg-amber-100 text-amber-800' },
}

const planLabels: Record<string, string> = {
  FREE: 'Gratis',
  PRO: 'Pro',
  BUSINESS: 'Bisnis',
  ENTERPRISE: 'Enterprise',
}

export default async function AdminTenantDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) notFound()
  if (session.user.globalRole !== 'SUPERADMIN') redirect('/admin')

  const tenant = await prisma.tenant
    .findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true, jobs: true, applications: true },
        },
        users: {
          take: 10,
          orderBy: { joinedAt: 'desc' },
          select: {
            userId: true,
            role: true,
            joinedAt: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const recentAudit = await prisma.auditLog
    .findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true,
        metadata: true,
        ip: true,
        user: { select: { email: true } },
      },
    })
    .catch(() => [])

  const statusInfo =
    statusLabels[tenant.status] ?? { label: tenant.status, tone: 'bg-muted text-muted-foreground' }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <Link
          href="/admin/tenants"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke daftar tenant
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
            <Building2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">{tenant.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{tenant.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.tone}`}
          >
            {statusInfo.label}
          </span>
          <span className="border-border inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
            {planLabels[tenant.planTier] ?? tenant.planTier}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Anggota
          </div>
          <div className="font-heading mt-2 text-2xl">{tenant._count.users.toLocaleString('id-ID')}</div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            Lowongan
          </div>
          <div className="font-heading mt-2 text-2xl">{tenant._count.jobs.toLocaleString('id-ID')}</div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Lamaran
          </div>
          <div className="font-heading mt-2 text-2xl">{tenant._count.applications.toLocaleString('id-ID')}</div>
        </div>
        <div className="border-border bg-card rounded-xl border p-4">
          <div className="text-muted-foreground text-xs uppercase">Dibuat</div>
          <div className="mt-2 text-sm font-medium">{dateFmt.format(tenant.createdAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-label="Detail tenant"
          className="border-border bg-card rounded-2xl border p-6 lg:col-span-2"
        >
          <h2 className="font-heading mb-4 text-lg">Detail</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Nama</dt>
              <dd className="mt-1 text-sm font-medium">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Slug</dt>
              <dd className="mt-1 font-mono text-sm">{tenant.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Custom domain</dt>
              <dd className="mt-1 text-sm">{tenant.customDomain ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Owner</dt>
              <dd className="mt-1 font-mono text-xs">{tenant.ownerUserId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">Diperbarui</dt>
              <dd className="mt-1 text-sm">{dateFmt.format(tenant.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        <aside
          aria-label="Tindakan admin"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <h2 className="font-heading mb-4 text-lg">Tindakan</h2>
          <AdminTenantActions
            tenantId={tenant.id}
            currentStatus={tenant.status}
            currentPlan={tenant.planTier}
          />
        </aside>
      </div>

      <section aria-label="Anggota terbaru" className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">Anggota terbaru</h2>
        {tenant.users.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada anggota.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Pengguna</th>
                  <th className="py-2 pr-3 font-medium">Peran</th>
                  <th className="py-2 font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map((m) => (
                  <tr key={m.userId} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3">
                      <Link
                        href={`/admin/users/${m.userId}` as never}
                        className="hover:underline"
                      >
                        <div className="font-medium">{m.user.name ?? m.user.email}</div>
                        <div className="text-muted-foreground text-xs">{m.user.email}</div>
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{m.role}</td>
                    <td className="py-2 whitespace-nowrap">{dateFmt.format(m.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Audit tenant" className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">Aktivitas terakhir</h2>
        {recentAudit.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                  <th className="py-2 pr-3 font-medium">Sumber</th>
                  <th className="py-2 pr-3 font-medium">Pengguna</th>
                  <th className="py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {recentAudit.map((l) => (
                  <tr key={l.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{dateFmt.format(l.createdAt)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{l.action}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {l.resource}
                      {l.resourceId ? `#${l.resourceId.slice(0, 8)}` : ''}
                    </td>
                    <td className="py-2 pr-3">{l.user?.email ?? '—'}</td>
                    <td className="py-2 font-mono text-xs">{l.ip ?? '—'}</td>
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
