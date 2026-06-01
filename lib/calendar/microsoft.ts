/**
 * Microsoft Graph (Outlook) Calendar HTTP client.
 *
 * Parallel to lib/calendar/google-client.ts but speaks Microsoft Graph v1.0.
 * Dependency-light: uses native fetch only — no @microsoft/microsoft-graph-client
 * or msal-node. If/when we need batch/delta queries we can swap.
 *
 * Graceful degradation:
 *  - Missing `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET` returns
 *    `{ ok: false, error: 'NOT_CONFIGURED' }` from every async helper.
 *  - All `fetch` failures are caught and surfaced as `{ ok: false, error }`.
 *
 * Token storage trade-off (see lib/calendar/microsoft-actions.ts):
 *  Tokens are persisted plaintext in `CalendarAccount.accessToken` /
 *  `refreshToken`. Production should encrypt with an at-rest key.
 */
import { env } from '@/lib/env'

const MS_AUTH_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
const MS_TOKEN_URL =
  'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const MS_GRAPH_ME = 'https://graph.microsoft.com/v1.0/me'

/**
 * Scopes requested for calendar integration.
 *  - `Calendars.ReadWrite` lets us create/update/delete events on the user's
 *    default Outlook calendar.
 *  - `offline_access` is required to receive a `refresh_token`.
 *  - `User.Read` + `openid email` lets us fetch the connected mailbox for
 *    display as `providerEmail`.
 */
const CALENDAR_SCOPES = [
  'Calendars.ReadWrite',
  'offline_access',
  'User.Read',
  'openid',
  'email',
]

export type MicrosoftTokenResponse = {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
  scope?: string
  tokenType?: string
}

export type MicrosoftEventInput = {
  subject: string
  body?: { contentType: 'HTML' | 'Text'; content: string }
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  attendees?: Array<{
    emailAddress: { address: string; name?: string }
    type: 'required' | 'optional'
  }>
  location?: { displayName: string }
}

export type MicrosoftResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

function isConfigured(): boolean {
  return Boolean(
    env.MICROSOFT_OAUTH_CLIENT_ID && env.MICROSOFT_OAUTH_CLIENT_SECRET,
  )
}

/**
 * Resolve the redirect URI used for both /start and /callback. Falls back to
 * `${NEXTAUTH_URL}/api/auth/microsoft-calendar/callback` when the explicit env
 * var is unset so dev environments work out of the box.
 */
export function microsoftRedirectUri(): string {
  const explicit = env.MICROSOFT_OAUTH_REDIRECT_URI
  if (explicit) return explicit.replace(/\/$/, '')
  const base = (env.NEXTAUTH_URL || env.NEXT_PUBLIC_APP_URL || '').replace(
    /\/$/,
    '',
  )
  return `${base}/api/auth/microsoft-calendar/callback`
}

/**
 * Build the Microsoft v2.0 Authorization Code URL for the calendar scope.
 * `state` is opaque to Microsoft; the caller is responsible for HMAC-signing.
 *
 * `prompt=consent` + `offline_access` scope ensures Microsoft returns a
 * `refresh_token` reliably across re-consents.
 */
export function buildMicrosoftAuthUrl(state: string): string {
  const clientId = env.MICROSOFT_OAUTH_CLIENT_ID ?? ''
  const query = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: microsoftRedirectUri(),
    response_mode: 'query',
    scope: CALENDAR_SCOPES.join(' '),
    prompt: 'consent',
    state,
  })
  return `${MS_AUTH_URL}?${query.toString()}`
}

function parseTokenResponse(j: {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  token_type?: string
}): MicrosoftTokenResponse {
  // Store expiresAt 60s before actual expiry to avoid edge-of-expiry races
  // when an event-create call hits Graph right as the token rolls over.
  const expiresAt = new Date(Date.now() + (j.expires_in - 60) * 1000)
  return {
    accessToken: j.access_token,
    refreshToken: j.refresh_token,
    expiresAt,
    scope: j.scope,
    tokenType: j.token_type,
  }
}

/** Exchange an authorization code for access + refresh tokens. */
export async function exchangeMicrosoftCode(
  code: string,
): Promise<MicrosoftResult<MicrosoftTokenResponse>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const body = new URLSearchParams({
      client_id: env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
      client_secret: env.MICROSOFT_OAUTH_CLIENT_SECRET ?? '',
      code,
      redirect_uri: microsoftRedirectUri(),
      grant_type: 'authorization_code',
      scope: CALENDAR_SCOPES.join(' '),
    })
    const res = await fetch(MS_TOKEN_URL, {
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
    return { ok: true, data: parseTokenResponse(j) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** Refresh an expired access token using the stored refresh_token. */
export async function refreshMicrosoftToken(
  refreshToken: string,
): Promise<MicrosoftResult<MicrosoftTokenResponse>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const body = new URLSearchParams({
      client_id: env.MICROSOFT_OAUTH_CLIENT_ID ?? '',
      client_secret: env.MICROSOFT_OAUTH_CLIENT_SECRET ?? '',
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: CALENDAR_SCOPES.join(' '),
    })
    const res = await fetch(MS_TOKEN_URL, {
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
    return { ok: true, data: parseTokenResponse(j) }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/**
 * Fetch the connected mailbox identity via /me. Graph returns `mail` for
 * mailbox-backed accounts; falls back to `userPrincipalName` (UPN) for
 * tenant accounts where mail isn't populated.
 */
export async function getMicrosoftProfile(
  accessToken: string,
): Promise<MicrosoftResult<{ email: string; id: string; name?: string }>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const res = await fetch(MS_GRAPH_ME, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (!res.ok) {
      return { ok: false, error: `profile fetch failed: ${res.status}` }
    }
    const j = (await res.json()) as {
      id?: string
      mail?: string | null
      userPrincipalName?: string | null
      displayName?: string | null
    }
    const email = j.mail || j.userPrincipalName
    if (!email || !j.id) {
      return { ok: false, error: 'profile missing mail/userPrincipalName/id' }
    }
    return {
      ok: true,
      data: { email, id: j.id, name: j.displayName ?? undefined },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/**
 * Create a calendar event on the user's default Outlook calendar.
 * Returns `{ externalEventId, htmlLink }` to mirror the Google client shape so
 * the sync layer can be provider-agnostic.
 *
 * Graph returns `webLink` (browser URL) — we expose it as `htmlLink` to
 * stay symmetrical with Google's field name and avoid a schema rename.
 */
export async function createMicrosoftEvent(
  accessToken: string,
  payload: MicrosoftEventInput,
): Promise<MicrosoftResult<{ externalEventId: string; htmlLink: string }>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const res = await fetch(`${MS_GRAPH_ME}/calendar/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: `create event failed: ${res.status} ${text}` }
    }
    const j = (await res.json()) as { id?: string; webLink?: string }
    if (!j.id) return { ok: false, error: 'create event: missing id' }
    return {
      ok: true,
      data: { externalEventId: j.id, htmlLink: j.webLink ?? '' },
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

/** DELETE a Graph calendar event. 404/410 treated as success (already gone). */
export async function deleteMicrosoftEvent(
  accessToken: string,
  eventId: string,
): Promise<MicrosoftResult<void>> {
  if (!isConfigured()) return { ok: false, error: 'NOT_CONFIGURED' }
  try {
    const res = await fetch(
      `${MS_GRAPH_ME}/calendar/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      },
    )
    if (res.ok || res.status === 404 || res.status === 410) {
      return { ok: true, data: undefined }
    }
    const text = await res.text().catch(() => '')
    return { ok: false, error: `delete event failed: ${res.status} ${text}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' }
  }
}

export const MICROSOFT_OAUTH_SCOPES = CALENDAR_SCOPES
