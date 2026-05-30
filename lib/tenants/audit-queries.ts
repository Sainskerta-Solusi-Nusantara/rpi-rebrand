import type { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

export type TenantAuditFilters = {
  action?: AuditAction
  resource?: string
  actorEmail?: string
  from?: Date
  to?: Date
}

export type TenantAuditRow = {
  id: string
  action: string
  resource: string
  resourceId: string | null
  metadata: unknown
  ip: string | null
  userAgent: string | null
  createdAt: Date
  actor: { id: string; email: string; name: string | null } | null
}

function buildWhere(tenantId: string, f: TenantAuditFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = { tenantId }
  if (f.action) where.action = f.action
  if (f.resource && f.resource.trim()) {
    where.resource = { contains: f.resource.trim(), mode: 'insensitive' }
  }
  if (f.actorEmail && f.actorEmail.trim()) {
    where.user = { email: { contains: f.actorEmail.trim(), mode: 'insensitive' } }
  }
  if (f.from || f.to) {
    where.createdAt = {}
    if (f.from) where.createdAt.gte = f.from
    if (f.to) where.createdAt.lte = f.to
  }
  return where
}

export async function listTenantAudit(
  tenantId: string,
  f: TenantAuditFilters,
  opts: { page: number; pageSize: number },
): Promise<{ items: TenantAuditRow[]; total: number }> {
  const where = buildWhere(tenantId, f)
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
          user: { select: { id: true, email: true, name: true } },
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
      createdAt: r.createdAt,
      actor: r.user
        ? { id: r.user.id, email: r.user.email, name: r.user.name }
        : null,
    })),
    total,
  }
}

export async function exportTenantAudit(
  tenantId: string,
  f: TenantAuditFilters,
  cap = 10000,
): Promise<TenantAuditRow[]> {
  const where = buildWhere(tenantId, f)
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
        user: { select: { id: true, email: true, name: true } },
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
    createdAt: r.createdAt,
    actor: r.user
      ? { id: r.user.id, email: r.user.email, name: r.user.name }
      : null,
  }))
}
