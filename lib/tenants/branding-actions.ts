'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { dispatchTenantEvent } from '@/lib/webhooks/dispatch'
import {
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  deleteLocalTenantLogo,
  saveTenantLogo,
} from '@/lib/storage'
import { getServerT } from '@/lib/i18n/server-dictionary'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const colorOpt = z
  .string()
  .trim()
  .refine((v) => v === '' || HEX_RE.test(v), 'Gunakan format warna #rrggbb')
  .transform((v) => (v === '' ? undefined : v.toLowerCase()))
  .optional()

const updateSchema = z.object({
  primaryColor: colorOpt,
  secondaryColor: colorOpt,
  accentColor: colorOpt,
  backgroundColor: colorOpt,
  foregroundColor: colorOpt,
  ringColor: colorOpt,
  fontHeading: z.string().trim().max(80).optional().or(z.literal('')),
  fontBody: z.string().trim().max(80).optional().or(z.literal('')),
  radius: z
    .preprocess(
      (v) => (typeof v === 'string' && v !== '' ? Number(v) : v),
      z.number().int().min(0).max(40).optional(),
    ),
  density: z.enum(['compact', 'normal', 'comfortable']).optional(),
})

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

type LoadCtx =
  | { error: string }
  | { tenant: { id: string; slug: string }; actorId: string }

async function loadTenantForBranding(tenantSlug: string): Promise<LoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant1.branding.mustLogin }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant1.branding.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'branding.update')) {
    return { error: t.srvTenant1.branding.noPermission }
  }
  return { tenant, actorId }
}

export async function updateTenantBranding(input: {
  tenantSlug: string
  values: FormData
}): Promise<ActionResult> {
  const ctx = await loadTenantForBranding(input.tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const t = await getServerT()
  const fd = input.values
  const parsed = updateSchema.safeParse({
    primaryColor: fd.get('primaryColor') ?? '',
    secondaryColor: fd.get('secondaryColor') ?? '',
    accentColor: fd.get('accentColor') ?? '',
    backgroundColor: fd.get('backgroundColor') ?? '',
    foregroundColor: fd.get('foregroundColor') ?? '',
    ringColor: fd.get('ringColor') ?? '',
    fontHeading: fd.get('fontHeading') ?? '',
    fontBody: fd.get('fontBody') ?? '',
    radius: fd.get('radius') ?? undefined,
    density: fd.get('density') ?? undefined,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvTenant1.branding.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const d = parsed.data

  try {
    // Filter out undefined so we don't overwrite with defaults.
    const updateData: Record<string, unknown> = {}
    if (d.primaryColor) updateData.primaryColor = d.primaryColor
    if (d.secondaryColor) updateData.secondaryColor = d.secondaryColor
    if (d.accentColor) updateData.accentColor = d.accentColor
    if (d.backgroundColor) updateData.backgroundColor = d.backgroundColor
    if (d.foregroundColor) updateData.foregroundColor = d.foregroundColor
    if (d.ringColor) updateData.ringColor = d.ringColor
    if (d.fontHeading) updateData.fontHeading = d.fontHeading
    if (d.fontBody) updateData.fontBody = d.fontBody
    if (typeof d.radius === 'number') updateData.radius = d.radius
    if (d.density) updateData.density = d.density

    await prisma.branding.upsert({
      where: { tenantId: ctx.tenant.id },
      update: updateData,
      create: { tenantId: ctx.tenant.id, ...updateData },
    })

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: 'tenant.branding',
        resourceId: ctx.tenant.id,
        metadata: updateData as Prisma.InputJsonValue,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    dispatchTenantEvent(ctx.tenant.id, 'tenant.branding.updated', {
      changed: Object.keys(updateData),
    })

    revalidatePath(`/dashboard/tenants/${input.tenantSlug}/branding`)
    return { ok: true }
  } catch (err) {
    console.error('[updateTenantBranding] failed', err)
    return { ok: false, error: t.srvTenant1.branding.updateFailed }
  }
}

const LOGO_SLOTS = ['light', 'dark', 'favicon'] as const
type LogoSlot = (typeof LOGO_SLOTS)[number]

export async function uploadTenantLogo(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const t = await getServerT()
  const tenantSlug = String(formData.get('tenantSlug') ?? '')
  const slotRaw = String(formData.get('slot') ?? '')
  if (!LOGO_SLOTS.includes(slotRaw as LogoSlot)) {
    return { ok: false, error: t.srvTenant1.branding.slotInvalid }
  }
  const slot = slotRaw as LogoSlot

  const ctx = await loadTenantForBranding(tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const file = formData.get('file')
  if (!(file instanceof Blob) || file.size === 0) {
    return { ok: false, error: t.srvTenant1.branding.fileNotFound }
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, error: t.srvTenant1.branding.fileTooLarge }
  }
  if (!ALLOWED_LOGO_MIME.includes(file.type)) {
    return { ok: false, error: t.srvTenant1.branding.formatInvalid }
  }

  try {
    const buf = Buffer.from(await file.arrayBuffer())
    const save = await saveTenantLogo({ tenantId: ctx.tenant.id, slot, buffer: buf, mime: file.type })
    if (!save.ok) return { ok: false, error: save.error }

    const prior = await prisma.branding.findUnique({
      where: { tenantId: ctx.tenant.id },
      select: { logoLight: true, logoDark: true, favicon: true },
    })

    const field = slot === 'light' ? 'logoLight' : slot === 'dark' ? 'logoDark' : 'favicon'
    await prisma.branding.upsert({
      where: { tenantId: ctx.tenant.id },
      update: { [field]: save.url },
      create: { tenantId: ctx.tenant.id, [field]: save.url },
    })

    const priorUrl = prior?.[field] ?? null
    if (priorUrl && priorUrl !== save.url) void deleteLocalTenantLogo(priorUrl)

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: `tenant.branding.${slot}`,
        resourceId: ctx.tenant.id,
        metadata: { to: save.url },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/branding`)
    return { ok: true, data: { url: save.url } }
  } catch (err) {
    console.error('[uploadTenantLogo] failed', err)
    return { ok: false, error: t.srvTenant1.branding.uploadFailed }
  }
}

export async function removeTenantLogo(input: {
  tenantSlug: string
  slot: LogoSlot
}): Promise<ActionResult> {
  const t = await getServerT()
  if (!LOGO_SLOTS.includes(input.slot)) {
    return { ok: false, error: t.srvTenant1.branding.slotInvalid }
  }
  const ctx = await loadTenantForBranding(input.tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  try {
    const prior = await prisma.branding.findUnique({
      where: { tenantId: ctx.tenant.id },
      select: { logoLight: true, logoDark: true, favicon: true },
    })
    const field =
      input.slot === 'light' ? 'logoLight' : input.slot === 'dark' ? 'logoDark' : 'favicon'
    const priorUrl = prior?.[field] ?? null

    await prisma.branding.upsert({
      where: { tenantId: ctx.tenant.id },
      update: { [field]: null },
      create: { tenantId: ctx.tenant.id, [field]: null },
    })

    if (priorUrl) void deleteLocalTenantLogo(priorUrl)

    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        tenantId: ctx.tenant.id,
        userId: ctx.actorId,
        action: AuditAction.UPDATE,
        resource: `tenant.branding.${input.slot}`,
        resourceId: ctx.tenant.id,
        metadata: { from: priorUrl, to: null },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })

    revalidatePath(`/dashboard/tenants/${input.tenantSlug}/branding`)
    return { ok: true }
  } catch (err) {
    console.error('[removeTenantLogo] failed', err)
    return { ok: false, error: t.srvTenant1.branding.removeFailed }
  }
}
