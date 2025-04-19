/**
 * GET /api/dashboard/metrics
 *
 * Role-aware aggregation endpoint. Branches by session.user.globalRole and
 * returns a discriminated payload of widgets the dashboard renders.
 *
 *  USER       → applicant-facing widgets (apps, interviews, offers, profile %, recs, LMS)
 *  PARTNER    → hiring funnel + team + recent applications for current tenant
 *  ADMIN      → cross-tenant aggregates + 30d growth + health pings
 *  SUPERADMIN → ADMIN payload + cross-tenant breakdown + MRR placeholder
 */

import { type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { canAccessTenant } from '@/lib/auth/rbac'
import {
  apiError,
  apiSuccess,
  getTenantSlugFromHeaders,
  handleRouteError,
} from '@/lib/api-helpers'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const role = session.user.globalRole

    if (role === 'USER') {
      return apiSuccess(await userMetrics(session.user.id))
    }

    if (role === 'PARTNER') {
      const slug = getTenantSlugFromHeaders(req)
      if (!slug) return apiError('TENANT_REQUIRED', 'Tenant context is required.', 400)
      const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } })
      if (!tenant) return apiError('TENANT_NOT_FOUND', 'Tenant not found.', 404)
      if (!canAccessTenant(role, session.user.tenants, tenant.id)) {
        return apiError('FORBIDDEN', 'You do not have access to this tenant.', 403)
      }
      return apiSuccess(await partnerMetrics(tenant.id))
    }

    if (role === 'ADMIN') {
      return apiSuccess(await adminMetrics())
    }

    if (role === 'SUPERADMIN') {
      const [admin, extras] = await Promise.all([adminMetrics(), superAdminExtras()])
      return apiSuccess({ ...admin, ...extras })
    }

    return apiError('FORBIDDEN', 'Unsupported role.', 403)
  } catch (err) {
    return handleRouteError(err)
  }
}

// -----------------------------------------------------------------------------
// USER metrics
// -----------------------------------------------------------------------------

async function userMetrics(userId: string) {
  const [applications, interviews, offers, savedCount, user, enrollments, recommendedJobs] =
    await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, status: 'INTERVIEW' } }),
      prisma.application.count({ where: { userId, status: 'OFFERED' } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true, phone: true, bio: true, headline: true, location: true },
      }),
      prisma.enrollment.findMany({
        where: { userId },
        select: { status: true, progress: true },
      }),
      prisma.job.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
          locationType: true,
          employmentType: true,
          publishedAt: true,
          tenant: { select: { slug: true, name: true } },
        },
      }),
    ])

  const profileFields = user
    ? [user.name, user.image, user.phone, user.bio, user.headline, user.location]
    : []
  const filled = profileFields.filter((v) => v && String(v).trim().length > 0).length
  const profileCompleteness = profileFields.length
    ? Math.round((filled / profileFields.length) * 100)
    : 0

  const lmsTotal = enrollments.length
  const lmsCompleted = enrollments.filter((e) => e.status === 'COMPLETED').length
  const lmsAvgProgress = lmsTotal
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / lmsTotal)
    : 0

  return {
    role: 'USER' as const,
    applications,
    interviews,
    offers,
    savedCount,
    profileCompleteness,
    lmsProgress: { total: lmsTotal, completed: lmsCompleted, avgProgress: lmsAvgProgress },
    recommendedJobs,
  }
}

// -----------------------------------------------------------------------------
// PARTNER metrics (tenant-scoped)
// -----------------------------------------------------------------------------

async function partnerMetrics(tenantId: string) {
  const [activeJobs, totalApplicants, hires, teamSize, funnelRaw, recentApplications] =
    await Promise.all([
      prisma.job.count({ where: { tenantId, status: 'PUBLISHED' } }),
      prisma.application.count({ where: { tenantId } }),
      prisma.application.count({ where: { tenantId, status: 'HIRED' } }),
      prisma.userTenant.count({ where: { tenantId } }),
      prisma.application.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.application.findMany({
        where: { tenantId },
        orderBy: { appliedAt: 'desc' },
        take: 10,
        include: {
          job: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      }),
    ])

  const funnelData = funnelRaw.map((row) => ({ status: row.status, count: row._count._all }))

  return {
    role: 'PARTNER' as const,
    activeJobs,
    totalApplicants,
    hires,
    teamSize,
    funnelData,
    recentApplications,
  }
}

// -----------------------------------------------------------------------------
// ADMIN metrics
// -----------------------------------------------------------------------------

async function adminMetrics() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [tenants, users, jobs, applications, newTenants30d, newUsers30d, newJobs30d] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.tenant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.job.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ])

  // Lightweight health pings: latency to the DB.
  const dbStart = Date.now()
  let dbOk = true
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    dbOk = false
  }
  const dbLatencyMs = Date.now() - dbStart

  return {
    role: 'ADMIN' as const,
    tenants,
    users,
    jobs,
    applications,
    growth: {
      windowDays: 30,
      newTenants: newTenants30d,
      newUsers: newUsers30d,
      newJobs: newJobs30d,
    },
    healthChecks: {
      database: { ok: dbOk, latencyMs: dbLatencyMs },
      timestamp: new Date().toISOString(),
    },
  }
}

// -----------------------------------------------------------------------------
// SUPERADMIN extras
// -----------------------------------------------------------------------------

async function superAdminExtras() {
  const tenantsByPlan = await prisma.tenant.groupBy({
    by: ['planTier'],
    _count: { _all: true },
  })

  const tenantsByStatus = await prisma.tenant.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  // MRR placeholder — proper computation lives in the billing service.
  // We approximate from active subscriptions: each tier has a notional price.
  const PLAN_PRICE_USD: Record<string, number> = {
    FREE: 0,
    PRO: 49,
    BUSINESS: 199,
    ENTERPRISE: 999,
  }
  const activeSubs = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { plan: true },
  })
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICE_USD[s.plan] ?? 0), 0)

  return {
    crossTenant: {
      tenantsByPlan: tenantsByPlan.map((r) => ({ plan: r.planTier, count: r._count._all })),
      tenantsByStatus: tenantsByStatus.map((r) => ({ status: r.status, count: r._count._all })),
    },
    mrr: { amount: mrr, currency: 'USD', placeholder: true },
  }
}
