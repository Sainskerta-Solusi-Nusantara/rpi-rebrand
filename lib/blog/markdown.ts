/**
 * Minimal markdown → safe HTML renderer.
 *
 * NOTE: minimal markdown — no real lib for now.
 * We have no markdown library installed (checked package.json: neither `marked`
 * nor `remark`/`unified` are available). Rather than pull in a new dependency
 * we ship a tiny in-house renderer scoped to the syntax the spec calls out:
 *
 *   - Headings: `# H1`, `## H2`, `### H3`
 *   - Bold: `**bold**`
 *   - Italic: `*italic*`
 *   - Inline code: `` `code` ``
 *   - Fenced code blocks: ```` ```lang ... ``` ````
 *   - Links: `[text](url)` with a URL whitelist (http/https/mailto/relative)
 *   - Unordered lists: `- item`
 *   - Ordered lists: `1. item`
 *   - Paragraphs separated by blank lines
 *
 * Security:
 *   - Raw input is HTML-escaped FIRST so any `<script>` / `<style>` / `<img onerror=...>`
 *     present in source becomes inert text (`&lt;script&gt;...`).
 *   - We then re-introduce only the tag set above (`<h1>`, `<h2>`, `<h3>`, `<strong>`,
 *     `<em>`, `<code>`, `<pre>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<p>`, `<br>`).
 *   - Link `href` values are validated against an allowlist (http, https, mailto,
 *     or relative paths starting with `/`). Everything else is dropped.
 *   - We never emit `<script>`, `<style>`, `<iframe>`, or inline event handlers.
 *
 * Output is intended to be injected via `dangerouslySetInnerHTML` inside a
 * `prose` container.
 */

/** HTML-escape every special character so user input cannot inject markup. */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Allow only safe URL schemes / relative paths in `[text](url)` links. */
function sanitizeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0 || trimmed.length > 2048) return null
  // Relative path or fragment / query
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed
  }
  // Absolute with allowed scheme
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^mailto:/i.test(trimmed)) return trimmed
  return null
}

/** Render inline markdown (after the line has already been HTML-escaped). */
function renderInline(escaped: string): string {
  let out = escaped

  // Inline code first so that ** inside ` ` is not bolded.
  // Look for backtick-quoted spans on a single line.
  out = out.replace(/`([^`\n]+)`/g, (_m, code) => `<code>${code}</code>`)

  // Links: [text](url)  — url has been HTML-escaped already; we re-decode the
  // tiny set we need (& and quotes) for the allowlist check, then re-escape.
  out = out.replace(/\[([^\]\n]+)\]\(([^()\s]+)\)/g, (_m, text: string, url: string) => {
    const decoded = url
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    const safe = sanitizeUrl(decoded)
    if (!safe) return text
    const href = escapeHtml(safe)
    const isExternal = /^https?:\/\//i.test(safe)
    const rel = isExternal ? ' rel="noopener noreferrer nofollow"' : ''
    const target = isExternal ? ' target="_blank"' : ''
    return `<a href="${href}"${target}${rel}>${text}</a>`
  })

  // Bold: **text**
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')

  // Italic: *text* — only when not adjacent to another asterisk (avoid eating ** boundaries)
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

  return out
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'code'; code: string }
  | { kind: 'p'; text: string }

/**
 * Convert a markdown source string into a safe HTML fragment.
 *
 * @param md - raw markdown text from a trusted-but-verified author
 */
export function renderMarkdownToHtml(md: string): string {
  if (!md) return ''

  // Step 1: normalize line endings.
  const source = md.replace(/\r\n?/g, '\n')

  // Step 2: walk lines, extracting fenced code blocks BEFORE we escape so we
  // can keep the original source verbatim inside <pre><code>.
  const lines = source.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i] ?? ''

    // Fenced code block.
    if (/^```/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i] ?? '')) {
        buf.push(lines[i] ?? '')
        i++
      }
      if (i < lines.length) i++ // consume the closing ```
      blocks.push({ kind: 'code', code: buf.join('\n') })
      continue
    }

    // Blank line → flush paragraph boundary.
    if (line.trim() === '') {
      i++
      continue
    }

    // Heading levels.
    const h3 = line.match(/^###\s+(.+)$/)
    if (h3) {
      blocks.push({ kind: 'h3', text: h3[1] ?? '' })
      i++
      continue
    }
    const h2 = line.match(/^##\s+(.+)$/)
    if (h2) {
      blocks.push({ kind: 'h2', text: h2[1] ?? '' })
      i++
      continue
    }
    const h1 = line.match(/^#\s+(.+)$/)
    if (h1) {
      blocks.push({ kind: 'h1', text: h1[1] ?? '' })
      i++
      continue
    }

    // Unordered list (consecutive `- ` lines).
    if (/^- +\S/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^- +\S/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^- +/, ''))
        i++
      }
      blocks.push({ kind: 'ul', items })
      continue
    }

    // Ordered list (consecutive `1. ` lines).
    if (/^\d+\.\s+\S/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+\S/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ kind: 'ol', items })
      continue
    }

    // Paragraph: gather consecutive non-blank, non-special lines.
    const paraLines: string[] = [line]
    i++
    while (i < lines.length) {
      const l = lines[i] ?? ''
      if (
        l.trim() === '' ||
        /^```/.test(l) ||
        /^#{1,3}\s+/.test(l) ||
        /^- +\S/.test(l) ||
        /^\d+\.\s+\S/.test(l)
      ) {
        break
      }
      paraLines.push(l)
      i++
    }
    blocks.push({ kind: 'p', text: paraLines.join('\n') })
  }

  // Step 3: emit HTML. Inline content is HTML-escaped per line, then a small
  // set of inline markdown transforms is applied. Multi-line paragraphs join
  // with `<br>` so soft line breaks are preserved.
  const out: string[] = []
  for (const b of blocks) {
    switch (b.kind) {
      case 'h1':
        out.push(`<h1>${renderInline(escapeHtml(b.text))}</h1>`)
        break
      case 'h2':
        out.push(`<h2>${renderInline(escapeHtml(b.text))}</h2>`)
        break
      case 'h3':
        out.push(`<h3>${renderInline(escapeHtml(b.text))}</h3>`)
        break
      case 'ul': {
        const items = b.items
          .map((it) => `<li>${renderInline(escapeHtml(it))}</li>`)
          .join('')
        out.push(`<ul>${items}</ul>`)
        break
      }
      case 'ol': {
        const items = b.items
          .map((it) => `<li>${renderInline(escapeHtml(it))}</li>`)
          .join('')
        out.push(`<ol>${items}</ol>`)
        break
      }
      case 'code':
        // Escape only — no inline transforms inside code.
        out.push(`<pre><code>${escapeHtml(b.code)}</code></pre>`)
        break
      case 'p': {
        const html = b.text
          .split('\n')
          .map((ln) => renderInline(escapeHtml(ln)))
          .join('<br>')
        out.push(`<p>${html}</p>`)
        break
      }
    }
  }

  return out.join('\n')
}
