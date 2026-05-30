import { cache } from 'react'
import { prisma } from '@/lib/db'

export type TenantPublicJob = {
  id: string
  title: string
  slug: string
  location: string
  locationType: string
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  publishedAt: Date | null
}

export type TenantPublicCourse = {
  id: string
  title: string
  slug: string
  description: string
  level: string
  durationHours: number
  thumbnail: string | null
  publishedAt: Date | null
}

export type TenantPublicData = {
  id: string
  slug: string
  name: string
  status: string
  createdAt: Date
  planTier: string
  branding: {
    logoLight: string | null
    logoDark: string | null
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    foregroundColor: string
    fontHeading: string
    fontBody: string
  } | null
  activeJobsCount: number
  totalJobsCount: number
  activeMembersCount: number
  publishedCoursesCount: number
  recentJobs: TenantPublicJob[]
  recentCourses: TenantPublicCourse[]
}

/**
 * Fetch a tenant's public landing-page payload by slug.
 * Returns null on error or when the tenant does not exist.
 */
export const getTenantPublicData = cache(
  async (slug: string): Promise<TenantPublicData | null> => {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          planTier: true,
          createdAt: true,
          branding: {
            select: {
              logoLight: true,
              logoDark: true,
              primaryColor: true,
              secondaryColor: true,
              accentColor: true,
              backgroundColor: true,
              foregroundColor: true,
              fontHeading: true,
              fontBody: true,
            },
          },
        },
      })

      if (!tenant) return null

      const [
        activeJobsCount,
        totalJobsCount,
        activeMembersCount,
        publishedCoursesCount,
        recentJobs,
        recentCourses,
      ] = await Promise.all([
        prisma.job.count({
          where: { tenantId: tenant.id, status: 'PUBLISHED' },
        }),
        prisma.job.count({ where: { tenantId: tenant.id } }),
        prisma.userTenant.count({
          where: { tenantId: tenant.id, status: 'active' },
        }),
        prisma.course.count({
          where: { tenantId: tenant.id, status: 'PUBLISHED' },
        }),
        prisma.job.findMany({
          where: { tenantId: tenant.id, status: 'PUBLISHED' },
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          take: 12,
          select: {
            id: true,
            title: true,
            slug: true,
            location: true,
            locationType: true,
            employmentType: true,
            salaryMin: true,
            salaryMax: true,
            salaryCurrency: true,
            publishedAt: true,
          },
        }),
        prisma.course.findMany({
          where: { tenantId: tenant.id, status: 'PUBLISHED' },
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            level: true,
            durationHours: true,
            thumbnail: true,
            publishedAt: true,
          },
        }),
      ])

      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        status: tenant.status as string,
        createdAt: tenant.createdAt,
        planTier: tenant.planTier as string,
        branding: tenant.branding
          ? {
              logoLight: tenant.branding.logoLight,
              logoDark: tenant.branding.logoDark,
              primaryColor: tenant.branding.primaryColor,
              secondaryColor: tenant.branding.secondaryColor,
              accentColor: tenant.branding.accentColor,
              backgroundColor: tenant.branding.backgroundColor,
              foregroundColor: tenant.branding.foregroundColor,
              fontHeading: tenant.branding.fontHeading,
              fontBody: tenant.branding.fontBody,
            }
          : null,
        activeJobsCount,
        totalJobsCount,
        activeMembersCount,
        publishedCoursesCount,
        recentJobs: recentJobs.map((j) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          location: j.location,
          locationType: j.locationType as string,
          employmentType: j.employmentType as string,
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          salaryCurrency: j.salaryCurrency,
          publishedAt: j.publishedAt,
        })),
        recentCourses: recentCourses.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          level: c.level as string,
          durationHours: c.durationHours,
          thumbnail: c.thumbnail,
          publishedAt: c.publishedAt,
        })),
      }
    } catch {
      return null
    }
  },
)
