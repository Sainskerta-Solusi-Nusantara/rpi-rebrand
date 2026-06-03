'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { localizedParse } from '@/lib/i18n/zod-error-map'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string; field?: string }

const ALLOWED_RETENTION_DAYS = [0, 30, 60, 90, 180, 365, 730, 1825] as const

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

const upsertSchema = z.object({
  id: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  scope: z.enum(['global', 'tenant']),
  tenantId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  resourceType: z
    .string()
    .trim()
    .min(1)
    .max(120),
  retentionDays: z
    .preprocess(
      (v) => (typeof v === 'string' ? Number(v) : v),
      z.number().int(),
    )
    .refine(
      (n) => ALLOWED_RETENTION_DAYS.includes(n as (typeof ALLOWED_RETENTION_DAYS)[number]),
      { params: { i18n: 'retentionValueNotAllowed' } },
    ),
  archiveEnabled: z.preprocess(
    (v) => v === 'on' || v === 'true' || v === true,
    z.boolean(),
  ),
})

/**
 * Create or update a retention policy.
 *
 * - Global scope (scope='global') requires SUPERADMIN.
 * - Tenant scope (scope='tenant') requires `tenantId` and tenant-level
 *   `audit.view` permission (OWNER/ADMIN have this; we fall back to it
 *   because `audit.manage` is not modelled separately).
 *
 * Audited as resource `audit.retention.upserted`.
 */
export async function upsertRetentionPolicy(
  formData: FormData,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()

  const raw = {
    id: formData.get('id'),
    scope: formData.get('scope'),
    tenantId: formData.get('tenantId'),
    resourceType: formData.get('resourceType'),
    retentionDays: formData.get('retentionDays'),
    archiveEnabled: formData.get('archiveEnabled'),
  }
  const parsed = await localizedParse(upsertSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAdmin.retentionActions.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const { id, scope, tenantId, resourceType, retentionDays, archiveEnabled } =
    parsed.data
  const { globalRole, tenants } = session.user

  if (scope === 'global') {
    if (globalRole !== 'SUPERADMIN') {
      return { ok: false, error: t.srvAdmin.retentionActions.globalPolicyRequiresSuperadmin }
    }
  } else {
    if (!tenantId) {
      return { ok: false, error: t.srvAdmin.retentionActions.tenantRequired, field: 'tenantId' }
    }
    if (!hasTenantPermission(globalRole, tenants, tenantId, 'audit.view')) {
      return { ok: false, error: t.srvAdmin.retentionActions.noPermissionManageRetention }
    }
  }

  const effectiveTenantId = scope === 'tenant' ? tenantId! : null

  try {
    const policy = await prisma.auditRetentionPolicy.upsert({
      where: id
        ? { id }
        : {
            scope_tenantId_resourceType: {
              scope,
              // Prisma compound-unique with optional column: null is fine
              tenantId: effectiveTenantId as string,
              resourceType,
            },
          },
      create: {
        scope,
        tenantId: effectiveTenantId,
        resourceType,
        retentionDays,
        archiveEnabled,
        createdById: session.user.id,
      },
      update: {
        retentionDays,
        archiveEnabled,
      },
    })

    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          tenantId: effectiveTenantId,
          action: id ? 'UPDATE' : 'CREATE',
          resource: 'audit.retention.upserted',
          resourceId: policy.id,
          metadata: {
            policyId: policy.id,
            scope,
            tenantId: effectiveTenantId,
            resourceType,
            retentionDays,
            archiveEnabled,
          },
        },
      })
      .catch(() => {
        // never block on audit log failure
      })

    if (scope === 'global') {
      revalidatePath('/dashboard/audit-retention')
    } else if (effectiveTenantId) {
      const tenant = await prisma.tenant
        .findUnique({ where: { id: effectiveTenantId }, select: { slug: true } })
        .catch(() => null)
      if (tenant) revalidatePath(`/dashboard/tenants/${tenant.slug}/audit-retention`)
    }
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return {
        ok: false,
        error: t.srvAdmin.retentionActions.policyAlreadyExists,
        field: 'resourceType',
      }
    }
    console.error('[upsertRetentionPolicy] failed', err)
    return { ok: false, error: t.srvAdmin.retentionActions.savePolicyFailed }
  }
}

/**
 * Delete a retention policy. Audited as `audit.retention.deleted`.
 */
export async function deleteRetentionPolicy(
  id: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()

  const policy = await prisma.auditRetentionPolicy
    .findUnique({ where: { id } })
    .catch(() => null)
  if (!policy) {
    return { ok: false, error: t.srvAdmin.retentionActions.policyNotFound }
  }

  const { globalRole, tenants } = session.user
  if (policy.scope === 'global') {
    if (globalRole !== 'SUPERADMIN') {
      return { ok: false, error: t.srvAdmin.retentionActions.deletePolicyRequiresSuperadmin }
    }
  } else {
    if (!policy.tenantId) {
      return { ok: false, error: t.srvAdmin.retentionActions.tenantPolicyInvalid }
    }
    if (!hasTenantPermission(globalRole, tenants, policy.tenantId, 'audit.view')) {
      return { ok: false, error: t.srvAdmin.retentionActions.noPermissionDeletePolicy }
    }
  }

  try {
    await prisma.auditRetentionPolicy.delete({ where: { id } })

    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          tenantId: policy.tenantId,
          action: 'DELETE',
          resource: 'audit.retention.deleted',
          resourceId: policy.id,
          metadata: {
            policyId: policy.id,
            resourceType: policy.resourceType,
          },
        },
      })
      .catch(() => {})

    if (policy.scope === 'global') {
      revalidatePath('/dashboard/audit-retention')
    } else if (policy.tenantId) {
      const tenant = await prisma.tenant
        .findUnique({ where: { id: policy.tenantId }, select: { slug: true } })
        .catch(() => null)
      if (tenant) revalidatePath(`/dashboard/tenants/${tenant.slug}/audit-retention`)
    }
    return { ok: true }
  } catch (err) {
    console.error('[deleteRetentionPolicy] failed', err)
    return { ok: false, error: t.srvAdmin.retentionActions.deletePolicyFailed }
  }
}

export type RetentionImpactRow = {
  resourceType: string
  currentCount: number
  willDeleteCount: number
  willArchiveCount: number
  retentionDays: number
}

/**
 * Read-only preview of what running cleanup right now would do, for the
 * given tenant. NOT destructive.
 */
export async function previewRetentionImpact(
  tenantId: string,
): Promise<ActionResult<RetentionImpactRow[]>> {
  const t = await getServerT()
  const session = await requireAuth()
  const { globalRole, tenants } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenantId, 'audit.view')) {
    return { ok: false, error: t.srvAdmin.retentionActions.noPermissionPreviewRetention }
  }

  let policies
  try {
    policies = await prisma.auditRetentionPolicy.findMany({
      where: { scope: 'tenant', tenantId },
    })
  } catch (err) {
    console.error('[previewRetentionImpact] policy load failed', err)
    return { ok: false, error: t.srvAdmin.retentionActions.loadPoliciesFailed }
  }

  const now = Date.now()
  const rows: RetentionImpactRow[] = []
  for (const policy of policies) {
    const where: Record<string, unknown> = { tenantId }
    if (policy.resourceType !== '*') where.resource = policy.resourceType
    const cutoff =
      policy.retentionDays > 0
        ? new Date(now - policy.retentionDays * 24 * 60 * 60 * 1000)
        : null

    try {
      const currentCount = await prisma.auditLog.count({ where })
      let willDeleteCount = 0
      if (cutoff) {
        willDeleteCount = await prisma.auditLog.count({
          where: { ...where, createdAt: { lt: cutoff } },
        })
      }
      rows.push({
        resourceType: policy.resourceType,
        currentCount,
        willDeleteCount,
        willArchiveCount: policy.archiveEnabled ? willDeleteCount : 0,
        retentionDays: policy.retentionDays,
      })
    } catch (err) {
      console.error('[previewRetentionImpact] count failed', err)
      rows.push({
        resourceType: policy.resourceType,
        currentCount: 0,
        willDeleteCount: 0,
        willArchiveCount: 0,
        retentionDays: policy.retentionDays,
      })
    }
  }

  return { ok: true, data: rows }
}
