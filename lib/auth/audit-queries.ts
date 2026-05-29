import { cache } from 'react'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'

export type AuthEvent = {
  id: string
  action: string
  ip: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export const getRecentAuthEvents = cache(
  async (userId: string, limit = 10): Promise<AuthEvent[]> => {
    try {
      const rows = await prisma.auditLog.findMany({
        where: {
          userId,
          action: { in: [AuditAction.LOGIN, AuditAction.LOGOUT] },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(100, limit)),
        select: {
          id: true,
          action: true,
          ip: true,
          userAgent: true,
          metadata: true,
          createdAt: true,
        },
      })
      return rows.map((r) => ({
        id: r.id,
        action: r.action as string,
        ip: r.ip,
        userAgent: r.userAgent,
        metadata: (r.metadata as Record<string, unknown> | null) ?? null,
        createdAt: r.createdAt,
      }))
    } catch {
      return []
    }
  },
)

export type UserDeviceSummary = {
  id: string
  userAgent: string
  ipFirstSeen: string | null
  ipLastSeen: string | null
  firstSeenAt: Date
  lastSeenAt: Date
  loginCount: number
  revokedAt: Date | null
}

export const getUserDevices = cache(
  async (userId: string, limit = 10): Promise<UserDeviceSummary[]> => {
    try {
      const rows = await prisma.userDevice.findMany({
        where: { userId },
        orderBy: [{ revokedAt: 'asc' }, { lastSeenAt: 'desc' }],
        take: Math.max(1, Math.min(50, limit)),
        select: {
          id: true,
          userAgent: true,
          ipFirstSeen: true,
          ipLastSeen: true,
          firstSeenAt: true,
          lastSeenAt: true,
          loginCount: true,
          revokedAt: true,
        },
      })
      return rows
    } catch {
      return []
    }
  },
)

export const getUserSecuritySnapshot = cache(
  async (
    userId: string,
  ): Promise<{
    lastLoginAt: Date | null
    passwordSet: boolean
    googleLinked: boolean
    email: string | null
    emailVerifiedAt: Date | null
    totpEnabledAt: Date | null
    recoveryCodeCount: number
  }> => {
    try {
      const [user, recoveryCodeCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            emailVerified: true,
            lastLoginAt: true,
            passwordHash: true,
            totpEnabledAt: true,
            accounts: { where: { provider: 'google' }, select: { id: true } },
          },
        }),
        prisma.totpRecoveryCode.count({
          where: { userId, usedAt: null },
        }),
      ])
      return {
        lastLoginAt: user?.lastLoginAt ?? null,
        passwordSet: Boolean(user?.passwordHash),
        googleLinked: Boolean(user?.accounts?.length),
        email: user?.email ?? null,
        emailVerifiedAt: user?.emailVerified ?? null,
        totpEnabledAt: user?.totpEnabledAt ?? null,
        recoveryCodeCount,
      }
    } catch {
      return {
        lastLoginAt: null,
        passwordSet: false,
        googleLinked: false,
        email: null,
        emailVerifiedAt: null,
        totpEnabledAt: null,
        recoveryCodeCount: 0,
      }
    }
  },
)
