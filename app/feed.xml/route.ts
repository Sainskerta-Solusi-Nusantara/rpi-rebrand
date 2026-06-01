/**
 * RSS 2.0 feed for published Articles.
 *
 * Cached at the edge for 5 minutes; that is short enough that newly published
 * articles surface to feed readers quickly, but long enough to absorb the
 * burst of polling that aggregators do.
 */

import { NextResponse } from 'next/server'
import { listPublishedArticles } from '@/lib/blog/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 300

function xmlEscape(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapCdata(input: string): string {
  // Close any accidental CDATA terminator inside the payload.
  return `<![CDATA[${input.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

export async function GET(): Promise<Response> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://rumahpekerja.id'
  const { items } = await listPublishedArticles({ page: 1, pageSize: 20 })

  const lastBuildDate = (
    items[0]?.publishedAt ??
    items[0]?.createdAt ??
    new Date()
  ).toUTCString()

  const channelTitle = 'Rumah Pekerja Indonesia — Blog'
  const channelDescription =
    'Wawasan, riset, dan panduan praktis dari dunia kerja Indonesia.'

  const itemsXml = items
    .map((a) => {
      const link = `${baseUrl}/blog/${a.slug}`
      const pubDate = (a.publishedAt ?? a.createdAt).toUTCString()
      const description = a.summary ?? a.title
      const authorName = a.author?.name ?? 'Tim RPI'
      const categories = a.tags
        .map((t) => `      <category>${xmlEscape(t)}</category>`)
        .join('\n')

      return [
        '    <item>',
        `      <title>${xmlEscape(a.title)}</title>`,
        `      <link>${xmlEscape(link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <dc:creator>${wrapCdata(authorName)}</dc:creator>`,
        `      <description>${wrapCdata(description)}</description>`,
        categories,
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(channelTitle)}</title>
    <link>${xmlEscape(`${baseUrl}/blog`)}</link>
    <atom:link href="${xmlEscape(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />
    <description>${xmlEscape(channelDescription)}</description>
    <language>id-ID</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control':
        'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
