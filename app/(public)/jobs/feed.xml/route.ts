/**
 * Public job feed for ATS / aggregator syndication.
 *
 * URL: GET /jobs/feed.xml?format=atom|linkedin|indeed[&tenant={slug}]
 *
 * - `format=atom` (default) — RFC 4287 Atom 1.0
 * - `format=linkedin`       — LinkedIn Jobs XML feed
 * - `format=indeed`         — Indeed XML feed
 * - `tenant={slug}`         — scope to a single tenant (optional). When the
 *                             slug is unknown OR the tenant has no published
 *                             jobs we return a 404 XML body so subscribers
 *                             fail loudly instead of silently consuming an
 *                             empty feed.
 *
 * Note: we accept the tenant filter as a query parameter rather than a path
 * segment to avoid colliding with the existing `/jobs/[slug]` job-detail
 * route, which uses a different dynamic-segment name.
 *
 * Caps at 500 most-recent published jobs. Cached at the edge for 10 minutes
 * with a 30-minute stale-while-revalidate window so aggregator polling does
 * not hammer the DB.
 */

import type { NextRequest } from 'next/server'
import {
  getPublishedJobsForFeed,
  getTenantBySlug,
} from '@/lib/feed/feed-queries'
import { buildAtomFeed } from '@/lib/feed/atom-feed'
import { buildLinkedInJobsXml } from '@/lib/feed/linkedin-feed'
import { buildIndeedXml } from '@/lib/feed/indeed-feed'
import { xmlNotFoundResponse, xmlResponse } from '@/lib/feed/feed-headers'

export const dynamic = 'force-dynamic'
export const revalidate = 600

type FeedFormat = 'atom' | 'linkedin' | 'indeed'

function parseFormat(value: string | null): FeedFormat {
  const v = (value ?? '').toLowerCase()
  if (v === 'linkedin' || v === 'indeed' || v === 'atom') return v
  return 'atom'
}

function resolveBaseUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  const base = envUrl && envUrl.length > 0 ? envUrl : req.nextUrl.origin
  return base.replace(/\/+$/, '')
}

export async function GET(req: NextRequest): Promise<Response> {
  const format = parseFormat(req.nextUrl.searchParams.get('format'))
  const tenantSlug = req.nextUrl.searchParams.get('tenant')?.trim() || null
  const baseUrl = resolveBaseUrl(req)

  let tenantId: string | null = null
  let feedTitle = 'SSN Pekerja — Lowongan'
  let alternateHref = `${baseUrl}/jobs`
  let selfQuery = `format=${format}`

  if (tenantSlug) {
    const tenant = await getTenantBySlug(tenantSlug)
    if (!tenant) return xmlNotFoundResponse('Tenant not found')
    tenantId = tenant.id
    feedTitle = `${tenant.name} — Lowongan`
    alternateHref = `${baseUrl}/jobs?tenant=${tenant.slug}`
    selfQuery = `format=${format}&tenant=${tenant.slug}`
  }

  const jobs = await getPublishedJobsForFeed(tenantId, { limit: 500 })
  if (tenantSlug && jobs.length === 0) {
    return xmlNotFoundResponse('No published jobs for tenant')
  }

  let xml: string
  switch (format) {
    case 'linkedin':
      xml = buildLinkedInJobsXml(jobs, baseUrl)
      break
    case 'indeed':
      xml = buildIndeedXml(jobs, baseUrl)
      break
    case 'atom':
    default:
      xml = buildAtomFeed(jobs, baseUrl, feedTitle, {
        selfHref: `${baseUrl}/jobs/feed.xml?${selfQuery}`,
        alternateHref,
      })
      break
  }

  return xmlResponse(xml)
}
