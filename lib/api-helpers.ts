/**
 * Shared HTTP API helpers for Route Handlers.
 *
 * - Standard JSON envelope: { ok: true, data } | { ok: false, error: { code, message, details? } }
 * - withAuth HOF wrapping NextRequest handlers with NextAuth session + role check
 * - Tenant slug extraction from middleware-injected `x-tenant-slug` header
 *
 * All API routes under /app/api/** should use these helpers for a consistent
 * client surface and centralized error handling.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import type { Session } from 'next-auth'
import type { GlobalRole } from '@/types/next-auth'
import { auth } from '@/lib/auth/session'

// -----------------------------------------------------------------------------
// Envelope types
// -----------------------------------------------------------------------------

export type ApiSuccess<T> = { ok: true; data: T }

export type ApiErrorPayload = {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResult<T> = ApiSuccess<T> | ApiErrorPayload

// -----------------------------------------------------------------------------
// Response builders
// -----------------------------------------------------------------------------

/** Build a JSON success response with optional NextResponse init. */
export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init)
}

/** Build a JSON error response. */
export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  return NextResponse.json<ApiErrorPayload>(
    { ok: false, error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status },
  )
}

// -----------------------------------------------------------------------------
// Tenant slug extraction
// -----------------------------------------------------------------------------

/**
 * Read the tenant slug from the `x-tenant-slug` request header,
 * set by middleware.ts on subdomain requests. Returns null on apex.
 */
export function getTenantSlugFromHeaders(req: NextRequest): string | null {
  const slug = req.headers.get('x-tenant-slug')
  return slug && slug.length > 0 ? slug : null
}

// -----------------------------------------------------------------------------
// Auth wrapper
// -----------------------------------------------------------------------------

export type AuthedHandlerContext = {
  session: Session
  tenantSlug: string | null
}

export type AuthedHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  ctx: { params: TParams } & AuthedHandlerContext,
) => Promise<NextResponse> | NextResponse

/**
 * Wraps a Route Handler with authentication + optional role gating.
 * Pass 'any' to allow any authenticated user, or an array of allowed
 * GlobalRole values to restrict access.
 *
 * Errors:
 *  - 401 AUTH_REQUIRED when no session
 *  - 403 FORBIDDEN when role mismatch
 *  - 500 INTERNAL on uncaught throws (Prisma errors mapped to 4xx where useful)
 */
export function withAuth<TParams = Record<string, string>>(
  roles: GlobalRole[] | 'any',
  handler: AuthedHandler<TParams>,
) {
  return async (req: NextRequest, ctx: { params: TParams }) => {
    try {
      const session = await auth()
      if (!session?.user) {
        return apiError('AUTH_REQUIRED', 'Authentication required.', 401)
      }
      if (roles !== 'any' && !roles.includes(session.user.globalRole)) {
        return apiError('FORBIDDEN', 'You do not have permission to access this resource.', 403)
      }
      const tenantSlug = getTenantSlugFromHeaders(req)
      return await handler(req, { ...ctx, session, tenantSlug })
    } catch (err) {
      return handleRouteError(err)
    }
  }
}

// -----------------------------------------------------------------------------
// Error normalization
// -----------------------------------------------------------------------------

/**
 * Map common errors to API envelope responses.
 *
 * - ZodError -> 400 VALIDATION_ERROR with issue list
 * - Prisma known errors -> 400/404/409 with sensible codes
 * - Anything else -> 500 INTERNAL
 */
export function handleRouteError(err: unknown): NextResponse<ApiErrorPayload> {
  // Avoid hard import of zod at module top to keep this helper agnostic; we
  // duck-type on the error shape instead.
  const anyErr = err as { name?: string; issues?: unknown }
  if (anyErr && typeof anyErr === 'object' && anyErr.name === 'ZodError' && Array.isArray(anyErr.issues)) {
    return apiError('VALIDATION_ERROR', 'Request payload failed validation.', 400, anyErr.issues)
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return apiError('UNIQUE_CONSTRAINT', 'A record with the given identifiers already exists.', 409, {
          target: err.meta?.target,
        })
      case 'P2025':
        return apiError('NOT_FOUND', 'Record not found.', 404)
      case 'P2003':
        return apiError('FOREIGN_KEY', 'Related record does not exist.', 400)
      default:
        return apiError('DB_ERROR', err.message, 400, { code: err.code })
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return apiError('DB_VALIDATION', 'Invalid database query.', 400)
  }

  if (err instanceof Error) {
    return apiError('INTERNAL', err.message || 'Internal server error.', 500)
  }

  return apiError('INTERNAL', 'Internal server error.', 500)
}

// -----------------------------------------------------------------------------
// Pagination helpers
// -----------------------------------------------------------------------------

export type Pagination = { page: number; take: number; skip: number }

/**
 * Parse `page` and `take` from a URL search params with safe defaults and
 * upper bounds. Returns 1-indexed page and zero-based skip.
 */
export function parsePagination(searchParams: URLSearchParams, defaultTake = 20, maxTake = 100): Pagination {
  const rawPage = Number(searchParams.get('page') ?? 1)
  const rawTake = Number(searchParams.get('take') ?? defaultTake)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1
  const take = Number.isFinite(rawTake) ? Math.min(Math.max(Math.floor(rawTake), 1), maxTake) : defaultTake
  return { page, take, skip: (page - 1) * take }
}

/** Build a paginated payload alongside the total count. */
export function paginated<T>(items: T[], total: number, { page, take }: Pagination) {
  return {
    items,
    total,
    page,
    take,
    pages: Math.max(1, Math.ceil(total / take)),
  }
}
