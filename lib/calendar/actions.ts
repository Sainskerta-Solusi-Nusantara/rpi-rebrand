'use server'

/**
 * Calendar server actions for the connected recruiter user.
 *
 * Token-storage note (MVP): tokens are persisted plaintext in
 * `CalendarAccount.accessToken` / `refreshToken`. Production should encrypt
 * with an envelope key (e.g. libsodium secretbox + KEK from env). Mark as
 * TODO before shipping to multi-tenant prod.
 *
 * TODO(auto-sync): once `scheduleInterview` (lib/tenants/interview-actions.ts)
 * settles its transaction, callers could best-effort fire
 * `syncInterviewToCalendar(interview.id)` so newly-scheduled interviews land
 * on the recruiter's calendar automatically. We deliberately do NOT wire
 * that here to avoid touching another agent's scope; surface as a manual
 * button via `<SyncInterviewButton>` instead.
 */

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  refreshAccessToken,
  type GoogleEventInput,
} from '@/lib/calendar/google-client'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

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

const SUPPORTED_PROVIDERS = ['google', 'microsoft'] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

export type CalendarAccountSummary = {
  id: string
  provider: string
  providerEmail: string
  calendarId: string | null
  expiresAt: Date | null
  scope: string | null
  createdAt: Date
}

/** Return the signed-in user's calendar account (any provider) or null. */
export async function getMyCalendarAccount(): Promise<CalendarAccountSummary | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const account = await prisma.calendarAccount
    .findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        providerEmail: true,
        calendarId: true,
        expiresAt: true,
        scope: true,
        createdAt: true,
      },
    })
    .catch(() => null)
  return account
}

/**
 * Disconnect (delete) the current user's CalendarAccount for the given
 * provider. Cascades to CalendarEventMapping rows by schema.
 */
export async function disconnectCalendar(
  provider: string,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)) {
    return { ok: false, error: 'Provider tidak didukung.' }
  }

  try {
    const existing = await prisma.calendarAccount.findUnique({
      where: { userId_provider: { userId: session.user.id, provider } },
      select: { id: true, providerEmail: true },
    })
    if (!existing) {
      return { ok: false, error: 'Kalender belum terhubung.' }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.calendarAccount.delete({ where: { id: existing.id } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.DELETE,
          resource: 'calendar.account',
          resourceId: existing.id,
          metadata: { provider, providerEmail: existing.providerEmail },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    return { ok: true }
  } catch (err) {
    console.error('[disconnectCalendar] failed', err)
    return { ok: false, error: 'Gagal memutuskan kalender. Coba lagi sebentar.' }
  }
}

/**
 * Internal: ensure `account.accessToken` is still valid (>60s left). If not,
 * refresh and persist. Returns a valid accessToken or an error.
 */
async function ensureFreshAccessToken(account: {
  id: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const now = Date.now()
  const expiresAt = account.expiresAt?.getTime() ?? 0
  const stillValid = expiresAt > now + 60_000
  if (stillValid) return { ok: true, accessToken: account.accessToken }
  if (!account.refreshToken) {
    return { ok: false, error: 'Refresh token tidak tersedia, hubungkan ulang kalender.' }
  }
  const refreshed = await refreshAccessToken(account.refreshToken)
  if (!refreshed.ok) return { ok: false, error: refreshed.error }
  await prisma.calendarAccount
    .update({
      where: { id: account.id },
      data: {
        accessToken: refreshed.data.accessToken,
        refreshToken: refreshed.data.refreshToken ?? account.refreshToken,
        expiresAt: new Date(Date.now() + refreshed.data.expiresIn * 1000),
        scope: refreshed.data.scope ?? undefined,
      },
    })
    .catch(() => null)
  return { ok: true, accessToken: refreshed.data.accessToken }
}

function buildGoogleEventFromInterview(interview: {
  scheduledAt: Date
  durationMin: number
  type: string
  meetingUrl: string | null
  location: string | null
  notes: string | null
  stageName: string | null
  application: {
    job: { title: string }
    user: { email: string; name: string | null }
  }
}): GoogleEventInput {
  const start = interview.scheduledAt
  const end = new Date(start.getTime() + interview.durationMin * 60_000)
  const stage = interview.stageName ? ` (${interview.stageName})` : ''
  const summary = `Wawancara: ${interview.application.job.title}${stage}`
  const descriptionLines = [
    `Pelamar: ${interview.application.user.name ?? interview.application.user.email}`,
    `Jenis: ${interview.type}`,
    interview.meetingUrl ? `Tautan meeting: ${interview.meetingUrl}` : '',
    interview.notes ? `Catatan:\n${interview.notes}` : '',
  ].filter(Boolean)
  // Use Asia/Jakarta for now; future: per-user timezone preference.
  const tz = 'Asia/Jakarta'
  const event: GoogleEventInput = {
    summary,
    description: descriptionLines.join('\n'),
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    attendees: [
      {
        email: interview.application.user.email,
        displayName: interview.application.user.name ?? undefined,
      },
    ],
  }
  if (interview.type === 'onsite' && interview.location) {
    event.location = interview.location
  }
  return event
}

/**
 * Sync an interview to the current user's Google Calendar. Idempotent for
 * the "already synced" case (returns existing mapping).
 *
 * Requires:
 *  - Caller is signed in
 *  - Caller has `job.update` for the tenant
 *  - Caller has a connected `google` CalendarAccount
 */
export async function syncInterviewToCalendar(
  interviewId: string,
): Promise<ActionResult<{ externalEventId: string; htmlLink: string | null }>> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const interview = await prisma.interviewSchedule
    .findUnique({
      where: { id: interviewId },
      select: {
        id: true,
        scheduledAt: true,
        durationMin: true,
        type: true,
        meetingUrl: true,
        location: true,
        notes: true,
        stageName: true,
        application: {
          select: {
            id: true,
            tenantId: true,
            tenant: { select: { slug: true } },
            job: { select: { title: true } },
            user: { select: { email: true, name: true } },
          },
        },
        calendarEvent: {
          select: { id: true, externalEventId: true, htmlLink: true },
        },
      },
    })
    .catch(() => null)
  if (!interview) {
    return { ok: false, error: 'Wawancara tidak ditemukan.' }
  }
  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      interview.application.tenantId,
      'job.update',
    )
  ) {
    return { ok: false, error: 'Anda tidak memiliki izin.' }
  }

  const account = await prisma.calendarAccount.findUnique({
    where: { userId_provider: { userId: actorId, provider: 'google' } },
    select: {
      id: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      calendarId: true,
      providerEmail: true,
    },
  })
  if (!account) {
    return {
      ok: false,
      error: 'Belum ada kalender Google terhubung. Buka Keamanan untuk menghubungkan.',
    }
  }

  // If already synced, treat as success — update event instead (light path).
  if (interview.calendarEvent) {
    return {
      ok: true,
      data: {
        externalEventId: interview.calendarEvent.externalEventId,
        htmlLink: interview.calendarEvent.htmlLink,
      },
    }
  }

  const fresh = await ensureFreshAccessToken(account)
  if (!fresh.ok) return { ok: false, error: fresh.error }

  const event = buildGoogleEventFromInterview(interview)
  const created = await createCalendarEvent({
    accessToken: fresh.accessToken,
    calendarId: account.calendarId,
    event,
  })
  if (!created.ok) {
    return { ok: false, error: `Gagal membuat event: ${created.error}` }
  }

  const meta = getRequestMeta()
  try {
    const mapping = await prisma.calendarEventMapping.create({
      data: {
        interviewId: interview.id,
        calendarAccountId: account.id,
        externalEventId: created.data.id,
        htmlLink: created.data.htmlLink || null,
      },
      select: { id: true, externalEventId: true, htmlLink: true },
    })
    await prisma.auditLog
      .create({
        data: {
          userId: actorId,
          tenantId: interview.application.tenantId,
          action: AuditAction.CREATE,
          resource: 'calendar.event',
          resourceId: mapping.id,
          metadata: {
            interviewId: interview.id,
            provider: 'google',
            externalEventId: mapping.externalEventId,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch(() => null)

    revalidatePath(
      `/dashboard/tenants/${interview.application.tenant.slug}/lamaran/${interview.application.id}`,
    )
    return {
      ok: true,
      data: { externalEventId: mapping.externalEventId, htmlLink: mapping.htmlLink },
    }
  } catch (err) {
    // If unique constraint hits because of a race, treat as already synced.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: true,
        data: { externalEventId: created.data.id, htmlLink: created.data.htmlLink || null },
      }
    }
    console.error('[syncInterviewToCalendar] failed', err)
    return { ok: false, error: 'Gagal menyimpan sinkronisasi.' }
  }
}

/**
 * Delete the external Google Calendar event + local mapping for an interview.
 */
export async function unsyncInterview(
  interviewId: string,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: 'Anda harus masuk.' }
  }
  const mapping = await prisma.calendarEventMapping
    .findUnique({
      where: { interviewId },
      select: {
        id: true,
        externalEventId: true,
        calendarAccount: {
          select: {
            id: true,
            userId: true,
            accessToken: true,
            refreshToken: true,
            expiresAt: true,
            calendarId: true,
            provider: true,
          },
        },
        interview: {
          select: {
            application: {
              select: {
                id: true,
                tenantId: true,
                tenant: { select: { slug: true } },
              },
            },
          },
        },
      },
    })
    .catch(() => null)
  if (!mapping) {
    return { ok: false, error: 'Sinkronisasi tidak ditemukan.' }
  }
  const { globalRole, tenants, id: actorId } = session.user
  if (
    !hasTenantPermission(
      globalRole,
      tenants,
      mapping.interview.application.tenantId,
      'job.update',
    )
  ) {
    return { ok: false, error: 'Anda tidak memiliki izin.' }
  }
  // Only allow deletion of an event tied to the actor's own account, unless
  // SUPERADMIN. Prevents accidentally calling another user's tokens.
  if (
    mapping.calendarAccount.userId !== actorId &&
    globalRole !== 'SUPERADMIN'
  ) {
    return { ok: false, error: 'Anda hanya bisa menghapus sinkronisasi milik Anda.' }
  }

  const fresh = await ensureFreshAccessToken({
    id: mapping.calendarAccount.id,
    accessToken: mapping.calendarAccount.accessToken,
    refreshToken: mapping.calendarAccount.refreshToken,
    expiresAt: mapping.calendarAccount.expiresAt,
  })
  if (fresh.ok && mapping.calendarAccount.provider === 'google') {
    const del = await deleteCalendarEvent({
      accessToken: fresh.accessToken,
      calendarId: mapping.calendarAccount.calendarId,
      eventId: mapping.externalEventId,
    })
    if (!del.ok) {
      // Don't fail the unsync if remote already gone — we still want local cleanup.
      console.warn('[unsyncInterview] remote delete failed:', del.error)
    }
  }

  const meta = getRequestMeta()
  try {
    await prisma.$transaction([
      prisma.calendarEventMapping.delete({ where: { id: mapping.id } }),
      prisma.auditLog.create({
        data: {
          userId: actorId,
          tenantId: mapping.interview.application.tenantId,
          action: AuditAction.DELETE,
          resource: 'calendar.event',
          resourceId: mapping.id,
          metadata: {
            interviewId,
            provider: mapping.calendarAccount.provider,
            externalEventId: mapping.externalEventId,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])
    revalidatePath(
      `/dashboard/tenants/${mapping.interview.application.tenant.slug}/lamaran/${mapping.interview.application.id}`,
    )
    return { ok: true }
  } catch (err) {
    console.error('[unsyncInterview] failed', err)
    return { ok: false, error: 'Gagal menghapus sinkronisasi.' }
  }
}
