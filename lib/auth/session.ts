import { redirect } from 'next/navigation'
import { getServerSession, type Session } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import type { GlobalRole } from '@/types/next-auth'

/** Shorthand for getServerSession with our authOptions. */
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions)
}

/**
 * Require an authenticated session in a Server Component / Route Handler.
 * Redirects to /login (with callbackUrl) if missing.
 */
export async function requireAuth(callbackUrl?: string): Promise<Session> {
  const session = await auth()
  if (!session?.user) {
    const target = callbackUrl
      ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/login'
    redirect(target)
  }
  return session
}

/** Require at least one of the supplied global roles. Redirects to / if not satisfied. */
export async function requireRole(...roles: GlobalRole[]): Promise<Session> {
  const session = await requireAuth()
  if (!roles.includes(session.user.globalRole)) {
    redirect('/')
  }
  return session
}

/**
 * Require the authenticated user to be a member of the given tenant.
 * SUPERADMIN/ADMIN bypass membership check.
 */
export async function requireTenantMember(tenantId: string): Promise<Session> {
  const session = await requireAuth()
  const { globalRole, tenants } = session.user
  if (globalRole === 'SUPERADMIN' || globalRole === 'ADMIN') return session
  const isMember = tenants.some((t) => t.tenantId === tenantId)
  if (!isMember) redirect('/')
  return session
}
