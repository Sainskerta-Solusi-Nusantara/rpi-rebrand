'use server'

/**
 * Calendar server actions for the connected recruiter user.
 *
 * Token-storage: `CalendarAccount.accessToken` / `refreshToken` are encrypted
 * at rest with AES-256-GCM via lib/calendar/token-crypto.ts (KEK from
 * `CALENDAR_TOKEN_KEY`). This module decrypts on read and re-encrypts on
 * refresh; legacy plaintext rows are read transparently and upgraded on their
 * next write. Without a configured key (dev), tokens fall back to plaintext.
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
import { getServerT } from '@/lib/i18n/server-dictionary'
import {
  createCalendarEvent,
  deleteCalendarEvent,
  refreshAccessToken,
  type GoogleEventInput,
} from '@/lib/calendar/google-client'
import {
  createMicrosoftEvent,
  deleteMicrosoftEvent,
  refreshMicrosoftToken,
  type MicrosoftEventInput,
} from '@/lib/calendar/microsoft'
import { decryptToken, encryptToken } from '@/lib/calendar/token-crypto'

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
 * Return ALL calendar accounts for the signed-in user (one per provider).
 * Used by the dashboard integrasi/keamanan UI so that Google + Microsoft can
 * be rendered side-by-side, each with its own connect/disconnect state.
 */
export async function getMyCalendarAccounts(): Promise<CalendarAccountSummary[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  return prisma.calendarAccount
    .findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
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
    .catch(() => [])
}

/**
 * Disconnect (delete) the current user's CalendarAccount for the given
 * provider. Cascades to CalendarEventMapping rows by schema.
 */
export async function disconnectCalendar(
  provider: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvCalendar.calendar.mustLogin }
  }
  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)) {
    return { ok: false, error: t.srvCalendar.calendar.providerNotSupported }
  }

  try {
    const existing = await prisma.calendarAccount.findUnique({
      where: { userId_provider: { userId: session.user.id, provider } },
      select: { id: true, providerEmail: true },
    })
    if (!existing) {
      return { ok: false, error: t.srvCalendar.calendar.calendarNotConnected }
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
    return { ok: false, error: t.srvCalendar.calendar.disconnectFailed }
  }
}

/**
 * Internal: ensure `account.accessToken` is still valid (>60s left). If not,
 * refresh via the appropriate provider's token endpoint and persist.
 * Returns a valid (plaintext) accessToken or an error.
 *
 * The `account` fields are read from the DB and may be encrypted at rest
 * (see lib/calendar/token-crypto.ts). We decrypt on the way in, operate on
 * plaintext, and re-encrypt before persisting refreshed tokens. The returned
 * accessToken is always plaintext for direct use against provider APIs.
 *
 * Provider-aware: dispatches to either `refreshAccessToken` (Google) or
 * `refreshMicrosoftToken` (Graph). Both return shapes are normalized so this
 * helper stays simple.
 */
async function ensureFreshAccessToken(account: {
  id: string
  provider: string
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
}): Promise<{ ok: true; accessToken: string } | { ok: false; error: string }> {
  const accessToken = decryptToken(account.accessToken) as string
  const refreshToken = decryptToken(account.refreshToken)

  const now = Date.now()
  const expiresAt = account.expiresAt?.getTime() ?? 0
  const stillValid = expiresAt > now + 60_000
  if (stillValid) return { ok: true, accessToken }
  if (!refreshToken) {
    const t = await getServerT()
    return { ok: false, error: t.srvCalendar.calendar.refreshTokenMissing }
  }

  if (account.provider === 'microsoft') {
    const refreshed = await refreshMicrosoftToken(refreshToken)
    if (!refreshed.ok) return { ok: false, error: refreshed.error }
    await prisma.calendarAccount
      .update({
        where: { id: account.id },
        data: {
          accessToken: encryptToken(refreshed.data.accessToken),
          refreshToken: encryptToken(refreshed.data.refreshToken ?? refreshToken),
          expiresAt: refreshed.data.expiresAt,
          scope: refreshed.data.scope ?? undefined,
        },
      })
      .catch(() => null)
    return { ok: true, accessToken: refreshed.data.accessToken }
  }

  // Default: Google.
  const refreshed = await refreshAccessToken(refreshToken)
  if (!refreshed.ok) return { ok: false, error: refreshed.error }
  await prisma.calendarAccount
    .update({
      where: { id: account.id },
      data: {
        accessToken: encryptToken(refreshed.data.accessToken),
        refreshToken: encryptToken(refreshed.data.refreshToken ?? refreshToken),
        expiresAt: new Date(Date.now() + refreshed.data.expiresIn * 1000),
        scope: refreshed.data.scope ?? undefined,
      },
    })
    .catch(() => null)
  return { ok: true, accessToken: refreshed.data.accessToken }
}

/**
 * Provider-agnostic interview projection used by both Google and Microsoft
 * event-builders. Keeping a neutral shape here avoids drift between providers
 * (e.g. accidentally adding a field to one and not the other).
 */
type InterviewProjection = {
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
}

function buildGoogleEventFromInterview(
  interview: InterviewProjection,
): GoogleEventInput {
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
 * Microsoft Graph event body. Note Graph wants HTML for `body.content`
 * (Google takes plain-text `description`). We re-encode line breaks as <br>
 * and HTML-escape the user-controlled strings to defend against injection
 * into the rendered event description in Outlook web.
 */
function buildMicrosoftEventFromInterview(
  interview: InterviewProjection,
): MicrosoftEventInput {
  const start = interview.scheduledAt
  const end = new Date(start.getTime() + interview.durationMin * 60_000)
  const stage = interview.stageName ? ` (${interview.stageName})` : ''
  const subject = `Wawancara: ${interview.application.job.title}${stage}`

  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const lines = [
    `Pelamar: ${escape(interview.application.user.name ?? interview.application.user.email)}`,
    `Jenis: ${escape(interview.type)}`,
    interview.meetingUrl
      ? `Tautan meeting: <a href="${escape(interview.meetingUrl)}">${escape(interview.meetingUrl)}</a>`
      : '',
    interview.notes
      ? `Catatan:<br>${escape(interview.notes).replace(/\n/g, '<br>')}`
      : '',
  ].filter(Boolean)

  const tz = 'Asia/Jakarta'
  const event: MicrosoftEventInput = {
    subject,
    body: { contentType: 'HTML', content: lines.join('<br>') },
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    attendees: [
      {
        emailAddress: {
          address: interview.application.user.email,
          name: interview.application.user.name ?? undefined,
        },
        type: 'required',
      },
    ],
  }
  if (interview.type === 'onsite' && interview.location) {
    event.location = { displayName: interview.location }
  }
  return event
}

/**
 * Sync an interview to the current user's calendar. Idempotent for the
 * "already synced" case (returns existing mapping).
 *
 * Provider abstraction:
 *  - Looks up ALL connected accounts for the actor. If both Google and
 *    Microsoft are connected, the event is created on BOTH calendars so
 *    the recruiter sees it wherever they work. But because schema enforces
 *    `CalendarEventMapping.interviewId @unique`, only one provider's
 *    mapping is persisted (preference: Google for backward-compat with
 *    existing event-log UI). Other-provider event ids are recorded in
 *    the audit log's `metadata.alsoSyncedTo` for traceability.
 *  - If neither is connected, returns a localized error.
 *
 * Requires:
 *  - Caller is signed in
 *  - Caller has `job.update` for the tenant
 */
export async function syncInterviewToCalendar(
  interviewId: string,
): Promise<ActionResult<{ externalEventId: string; htmlLink: string | null }>> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvCalendar.calendar.mustLogin }
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
    return { ok: false, error: t.srvCalendar.calendar.interviewNotFound }
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
    return { ok: false, error: t.srvCalendar.calendar.noPermission }
  }

  const accounts = await prisma.calendarAccount.findMany({
    where: { userId: actorId, provider: { in: ['google', 'microsoft'] } },
    select: {
      id: true,
      provider: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      calendarId: true,
      providerEmail: true,
    },
  })
  if (accounts.length === 0) {
    return {
      ok: false,
      error: t.srvCalendar.calendar.noCalendarConnected,
    }
  }

  // If already synced, treat as success — caller intent is "make sure this
  // is on a calendar"; an existing mapping satisfies that. Future work:
  // detect when a second provider was added later and back-fill.
  if (interview.calendarEvent) {
    return {
      ok: true,
      data: {
        externalEventId: interview.calendarEvent.externalEventId,
        htmlLink: interview.calendarEvent.htmlLink,
      },
    }
  }

  // Prefer Google first so the persisted mapping matches the historical
  // behavior. Microsoft (if present) is then created best-effort.
  const ordered = [...accounts].sort((a, b) =>
    a.provider === 'google' ? -1 : b.provider === 'google' ? 1 : 0,
  )

  const created: Array<{
    provider: string
    accountId: string
    externalEventId: string
    htmlLink: string | null
  }> = []
  const errors: Array<{ provider: string; error: string }> = []

  for (const account of ordered) {
    const fresh = await ensureFreshAccessToken(account)
    if (!fresh.ok) {
      errors.push({ provider: account.provider, error: fresh.error })
      continue
    }
    if (account.provider === 'microsoft') {
      const payload = buildMicrosoftEventFromInterview(interview)
      const r = await createMicrosoftEvent(fresh.accessToken, payload)
      if (!r.ok) {
        errors.push({ provider: account.provider, error: r.error })
        continue
      }
      created.push({
        provider: account.provider,
        accountId: account.id,
        externalEventId: r.data.externalEventId,
        htmlLink: r.data.htmlLink || null,
      })
    } else {
      // google
      const event = buildGoogleEventFromInterview(interview)
      const r = await createCalendarEvent({
        accessToken: fresh.accessToken,
        calendarId: account.calendarId,
        event,
      })
      if (!r.ok) {
        errors.push({ provider: account.provider, error: r.error })
        continue
      }
      created.push({
        provider: account.provider,
        accountId: account.id,
        externalEventId: r.data.id,
        htmlLink: r.data.htmlLink || null,
      })
    }
  }

  if (created.length === 0) {
    const summary = errors.map((e) => `${e.provider}: ${e.error}`).join('; ')
    return { ok: false, error: `${t.srvCalendar.calendar.createEventFailed}${summary}` }
  }

  // Persist the FIRST successful provider as the canonical mapping (Google
  // wins by sort above). Any others go into the audit log for traceability.
  const primary = created[0]
  if (!primary) {
    // Unreachable: `created.length === 0` is handled above, but TS can't see it.
    return { ok: false, error: t.srvCalendar.calendar.createEventFailedGeneric }
  }
  const secondary = created.slice(1)
  const meta = getRequestMeta()
  try {
    const mapping = await prisma.calendarEventMapping.create({
      data: {
        interviewId: interview.id,
        calendarAccountId: primary.accountId,
        externalEventId: primary.externalEventId,
        htmlLink: primary.htmlLink,
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
            provider: primary.provider,
            externalEventId: mapping.externalEventId,
            alsoSyncedTo: secondary.map((s) => ({
              provider: s.provider,
              externalEventId: s.externalEventId,
            })),
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
      data: {
        externalEventId: mapping.externalEventId,
        htmlLink: mapping.htmlLink,
      },
    }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      return {
        ok: true,
        data: {
          externalEventId: primary.externalEventId,
          htmlLink: primary.htmlLink,
        },
      }
    }
    console.error('[syncInterviewToCalendar] failed', err)
    return { ok: false, error: t.srvCalendar.calendar.saveSyncFailed }
  }
}

/**
 * Delete the external Google Calendar event + local mapping for an interview.
 */
export async function unsyncInterview(
  interviewId: string,
): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvCalendar.calendar.mustLogin }
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
    return { ok: false, error: t.srvCalendar.calendar.syncNotFound }
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
    return { ok: false, error: t.srvCalendar.calendar.noPermission }
  }
  // Only allow deletion of an event tied to the actor's own account, unless
  // SUPERADMIN. Prevents accidentally calling another user's tokens.
  if (
    mapping.calendarAccount.userId !== actorId &&
    globalRole !== 'SUPERADMIN'
  ) {
    return { ok: false, error: t.srvCalendar.calendar.deleteSyncOwnerOnly }
  }

  const fresh = await ensureFreshAccessToken({
    id: mapping.calendarAccount.id,
    provider: mapping.calendarAccount.provider,
    accessToken: mapping.calendarAccount.accessToken,
    refreshToken: mapping.calendarAccount.refreshToken,
    expiresAt: mapping.calendarAccount.expiresAt,
  })
  if (fresh.ok) {
    if (mapping.calendarAccount.provider === 'google') {
      const del = await deleteCalendarEvent({
        accessToken: fresh.accessToken,
        calendarId: mapping.calendarAccount.calendarId,
        eventId: mapping.externalEventId,
      })
      if (!del.ok) {
        // Don't fail the unsync if remote already gone — we still want local cleanup.
        console.warn('[unsyncInterview] google remote delete failed:', del.error)
      }
    } else if (mapping.calendarAccount.provider === 'microsoft') {
      const del = await deleteMicrosoftEvent(
        fresh.accessToken,
        mapping.externalEventId,
      )
      if (!del.ok) {
        console.warn(
          '[unsyncInterview] microsoft remote delete failed:',
          del.error,
        )
      }
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
    return { ok: false, error: t.srvCalendar.calendar.deleteSyncFailed }
  }
}
