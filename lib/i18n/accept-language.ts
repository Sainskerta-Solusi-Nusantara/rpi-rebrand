// Parser for RFC 7231 Accept-Language headers.
//
// Returns the highest-q supported locale (id|en) or null when nothing matches.
// We accept primary subtags too: "en-US" → "en", "id-ID" → "id".

import { locales, type Locale } from './dictionary'

const SUPPORTED = new Set<string>(locales)

interface ParsedEntry {
  tag: string
  q: number
  index: number
}

/**
 * Parse an Accept-Language header value and resolve to a supported Locale.
 *
 * Examples:
 *   parseAcceptLanguage("en-US,en;q=0.9,id;q=0.7")  → 'en'
 *   parseAcceptLanguage("id-ID,id;q=0.9,en;q=0.5")  → 'id'
 *   parseAcceptLanguage(null)                       → null
 *   parseAcceptLanguage("fr,es")                    → null
 */
export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header || typeof header !== 'string') return null

  const entries: ParsedEntry[] = []
  const parts = header.split(',')
  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i]?.trim()
    if (!raw) continue
    // "en;q=0.9" or just "en-US"
    const [tagPart, ...params] = raw.split(';')
    const tag = (tagPart ?? '').trim().toLowerCase()
    if (!tag || tag === '*') continue
    let q = 1
    for (const p of params) {
      const kv = p.trim().split('=')
      if (kv.length === 2 && kv[0]?.trim().toLowerCase() === 'q') {
        const parsed = Number.parseFloat(kv[1] ?? '')
        if (Number.isFinite(parsed)) q = Math.max(0, Math.min(1, parsed))
      }
    }
    if (q <= 0) continue
    entries.push({ tag, q, index: i })
  }

  // Sort by q desc, then by original index asc (stable preference order).
  entries.sort((a, b) => (b.q - a.q) || (a.index - b.index))

  for (const e of entries) {
    if (SUPPORTED.has(e.tag)) return e.tag as Locale
    const primary = e.tag.split('-')[0]
    if (primary && SUPPORTED.has(primary)) return primary as Locale
  }

  return null
}
