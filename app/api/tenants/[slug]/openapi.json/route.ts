import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission } from '@/lib/auth/rbac'
import { verifyTenantBearerToken, hasScope } from '@/lib/tenants/api-key'
import { buildOpenApiSpec } from '@/lib/openapi/spec'

export const dynamic = 'force-dynamic'

/**
 * GET /api/tenants/:slug/openapi.json
 * Returns the OpenAPI 3.0 spec describing this tenant's REST surface.
 * Auth mirrors /audit/export: a session with `team.update` permission
 * OR a Tenant API Key with `read` scope (scoped to the matching tenant).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true },
    })
    .catch(() => null)
  if (!tenant) {
    return NextResponse.json({ error: 'TENANT_NOT_FOUND' }, { status: 404 })
  }

  const authHeader = req.headers.get('authorization')
  let authorized = false

  if (authHeader) {
    const verified = await verifyTenantBearerToken(authHeader, {
      ip:
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        null,
    })
    if (!verified) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 })
    }
    if (verified.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'TENANT_MISMATCH' }, { status: 403 })
    }
    if (!hasScope(verified, 'read')) {
      return NextResponse.json({ error: 'INSUFFICIENT_SCOPE' }, { status: 403 })
    }
    authorized = true
  } else {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
    }
    const { globalRole, tenants } = session.user
    if (!hasTenantPermission(globalRole, tenants, tenant.id, 'team.update')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    authorized = true
  }
  if (!authorized) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }

  // Prefer the request's own origin (handles preview/staging URLs cleanly);
  // fall back to NEXT_PUBLIC_APP_URL for cases where the proxy strips it.
  const origin =
    req.nextUrl.origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.pekerja.sainskerta.net'

  const spec = buildOpenApiSpec({ slug: tenant.slug, baseUrl: origin })

  return NextResponse.json(spec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
