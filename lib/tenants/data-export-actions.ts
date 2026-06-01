'use server'

import { headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

/**
 * Tenant data export action — OWNER-only.
 *
 * NOTE on permissions: we deliberately do NOT gate this with the `tenant.delete`
 * permission. The export reveals PII for every member and every applicant, so
 * we want a strict OWNER check (matching tenant.ownerUserId === actor.id),
 * not a permission that could be granted to other admins. This also keeps the
 * GDPR-data-export action under the same single-throat-to-choke contract as
 * billing changes and ownership transfer.
 *
 * MVP note: this action is synchronous — the actual JSON build happens in the
 * route handler (GET /api/tenants/[slug]/data-export) on download. For very
 * large tenants this can be slow; the long-term fix is a background job
 * (queue → S3 → signed URL → email when ready). Out of scope here.
 */

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

export async function requestTenantExport(input: {
  tenantSlug: string
}): Promise<ActionResult<{ downloadHref: string }>> {
  if (!input.tenantSlug) {
    return { ok: false, error: 'Data tidak valid.' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const actorId = session.user.id

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: input.tenantSlug },
      select: { id: true, slug: true, ownerUserId: true },
    })
    .catch(() => null)
  if (!tenant) {
    return { ok: false, error: 'Tenant tidak ditemukan.' }
  }
  if (tenant.ownerUserId !== actorId) {
    return {
      ok: false,
      error: 'Hanya OWNER tenant yang dapat mengunduh ekspor data.',
    }
  }

  const meta = getRequestMeta()
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: actorId,
        action: AuditAction.CREATE,
        resource: 'tenant.data_export',
        resourceId: tenant.id,
        metadata: { requested: true },
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    console.error('[requestTenantExport] audit failed', err)
    // Non-fatal: still allow the download to proceed.
  }

  return {
    ok: true,
    data: {
      downloadHref: `/api/tenants/${tenant.slug}/data-export`,
    },
  }
}
