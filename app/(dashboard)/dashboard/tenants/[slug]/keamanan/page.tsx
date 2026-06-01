import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ShieldCheck, Users } from 'lucide-react'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission, canAccessTenant } from '@/lib/auth/rbac'
import { prisma } from '@/lib/db'
import { getTenantTwoFactorPolicy } from '@/lib/tenants/tenant-2fa-queries'
import { TenantTwoFactorPolicy } from '@/components/organisms/tenant-two-factor-policy'
import { TenantMembers2faTable } from '@/components/organisms/tenant-members-2fa-table'

export const metadata = { title: 'Keamanan Tenant — Dasbor' }

export default async function TenantSecurityPage({
  params,
}: {
  params: { slug: string }
}) {
  const session = await requireAuth(`/dashboard/tenants/${params.slug}/keamanan`)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true, ownerUserId: true },
    })
    .catch(() => null)
  if (!tenant) notFound()

  const { globalRole, tenants } = session.user
  if (!canAccessTenant(globalRole, tenants, tenant.id)) {
    notFound()
  }

  const isOwner =
    tenant.ownerUserId === session.user.id || globalRole === 'SUPERADMIN'
  if (!isOwner) {
    // Non-owners get a 404 to keep the URL undiscoverable.
    notFound()
  }

  const canNudge = hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')
  const policy = (await getTenantTwoFactorPolicy(tenant.id)) ?? {
    requireTwoFactor: false,
    membersTotal: 0,
    membersWithTwoFactor: 0,
    membersWithoutTwoFactor: 0,
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <Link
          href={`/dashboard/tenants/${tenant.slug}` as never}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke tenant
        </Link>
      </div>

      <header className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-xl bg-[hsl(220,50%,14%)] text-white">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl">Keamanan tenant</h1>
          <p className="text-muted-foreground text-sm">
            {tenant.name} · kebijakan 2FA &amp; kepatuhan anggota
          </p>
        </div>
      </header>

      <section
        aria-label="Kebijakan 2FA"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-heading text-lg">Kebijakan 2FA</h2>
        </div>
        <TenantTwoFactorPolicy
          tenantSlug={tenant.slug}
          initialRequired={policy.requireTwoFactor}
          pendingCount={policy.membersWithoutTwoFactor}
        />
      </section>

      <section
        aria-label="Status anggota"
        className="border-border bg-card rounded-2xl border p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-heading text-lg">
              Status 2FA anggota ({policy.membersTotal})
            </h2>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-800">
              {policy.membersWithTwoFactor} aktif
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
              {policy.membersWithoutTwoFactor} belum
            </span>
          </div>
        </div>

        <TenantMembers2faTable
          tenantId={tenant.id}
          tenantSlug={tenant.slug}
          canNudge={canNudge}
        />
      </section>
    </div>
  )
}
