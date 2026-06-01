/**
 * GET /api/auth/microsoft-calendar/start
 *
 * Kicks off the Microsoft v2.0 OAuth Authorization-Code flow for the Outlook
 * calendar scope. Parallel to /api/calendar/google/connect but uses a signed
 * `state` blob (HMAC-SHA256 with `NEXTAUTH_SECRET`) so the callback can
 * validate the carrier without trusting cookies alone.
 *
 * Approach:
 *  1. requireAuth — anonymous users can't connect calendars.
 *  2. Mint a JSON state = { userId, returnTo, nonce, iat }, base64url-encode,
 *     then append `.<hmac>` so the callback can verify integrity.
 *  3. Also stash the raw state in a short-lived HttpOnly cookie for
 *     defense-in-depth (CSRF + replay window).
 *  4. Redirect to Microsoft with our /callback as redirect_uri.
 *
 * If `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET` aren't set,
 * redirect to the security page with `?calendar=error&reason=not_configured`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHmac } from 'crypto'
import { requireAuth } from '@/lib/auth/session'
import { env } from '@/lib/env'
import { buildMicrosoftAuthUrl } from '@/lib/calendar/microsoft'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'ms_calendar_oauth_state'

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

/**
 * Sign a state payload with HMAC-SHA256 keyed by NEXTAUTH_SECRET. Returns
 * `<base64url(payload)>.<base64url(hmac)>` — the same shape as a JWT minus
 * the alg header (we hardcode HS256 here).
 */
function signState(payload: object): string {
  const json = JSON.stringify(payload)
  const body = b64urlEncode(Buffer.from(json, 'utf8'))
  const mac = createHmac('sha256', env.NEXTAUTH_SECRET)
    .update(body)
    .digest()
  return `${body}.${b64urlEncode(mac)}`
}

export async function GET(req: NextRequest) {
  const session = await requireAuth('/dashboard/keamanan')

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  if (!env.MICROSOFT_OAUTH_CLIENT_ID || !env.MICROSOFT_OAUTH_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/keamanan?calendar=error&reason=not_configured`,
    )
  }

  const rawReturnTo = req.nextUrl.searchParams.get('returnTo')
  // Only allow same-origin internal paths to prevent open redirects.
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : '/dashboard/integrasi'

  const state = signState({
    userId: session.user.id,
    returnTo,
    nonce: randomBytes(16).toString('hex'),
    iat: Date.now(),
  })

  const target = buildMicrosoftAuthUrl(state)

  const res = NextResponse.redirect(target)
  res.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/auth/microsoft-calendar',
    maxAge: 600, // 10 minutes
  })
  return res
}
