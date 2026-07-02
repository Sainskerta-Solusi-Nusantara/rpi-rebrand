/**
 * Public embed page for a tenant's job board.
 *
 * URL: /embed/[slug]/jobs?limit=10&theme=light
 *
 * - No global navbar / footer (rendered under app/embed/layout.tsx).
 * - No auth required.
 * - Branded with the tenant's Branding row (logo, primary color, etc).
 * - Intended to be loaded inside an <iframe> on third-party sites.
 *
 * FRAME-ANCESTORS NOTE
 * --------------------
 * Allowing cross-origin iframing requires setting either
 *   X-Frame-Options: ALLOWALL  (deprecated) or
 *   Content-Security-Policy: frame-ancestors *
 * Next.js 14 does NOT support setting custom response headers from a Server
 * Component directly. The clean fix is to add these headers in middleware
 * for paths starting with `/embed/`, but middleware modifications are out
 * of scope for this feature. For now:
 *
 *   - Same-origin iframes work today.
 *   - Cross-origin embeds require an ops step: extend middleware (or
 *     next.config.mjs `headers()`) so that requests to `/embed/*` strip
 *     X-Frame-Options and set `frame-ancestors *` in CSP.
 *
 * This limitation is also documented in the recruiter UI at
 * /dashboard/tenants/[slug]/embed.
 */

import Image from 'next/image'
import { notFound } from 'next/navigation'
import { safeCssColor, safeFontName } from '@/lib/security/sanitize'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getTenantBranding } from '@/lib/branding/server'

export const dynamic = 'force-dynamic'

// noindex / nofollow — this surface is for embeds, not SEO.
export function generateMetadata(): {
  title: string
  robots: { index: boolean; follow: boolean }
} {
  return {
    title: 'Lowongan kerja',
    robots: { index: false, follow: false },
  }
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: 'Penuh Waktu',
  PART_TIME: 'Paruh Waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Lepas',
}

const LOCATION_LABELS: Record<string, string> = {
  ONSITE: 'Di Tempat',
  HYBRID: 'Hibrida',
  REMOTE: 'Jarak Jauh',
}

function formatRupiahShort(n: number): string {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000) return `Rp ${Math.round(n / 1_000_000)}jt`
  if (n >= 1_000) return `Rp ${Math.round(n / 1_000)}rb`
  return `Rp ${n}`
}

function salaryLabel(min: number | null, max: number | null): string | null {
  if (min !== null && max !== null) {
    return `${formatRupiahShort(min)} – ${formatRupiahShort(max)}`
  }
  if (min !== null) return `≥ ${formatRupiahShort(min)}`
  if (max !== null) return `≤ ${formatRupiahShort(max)}`
  return null
}

function parseLimit(raw: string | string[] | undefined): number {
  const v = typeof raw === 'string' ? parseInt(raw, 10) : NaN
  if (!Number.isFinite(v) || v <= 0) return 25
  return Math.min(50, v)
}

function parseTheme(raw: string | string[] | undefined): 'light' | 'dark' {
  return raw === 'dark' ? 'dark' : 'light'
}

// --------------------------------------------------------------------------
// Page
// --------------------------------------------------------------------------

export default async function EmbedJobsPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: Record<string, string | string[] | undefined>
}) {
  const limit = parseLimit(searchParams.limit)
  const theme = parseTheme(searchParams.theme)

  const tenant = await prisma.tenant
    .findUnique({
      where: { slug: params.slug },
      select: { id: true, slug: true, name: true, status: true },
    })
    .catch(() => null)

  if (!tenant || tenant.status !== 'ACTIVE') {
    notFound()
  }

  const branding = await getTenantBranding(params.slug).catch(() => null)
  const tokens = branding?.tokens
  const logo = tokens?.logoLight ?? tokens?.logoDark ?? null

  const jobs = await prisma.job.findMany({
    where: {
      tenantId: tenant.id,
      status: 'PUBLISHED',
    },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      location: true,
      locationType: true,
      employmentType: true,
      salaryMin: true,
      salaryMax: true,
      publishedAt: true,
    },
  })

  // Theme — "dark" simply swaps surface tokens. Branding primary stays.
  // Tenant token colors are hex-validated on write, but this public embed
  // injects them into a raw <style>; sanitize at render too (defense in depth)
  // so a malformed color can never break out of the CSS block.
  const bgColor =
    theme === 'dark' ? '#0a1726' : safeCssColor(tokens?.backgroundColor, '#ffffff')
  const fgColor =
    theme === 'dark' ? '#f5f5f4' : safeCssColor(tokens?.foregroundColor, '#0a2540')
  const cardBg = theme === 'dark' ? '#0e1f33' : '#ffffff'
  const borderColor =
    theme === 'dark' ? '#1f3149' : safeCssColor(tokens?.borderColor, '#e5e7eb')
  const mutedFg =
    theme === 'dark' ? '#94a3b8' : safeCssColor(tokens?.mutedForeground, '#6b7280')
  const primary = safeCssColor(tokens?.primaryColor, '#0a2540')
  const primaryFg = safeCssColor(tokens?.primaryForeground, '#ffffff')
  const ring = safeCssColor(tokens?.ringColor, '#c9a961')

  const radiusPx = `${tokens?.radius ?? 12}px`

  // Build inline CSS variables for the embed surface.
  const embedStyle = `
    .ssn-embed {
      --ssn-bg: ${bgColor};
      --ssn-fg: ${fgColor};
      --ssn-card: ${cardBg};
      --ssn-border: ${borderColor};
      --ssn-muted-fg: ${mutedFg};
      --ssn-primary: ${primary};
      --ssn-primary-fg: ${primaryFg};
      --ssn-ring: ${ring};
      --ssn-radius: ${radiusPx};
      background: var(--ssn-bg);
      color: var(--ssn-fg);
      font-family: ${safeFontName(tokens?.fontBody, 'Inter')}, ui-sans-serif, system-ui, sans-serif;
      min-height: 100vh;
      padding: 20px;
      box-sizing: border-box;
    }
    .ssn-embed * { box-sizing: border-box; }
    .ssn-embed-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--ssn-border);
      margin-bottom: 20px;
    }
    .ssn-embed-logo {
      height: 36px;
      width: auto;
      max-width: 160px;
      object-fit: contain;
    }
    .ssn-embed-title {
      font-family: ${safeFontName(tokens?.fontHeading, 'Playfair Display')}, ui-serif, serif;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
    }
    .ssn-embed-subtitle {
      font-size: 12px;
      color: var(--ssn-muted-fg);
      margin: 2px 0 0;
    }
    .ssn-embed-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
    }
    .ssn-embed-card {
      background: var(--ssn-card);
      border: 1px solid var(--ssn-border);
      border-radius: var(--ssn-radius);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: border-color .15s ease, transform .15s ease;
    }
    .ssn-embed-card:hover { border-color: var(--ssn-ring); }
    .ssn-embed-card-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .ssn-embed-job-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: var(--ssn-fg);
    }
    .ssn-embed-meta {
      font-size: 12px;
      color: var(--ssn-muted-fg);
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
    }
    .ssn-embed-meta span:not(:last-child)::after {
      content: '·';
      margin-left: 10px;
      color: var(--ssn-muted-fg);
    }
    .ssn-embed-salary {
      font-size: 12px;
      font-weight: 600;
      color: var(--ssn-primary);
    }
    .ssn-embed-cta {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 9999px;
      background: var(--ssn-primary);
      color: var(--ssn-primary-fg);
      text-decoration: none;
      white-space: nowrap;
      transition: opacity .15s ease;
    }
    .ssn-embed-cta:hover { opacity: .9; }
    .ssn-embed-empty {
      text-align: center;
      padding: 40px 16px;
      color: var(--ssn-muted-fg);
      font-size: 13px;
      border: 1px dashed var(--ssn-border);
      border-radius: var(--ssn-radius);
    }
    .ssn-embed-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid var(--ssn-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      color: var(--ssn-muted-fg);
    }
    .ssn-embed-footer a {
      color: var(--ssn-primary);
      text-decoration: none;
      font-weight: 600;
    }
    .ssn-embed-footer a:hover { text-decoration: underline; }
  `

  // Apply page-level background so any iframe padding still matches.
  const bodyVar = `body{background:${bgColor};margin:0}`

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: bodyVar + embedStyle }} />
      <div className="ssn-embed" data-theme={theme}>
        <header className="ssn-embed-header">
          {logo ? (
            <Image
              src={logo}
              alt={tenant.name}
              className="ssn-embed-logo"
              width={160}
              height={36}
              unoptimized
            />
          ) : (
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: primary,
                color: primaryFg,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {tenant.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="ssn-embed-title">{tenant.name}</h1>
            <p className="ssn-embed-subtitle">
              Lowongan kerja oleh {tenant.name}
            </p>
          </div>
        </header>

        {jobs.length === 0 ? (
          <div className="ssn-embed-empty">
            Belum ada lowongan aktif saat ini.
          </div>
        ) : (
          <ul className="ssn-embed-list">
            {jobs.map((j) => {
              const sal = salaryLabel(j.salaryMin, j.salaryMax)
              const empLabel =
                EMPLOYMENT_LABELS[j.employmentType] ?? j.employmentType
              const locTypeLabel =
                LOCATION_LABELS[j.locationType] ?? j.locationType
              return (
                <li key={j.id}>
                  <article className="ssn-embed-card">
                    <div className="ssn-embed-card-row">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h2 className="ssn-embed-job-title">{j.title}</h2>
                        <div className="ssn-embed-meta">
                          <span>{j.location}</span>
                          <span>{locTypeLabel}</span>
                          <span>{empLabel}</span>
                        </div>
                        {sal && (
                          <div className="ssn-embed-salary">{sal}</div>
                        )}
                      </div>
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/jobs/${j.slug}` as any}
                        target="_top"
                        className="ssn-embed-cta"
                      >
                        Lamar
                      </Link>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        )}

        <footer className="ssn-embed-footer">
          <span>Didukung oleh SSN Pekerja</span>
          <Link
            href="/jobs"
            target="_top"
            rel="noopener"
          >
            Lihat semua di SSN Pekerja →
          </Link>
        </footer>
      </div>
    </>
  )
}
