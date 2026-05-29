import type { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type ActivityFilters = {
  action?: AuditAction
  resource?: string
  from?: Date
  to?: Date
}

export type ActivityRow = {
  id: string
  action: string
  resource: string
  resourceId: string | null
  metadata: unknown
  ip: string | null
  userAgent: string | null
  tenantSlug: string | null
  createdAt: Date
}

function buildWhere(userId: string, f: ActivityFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = { userId }
  if (f.action) where.action = f.action
  if (f.resource && f.resource.trim()) {
    where.resource = { contains: f.resource.trim(), mode: 'insensitive' }
  }
  if (f.from || f.to) {
    where.createdAt = {}
    if (f.from) where.createdAt.gte = f.from
    if (f.to) where.createdAt.lte = f.to
  }
  return where
}

export async function listActivity(
  userId: string,
  f: ActivityFilters,
  opts: { page: number; pageSize: number },
): Promise<{ items: ActivityRow[]; total: number }> {
  const where = buildWhere(userId, f)
  const [rows, total] = await Promise.all([
    prisma.auditLog
      .findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Math.max(0, (opts.page - 1) * opts.pageSize),
        take: Math.max(1, Math.min(200, opts.pageSize)),
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          metadata: true,
          ip: true,
          userAgent: true,
          createdAt: true,
          tenant: { select: { slug: true } },
        },
      })
      .catch(() => []),
    prisma.auditLog.count({ where }).catch(() => 0),
  ])
  return {
    items: rows.map((r) => ({
      id: r.id,
      action: r.action as string,
      resource: r.resource,
      resourceId: r.resourceId,
      metadata: r.metadata,
      ip: r.ip,
      userAgent: r.userAgent,
      tenantSlug: r.tenant?.slug ?? null,
      createdAt: r.createdAt,
    })),
    total,
  }
}

/**
 * Stream-friendly export: caps at 10k rows to avoid runaway memory. Returns
 * rows ordered by createdAt desc.
 */
export async function exportActivity(
  userId: string,
  f: ActivityFilters,
  cap = 10000,
): Promise<ActivityRow[]> {
  const where = buildWhere(userId, f)
  const rows = await prisma.auditLog
    .findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: cap,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        metadata: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        tenant: { select: { slug: true } },
      },
    })
    .catch(() => [])
  return rows.map((r) => ({
    id: r.id,
    action: r.action as string,
    resource: r.resource,
    resourceId: r.resourceId,
    metadata: r.metadata,
    ip: r.ip,
    userAgent: r.userAgent,
    tenantSlug: r.tenant?.slug ?? null,
    createdAt: r.createdAt,
  }))
}
