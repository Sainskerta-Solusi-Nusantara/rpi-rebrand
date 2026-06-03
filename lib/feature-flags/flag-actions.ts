'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { localizedParse } from '@/lib/i18n/zod-error-map'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | (T extends undefined ? { ok: true } : { ok: true; data: T })
  | { ok: false; error: string; field?: string }

const KEY_REGEX = /^[a-z][a-z0-9-_]*$/
const FLAG_TYPES = ['boolean', 'percentage', 'segment'] as const
const SEGMENT_OPS = ['in', 'equals', 'starts_with'] as const

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

function requireSuperadmin(globalRole: string | undefined): true | null {
  if (globalRole !== 'SUPERADMIN') {
    return true
  }
  return null
}

const baseFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .refine((v) => KEY_REGEX.test(v), { params: { i18n: 'flagKeyFormat' } }),
  name: z.string().trim().min(1).max(120),
  description: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  type: z.enum(FLAG_TYPES),
  percentage: z.preprocess(
    (v) => (typeof v === 'string' ? Number(v) : v),
    z.number().int().min(0).max(100),
  ),
  segmentRules: z.preprocess(emptyToUndefined, z.string().optional()),
  environments: z.preprocess(emptyToUndefined, z.string().optional()),
})

const segmentRuleSchema = z.object({
  attr: z.string().trim().min(1),
  op: z.enum(SEGMENT_OPS),
  values: z.array(z.string()).min(1),
})

const environmentsSchema = z
  .object({
    dev: z.boolean().optional(),
    staging: z.boolean().optional(),
    prod: z.boolean().optional(),
  })
  .partial()

function parseSegmentRules(raw: string | undefined): unknown | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const arr = z.array(segmentRuleSchema).parse(parsed)
    return arr
  } catch {
    return null
  }
}

function parseEnvironments(raw: string | undefined): unknown | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    const obj = environmentsSchema.parse(parsed)
    if (Object.keys(obj).length === 0) return null
    return obj
  } catch {
    return null
  }
}

async function writeAudit(
  userId: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: metadata as Prisma.InputJsonValue,
      },
    })
  } catch {
    /* never block on audit failures */
  }
}

function revalidateAll(id?: string) {
  revalidatePath('/dashboard/feature-flags')
  if (id) revalidatePath(`/dashboard/feature-flags/${id}`)
}

/* -------------------------------------------------------------------------- */
/*  Create / update / toggle / delete                                          */
/* -------------------------------------------------------------------------- */

/**
 * Create a new feature flag. Defaults to disabled so callers must explicitly
 * toggle it after configuring rollout.
 */
export async function createFlag(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  const raw = {
    key: formData.get('key'),
    name: formData.get('name'),
    description: formData.get('description'),
    type: formData.get('type'),
    percentage: formData.get('percentage') ?? 0,
    segmentRules: formData.get('segmentRules'),
    environments: formData.get('environments'),
  }
  const parsed = await localizedParse(baseFlagSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAdmin.flagActions.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data
  const segmentRules = parseSegmentRules(data.segmentRules)
  const environments = parseEnvironments(data.environments)

  try {
    const flag = await prisma.featureFlag.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        enabled: false,
        percentage: data.type === 'percentage' ? data.percentage : 0,
        segmentRules: segmentRules === null ? Prisma.JsonNull : (segmentRules as Prisma.InputJsonValue),
        environments: environments === null ? Prisma.JsonNull : (environments as Prisma.InputJsonValue),
        createdById: session.user.id,
      },
    })
    await writeAudit(session.user.id, AuditAction.CREATE, 'feature_flag.created', flag.id, {
      key: flag.key,
      type: flag.type,
    })
    revalidateAll(flag.id)
    return { ok: true, data: { id: flag.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: t.srvAdmin.flagActions.keyAlreadyUsed, field: 'key' }
    }
    console.error('[createFlag] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.createFlagFailed }
  }
}

/**
 * Update flag configuration. Does not change `enabled` — use `toggleFlag` for
 * that so audit logs are unambiguous.
 */
export async function updateFlag(id: string, formData: FormData): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  const raw = {
    key: formData.get('key'),
    name: formData.get('name'),
    description: formData.get('description'),
    type: formData.get('type'),
    percentage: formData.get('percentage') ?? 0,
    segmentRules: formData.get('segmentRules'),
    environments: formData.get('environments'),
  }
  const parsed = await localizedParse(baseFlagSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAdmin.flagActions.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data
  const segmentRules = parseSegmentRules(data.segmentRules)
  const environments = parseEnvironments(data.environments)

  try {
    await prisma.featureFlag.update({
      where: { id },
      data: {
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
        percentage: data.type === 'percentage' ? data.percentage : 0,
        segmentRules: segmentRules === null ? Prisma.JsonNull : (segmentRules as Prisma.InputJsonValue),
        environments: environments === null ? Prisma.JsonNull : (environments as Prisma.InputJsonValue),
      },
    })
    await writeAudit(session.user.id, AuditAction.UPDATE, 'feature_flag.updated', id, {
      key: data.key,
      type: data.type,
    })
    revalidateAll(id)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return { ok: false, error: t.srvAdmin.flagActions.keyAlreadyUsed, field: 'key' }
      }
      if (err.code === 'P2025') {
        return { ok: false, error: t.srvAdmin.flagActions.flagNotFound }
      }
    }
    console.error('[updateFlag] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.saveFlagFailed }
  }
}

/**
 * Master kill-switch toggle. Audited separately so on-call can see when a
 * flag was flipped.
 */
export async function toggleFlag(id: string, enabled: boolean): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  try {
    const flag = await prisma.featureFlag.update({
      where: { id },
      data: { enabled },
      select: { id: true, key: true, enabled: true },
    })
    await writeAudit(session.user.id, AuditAction.UPDATE, 'feature_flag.toggled', flag.id, {
      key: flag.key,
      enabled: flag.enabled,
    })
    revalidateAll(id)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvAdmin.flagActions.flagNotFound }
    }
    console.error('[toggleFlag] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.toggleFlagFailed }
  }
}

/**
 * Delete a flag. Overrides cascade via the FK in the Prisma schema.
 */
export async function deleteFlag(id: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  try {
    const flag = await prisma.featureFlag.delete({
      where: { id },
      select: { id: true, key: true },
    })
    await writeAudit(session.user.id, AuditAction.DELETE, 'feature_flag.deleted', flag.id, {
      key: flag.key,
    })
    revalidatePath('/dashboard/feature-flags')
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvAdmin.flagActions.flagNotFound }
    }
    console.error('[deleteFlag] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.deleteFlagFailed }
  }
}

/* -------------------------------------------------------------------------- */
/*  Overrides                                                                  */
/* -------------------------------------------------------------------------- */

const overrideSchema = z
  .object({
    scope: z.enum(['user', 'tenant', 'both']),
    userId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    tenantId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    value: z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean()),
    reason: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  })
  .superRefine((d, ctx) => {
    if (d.scope === 'user' && !d.userId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['userId'], params: { i18n: 'userIdRequiredForUserScope' } })
    }
    if (d.scope === 'tenant' && !d.tenantId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tenantId'], params: { i18n: 'tenantIdRequiredForTenantScope' } })
    }
    if (d.scope === 'both' && (!d.userId || !d.tenantId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['userId'], params: { i18n: 'scopeBothRequired' } })
    }
  })

/**
 * Upsert an override. The unique constraint is `(flagId, userId, tenantId)`,
 * so re-submitting the same scope updates the existing row instead of erroring.
 */
export async function addOverride(
  flagId: string,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  const raw = {
    scope: formData.get('scope'),
    userId: formData.get('userId'),
    tenantId: formData.get('tenantId'),
    value: formData.get('value'),
    reason: formData.get('reason'),
  }
  const parsed = await localizedParse(overrideSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAdmin.flagActions.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }
  const data = parsed.data

  const userId = data.scope === 'tenant' ? null : data.userId ?? null
  const tenantId = data.scope === 'user' ? null : data.tenantId ?? null

  if (!userId && !tenantId) {
    return { ok: false, error: t.srvAdmin.flagActions.overrideTargetRequired }
  }

  try {
    const flag = await prisma.featureFlag.findUnique({ where: { id: flagId }, select: { id: true, key: true } })
    if (!flag) return { ok: false, error: t.srvAdmin.flagActions.flagNotFound }

    const override = await prisma.featureFlagOverride.upsert({
      where: {
        flagId_userId_tenantId: {
          flagId,
          userId: userId as string,
          tenantId: tenantId as string,
        },
      },
      create: {
        flagId,
        userId,
        tenantId,
        value: data.value,
        reason: data.reason ?? null,
      },
      update: {
        value: data.value,
        reason: data.reason ?? null,
      },
    })

    await writeAudit(session.user.id, AuditAction.UPDATE, 'feature_flag.override.added', override.id, {
      flagId,
      flagKey: flag.key,
      userId,
      tenantId,
      value: data.value,
    })
    revalidatePath(`/dashboard/feature-flags/${flagId}`)
    return { ok: true }
  } catch (err) {
    console.error('[addOverride] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.saveOverrideFailed }
  }
}

/**
 * Delete a single override by id. Audited.
 */
export async function removeOverride(overrideId: string): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()
  const denied = requireSuperadmin(session.user.globalRole)
  if (denied) return { ok: false, error: t.srvAdmin.flagActions.superadminOnly }

  try {
    const override = await prisma.featureFlagOverride.delete({
      where: { id: overrideId },
      select: { id: true, flagId: true, userId: true, tenantId: true },
    })
    await writeAudit(session.user.id, AuditAction.DELETE, 'feature_flag.override.removed', override.id, {
      flagId: override.flagId,
      userId: override.userId,
      tenantId: override.tenantId,
    })
    revalidatePath(`/dashboard/feature-flags/${override.flagId}`)
    return { ok: true }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: t.srvAdmin.flagActions.overrideNotFound }
    }
    console.error('[removeOverride] failed', err)
    return { ok: false, error: t.srvAdmin.flagActions.deleteOverrideFailed }
  }
}
