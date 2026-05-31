/**
 * GET /api/calendar/google/connect
 *
 * Kicks off the Google OAuth Authorization-Code flow for calendar scope. This
 * is separate from NextAuth's sign-in flow because we need a different scope
 * (`calendar.events`) and we want the tokens persisted in `CalendarAccount`,
 * not in NextAuth's `accounts` table.
 *
 * Approach:
 *  1. requireAuth — anonymous users can't connect calendars.
 *  2. Mint a random state token, store in a short-lived HttpOnly cookie.
 *  3. Redirect to Google with our redirect_uri pointing at the callback.
 *
 * If `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` aren't set, redirect to the
 * security page with `?calendar=error&reason=not_configured`.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireAuth } from '@/lib/auth/session'
import { env } from '@/lib/env'
import { buildAuthUrl } from '@/lib/calendar/google-client'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'calendar_oauth_state'

export async function GET(req: NextRequest) {
  const session = await requireAuth('/dashboard/keamanan')

  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/calendar/google/callback`

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/keamanan?calendar=error&reason=not_configured`,
    )
  }

  // CSRF: opaque random state echoed back by Google, verified on callback.
  const state = randomBytes(24).toString('hex')

  const target = buildAuthUrl({
    userId: session.user.id,
    redirectUri,
    state,
  })

  const res = NextResponse.redirect(target)
  res.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/calendar/google',
    maxAge: 600, // 10 minutes
  })
  return res
}
