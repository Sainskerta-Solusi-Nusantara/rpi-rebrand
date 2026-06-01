import { cache } from 'react'
import type { TenantRole } from '@prisma/client'
import { prisma } from '@/lib/db'

export type TenantMember2faRow = {
  userId: string
  name: string | null
  email: string
  role: TenantRole
  totpEnabled: boolean
  totpEnabledAt: Date | null
}

/**
 * Members of a tenant with their 2FA status. Used by the tenant security
 * dashboard so the OWNER can see who hasn't enrolled yet.
 *
 * Cached per request via `react.cache` — multiple components on the page
 * may consume this.
 */
export const getTenantMembersTwoFactorStatus = cache(
  async (tenantId: string): Promise<TenantMember2faRow[]> => {
    if (!tenantId) return []
    try {
      const rows = await prisma.userTenant.findMany({
        where: { tenantId, status: 'active' },
        orderBy: { joinedAt: 'asc' },
        select: {
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              totpEnabledAt: true,
            },
          },
        },
      })
      return rows.map((r) => ({
        userId: r.user.id,
        name: r.user.name,
        email: r.user.email,
        role: r.role,
        totpEnabled: Boolean(r.user.totpEnabledAt),
        totpEnabledAt: r.user.totpEnabledAt,
      }))
    } catch {
      return []
    }
  },
)

export type TenantTwoFactorPolicy = {
  requireTwoFactor: boolean
  membersTotal: number
  membersWithTwoFactor: number
  membersWithoutTwoFactor: number
}

/** Roll-up: how many members are compliant under the current policy. */
export const getTenantTwoFactorPolicy = cache(
  async (tenantId: string): Promise<TenantTwoFactorPolicy | null> => {
    if (!tenantId) return null
    try {
      const [tenant, members] = await Promise.all([
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { requireTwoFactor: true },
        }),
        getTenantMembersTwoFactorStatus(tenantId),
      ])
      if (!tenant) return null
      const compliant = members.filter((m) => m.totpEnabled).length
      return {
        requireTwoFactor: tenant.requireTwoFactor,
        membersTotal: members.length,
        membersWithTwoFactor: compliant,
        membersWithoutTwoFactor: members.length - compliant,
      }
    } catch {
      return null
    }
  },
)

/** Per-user 2FA snapshot for the SUPERADMIN reset page. */
export const getUserTwoFactorAdminSnapshot = cache(
  async (
    userId: string,
  ): Promise<{
    id: string
    email: string
    name: string | null
    totpEnabledAt: Date | null
    recoveryCodeCount: number
    recoveryCodeUsed: number
  } | null> => {
    if (!userId) return null
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          totpEnabledAt: true,
        },
      })
      if (!user) return null
      const [total, used] = await Promise.all([
        prisma.totpRecoveryCode.count({ where: { userId } }),
        prisma.totpRecoveryCode.count({ where: { userId, usedAt: { not: null } } }),
      ])
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        totpEnabledAt: user.totpEnabledAt,
        recoveryCodeCount: total - used,
        recoveryCodeUsed: used,
      }
    } catch {
      return null
    }
  },
)
