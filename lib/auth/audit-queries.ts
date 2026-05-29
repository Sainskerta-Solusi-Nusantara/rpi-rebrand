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

export const getUserSecuritySnapshot = cache(
  async (
    userId: string,
  ): Promise<{
    lastLoginAt: Date | null
    passwordSet: boolean
    googleLinked: boolean
    email: string | null
    emailVerifiedAt: Date | null
  }> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          emailVerified: true,
          lastLoginAt: true,
          passwordHash: true,
          accounts: { where: { provider: 'google' }, select: { id: true } },
        },
      })
      return {
        lastLoginAt: user?.lastLoginAt ?? null,
        passwordSet: Boolean(user?.passwordHash),
        googleLinked: Boolean(user?.accounts?.length),
        email: user?.email ?? null,
        emailVerifiedAt: user?.emailVerified ?? null,
      }
    } catch {
      return {
        lastLoginAt: null,
        passwordSet: false,
        googleLinked: false,
        email: null,
        emailVerifiedAt: null,
      }
    }
  },
)
