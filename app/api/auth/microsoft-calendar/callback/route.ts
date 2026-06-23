/**
 * GET /api/auth/microsoft-calendar/callback
 *
 * Microsoft redirects here with `?code` + `?state`. We:
 *  1. Verify state HMAC + cookie match (CSRF + replay guard).
 *  2. Exchange the code for tokens.
 *  3. Fetch the connected mailbox identity (mail || userPrincipalName) for
 *     display via Graph /me.
 *  4. Upsert a CalendarAccount keyed by (userId, provider='microsoft').
 *  5. Audit `calendar.microsoft.linked` and redirect to the embedded
 *     `returnTo` (default `/dashboard/integrasi`).
 *
 * Any error path redirects back to `/dashboard/keamanan?calendar=error&reason=...`
 * so the user gets actionable feedback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { AuditAction } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import {
  exchangeMicrosoftCode,
  getMicrosoftProfile,
} from '@/lib/calendar/microsoft'
import { encryptToken } from '@/lib/calendar/token-crypto'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'ms_calendar_oauth_state'
const STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

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

function errorRedirect(appUrl: string, reason: string) {
  const res = NextResponse.redirect(
    `${appUrl}/dashboard/keamanan?calendar=error&reason=${encodeURIComponent(reason)}`,
  )
  res.cookies.delete(STATE_COOKIE)
  return res
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(
    s.replace(/-/g, '+').replace(/_/g, '/') + pad,
    'base64',
  )
}

/**
 * Verify the HMAC-signed state token issued in /start. Returns the embedded
 * payload or `null` on any failure. Rejects expired states (>10min).
 */
function verifyState(token: string): {
  userId: string
  returnTo: string
  nonce: string
  iat: number
} | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const body = parts[0]
  const sig = parts[1]
  if (!body || !sig) return null
  const expected = createHmac('sha256', env.NEXTAUTH_SECRET)
    .update(body)
    .digest()
  let provided: Buffer
  try {
    provided = b64urlDecode(sig)
  } catch {
    return null
  }
  if (provided.length !== expected.length) return null
  if (!timingSafeEqual(provided, expected)) return null
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8')) as {
      userId?: string
      returnTo?: string
      nonce?: string
      iat?: number
    }
    if (!payload.userId || !payload.returnTo || !payload.nonce || !payload.iat) {
      return null
    }
    if (Date.now() - payload.iat > STATE_MAX_AGE_MS) return null
    return {
      userId: payload.userId,
      returnTo: payload.returnTo,
      nonce: payload.nonce,
      iat: payload.iat,
    }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const session = await requireAuth('/dashboard/keamanan')
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  if (!env.MICROSOFT_OAUTH_CLIENT_ID || !env.MICROSOFT_OAUTH_CLIENT_SECRET) {
    return errorRedirect(appUrl, 'not_configured')
  }

  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const oauthError = req.nextUrl.searchParams.get('error')
  if (oauthError) return errorRedirect(appUrl, oauthError)
  if (!code || !stateParam) return errorRedirect(appUrl, 'missing_code')

  // Defense in depth: cookie must match the query state, AND the HMAC must
  // verify, AND the embedded userId must match the active session user
  // (prevents cross-session confused-deputy via stolen state).
  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  if (!cookieState || cookieState !== stateParam) {
    return errorRedirect(appUrl, 'state_mismatch')
  }
  const verified = verifyState(stateParam)
  if (!verified) return errorRedirect(appUrl, 'state_invalid')
  if (verified.userId !== session.user.id) {
    return errorRedirect(appUrl, 'state_user_mismatch')
  }

  const tokenRes = await exchangeMicrosoftCode(code)
  if (!tokenRes.ok) {
    return errorRedirect(appUrl, 'token_exchange_failed')
  }
  const { accessToken, refreshToken, expiresAt, scope } = tokenRes.data

  const profile = await getMicrosoftProfile(accessToken)
  if (!profile.ok) {
    return errorRedirect(appUrl, 'profile_failed')
  }

  const meta = getRequestMeta()

  try {
    const existing = await prisma.calendarAccount.findUnique({
      where: {
        userId_provider: { userId: session.user.id, provider: 'microsoft' },
      },
      select: { id: true, refreshToken: true },
    })

    const saved = await prisma.calendarAccount.upsert({
      where: {
        userId_provider: { userId: session.user.id, provider: 'microsoft' },
      },
      create: {
        userId: session.user.id,
        provider: 'microsoft',
        providerEmail: profile.data.email,
        // Graph defaults to the user's primary calendar when no id is given
        // (POST /me/calendar/events). Persist null to signal "default".
        calendarId: null,
        accessToken: encryptToken(accessToken),
        refreshToken: encryptToken(refreshToken ?? null),
        expiresAt,
        scope: scope ?? null,
      },
      update: {
        providerEmail: profile.data.email,
        accessToken: encryptToken(accessToken),
        // Microsoft refresh_token rotation: a new one is returned on each
        // refresh; fall back to existing if a re-consent omits it.
        // encryptToken is a no-op on the already-encrypted existing value.
        refreshToken: encryptToken(refreshToken ?? existing?.refreshToken ?? null),
        expiresAt,
        scope: scope ?? undefined,
      },
      select: { id: true },
    })

    await prisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: existing ? AuditAction.UPDATE : AuditAction.CREATE,
          resource: 'calendar.microsoft.linked',
          resourceId: saved.id,
          metadata: {
            provider: 'microsoft',
            providerEmail: profile.data.email,
            scope,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch(() => null)
  } catch (err) {
    console.error('[auth/microsoft-calendar/callback] persist failed', err)
    return errorRedirect(appUrl, 'persist_failed')
  }

  // Sanitize returnTo: only same-origin internal paths.
  const safeReturnTo =
    verified.returnTo.startsWith('/') && !verified.returnTo.startsWith('//')
      ? verified.returnTo
      : '/dashboard/integrasi'

  const sep = safeReturnTo.includes('?') ? '&' : '?'
  const res = NextResponse.redirect(
    `${appUrl}${safeReturnTo}${sep}calendar=connected&provider=microsoft`,
  )
  res.cookies.delete(STATE_COOKIE)
  return res
}
