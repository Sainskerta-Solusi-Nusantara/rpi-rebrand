/**
 * Google Calendar HTTP client — thin wrapper around Google's OAuth + Calendar
 * REST endpoints. Kept dependency-light (uses `fetch`) so we don't hard-couple
 * to the `googleapis` SDK. If/when `googleapis` is installed we can swap to
 * its typed client without changing call sites.
 *
 * Graceful degradation:
 *  - Missing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` returns
 *    `{ ok: false, error: 'NOT_CONFIGURED' }` from every async helper.
 *  - All `fetch` failures are caught and surfaced as `{ ok: false, error }`.
 *
 * Token storage (see lib/calendar/actions.ts):
 *  `CalendarAccount.accessToken` / `refreshToken` are encrypted at rest
 *  (AES-256-GCM, KEK from `CALENDAR_TOKEN_KEY`) via token-crypto.ts. The
 *  `accessToken` this client receives is already decrypted plaintext.
 */

import { env } from '@/lib/env'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

/**
 * Scopes requested for calendar integration. `calendar.events` lets us
 * create/update/delete events on the user's primary (or chosen) calendar.
 * `userinfo.email` is needed so we can store providerEmail on
 * CalendarAccount for display.
 */
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'openid',
  'email',
  'profile',
]

export type TokenResponse = {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  scope?: string
  tokenType?: string
}

export type GoogleEventInput = {
  summary: string
  description?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  location?: string
  conferenceData?: {
    createRequest?: {
      requestId: string
      conferenceSolutionKey?: { type: string }
    }
  }
  attendees?: Array<{ email: string; displayName?: string }>
}

export type CalendarResult<T> = { ok: true; data: T } | { ok: false; error: string }

function isConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
}

/**
 * Build the Google OAuth Authorization Code URL for the calendar scope.
 * `state` is opaque to Google; we round-trip it through a short-lived cookie
 * to defend against CSRF on the callback.
 *
 * `access_type=offline` + `prompt=consent` ensures Google returns a
 * `refresh_token` (otherwise refresh_token only ships on the first consent).
 */
export function buildAuthUrl(params: {
  userId: string
  redirectUri: string
  state: string
}): string {
  const clientId = env.GOOGLE_CLIENT_ID ?? ''
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: params.state,
  })
  return `${GOOGLE_AUTH_URL}?${query.toString()}`
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
): Promise<CalendarResult<TokenResponse>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const body = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    })
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `token exchange failed: ${res.status} ${text}` }
    }
    const j = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
      scope?: string
      token_type?: string
    }
    return {
      ok: true,
      data: {
        accessToken: j.access_token,
        refreshToken: j.refresh_token,
        expiresIn: j.expires_in,
        scope: j.scope,
        tokenType: j.token_type,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** Refresh an expired access token using the stored refresh_token. */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<CalendarResult<TokenResponse>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `token refresh failed: ${res.status} ${text}` }
    }
    const j = (await res.json()) as {
      access_token: string
      refresh_token?: string
      expires_in: number
      scope?: string
      token_type?: string
    }
    return {
      ok: true,
      data: {
        accessToken: j.access_token,
        // Google may or may not return a new refresh_token on refresh.
        refreshToken: j.refresh_token,
        expiresIn: j.expires_in,
        scope: j.scope,
        tokenType: j.token_type,
      },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** Fetch the connected Google account's email + sub. Used on callback. */
export async function fetchUserInfo(
  accessToken: string,
): Promise<CalendarResult<{ email: string; sub: string; name?: string }>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const res = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      return { ok: false, error: `userinfo failed: ${res.status}` }
    }
    const j = (await res.json()) as { email?: string; sub?: string; name?: string }
    if (!j.email || !j.sub) {
      return { ok: false, error: 'userinfo missing email/sub' }
    }
    return { ok: true, data: { email: j.email, sub: j.sub, name: j.name } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** Create a calendar event on the given calendarId (defaults to 'primary'). */
export async function createCalendarEvent(params: {
  accessToken: string
  calendarId?: string | null
  event: GoogleEventInput
}): Promise<CalendarResult<{ id: string; htmlLink: string }>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  const calendarId = params.calendarId || 'primary'
  try {
    const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
      calendarId,
    )}/events?conferenceDataVersion=1`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.event),
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `create event failed: ${res.status} ${text}` }
    }
    const j = (await res.json()) as { id?: string; htmlLink?: string }
    if (!j.id) return { ok: false, error: 'create event: missing id' }
    return { ok: true, data: { id: j.id, htmlLink: j.htmlLink ?? '' } }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** PATCH an existing calendar event. */
export async function updateCalendarEvent(params: {
  accessToken: string
  calendarId?: string | null
  eventId: string
  event: Partial<GoogleEventInput>
}): Promise<CalendarResult<void>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  const calendarId = params.calendarId || 'primary'
  try {
    const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
      calendarId,
    )}/events/${encodeURIComponent(params.eventId)}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params.event),
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `update event failed: ${res.status} ${text}` }
    }
    return { ok: true, data: undefined }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** DELETE a calendar event. 404/410 are treated as success (already gone). */
export async function deleteCalendarEvent(params: {
  accessToken: string
  calendarId?: string | null
  eventId: string
}): Promise<CalendarResult<void>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  const calendarId = params.calendarId || 'primary'
  try {
    const url = `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
      calendarId,
    )}/events/${encodeURIComponent(params.eventId)}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${params.accessToken}` },
      cache: 'no-store',
    })
    // Google returns 204 on success. 404/410 = event already gone.
    if (res.ok || res.status === 404 || res.status === 410) {
      return { ok: true, data: undefined }
    }
    const text = await res.text().catch(() => '')
    return { ok: false, error: `delete event failed: ${res.status} ${text}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

export const CALENDAR_OAUTH_SCOPES = CALENDAR_SCOPES
