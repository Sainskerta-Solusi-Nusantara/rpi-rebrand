import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

const PARTNER_ROLES = new Set(['SUPERADMIN', 'ADMIN', 'PARTNER'])

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login?callbackUrl=/partner')
  }

  const role = session.user.globalRole
  const hasTenantMembership = (session.user.tenants ?? []).length > 0
  // Allow if global role is partner-tier OR user has at least one tenant membership.
  if (!PARTNER_ROLES.has(role) && !hasTenantMembership) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
