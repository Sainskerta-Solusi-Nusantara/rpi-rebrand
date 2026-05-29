import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin'])

/**
 * Multi-tenant + auth middleware.
 * - Detects subdomain → injects x-tenant-slug request header.
 * - Guards /dashboard, /admin, /partner via NextAuth JWT.
 * - /admin/* requires globalRole SUPERADMIN or ADMIN.
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const rawHost = req.headers.get('host') ?? ''
  // Strip port for local dev (e.g., "acme.localhost:3000" → "acme.localhost").
  const hostname = rawHost.split(':')[0] ?? ''
  const rootHostname = ROOT_DOMAIN.split(':')[0] ?? ''

  // Compute subdomain (everything before the root domain).
  let subdomain: string | null = null
  if (hostname && rootHostname && hostname !== rootHostname && hostname.endsWith(`.${rootHostname}`)) {
    const candidate = hostname.slice(0, -rootHostname.length - 1)
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      subdomain = candidate
    }
  }

  // Clone headers so downstream server components can read x-tenant-slug.
  const requestHeaders = new Headers(req.headers)
  if (subdomain) {
    requestHeaders.set('x-tenant-slug', subdomain)
  } else {
    requestHeaders.delete('x-tenant-slug')
  }

  const path = url.pathname
  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/partner') ||
    path.startsWith('/onboarding')

  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', url.pathname + url.search)
      return NextResponse.redirect(loginUrl)
    }

    if (path.startsWith('/admin')) {
      const role = (token as { globalRole?: string }).globalRole
      if (role !== 'SUPERADMIN' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }
    // Tenant existence / membership checks are deferred to server components,
    // which have DB access and can apply RLS-aware logic.
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
