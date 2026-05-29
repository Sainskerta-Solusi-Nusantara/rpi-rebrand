import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Building2, UserPlus, Mail } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission, canAccessTenant } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { TenantInviteForm, RevokeInviteButton } from '@/components/organisms/tenant-invite-form'

export const metadata = { title: 'Kelola Tenant — Dasbor' }

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateShort = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' })

const statusLabels: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'Aktif', tone: 'bg-green-100 text-green-800' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'bg-red-100 text-red-800' },
  PROVISIONING: { label: 'Provisioning', tone: 'bg-amber-100 text-amber-800' },
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  MEMBER: 'Member',
}

export default async function ManageTenantPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}`)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        planTier: true,
        createdAt: true,
        ownerUserId: true,
      },
    })
    .catch(() => null)

  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!canAccessTenant(globalRole, tenants, tenant.id)) {
    notFound()
  }

  const canInvite = hasTenantPermission(globalRole, tenants, tenant.id, 'team.invite')

  const [members, invitations] = await Promise.all([
    prisma.userTenant.findMany({
      where: { tenantId: tenant.id },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        role: true,
        status: true,
        joinedAt: true,
        user: { select: { id: true, email: true, name: true, image: true } },
      },
    }),
    canInvite
      ? prisma.invitation.findMany({
          where: { tenantId: tenant.id, acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
        })
      : Promise.resolve([]),
  ])

  const statusInfo =
    statusLabels[tenant.status] ?? {
      label: tenant.status,
      tone: 'bg-muted text-muted-foreground',
    }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          href="/dashboard/tenants"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke tenant saya
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
            <Building2 className="h-6 w-6" aria-hidden="true" />
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
            {tenant.planTier}
          </span>
        </div>
      </header>

      <section
        aria-label="Anggota"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg">Anggota ({members.length})</h2>
        </div>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada anggota.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Pengguna</th>
                  <th className="py-2 pr-3 font-medium">Peran</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Bergabung</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        {m.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.user.image}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted size-8 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium">{m.user.name ?? m.user.email}</div>
                          <div className="text-muted-foreground text-xs">{m.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{roleLabels[m.role] ?? m.role}</td>
                    <td className="py-2 pr-3 text-xs">{m.status}</td>
                    <td className="py-2 whitespace-nowrap text-xs">
                      {dateShort.format(m.joinedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canInvite && (
        <section
          aria-label="Undang anggota"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">Undang anggota baru</h2>
          </div>
          <TenantInviteForm tenantSlug={tenant.slug} />
        </section>
      )}

      {canInvite && invitations.length > 0 && (
        <section
          aria-label="Undangan tertunda"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">
              Undangan tertunda ({invitations.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Peran</th>
                  <th className="py-2 pr-3 font-medium">Dikirim</th>
                  <th className="py-2 pr-3 font-medium">Berlaku hingga</th>
                  <th className="py-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium">{inv.email}</td>
                    <td className="py-2 pr-3">{roleLabels[inv.role] ?? inv.role}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(inv.createdAt)}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-xs">
                      {dateFmt.format(inv.expiresAt)}
                    </td>
                    <td className="py-2 text-right">
                      <RevokeInviteButton invitationId={inv.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
