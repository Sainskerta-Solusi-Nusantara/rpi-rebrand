import { ShieldCheck, ShieldX } from 'lucide-react'
import { getTenantMembersTwoFactorStatus } from '@/lib/tenants/tenant-2fa-queries'
import { NudgeMemberButton } from '@/components/organisms/tenant-two-factor-policy'
import { getServerT } from '@/lib/i18n/server-dictionary'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  MEMBER: 'Member',
}

/**
 * Server component — lists tenant members with their 2FA status. Designed
 * to be embedded under the tenant security page. Renders the row-level
 * "Ingatkan anggota" client button for members who haven't enrolled.
 */
export async function TenantMembers2faTable({
  tenantId,
  tenantSlug,
  canNudge,
}: {
  tenantId: string
  tenantSlug: string
  canNudge: boolean
}) {
  const t = await getServerT()
  const ns = t.formsTenantAdmin2.members2faTable
  const members = await getTenantMembersTwoFactorStatus(tenantId)

  if (members.length === 0) {
    return <p className="text-muted-foreground text-sm">{ns.emptyMembers}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
            <th className="py-2 pr-3 font-medium">{ns.thMember}</th>
            <th className="py-2 pr-3 font-medium">{ns.thRole}</th>
            <th className="py-2 pr-3 font-medium">{ns.th2faStatus}</th>
            <th className="py-2 pr-3 font-medium">{ns.thActiveSince}</th>
            <th className="py-2 font-medium text-right">{ns.thAction}</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.userId} className="border-border/60 border-b last:border-b-0">
              <td className="py-2 pr-3">
                <div className="font-medium text-foreground">
                  {m.name ?? m.email}
                </div>
                <div className="text-muted-foreground text-xs">{m.email}</div>
              </td>
              <td className="py-2 pr-3 text-xs">{roleLabels[m.role] ?? m.role}</td>
              <td className="py-2 pr-3">
                {m.totpEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-300">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    {ns.statusActive}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
                    <ShieldX className="h-3 w-3" aria-hidden="true" />
                    {ns.statusInactive}
                  </span>
                )}
              </td>
              <td className="py-2 pr-3 whitespace-nowrap text-xs">
                {m.totpEnabledAt ? dateFmt.format(m.totpEnabledAt) : '—'}
              </td>
              <td className="py-2 text-right">
                {canNudge && !m.totpEnabled ? (
                  <NudgeMemberButton
                    tenantSlug={tenantSlug}
                    userId={m.userId}
                    alreadyEnrolled={m.totpEnabled}
                  />
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
