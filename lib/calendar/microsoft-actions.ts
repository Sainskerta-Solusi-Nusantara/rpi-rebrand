'use server'

/**
 * Microsoft (Outlook) calendar server actions for the connected recruiter user.
 *
 * Mirrors lib/calendar/actions.ts but redirects to the Microsoft OAuth start
 * route instead of issuing the Google authorize URL directly. We split into
 * a server action + a GET route so that the cookie + signed-state minting
 * happens in one place — the state-signing key (NEXTAUTH_SECRET) is therefore
 * only referenced from server-only files.
 *
 * Token-storage: `CalendarAccount.accessToken` / `refreshToken` are encrypted
 * at rest (AES-256-GCM, KEK from `CALENDAR_TOKEN_KEY`) via
 * lib/calendar/token-crypto.ts. See lib/calendar/actions.ts for the read/write
 * boundary.
 */

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth, requireAuth } from '@/lib/auth/session'
import { getServerT } from '@/lib/i18n/server-dictionary'

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

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

/**
 * Server action — kicks off the Microsoft OAuth flow.
 *
 * We delegate to the `/api/auth/microsoft-calendar/start` GET route rather
 * than building the URL inline so the HMAC-signed state cookie can be set
 * on the same response. `redirect()` here is a normal browser navigation
 * (303), which is then re-redirected by the route handler to Microsoft.
 */
export async function linkMicrosoftCalendar(returnTo?: string): Promise<void> {
  await requireAuth('/dashboard/keamanan')
  const target = returnTo
    ? `/api/auth/microsoft-calendar/start?returnTo=${encodeURIComponent(returnTo)}`
    : '/api/auth/microsoft-calendar/start'
  redirect(target)
}

/**
 * Disconnect (delete) the current user's Microsoft CalendarAccount.
 * Cascades to CalendarEventMapping rows by schema, so existing event-log
 * UI for already-synced interviews naturally clears too.
 *
 * Audits `calendar.microsoft.unlinked` on the audit log so the security
 * timeline shows the provider clearly without parsing metadata.
 */
export async function unlinkMicrosoftCalendar(): Promise<ActionResult> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: t.srvCalendar.microsoft.mustLogin }
  }

  try {
    const existing = await prisma.calendarAccount.findUnique({
      where: {
        userId_provider: { userId: session.user.id, provider: 'microsoft' },
      },
      select: { id: true, providerEmail: true },
    })
    if (!existing) {
      return { ok: false, error: t.srvCalendar.microsoft.calendarNotConnected }
    }

    const meta = getRequestMeta()
    await prisma.$transaction([
      prisma.calendarAccount.delete({ where: { id: existing.id } }),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: AuditAction.DELETE,
          resource: 'calendar.microsoft.unlinked',
          resourceId: existing.id,
          metadata: {
            provider: 'microsoft',
            providerEmail: existing.providerEmail,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      }),
    ])

    revalidatePath('/dashboard/keamanan')
    revalidatePath('/dashboard/integrasi')
    return { ok: true }
  } catch (err) {
    console.error('[unlinkMicrosoftCalendar] failed', err)
    return {
      ok: false,
      error: t.srvCalendar.microsoft.disconnectFailed,
    }
  }
}
