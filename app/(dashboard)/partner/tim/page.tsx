import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db'
import { headers } from 'next/headers'
import { getServerT, getServerLocale } from '@/lib/i18n/server-dictionary'
import { formatDate } from '@/lib/i18n/format'

function makeFallback(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function Fallback(_props: any) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="bg-muted my-4 h-48 w-full animate-pulse rounded-xl"
        data-todo={`component:${label}`}
      />
    )
  }
}
function safeRequire<T = unknown>(path: string, exportName: string): T {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(path)
    return (mod?.[exportName] ?? makeFallback(`${path}#${exportName}`)) as T
  } catch {
    return makeFallback(`${path}#${exportName}`) as unknown as T
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const InviteForm: any = safeRequire('@/components/molecules/invite-form', 'InviteForm')

export const metadata = { title: 'Tim Saya' }

async function resolveTenantId(userId: string): Promise<string | null> {
  const hSlug = headers().get('x-tenant-slug')
  if (hSlug) {
    const t = await prisma.tenant.findUnique({ where: { slug: hSlug }, select: { id: true } }).catch(() => null)
    if (t?.id) return t.id
  }
  const ut = await prisma.userTenant
    .findFirst({ where: { userId }, select: { tenantId: true } })
    .catch(() => null)
  return ut?.tenantId ?? null
}

export default async function PartnerTeamPage() {
  const [t, locale] = await Promise.all([getServerT(), getServerLocale()])
  const tp = t.partner
  const roleLabels: Record<string, string> = tp.roles
  const session = await getServerSession(authOptions)
  const tenantId = await resolveTenantId(session!.user.id)

  const [members, invitations] = await Promise.all([
    tenantId
      ? prisma.userTenant
          .findMany({
            where: { tenantId },
            orderBy: { joinedAt: 'desc' },
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          })
          .catch(() => [])
      : Promise.resolve([]),
    tenantId
      ? prisma.invitation
          .findMany({
            where: { tenantId, acceptedAt: null },
            orderBy: { createdAt: 'desc' },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ])

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="font-heading text-2xl md:text-3xl">{tp.team.title}</h1>
        <p className="text-muted-foreground mt-1">
          {tp.team.subtitle
            .replace('{members}', String(members.length))
            .replace('{invites}', String(invitations.length))}
        </p>
      </header>

      <InviteForm />

      <section>
        <h2 className="font-heading text-xl mb-4">{tp.team.membersHeading}</h2>
        {members.length === 0 ? (
          <p className="text-muted-foreground">{tp.team.noMembers}</p>
        ) : (
          <ul className="border-border divide-border divide-y rounded-xl border">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.user.image}
                      alt={m.user.name ?? m.user.email}
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted size-10 rounded-full" />
                  )}
                  <div>
                    <div className="font-medium">{m.user.name ?? m.user.email}</div>
                    <div className="text-muted-foreground text-xs">{m.user.email}</div>
                  </div>
                </div>
                <div className="text-sm font-medium">{roleLabels[m.role] ?? m.role}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {invitations.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl mb-4">{tp.team.pendingHeading}</h2>
          <ul className="border-border divide-border divide-y rounded-xl border">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-muted-foreground text-xs">
                    {tp.team.expires.replace('{date}', formatDate(inv.expiresAt, locale))}
                  </div>
                </div>
                <div className="text-sm">{roleLabels[inv.role] ?? inv.role}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
