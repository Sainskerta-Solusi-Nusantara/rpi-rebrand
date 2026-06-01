import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { parseAcceptLanguage } from '@/lib/i18n/accept-language'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000'
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin'])
const LOCALE_COOKIE = 'rpi_locale'
const SUPPORTED_LOCALES = new Set(['id', 'en'])
const ONE_YEAR = 60 * 60 * 24 * 365

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
  // Forward the current pathname so server components (e.g. the dashboard
  // layout's 2FA guard) can detect which route is being rendered and avoid
  // self-redirecting on the enrollment flow itself.
  requestHeaders.set('x-pathname', url.pathname)

  // ---- i18n locale detection -------------------------------------------------
  // Forward an explicit ?locale= query parameter as a header so server
  // components can read it via headers() (the URL query isn't easily reachable
  // from arbitrary RSCs).
  const queryLocale = url.searchParams.get('locale')
  let detectedLocale: string | null = null
  if (queryLocale && SUPPORTED_LOCALES.has(queryLocale)) {
    requestHeaders.set('x-locale-query', queryLocale)
    detectedLocale = queryLocale
  }

  // First-visit detection: if the cookie isn't set, pick the best match from
  // Accept-Language so the very first render is already localised.
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value
  const hasValidCookie = cookieLocale && SUPPORTED_LOCALES.has(cookieLocale)
  if (!hasValidCookie && !detectedLocale) {
    const fromAccept = parseAcceptLanguage(req.headers.get('accept-language'))
    if (fromAccept) detectedLocale = fromAccept
  }
  // ---------------------------------------------------------------------------

  const path = url.pathname
  const isProtected =
    path.startsWith('/dashboard') ||
    path.startsWith('/admin') ||
    path.startsWith('/partner') ||
    path.startsWith('/onboarding')

  if (isProtected) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token || (token as { invalid?: boolean }).invalid) {
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

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Persist the first-visit locale detection so subsequent requests are fast
  // and consistent.
  if (!hasValidCookie && detectedLocale) {
    response.cookies.set(LOCALE_COOKIE, detectedLocale, {
      path: '/',
      sameSite: 'lax',
      maxAge: ONE_YEAR,
    })
  }

  return response
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
