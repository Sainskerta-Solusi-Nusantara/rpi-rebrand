'use server'

/**
 * Server action wrapper around the (mock, template-based) JD generator.
 *
 * Auth: requires a signed-in user. The generator itself only produces text,
 * so we don't need a tenant-scoped permission here — but we DO require the
 * caller to hold `job.create` somewhere (any tenant they're a member of), to
 * prevent random signed-in users from spamming the generator. Audit log is
 * still recorded for traceability.
 */

import { createHash } from 'crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import {
  AuditAction,
  EmploymentType,
  ExperienceLevel,
  LocationType,
  Prisma,
} from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasPermission, hasTenantPermission } from '@/lib/auth/rbac'
import {
  generateJobDescription,
  type JdGeneratorOutput,
} from './generate'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const inputSchema = z.object({
  tenantSlug: z.string().trim().min(1).max(64).optional(),
  title: z
    .string()
    .trim()
    .min(3, 'Judul minimal 3 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  level: z.nativeEnum(ExperienceLevel),
  employmentType: z.nativeEnum(EmploymentType),
  location: z.string().trim().max(120).optional().default(''),
  locationType: z.nativeEnum(LocationType),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
})

export type GenerateJdInput = z.input<typeof inputSchema>

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

/** Stable, non-reversible hash of the title for audit metadata. */
function titleHash(title: string): string {
  return createHash('sha1').update(title.toLowerCase().trim()).digest('hex').slice(0, 16)
}

export async function generateJdAction(
  input: GenerateJdInput,
): Promise<ActionResult<JdGeneratorOutput>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }

  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  // Permission gate: must hold job.create on the specified tenant (preferred)
  // or — if no tenant is specified — on at least one tenant they're a member of.
  let resolvedTenantId: string | null = null
  if (d.tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: d.tenantSlug },
      select: { id: true },
    })
    if (!tenant) return { ok: false, error: 'Tenant tidak ditemukan.' }
    if (
      !hasTenantPermission(
        session.user.globalRole,
        session.user.tenants,
        tenant.id,
        'job.create',
      )
    ) {
      return { ok: false, error: 'Anda tidak memiliki izin.' }
    }
    resolvedTenantId = tenant.id
  } else {
    const memberships = session.user.tenants ?? []
    const hasGlobalJobCreate = hasPermission(session.user.globalRole, 'job.create')
    const hasAnyTenantJobCreate = memberships.some((m) =>
      hasTenantPermission(
        session.user.globalRole,
        memberships,
        m.tenantId,
        'job.create',
      ),
    )
    if (!hasGlobalJobCreate && !hasAnyTenantJobCreate) {
      return { ok: false, error: 'Anda tidak memiliki izin.' }
    }
  }

  const output = generateJobDescription({
    title: d.title,
    level: d.level,
    employmentType: d.employmentType,
    location: d.location,
    locationType: d.locationType,
    tags: d.tags,
  })

  const meta = getRequestMeta()
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: resolvedTenantId,
        userId: session.user.id,
        action: AuditAction.CREATE,
        resource: 'tenant.jd_generated',
        resourceId: null,
        metadata: {
          titleHash: titleHash(d.title),
          tags: d.tags,
          level: d.level,
          employmentType: d.employmentType,
          locationType: d.locationType,
        } as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    // Audit log failure must not block the user — log + continue.
    console.error('[generateJdAction] audit log failed', err)
  }

  return { ok: true, data: output }
}
