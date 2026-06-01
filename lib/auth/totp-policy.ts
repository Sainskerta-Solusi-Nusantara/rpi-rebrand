import { cache } from 'react'
import { prisma } from '@/lib/db'

/**
 * 2FA policy enforcement helpers.
 *
 * Force-2FA = a tenant OWNER may flip `Tenant.requireTwoFactor=true`. Once
 * that's set, every member of that tenant whose `User.totpEnabledAt` is null
 * must enroll before they can use the dashboard. SUPERADMIN bypasses (they
 * are the ones who manage the policy).
 *
 * Base 2FA enrollment / verify lives in `lib/auth/totp.ts` and
 * `lib/auth/totp-actions.ts` — do not duplicate that here.
 */

export type TotpEnabledShape = { totpEnabledAt: Date | null | undefined } | null | undefined

/** True if the user has finished TOTP enrollment. */
export function isTotpEnabled(user: TotpEnabledShape): boolean {
  return Boolean(user?.totpEnabledAt)
}

/**
 * Whether a tenant currently has the force-2FA policy turned on. Cached per
 * request so the dashboard layout can call it without extra round trips.
 */
export const tenantRequiresTwoFactor = cache(async (tenantId: string): Promise<boolean> => {
  if (!tenantId) return false
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { requireTwoFactor: true },
    })
    return Boolean(tenant?.requireTwoFactor)
  } catch {
    return false
  }
})

export type EnrollmentBlocker = {
  tenantId: string
  tenantName: string
  tenantSlug: string
}

/**
 * Returns the FIRST tenant that forces 2FA and where the user is still a
 * member without 2FA enrolled. Returns null if the user is compliant or has
 * no such memberships.
 *
 * Cached per request — both the dashboard layout and a redirect callsite
 * may probe this.
 */
export const userMustEnrollTwoFactor = cache(
  async (userId: string): Promise<EnrollmentBlocker | null> => {
    if (!userId) return null
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totpEnabledAt: true, globalRole: true },
      })
      if (!user) return null
      // Already enrolled → never blocked.
      if (user.totpEnabledAt) return null
      // SUPERADMIN manages the policy itself — never gated by it.
      if (user.globalRole === 'SUPERADMIN') return null

      const membership = await prisma.userTenant.findFirst({
        where: {
          userId,
          status: 'active',
          tenant: { requireTwoFactor: true },
        },
        orderBy: { joinedAt: 'asc' },
        select: {
          tenant: { select: { id: true, name: true, slug: true } },
        },
      })
      if (!membership) return null
      return {
        tenantId: membership.tenant.id,
        tenantName: membership.tenant.name,
        tenantSlug: membership.tenant.slug,
      }
    } catch {
      return null
    }
  },
)

/**
 * Throws when the user must enroll but hasn't yet. For use inside Server
 * Actions where a synchronous throw is preferable to redirect handling.
 */
export async function assertTwoFactorReady(userId: string): Promise<void> {
  const blocker = await userMustEnrollTwoFactor(userId)
  if (blocker) {
    throw new Error(
      `Tenant ${blocker.tenantName} mewajibkan 2FA. Aktifkan 2FA terlebih dulu.`,
    )
  }
}
