import { cache } from 'react'
import type { AuditRetentionPolicy } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Audit log retention policy query helpers.
 *
 * Resolution order (most specific wins):
 *   1. exact tenant + exact resourceType
 *   2. exact tenant + wildcard "*"
 *   3. global  + exact resourceType
 *   4. global  + wildcard "*"
 *   5. implicit forever (no policy → return null)
 *
 * Wildcard "*" matches any resourceType.
 */

/** All global-scope policies (scope = 'global'). Cached per request. */
export const getGlobalRetentionPolicies = cache(
  async (): Promise<AuditRetentionPolicy[]> => {
    try {
      return await prisma.auditRetentionPolicy.findMany({
        where: { scope: 'global' },
        orderBy: [{ resourceType: 'asc' }],
      })
    } catch {
      return []
    }
  },
)

/**
 * All tenant-scope policies for the given tenant, PLUS all global policies
 * that may apply (used by the resolver to compute the effective policy
 * without an extra round trip).
 *
 * Returns tenant policies first, then global, so callers iterating by
 * specificity see tenant rows before global ones.
 */
export const getRetentionPoliciesForTenant = cache(
  async (tenantId: string): Promise<AuditRetentionPolicy[]> => {
    if (!tenantId) return []
    try {
      const [tenantPolicies, globalPolicies] = await Promise.all([
        prisma.auditRetentionPolicy.findMany({
          where: { scope: 'tenant', tenantId },
          orderBy: [{ resourceType: 'asc' }],
        }),
        getGlobalRetentionPolicies(),
      ])
      return [...tenantPolicies, ...globalPolicies]
    } catch {
      return []
    }
  },
)

/**
 * Resolve the most specific policy applicable to the given (resourceType,
 * tenantId) pair. See the file header for the precedence order.
 *
 * Returns `null` if no policy applies — caller should treat as "retain
 * forever".
 */
export const resolveEffectivePolicy = cache(
  async (
    resourceType: string,
    tenantId: string | null,
  ): Promise<AuditRetentionPolicy | null> => {
    if (!resourceType) return null

    // 1 & 2 — tenant-scoped policies (only if tenantId provided)
    if (tenantId) {
      try {
        const tenantPolicies = await prisma.auditRetentionPolicy.findMany({
          where: {
            scope: 'tenant',
            tenantId,
            resourceType: { in: [resourceType, '*'] },
          },
        })
        const exact = tenantPolicies.find((p) => p.resourceType === resourceType)
        if (exact) return exact
        const wildcard = tenantPolicies.find((p) => p.resourceType === '*')
        if (wildcard) return wildcard
      } catch {
        // fall through to global
      }
    }

    // 3 & 4 — global-scoped policies
    try {
      const globalPolicies = await prisma.auditRetentionPolicy.findMany({
        where: {
          scope: 'global',
          resourceType: { in: [resourceType, '*'] },
        },
      })
      const exact = globalPolicies.find((p) => p.resourceType === resourceType)
      if (exact) return exact
      const wildcard = globalPolicies.find((p) => p.resourceType === '*')
      if (wildcard) return wildcard
    } catch {
      // fall through
    }

    // 5 — implicit forever
    return null
  },
)
