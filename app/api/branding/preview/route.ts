/**
 * POST /api/branding/preview
 *
 * Accepts a partial BrandingTokens payload and returns the generated CSS
 * string WITHOUT persisting anything. Used by the partner branding editor
 * to preview server-rendered CSS before saving.
 *
 * Requires authenticated PARTNER, ADMIN, or SUPERADMIN.
 */

import { type NextRequest } from 'next/server'
import { auth } from '@/lib/auth/session'
import { apiError, apiSuccess, handleRouteError } from '@/lib/api-helpers'
import { brandingPreviewSchema } from '@/lib/branding/validate'
import { generateBrandingCss } from '@/lib/branding/generate-css'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return apiError('AUTH_REQUIRED', 'Authentication required.', 401)

    const allowed = ['SUPERADMIN', 'ADMIN', 'PARTNER'] as const
    if (!allowed.includes(session.user.globalRole as (typeof allowed)[number])) {
      return apiError('FORBIDDEN', 'Insufficient role.', 403)
    }

    const json = await req.json().catch(() => null)
    const parsed = brandingPreviewSchema.safeParse(json)
    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid preview payload.', 400, parsed.error.issues)
    }

    const css = generateBrandingCss(parsed.data)
    return apiSuccess({ css, tokens: parsed.data })
  } catch (err) {
    return handleRouteError(err)
  }
}
