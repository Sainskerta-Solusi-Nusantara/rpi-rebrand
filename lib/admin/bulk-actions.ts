'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, type UserStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

const USER_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED'] as const

export type BulkSkipReason = 'self' | 'forbidden' | 'no_change' | 'not_found'

export type BulkUpdateUserStatusResult =
  | {
      ok: true
      data: {
        updated: number
        skipped: Partial<Record<BulkSkipReason, number>>
        errors: string[]
      }
    }
  | { ok: false; error: string }

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

async function requireAdmin(level: 'ADMIN' | 'SUPERADMIN' = 'ADMIN') {
  const session = await auth()
  if (!session?.user) return null
  const role = session.user.globalRole
  if (level === 'SUPERADMIN' && role !== 'SUPERADMIN') return null
  if (role !== 'SUPERADMIN' && role !== 'ADMIN') return null
  return session.user
}

const bulkStatusSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(USER_STATUSES),
})

/**
 * Bulk-update user status. ADMIN+.
 * Skips: self, forbidden (non-SUPERADMIN actor touching SUPERADMIN/ADMIN), no_change, not_found.
 * Each successful update produces an audit log with metadata { from, to, bulk: true }.
 */
export async function bulkUpdateUserStatus(input: {
  userIds: string[]
  status: UserStatus
}): Promise<BulkUpdateUserStatusResult> {
  const parsed = bulkStatusSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message ?? 'Input tidak valid.'
    return { ok: false, error: issue }
  }
  const { userIds, status } = parsed.data

  const actor = await requireAdmin('ADMIN')
  if (!actor) return { ok: false, error: 'Akses ditolak.' }

  // Deduplicate IDs upfront so we don't double-process.
  const uniqueIds = Array.from(new Set(userIds))

  const meta = getRequestMeta()

  type Outcome =
    | { kind: 'updated' }
    | { kind: 'skipped'; reason: BulkSkipReason }
    | { kind: 'error'; message: string }

  const results = await Promise.all(
    uniqueIds.map(async (userId): Promise<Outcome> => {
      try {
        if (userId === actor.id) {
          return { kind: 'skipped', reason: 'self' }
        }

        const target = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, status: true, globalRole: true },
        })
        if (!target) return { kind: 'skipped', reason: 'not_found' }

        if (
          actor.globalRole !== 'SUPERADMIN' &&
          (target.globalRole === 'SUPERADMIN' || target.globalRole === 'ADMIN')
        ) {
          return { kind: 'skipped', reason: 'forbidden' }
        }

        if (target.status === status) {
          return { kind: 'skipped', reason: 'no_change' }
        }

        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { status },
          }),
          prisma.auditLog.create({
            data: {
              action: AuditAction.UPDATE,
              userId: actor.id,
              resource: 'user.status',
              resourceId: userId,
              metadata: { from: target.status, to: status, bulk: true },
              ip: meta.ip,
              userAgent: meta.userAgent,
            },
          }),
        ])

        return { kind: 'updated' }
      } catch (err) {
        console.error('[bulkUpdateUserStatus] item failed', userId, err)
        return { kind: 'error', message: userId }
      }
    }),
  )

  let updated = 0
  const skipped: Partial<Record<BulkSkipReason, number>> = {}
  const errors: string[] = []

  for (const r of results) {
    if (r.kind === 'updated') {
      updated += 1
    } else if (r.kind === 'skipped') {
      skipped[r.reason] = (skipped[r.reason] ?? 0) + 1
    } else {
      errors.push(r.message)
    }
  }

  revalidatePath('/admin/users')

  return { ok: true, data: { updated, skipped, errors } }
}
