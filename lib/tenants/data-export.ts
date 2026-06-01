import { prisma } from '@/lib/db'

/**
 * GDPR Tenant Data Export — pure aggregation helper.
 *
 * Builds a sanitized JSON payload of all data belonging to a tenant, suitable
 * for download by the OWNER. Includes member emails, applicant PII, jobs,
 * courses, audit logs, etc. NOT included: webhook secrets, raw API key hashes,
 * OAuth refresh tokens, password hashes, anything cross-tenant.
 *
 * Trade-offs / notes:
 *  - Synchronous: runs everything in parallel via Promise.all. Fine for small
 *    and medium tenants. For very large tenants (10k+ applications, large
 *    audit history) this is slow and memory-heavy and should be moved to a
 *    background job + email-when-ready flow. Documented in actions file.
 *  - Audit logs capped at last 5000 entries to bound payload size. Use the
 *    /audit/export CSV endpoint for the full history.
 *  - Enrollments only include enrollments tied to courses owned by this
 *    tenant (cross-tenant enrollments excluded).
 *  - Moderation flags are matched by resourceId against this tenant's
 *    jobs/courses/applications since the ModerationFlag table does not store
 *    a tenantId directly.
 *  - Webhook configs include secret length only — never the secret value.
 *  - API key rows expose name + prefix + scopes + dates — never the hash.
 */

const AUDIT_LOG_CAP = 5000

export type TenantExportPayload = {
  meta: {
    exportedAt: string
    format: 'rpi-tenant-export@v1'
    tenantId: string
    tenantSlug: string
    note: string
    counts: Record<string, number>
  }
  tenant: unknown
  branding: unknown
  memberships: unknown[]
  jobs: unknown[]
  applications: unknown[]
  interviews: unknown[]
  scorecards: unknown[]
  courses: unknown[]
  enrollments: unknown[]
  webhooks: unknown[]
  apiKeys: unknown[]
  emailTemplates: unknown[]
  auditLogs: unknown[]
  moderationFlags: unknown[]
}

export async function buildTenantExportPayload(
  tenantId: string,
): Promise<TenantExportPayload> {
  const [
    tenant,
    branding,
    memberships,
    jobs,
    applications,
    interviews,
    scorecards,
    courses,
    enrollments,
    webhooksRaw,
    apiKeysRaw,
    emailTemplates,
    auditLogs,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        planTier: true,
        status: true,
        customDomain: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.branding.findUnique({ where: { tenantId } }).catch(() => null),
    prisma.userTenant
      .findMany({
        where: { tenantId },
        orderBy: { joinedAt: 'asc' },
        select: {
          id: true,
          role: true,
          status: true,
          joinedAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      })
      .catch(() => []),
    prisma.job
      .findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          responsibilities: true,
          requirements: true,
          benefits: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          salaryPeriod: true,
          employmentType: true,
          experienceLevel: true,
          location: true,
          locationType: true,
          categoryId: true,
          tags: true,
          status: true,
          postedById: true,
          views: true,
          publishedAt: true,
          expiredAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.application
      .findMany({
        where: { tenantId },
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          jobId: true,
          status: true,
          notes: true,
          resumeUrl: true,
          coverLetter: true,
          aiScore: true,
          aiTags: true,
          appliedAt: true,
          updatedAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      })
      .catch(() => []),
    prisma.interviewSchedule
      .findMany({
        where: { application: { tenantId } },
        orderBy: { scheduledAt: 'desc' },
        select: {
          id: true,
          applicationId: true,
          scheduledAt: true,
          durationMin: true,
          type: true,
          meetingUrl: true,
          location: true,
          notes: true,
          status: true,
          stageOrder: true,
          stageName: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.interviewScorecard
      .findMany({
        where: { interview: { application: { tenantId } } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          interviewId: true,
          authorId: true,
          ratings: true,
          notes: true,
          recommendation: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.course
      .findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          level: true,
          durationHours: true,
          instructorId: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          modules: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              durationMin: true,
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  contentType: true,
                  contentUrl: true,
                  contentBody: true,
                  order: true,
                  durationMin: true,
                },
              },
            },
          },
        },
      })
      .catch(() => []),
    prisma.enrollment
      .findMany({
        where: { course: { tenantId } },
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          courseId: true,
          status: true,
          progress: true,
          enrolledAt: true,
          completedAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      })
      .catch(() => []),
    prisma.tenantWebhook
      .findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          enabled: true,
          secret: true, // selected so we can compute length only; redacted below
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.tenantApiKey
      .findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          tokenPrefix: true,
          scopes: true,
          expiresAt: true,
          lastUsedAt: true,
          lastUsedIp: true,
          createdAt: true,
          revokedAt: true,
          createdById: true,
          // NOTE: tokenHash is deliberately NOT selected.
        },
      })
      .catch(() => []),
    prisma.tenantEmailTemplate
      .findMany({
        where: { tenantId },
        select: {
          id: true,
          status: true,
          subject: true,
          body: true,
          enabled: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch(() => []),
    prisma.auditLog
      .findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: AUDIT_LOG_CAP,
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
  ])

  // Sanitize webhooks — strip secret value, keep only its length.
  const webhooks = webhooksRaw.map((w) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { secret, ...rest } = w
    return {
      ...rest,
      secretLength: typeof secret === 'string' ? secret.length : 0,
      secretRedacted: true,
    }
  })

  // API keys already sanitized at query level; mark redaction for clarity.
  const apiKeys = apiKeysRaw.map((k) => ({
    ...k,
    tokenHashRedacted: true,
  }))

  // ModerationFlag does not have tenantId — match by resourceId against this
  // tenant's jobs / courses / applications / users (members).
  const tenantResourceIds = new Set<string>([
    ...jobs.map((j) => j.id),
    ...courses.map((c) => c.id),
    ...applications.map((a) => a.id),
    ...memberships.map((m) => m.user.id),
  ])
  const moderationFlags = tenantResourceIds.size
    ? await prisma.moderationFlag
        .findMany({
          where: { resourceId: { in: Array.from(tenantResourceIds) } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            resourceType: true,
            resourceId: true,
            reason: true,
            description: true,
            status: true,
            resolution: true,
            resolvedAt: true,
            createdAt: true,
          },
        })
        .catch(() => [])
    : []

  const tenantSlug = tenant?.slug ?? ''

  const counts = {
    memberships: memberships.length,
    jobs: jobs.length,
    applications: applications.length,
    interviews: interviews.length,
    scorecards: scorecards.length,
    courses: courses.length,
    enrollments: enrollments.length,
    webhooks: webhooks.length,
    apiKeys: apiKeys.length,
    emailTemplates: emailTemplates.length,
    auditLogs: auditLogs.length,
    moderationFlags: moderationFlags.length,
  }

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      format: 'rpi-tenant-export@v1',
      tenantId,
      tenantSlug,
      note:
        'Tenant data export. Berisi PII anggota & kandidat. Webhook secret & API key hash telah dihapus.',
      counts,
    },
    tenant,
    branding,
    memberships,
    jobs,
    applications,
    interviews,
    scorecards,
    courses,
    enrollments,
    webhooks,
    apiKeys,
    emailTemplates,
    auditLogs,
    moderationFlags,
  }
}
