import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export type FlagStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed'
export type FlagResourceType =
  | 'job'
  | 'course'
  | 'user'
  | 'profile'
  | 'message'
  | 'application'

export type FlagListItem = {
  id: string
  resourceType: string
  resourceId: string
  reason: string
  description: string | null
  status: string
  resolution: string | null
  createdAt: Date
  resolvedAt: Date | null
  reporter: {
    id: string
    email: string | null
    name: string | null
  } | null
  resolver: {
    id: string
    email: string | null
    name: string | null
  } | null
}

const DEFAULT_PAGE_SIZE = 25

/**
 * List moderation flags for the admin queue.
 * Filters by status / resourceType / free-text query.
 */
export async function listFlags(opts: {
  status?: string
  resourceType?: string
  query?: string
  page?: number
  pageSize?: number
}): Promise<{ items: FlagListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, opts.page ?? 1)
  const pageSize = Math.max(1, Math.min(100, opts.pageSize ?? DEFAULT_PAGE_SIZE))

  const where: Prisma.ModerationFlagWhereInput = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.resourceType ? { resourceType: opts.resourceType } : {}),
    ...(opts.query
      ? {
          OR: [
            { resourceId: { contains: opts.query, mode: 'insensitive' } },
            { description: { contains: opts.query, mode: 'insensitive' } },
            { reason: { contains: opts.query, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  try {
    const [rows, total] = await Promise.all([
      prisma.moderationFlag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          resourceType: true,
          resourceId: true,
          reason: true,
          description: true,
          status: true,
          resolution: true,
          createdAt: true,
          resolvedAt: true,
          reportedBy: { select: { id: true, email: true, name: true } },
          resolvedBy: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.moderationFlag.count({ where }),
    ])

    const items: FlagListItem[] = rows.map((r) => ({
      id: r.id,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      reason: r.reason,
      description: r.description,
      status: r.status,
      resolution: r.resolution,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      reporter: r.reportedBy
        ? { id: r.reportedBy.id, email: r.reportedBy.email, name: r.reportedBy.name }
        : null,
      resolver: r.resolvedBy
        ? { id: r.resolvedBy.id, email: r.resolvedBy.email, name: r.resolvedBy.name }
        : null,
    }))

    return { items, total, page, pageSize }
  } catch (err) {
    console.error('[listFlags] failed', err)
    return { items: [], total: 0, page, pageSize }
  }
}

export type FlagContext =
  | { kind: 'job'; id: string; title: string; slug: string; tenantSlug: string | null; status: string }
  | { kind: 'course'; id: string; title: string; slug: string; tenantSlug: string | null; status: string }
  | { kind: 'user'; id: string; email: string | null; name: string | null; status: string }
  | { kind: 'profile'; id: string; email: string | null; name: string | null; status: string; username: string | null }
  | { kind: 'application'; id: string; jobTitle: string | null; userEmail: string | null }
  | { kind: 'message'; id: string }
  | { kind: 'unknown'; id: string }

export type FlagWithContext = {
  id: string
  resourceType: string
  resourceId: string
  reason: string
  description: string | null
  status: string
  resolution: string | null
  createdAt: Date
  resolvedAt: Date | null
  reporter: { id: string; email: string | null; name: string | null } | null
  resolver: { id: string; email: string | null; name: string | null } | null
  context: FlagContext
  activity: Array<{
    id: string
    action: string
    resource: string
    createdAt: Date
    user: { email: string | null; name: string | null } | null
    metadata: Prisma.JsonValue | null
  }>
}

async function fetchContext(
  resourceType: string,
  resourceId: string,
): Promise<FlagContext> {
  try {
    switch (resourceType) {
      case 'job': {
        const j = await prisma.job.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            tenant: { select: { slug: true } },
          },
        })
        if (!j) return { kind: 'unknown', id: resourceId }
        return {
          kind: 'job',
          id: j.id,
          title: j.title,
          slug: j.slug,
          tenantSlug: j.tenant?.slug ?? null,
          status: j.status,
        }
      }
      case 'course': {
        const c = await prisma.course.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            tenant: { select: { slug: true } },
          },
        })
        if (!c) return { kind: 'unknown', id: resourceId }
        return {
          kind: 'course',
          id: c.id,
          title: c.title,
          slug: c.slug,
          tenantSlug: c.tenant?.slug ?? null,
          status: c.status,
        }
      }
      case 'user': {
        const u = await prisma.user.findUnique({
          where: { id: resourceId },
          select: { id: true, email: true, name: true, status: true },
        })
        if (!u) return { kind: 'unknown', id: resourceId }
        return { kind: 'user', id: u.id, email: u.email, name: u.name, status: u.status }
      }
      case 'profile': {
        const u = await prisma.user.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            username: true,
          },
        })
        if (!u) return { kind: 'unknown', id: resourceId }
        return {
          kind: 'profile',
          id: u.id,
          email: u.email,
          name: u.name,
          status: u.status,
          username: u.username,
        }
      }
      case 'application': {
        const a = await prisma.application.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            job: { select: { title: true } },
            user: { select: { email: true } },
          },
        })
        if (!a) return { kind: 'unknown', id: resourceId }
        return {
          kind: 'application',
          id: a.id,
          jobTitle: a.job?.title ?? null,
          userEmail: a.user?.email ?? null,
        }
      }
      case 'message':
        return { kind: 'message', id: resourceId }
      default:
        return { kind: 'unknown', id: resourceId }
    }
  } catch {
    return { kind: 'unknown', id: resourceId }
  }
}

/**
 * Fetch a flag plus best-effort context lookup of the referenced resource
 * plus the most recent audit entries for that resource.
 */
export async function getFlagWithContext(
  flagId: string,
): Promise<FlagWithContext | null> {
  try {
    const flag = await prisma.moderationFlag.findUnique({
      where: { id: flagId },
      select: {
        id: true,
        resourceType: true,
        resourceId: true,
        reason: true,
        description: true,
        status: true,
        resolution: true,
        createdAt: true,
        resolvedAt: true,
        reportedBy: { select: { id: true, email: true, name: true } },
        resolvedBy: { select: { id: true, email: true, name: true } },
      },
    })
    if (!flag) return null

    const [context, activity] = await Promise.all([
      fetchContext(flag.resourceType, flag.resourceId),
      prisma.auditLog
        .findMany({
          where: { resourceId: flag.resourceId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            action: true,
            resource: true,
            createdAt: true,
            metadata: true,
            user: { select: { email: true, name: true } },
          },
        })
        .catch(() => []),
    ])

    return {
      id: flag.id,
      resourceType: flag.resourceType,
      resourceId: flag.resourceId,
      reason: flag.reason,
      description: flag.description,
      status: flag.status,
      resolution: flag.resolution,
      createdAt: flag.createdAt,
      resolvedAt: flag.resolvedAt,
      reporter: flag.reportedBy
        ? { id: flag.reportedBy.id, email: flag.reportedBy.email, name: flag.reportedBy.name }
        : null,
      resolver: flag.resolvedBy
        ? { id: flag.resolvedBy.id, email: flag.resolvedBy.email, name: flag.resolvedBy.name }
        : null,
      context,
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        createdAt: a.createdAt,
        metadata: a.metadata,
        user: a.user ?? null,
      })),
    }
  } catch (err) {
    console.error('[getFlagWithContext] failed', err)
    return null
  }
}

export type FlagCounts = {
  pending: number
  reviewing: number
  resolved: number
  dismissed: number
}

/**
 * Aggregate counts per status for the admin dashboard widget.
 */
export async function getFlagCounts(): Promise<FlagCounts> {
  try {
    const grouped = await prisma.moderationFlag.groupBy({
      by: ['status'],
      _count: { _all: true },
    })
    const out: FlagCounts = { pending: 0, reviewing: 0, resolved: 0, dismissed: 0 }
    for (const g of grouped) {
      const k = g.status as keyof FlagCounts
      if (k in out) out[k] = g._count._all
    }
    return out
  } catch {
    return { pending: 0, reviewing: 0, resolved: 0, dismissed: 0 }
  }
}
