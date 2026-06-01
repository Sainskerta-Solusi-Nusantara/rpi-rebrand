import { cache } from 'react'
import { prisma } from '@/lib/db'

export type FlagListItem = {
  id: string
  key: string
  name: string
  description: string | null
  type: string
  enabled: boolean
  percentage: number
  segmentRules: unknown
  environments: unknown
  createdAt: Date
  updatedAt: Date
  createdBy: { id: string; name: string | null; email: string | null } | null
  overrideCount: number
}

export type FlagDetail = FlagListItem & {
  overrides: FlagOverrideRow[]
}

export type FlagOverrideRow = {
  id: string
  flagId: string
  userId: string | null
  tenantId: string | null
  value: boolean
  reason: string | null
  createdAt: Date
  user: { id: string; name: string | null; email: string | null } | null
  tenant: { id: string; name: string; slug: string } | null
}

/**
 * Admin list of all feature flags. Includes `createdBy` summary and a
 * count of overrides attached to each flag.
 */
export const getAllFlags = cache(async (): Promise<FlagListItem[]> => {
  try {
    const rows = await prisma.featureFlag.findMany({
      orderBy: [{ updatedAt: 'desc' }],
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { overrides: true } },
      },
    })
    return rows.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      description: r.description,
      type: r.type,
      enabled: r.enabled,
      percentage: r.percentage,
      segmentRules: r.segmentRules,
      environments: r.environments,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      createdBy: r.createdBy
        ? { id: r.createdBy.id, name: r.createdBy.name, email: r.createdBy.email }
        : null,
      overrideCount: r._count.overrides,
    }))
  } catch (err) {
    console.error('[getAllFlags] failed', err)
    return []
  }
})

/**
 * Load a single flag by its public string key, with all overrides eagerly
 * joined for the admin edit screen.
 */
export const getFlagByKey = cache(
  async (key: string): Promise<FlagDetail | null> => {
    try {
      const flag = await prisma.featureFlag.findUnique({
        where: { key },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          overrides: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              tenant: { select: { id: true, name: true, slug: true } },
            },
            orderBy: [{ createdAt: 'desc' }],
          },
          _count: { select: { overrides: true } },
        },
      })
      if (!flag) return null
      return {
        id: flag.id,
        key: flag.key,
        name: flag.name,
        description: flag.description,
        type: flag.type,
        enabled: flag.enabled,
        percentage: flag.percentage,
        segmentRules: flag.segmentRules,
        environments: flag.environments,
        createdAt: flag.createdAt,
        updatedAt: flag.updatedAt,
        createdBy: flag.createdBy
          ? {
              id: flag.createdBy.id,
              name: flag.createdBy.name,
              email: flag.createdBy.email,
            }
          : null,
        overrideCount: flag._count.overrides,
        overrides: flag.overrides.map((o) => ({
          id: o.id,
          flagId: o.flagId,
          userId: o.userId,
          tenantId: o.tenantId,
          value: o.value,
          reason: o.reason,
          createdAt: o.createdAt,
          user: o.user
            ? { id: o.user.id, name: o.user.name, email: o.user.email }
            : null,
          tenant: o.tenant
            ? { id: o.tenant.id, name: o.tenant.name, slug: o.tenant.slug }
            : null,
        })),
      }
    } catch (err) {
      console.error('[getFlagByKey] failed', err)
      return null
    }
  },
)

/**
 * Load a flag by its database id. Used by edit pages where the id
 * (not key) is the URL slug.
 */
export const getFlagById = cache(async (id: string): Promise<FlagDetail | null> => {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        overrides: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            tenant: { select: { id: true, name: true, slug: true } },
          },
          orderBy: [{ createdAt: 'desc' }],
        },
        _count: { select: { overrides: true } },
      },
    })
    if (!flag) return null
    return {
      id: flag.id,
      key: flag.key,
      name: flag.name,
      description: flag.description,
      type: flag.type,
      enabled: flag.enabled,
      percentage: flag.percentage,
      segmentRules: flag.segmentRules,
      environments: flag.environments,
      createdAt: flag.createdAt,
      updatedAt: flag.updatedAt,
      createdBy: flag.createdBy
        ? {
            id: flag.createdBy.id,
            name: flag.createdBy.name,
            email: flag.createdBy.email,
          }
        : null,
      overrideCount: flag._count.overrides,
      overrides: flag.overrides.map((o) => ({
        id: o.id,
        flagId: o.flagId,
        userId: o.userId,
        tenantId: o.tenantId,
        value: o.value,
        reason: o.reason,
        createdAt: o.createdAt,
        user: o.user
          ? { id: o.user.id, name: o.user.name, email: o.user.email }
          : null,
        tenant: o.tenant
          ? { id: o.tenant.id, name: o.tenant.name, slug: o.tenant.slug }
          : null,
      })),
    }
  } catch (err) {
    console.error('[getFlagById] failed', err)
    return null
  }
})

/**
 * List overrides for a given flag, joined with user + tenant summaries.
 * Used directly by the overrides table component.
 */
export const getOverridesForFlag = cache(
  async (flagId: string): Promise<FlagOverrideRow[]> => {
    try {
      const rows = await prisma.featureFlagOverride.findMany({
        where: { flagId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
      })
      return rows.map((o) => ({
        id: o.id,
        flagId: o.flagId,
        userId: o.userId,
        tenantId: o.tenantId,
        value: o.value,
        reason: o.reason,
        createdAt: o.createdAt,
        user: o.user
          ? { id: o.user.id, name: o.user.name, email: o.user.email }
          : null,
        tenant: o.tenant
          ? { id: o.tenant.id, name: o.tenant.name, slug: o.tenant.slug }
          : null,
      }))
    } catch (err) {
      console.error('[getOverridesForFlag] failed', err)
      return []
    }
  },
)
