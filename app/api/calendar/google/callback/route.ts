/**
 * GET /api/calendar/google/callback
 *
 * Google redirects here with `?code` + `?state`. We:
 *  1. Verify state matches the cookie minted in /connect (CSRF guard).
 *  2. Exchange the code for tokens.
 *  3. Fetch the connected account's email for display.
 *  4. Upsert a CalendarAccount keyed by (userId, provider='google').
 *  5. Audit CREATE on `calendar.account` and redirect to Keamanan.
 *
 * Any error path redirects back to `/dashboard/keamanan?calendar=error&reason=...`
 * so the user gets actionable feedback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { AuditAction } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'
import {
  exchangeCodeForTokens,
  fetchUserInfo,
} from '@/lib/calendar/google-client'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = 'calendar_oauth_state'

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

export async function GET(req: NextRequest) {
  const session = await requireAuth('/dashboard/keamanan')
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return errorRedirect(appUrl, 'not_configured')
  }

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const oauthError = req.nextUrl.searchParams.get('error')
  if (oauthError) {
    return errorRedirect(appUrl, oauthError)
  }
  if (!code || !state) {
    return errorRedirect(appUrl, 'missing_code')
  }

  const cookieState = req.cookies.get(STATE_COOKIE)?.value
  if (!cookieState || cookieState !== state) {
    return errorRedirect(appUrl, 'state_mismatch')
  }

  const redirectUri = `${appUrl}/api/calendar/google/callback`
  const tokenRes = await exchangeCodeForTokens(code, redirectUri)
  if (!tokenRes.ok) {
    return errorRedirect(appUrl, 'token_exchange_failed')
  }
  const { accessToken, refreshToken, expiresIn, scope } = tokenRes.data

  const userInfo = await fetchUserInfo(accessToken)
  if (!userInfo.ok) {
    return errorRedirect(appUrl, 'userinfo_failed')
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  const meta = getRequestMeta()

  try {
    // Upsert by (userId, provider) — model has @@unique([userId, provider]).
    const existing = await prisma.calendarAccount.findUnique({
      where: {
        userId_provider: { userId: session.user.id, provider: 'google' },
      },
      select: { id: true, refreshToken: true },
    })

    const saved = await prisma.calendarAccount.upsert({
      where: {
        userId_provider: { userId: session.user.id, provider: 'google' },
      },
      create: {
        userId: session.user.id,
        provider: 'google',
        providerEmail: userInfo.data.email,
        calendarId: 'primary',
        accessToken,
        // Only the initial consent reliably returns a refresh_token.
        refreshToken: refreshToken ?? null,
        expiresAt,
        scope: scope ?? null,
      },
      update: {
        providerEmail: userInfo.data.email,
        accessToken,
        // Google may omit refresh_token on re-consent; keep the existing one.
        refreshToken: refreshToken ?? existing?.refreshToken ?? null,
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
          resource: 'calendar.account',
          resourceId: saved.id,
          metadata: {
            provider: 'google',
            providerEmail: userInfo.data.email,
            scope,
          },
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      })
      .catch(() => null)
  } catch (err) {
    console.error('[calendar/google/callback] persist failed', err)
    return errorRedirect(appUrl, 'persist_failed')
  }

  const res = NextResponse.redirect(
    `${appUrl}/dashboard/keamanan?calendar=connected`,
  )
  res.cookies.delete(STATE_COOKIE)
  return res
}
