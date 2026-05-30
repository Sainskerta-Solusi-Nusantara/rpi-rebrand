import { cache } from 'react'
import { ApplicationStatus, JobStatus } from '@prisma/client'
import { prisma } from '@/lib/db'

export type TenantOverview = {
  totalJobs: number
  publishedJobs: number
  draftJobs: number
  closedJobs: number
  totalApplications: number
  applicationsThisWeek: number
  applicationsLast30d: number
  activeMembers: number
  pendingInvites: number
}

const EMPTY_OVERVIEW: TenantOverview = {
  totalJobs: 0,
  publishedJobs: 0,
  draftJobs: 0,
  closedJobs: 0,
  totalApplications: 0,
  applicationsThisWeek: 0,
  applicationsLast30d: 0,
  activeMembers: 0,
  pendingInvites: 0,
}

export const getTenantOverview = cache(
  async (tenantId: string): Promise<TenantOverview> => {
    try {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thirtyAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const [
        totalJobs,
        publishedJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        applicationsThisWeek,
        applicationsLast30d,
        activeMembers,
        pendingInvites,
      ] = await Promise.all([
        prisma.job.count({ where: { tenantId } }),
        prisma.job.count({ where: { tenantId, status: JobStatus.PUBLISHED } }),
        prisma.job.count({ where: { tenantId, status: JobStatus.DRAFT } }),
        prisma.job.count({ where: { tenantId, status: JobStatus.CLOSED } }),
        prisma.application.count({ where: { tenantId } }),
        prisma.application.count({
          where: { tenantId, appliedAt: { gte: weekAgo } },
        }),
        prisma.application.count({
          where: { tenantId, appliedAt: { gte: thirtyAgo } },
        }),
        prisma.userTenant.count({
          where: { tenantId, status: 'active' },
        }),
        prisma.invitation.count({
          where: {
            tenantId,
            acceptedAt: null,
            expiresAt: { gt: now },
          },
        }),
      ])

      return {
        totalJobs,
        publishedJobs,
        draftJobs,
        closedJobs,
        totalApplications,
        applicationsThisWeek,
        applicationsLast30d,
        activeMembers,
        pendingInvites,
      }
    } catch {
      return EMPTY_OVERVIEW
    }
  },
)

export type JobBreakdownRow = {
  id: string
  title: string
  slug: string
  status: string
  applicationsCount: number
  views: number
}

export const getJobsBreakdown = cache(
  async (tenantId: string): Promise<JobBreakdownRow[]> => {
    try {
      const rows = await prisma.job.findMany({
        where: { tenantId },
        orderBy: [{ applications: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 10,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          views: true,
          _count: { select: { applications: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        status: r.status as string,
        applicationsCount: r._count.applications,
        views: r.views,
      }))
    } catch {
      return []
    }
  },
)

export type ApplicationFunnelRow = {
  status: ApplicationStatus
  count: number
}

const FUNNEL_ORDER: ApplicationStatus[] = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.REVIEWED,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.OFFERED,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
  ApplicationStatus.WITHDRAWN,
]

export const getApplicationFunnel = cache(
  async (tenantId: string, since: Date): Promise<ApplicationFunnelRow[]> => {
    try {
      const grouped = await prisma.application.groupBy({
        by: ['status'],
        where: { tenantId, appliedAt: { gte: since } },
        _count: { _all: true },
      })
      const map = new Map<ApplicationStatus, number>()
      for (const g of grouped) {
        map.set(g.status, g._count._all)
      }
      return FUNNEL_ORDER.map((status) => ({
        status,
        count: map.get(status) ?? 0,
      }))
    } catch {
      return FUNNEL_ORDER.map((status) => ({ status, count: 0 }))
    }
  },
)

export type ApplicationsByDayRow = {
  date: string
  count: number
}

function toIsoDay(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export const getApplicationsByDay = cache(
  async (tenantId: string, days = 30): Promise<ApplicationsByDayRow[]> => {
    try {
      const safeDays = Math.max(1, Math.min(180, days))
      const now = new Date()
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - (safeDays - 1))

      const rows = await prisma.application.findMany({
        where: { tenantId, appliedAt: { gte: start } },
        select: { appliedAt: true },
      })

      const buckets: Record<string, number> = {}
      for (let i = 0; i < safeDays; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        buckets[toIsoDay(d)] = 0
      }
      for (const r of rows) {
        const key = toIsoDay(r.appliedAt)
        if (buckets[key] !== undefined) buckets[key]++
      }
      return Object.entries(buckets).map(([date, count]) => ({ date, count }))
    } catch {
      return []
    }
  },
)

export type RecentTenantActivityRow = {
  id: string
  action: string
  resource: string
  resourceId: string | null
  createdAt: Date
  actorEmail: string | null
}

export const getRecentTenantActivity = cache(
  async (tenantId: string, limit = 10): Promise<RecentTenantActivityRow[]> => {
    try {
      const rows = await prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: Math.max(1, Math.min(100, limit)),
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      })
      return rows.map((r) => ({
        id: r.id,
        action: r.action as string,
        resource: r.resource,
        resourceId: r.resourceId,
        createdAt: r.createdAt,
        actorEmail: r.user?.email ?? null,
      }))
    } catch {
      return []
    }
  },
)
