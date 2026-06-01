/**
 * GET /api/feature-flags/evaluate?key=<flagKey>&userId=...&tenantId=...&environment=...
 *
 * Returns { key, value, reason } for the requested flag, scoped to the
 * supplied evaluation context. Used by the client-side `useFeatureFlag` hook
 * and any non-RSC consumer that needs to check a flag without a direct DB
 * connection.
 *
 * Auth model: any authenticated session may call it, but a non-SUPERADMIN may
 * only evaluate against their own userId (passing a different userId is
 * rejected). tenantId is unrestricted because it is non-sensitive — the
 * returned boolean reveals nothing about the tenant beyond rollout state.
 */

import type { NextRequest } from 'next/server'
import { apiSuccess, apiError, withAuth } from '@/lib/api-helpers'
import { evaluateFlag, type EvaluationEnvironment } from '@/lib/feature-flags/flag-evaluator'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ENVS: EvaluationEnvironment[] = ['dev', 'staging', 'prod']

export const GET = withAuth('any', async (req: NextRequest, { session }) => {
  const url = new URL(req.url)
  const key = url.searchParams.get('key')?.trim()
  if (!key) {
    return apiError('VALIDATION_ERROR', 'Query parameter `key` is required.', 400)
  }

  const userIdParam = url.searchParams.get('userId')?.trim() || undefined
  const tenantIdParam = url.searchParams.get('tenantId')?.trim() || undefined
  const envParam = url.searchParams.get('environment')?.trim()

  // Restrict cross-user evaluation: only SUPERADMIN may evaluate as another user.
  if (
    userIdParam &&
    userIdParam !== session.user.id &&
    session.user.globalRole !== 'SUPERADMIN'
  ) {
    return apiError(
      'FORBIDDEN',
      'You may only evaluate flags for your own user.',
      403,
    )
  }

  const environment: EvaluationEnvironment | undefined =
    envParam && (ALLOWED_ENVS as string[]).includes(envParam)
      ? (envParam as EvaluationEnvironment)
      : undefined

  const result = await evaluateFlag(key, {
    userId: userIdParam ?? session.user.id,
    tenantId: tenantIdParam,
    environment,
  })

  return apiSuccess(result)
})
