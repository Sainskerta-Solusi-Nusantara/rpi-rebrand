'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, NotificationType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Talent Pool — recruiter-side outreach actions.
 *
 * ---------------------------------------------------------------------------
 * Scope / design notes
 * ---------------------------------------------------------------------------
 * - `sendOutreach`: lets a recruiter (job.view on the tenant) message a
 *   PUBLIC candidate WITHOUT an existing application. Delivered as a
 *   Notification (type APPLICATION_UPDATE — the closest semantic match in
 *   the existing enum; see lib/messaging/actions.ts for the same rationale).
 *
 * - This is OUTREACH, not a chat thread. Full messaging requires an actual
 *   Application row (MessageThread has a unique applicationId), so the
 *   recruiter's first message is one-way until the candidate applies. The
 *   notification body carries the outreach text + a link back to the
 *   candidate's /dashboard. A future iteration could promote outreach to a
 *   real thread by introducing a synthetic Application or relaxing the
 *   MessageThread FK — both require schema work that's out of scope here.
 *
 * - `saveCandidate` (bookmark) was DELIBERATELY OMITTED from this feature.
 *   There is no schema model for it, and stashing bookmarks in Branding.* or
 *   abusing AuditLog was rejected as too hacky. The talent-pool UI relies on
 *   client-side localStorage for "saved candidates" if needed; persistent
 *   bookmarks should land in a dedicated `RecruiterBookmark` model in a
 *   follow-up feature.
 *
 * - Audit:
 *     resource = 'talent_pool.outreach' for invitations
 *     resource = 'talent_pool.search'   (lightweight; reserved for future
 *       usage when we wire saved searches into the talent pool — not
 *       written here)
 *
 * - Privacy: we re-verify candidate.profilePublic === true + status ACTIVE
 *   on every send, so a recruiter cannot exploit a stale page cache to
 *   message a user who has since opted out.
 */

const sendOutreachSchema = z.object({
  tenantSlug: z.string().min(1, 'Tenant wajib diisi'),
  candidateUserId: z.string().min(1, 'Kandidat wajib diisi'),
  body: z
    .string()
    .min(10, 'Pesan minimal 10 karakter')
    .max(2000, 'Pesan maksimal 2000 karakter')
    .transform((v) => v.trim()),
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
  | {
      tenant: { id: string; slug: string; name: string }
      actorId: string
    }

async function loadTenantForOutreach(tenantSlug: string): Promise<LoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true },
    })
    .catch(() => null)
  if (!tenant) return { error: 'Tenant tidak ditemukan.' }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, 'job.view')) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { tenant, actorId }
}

/**
 * Send an outreach message from a recruiter to a public candidate.
 *
 * Authorization:
 *   - Caller must hold `job.view` on the requesting tenant.
 *   - Target candidate must currently be profilePublic === true AND
 *     status === 'ACTIVE'. (Re-checked at send time to prevent stale-page
 *     races where the candidate opted out after the recruiter loaded
 *     results.)
 *
 * Delivery:
 *   - One Notification row for the candidate (type APPLICATION_UPDATE).
 *   - AuditLog row scoped to the recruiter's tenant with resource
 *     'talent_pool.outreach'.
 */
export async function sendOutreach(input: {
  tenantSlug: string
  candidateUserId: string
  body: string
}): Promise<ActionResult> {
  const parsed = sendOutreachSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { tenantSlug, candidateUserId, body } = parsed.data

  const ctx = await loadTenantForOutreach(tenantSlug)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  // Re-verify candidate's public/active status — never message someone who
  // has opted out, even if the page cache says otherwise.
  const candidate = await prisma.user
    .findUnique({
      where: { id: candidateUserId },
      select: {
        id: true,
        profilePublic: true,
        status: true,
      },
    })
    .catch(() => null)
  if (!candidate) return { ok: false, error: 'Kandidat tidak ditemukan.' }
  if (!candidate.profilePublic || candidate.status !== 'ACTIVE') {
    return {
      ok: false,
      error: 'Kandidat tidak menerima tawaran saat ini.',
    }
  }

  if (candidate.id === ctx.actorId) {
    return { ok: false, error: 'Tidak dapat mengirim tawaran ke diri sendiri.' }
  }

  try {
    const preview = body.length > 200 ? body.slice(0, 200) + '…' : body
    const link = '/dashboard'

    await prisma.notification.create({
      data: {
        userId: candidate.id,
        type: NotificationType.APPLICATION_UPDATE,
        title: `Tawaran dari ${ctx.tenant.name}`,
        body: preview,
        link,
      },
    })

    const meta = getRequestMeta()
    await prisma.auditLog
      .create({
        data: {
          tenantId: ctx.tenant.id,
          userId: ctx.actorId,
          action: AuditAction.CREATE,
          resource: 'talent_pool.outreach',
          resourceId: candidate.id,
          metadata: {
            candidateUserId: candidate.id,
            bodyLength: body.length,
          } as Prisma.InputJsonValue,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch((err) => {
        console.error('[sendOutreach] audit log failed', err)
      })

    revalidatePath(`/dashboard/tenants/${tenantSlug}/talent-pool`)
    return { ok: true }
  } catch (err) {
    console.error('[sendOutreach] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}
