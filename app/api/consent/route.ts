import { NextResponse, type NextRequest } from 'next/server'
import { saveCustomConsent } from '@/lib/consent/consent-actions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/consent
 *
 * Body: { analytics?: boolean, marketing?: boolean, functional?: boolean }
 *
 * Saves consent without requiring a full page reload. Useful for the
 * privacy-center toggles in JS-heavy flows. The Server Action variant
 * (`saveCustomConsent`) is preferred when the call originates from RSC.
 *
 * Returns 200 with the persisted prefs. `necessary` is always coerced to true.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const result = await saveCustomConsent({
    analytics: Boolean(b.analytics),
    marketing: Boolean(b.marketing),
    functional: Boolean(b.functional),
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, prefs: result.prefs }, { status: 200 })
}
