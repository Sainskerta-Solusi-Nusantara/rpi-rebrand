// Small, dependency-free output-sanitization helpers for the two places the app
// injects dynamic strings into markup that a markdown/escape renderer doesn't
// already cover:
//   - JSON-LD <script> blocks (safeJsonLd)
//   - CSS custom-property values in a <style> tag (safeCssColor)
//
// Authored prose (blog/article/notes) is already rendered through escape-first
// renderers (lib/blog/markdown.ts, lib/applications/mention-parser.ts) and does
// not need these.

/**
 * Serialize an object for embedding in a `<script type="application/ld+json">`
 * block. `JSON.stringify` does NOT escape `<`, so a user-authored field
 * containing the literal `</script>` would break out of the tag — a classic
 * JSON-LD XSS. Escaping `<` to its JSON unicode form keeps the structured data
 * valid (parsers decode `<` back to `<`) while making `</script>` inert.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

// Permits hex (#rgb..#rrggbbaa), rgb()/rgba(), hsl()/hsla(), and bare CSS named
// colors. Anything containing `}`, `<`, `;`, `:`, quotes, etc. is rejected so a
// value can't terminate the declaration / <style> and inject markup.
const SAFE_CSS_COLOR =
  /^(#[0-9a-fA-F]{3,8}|rgba?\([0-9.,\s%/]+\)|hsla?\([0-9.,\s%deg/]+\)|[a-zA-Z]{3,24})$/

/**
 * Return `value` only if it is a syntactically-safe CSS color, else `fallback`.
 * Use when interpolating a (potentially tenant-controlled) color into a raw
 * `<style>` string, regardless of any write-time validation.
 */
export function safeCssColor(
  value: string | null | undefined,
  fallback: string,
): string {
  if (typeof value === 'string') {
    const v = value.trim()
    if (v.length > 0 && v.length <= 64 && SAFE_CSS_COLOR.test(v)) return v
  }
  return fallback
}

// A single font-family name: letters, digits, spaces, and - _ only. Rejects
// anything that could terminate the declaration / <style> (`}`, `;`, `<`, quotes).
const SAFE_FONT_NAME = /^[A-Za-z0-9 _-]{1,48}$/

/**
 * Return `value` only if it is a safe font-family name, else `fallback`. Use
 * when interpolating a (tenant-controlled) font name into a raw `<style>`.
 */
export function safeFontName(
  value: string | null | undefined,
  fallback: string,
): string {
  if (typeof value === 'string') {
    const v = value.trim()
    if (SAFE_FONT_NAME.test(v)) return v
  }
  return fallback
}

/**
 * Make tenant-authored custom CSS safe to inject into a raw `<style>` tag.
 * The CSS is allowed to be arbitrary, but it must not break out of the element:
 * the HTML parser ends a `<style>` at a literal `</style` (case-insensitive),
 * which valid CSS never needs — so any such sequence is removed.
 */
export function safeCustomCss(css: string | null | undefined): string {
  if (!css) return ''
  return css.replace(/<\/style/gi, '')
}
