/**
 * Shared response helper for XML feed routes.
 *
 * - `Content-Type: application/xml; charset=utf-8` so generic readers and
 *   ATS crawlers both accept the payload.
 * - `Cache-Control` permits 10-minute edge caching with a 30-minute SWR
 *   window, keeping DB pressure low when an aggregator polls aggressively.
 * - `X-Content-Type-Options: nosniff` prevents browsers from re-interpreting
 *   the XML body as HTML / script.
 */

export function xmlResponse(xml: string, status = 200): Response {
  return new Response(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control':
        'public, s-maxage=600, stale-while-revalidate=1800',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function xmlNotFoundResponse(message = 'Feed not found'): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>${message.replace(/[<>&]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;',
  )}</message>
</error>
`
  return new Response(xml, {
    status: 404,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
