/**
 * Minimal, dependency-free XML builder helpers for feed routes.
 *
 * - `escapeXml` escapes the five XML-mandated entities for attribute and
 *   element text content.
 * - `cdata` wraps payloads in a CDATA section, defusing any nested `]]>`
 *   terminator by splitting it (the standard `]]]]><![CDATA[>` trick).
 * - `el` is a tiny element builder that interpolates attributes safely.
 *
 * These helpers are intentionally pure (no IO, no globals) so they are easy
 * to unit test and reuse across LinkedIn / Indeed / Atom builders.
 */

export function escapeXml(input: string): string {
  return String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function cdata(input: string): string {
  // The CDATA section itself does NOT honor &-escapes — but it MUST NOT contain
  // a literal `]]>` terminator. We split such occurrences across two CDATA
  // sections, which is the canonical workaround.
  const safe = String(input ?? '').replace(/]]>/g, ']]]]><![CDATA[>')
  return `<![CDATA[${safe}]]>`
}

export type ElChild = string | null | undefined | false
export type ElAttrs = Record<string, string | number | boolean | null | undefined>

/**
 * Build a single XML element. Children are concatenated as-is (caller is
 * responsible for escaping / wrapping them). Attribute values are XML-escaped.
 *
 * - `el('title', undefined, 'Hello & world')` → `<title>Hello &amp; world</title>`
 *   (BUT only if you pass an already-escaped child; this helper does NOT
 *   escape children — use `escapeXml` or `cdata` first).
 * - `el('link', { rel: 'self', href: 'https://x?a=1&b=2' })` →
 *   `<link rel="self" href="https://x?a=1&amp;b=2" />`
 */
export function el(
  name: string,
  attrs?: ElAttrs,
  children?: ElChild | ElChild[],
): string {
  const attrStr =
    attrs && Object.keys(attrs).length > 0
      ? ' ' +
        Object.entries(attrs)
          .filter(([, v]) => v !== null && v !== undefined && v !== false)
          .map(([k, v]) => `${k}="${escapeXml(String(v))}"`)
          .join(' ')
      : ''

  const childArr = Array.isArray(children) ? children : children != null ? [children] : []
  const inner = childArr.filter((c): c is string => typeof c === 'string' && c.length > 0).join('')

  if (inner.length === 0) {
    return `<${name}${attrStr} />`
  }
  return `<${name}${attrStr}>${inner}</${name}>`
}

/**
 * Convenience: build a simple text element with auto-escaped text content.
 * For HTML content that must be preserved verbatim (description bodies),
 * use `el(name, attrs, cdata(htmlString))` instead.
 */
export function textEl(name: string, value: string | number | null | undefined, attrs?: ElAttrs): string {
  if (value === null || value === undefined || value === '') return ''
  return el(name, attrs, escapeXml(String(value)))
}
