import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Mail, Globe, Clock, ShieldCheck, ShieldX, KeyRound } from 'lucide-react'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { AdminUserActions } from '@/components/organisms/admin-user-actions'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatDate } from '@/lib/i18n/format'

export const metadata = { title: 'Detail Pengguna — Admin' }

const roleLabels: Record<string, { label: string; tone: string }> = {
  SUPERADMIN: { label: 'SUPERADMIN', tone: 'bg-amber-100 text-amber-800' },
  ADMIN: { label: 'ADMIN', tone: 'bg-blue-100 text-blue-800' },
  PARTNER: { label: 'PARTNER', tone: 'bg-purple-100 text-purple-800' },
  USER: { label: 'USER', tone: 'bg-slate-100 text-slate-800' },
}

function truncate(value: string | null | undefined, max = 60): string {
  if (!value) return '—'
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) notFound()

  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const td = t.admin.userDetail
  const cols = t.admin.common.auditCols
  const statusLabels: Record<string, string> = t.admin.userStatus
  const fmt = (d: Date) =>
    formatDate(d, locale, { dateStyle: 'medium', timeStyle: 'short' })

  const user = await prisma.user
    .findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        bio: true,
        headline: true,
        location: true,
        globalRole: true,
        status: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        accounts: { select: { provider: true } },
        tenants: {
          select: {
            tenantId: true,
            role: true,
            joinedAt: true,
            tenant: { select: { slug: true, name: true } },
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            ip: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    })
    .catch(() => null)

  if (!user) notFound()

  const isSelf = session.user.id === user.id
  const actorRole = session.user.globalRole
  const canChangeRole = actorRole === 'SUPERADMIN'
  const canChangeStatus =
    (actorRole === 'SUPERADMIN') ||
    (actorRole === 'ADMIN' && user.globalRole !== 'SUPERADMIN' && user.globalRole !== 'ADMIN')

  const roleTone = roleLabels[user.globalRole] ?? { label: user.globalRole, tone: 'bg-muted text-muted-foreground' }
  const googleLinked = user.accounts.some((a) => a.provider === 'google')

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {td.back}
        </Link>
      </div>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="size-14 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted size-14 rounded-full" />
          )}
          <div>
            <h1 className="font-heading text-2xl md:text-3xl">{user.name ?? user.email}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${roleTone.tone}`}
          >
            {roleTone.label}
          </span>
          <span
            className={
              user.status === 'ACTIVE'
                ? 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800'
                : user.status === 'SUSPENDED'
                  ? 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800'
                  : 'bg-muted text-muted-foreground inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium'
            }
          >
            {statusLabels[user.status] ?? user.status}
          </span>
          {user.emailVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              {td.emailVerified}
            </span>
          ) : (
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
              <ShieldX className="h-3 w-3" aria-hidden="true" />
              {td.emailUnverified}
            </span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-label="Profil"
          className="border-border bg-card rounded-2xl border p-6 lg:col-span-2"
        >
          <h2 className="font-heading mb-4 text-lg">{td.profileHeading}</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {td.email}
              </dt>
              <dd className="mt-1 text-sm font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">{td.phone}</dt>
              <dd className="mt-1 text-sm font-medium">{user.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">{td.headline}</dt>
              <dd className="mt-1 text-sm font-medium">{user.headline ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">{td.location}</dt>
              <dd className="mt-1 text-sm font-medium">{user.location ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                {td.google}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {googleLinked ? td.googleLinked : td.googleUnlinked}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {td.lastLogin}
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {user.lastLoginAt ? fmt(user.lastLoginAt) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase">{td.registered}</dt>
              <dd className="mt-1 text-sm font-medium">{fmt(user.createdAt)}</dd>
            </div>
            {user.bio && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs uppercase">{td.bio}</dt>
                <dd className="mt-1 text-sm">{user.bio}</dd>
              </div>
            )}
          </dl>
        </section>

        <aside
          aria-label="Tindakan admin"
          className="border-border bg-card rounded-2xl border p-6"
        >
          <h2 className="font-heading mb-4 text-lg">{td.actionsHeading}</h2>
          <AdminUserActions
            userId={user.id}
            currentRole={user.globalRole}
            currentStatus={user.status}
            canChangeRole={canChangeRole}
            canChangeStatus={canChangeStatus}
            isSelf={isSelf}
          />
          {actorRole === 'SUPERADMIN' && (
            <div className="border-border mt-6 border-t pt-4">
              <Link
                href={`/admin/users/${user.id}/two-factor` as never}
                className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                {td.resetTwoFactor}
              </Link>
            </div>
          )}
        </aside>
      </div>

      <section aria-label="Keanggotaan tenant" className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">{td.tenantMembershipHeading}</h2>
        {user.tenants.length === 0 ? (
          <p className="text-muted-foreground text-sm">{td.noMembership}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{td.colTenant}</th>
                  <th className="py-2 pr-3 font-medium">{td.colSlug}</th>
                  <th className="py-2 pr-3 font-medium">{td.colRole}</th>
                  <th className="py-2 font-medium">{td.colJoined}</th>
                </tr>
              </thead>
              <tbody>
                {user.tenants.map((m) => (
                  <tr key={m.tenantId} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 font-medium">{m.tenant.name}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      <Link
                        href={`/admin/tenants/${m.tenantId}` as never}
                        className="hover:underline"
                      >
                        {m.tenant.slug}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{m.role}</td>
                    <td className="py-2 whitespace-nowrap">{fmt(m.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Aktivitas audit" className="border-border bg-card rounded-2xl border p-6">
        <h2 className="font-heading mb-4 text-lg">{t.admin.common.recentActivity}</h2>
        {user.auditLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.admin.common.noActivity}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                  <th className="py-2 pr-3 font-medium">{cols.time}</th>
                  <th className="py-2 pr-3 font-medium">{cols.action}</th>
                  <th className="py-2 pr-3 font-medium">{cols.resource}</th>
                  <th className="py-2 pr-3 font-medium">{cols.metadata}</th>
                  <th className="py-2 font-medium">{cols.ip}</th>
                </tr>
              </thead>
              <tbody>
                {user.auditLogs.map((l) => (
                  <tr key={l.id} className="border-border/60 border-b last:border-b-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{fmt(l.createdAt)}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{l.action}</td>
                    <td className="py-2 pr-3 font-mono text-xs">
                      {l.resource}
                      {l.resourceId ? `#${l.resourceId.slice(0, 8)}` : ''}
                    </td>
                    <td className="text-muted-foreground py-2 pr-3 max-w-[18rem] text-xs">
                      {truncate(
                        l.metadata ? JSON.stringify(l.metadata) : null,
                        80,
                      )}
                    </td>
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
