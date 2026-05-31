/**
 * Job Board Embed — snippet builder helpers (pure, no runtime deps).
 *
 * These produce the HTML snippets that recruiters paste into their own
 * external websites (WordPress, Webflow, raw HTML, etc) to embed an iframe
 * of the tenant's published job board hosted at /embed/[slug]/jobs.
 *
 * Two flavors are supported:
 *
 *   1. buildIframeSnippet — a static <iframe src="..."> element. Simplest
 *      to paste; recruiters can edit width/height inline.
 *
 *   2. buildScriptSnippet — a <div id="..."></div> + <script> that injects
 *      the iframe at runtime, auto-sizes it to the host container width,
 *      and listens for postMessage("rpi-embed-height", N) from the iframe
 *      to resize itself when the inner content grows/shrinks. Use this for
 *      a more responsive integration on host sites that allow inline JS.
 *
 * Both helpers are pure — they take parameters and return a string. No I/O,
 * no React, no DOM. Safe to call from client or server.
 */

export type SnippetOptions = {
  /** Tenant slug (subdomain identifier) — used to build the embed URL. */
  slug: string
  /**
   * Absolute base URL for the RPI app (e.g. https://rumahpekerja.id).
   * Trailing slashes are tolerated; the helper normalizes them.
   */
  baseUrl: string
  /** Optional: max jobs to render (1–50). Forwarded as `?limit=`. */
  limit?: number
  /** Optional: light (default) or dark theme. Forwarded as `?theme=`. */
  theme?: 'light' | 'dark'
}

/** Normalize the base URL by stripping any trailing slash. */
function normalizeBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/** Build the embed URL — internal helper. */
function buildEmbedUrl(opts: SnippetOptions): string {
  const base = normalizeBase(opts.baseUrl)
  const params: string[] = []
  if (typeof opts.limit === 'number' && opts.limit > 0) {
    params.push(`limit=${Math.min(50, Math.floor(opts.limit))}`)
  }
  if (opts.theme === 'dark') {
    params.push('theme=dark')
  }
  const qs = params.length ? `?${params.join('&')}` : ''
  return `${base}/embed/${encodeURIComponent(opts.slug)}/jobs${qs}`
}

/**
 * Build a plain <iframe> snippet pointing at the tenant's embed page.
 * Default size: 100% width, 600px height. Recruiter can edit attributes.
 */
export function buildIframeSnippet(opts: SnippetOptions): string {
  const url = buildEmbedUrl(opts)
  return [
    `<iframe`,
    `  src="${url}"`,
    `  width="100%"`,
    `  height="600"`,
    `  frameborder="0"`,
    `  style="border:0;max-width:100%;display:block"`,
    `  loading="lazy"`,
    `  title="Lowongan kerja"`,
    `  referrerpolicy="no-referrer-when-downgrade"`,
    `></iframe>`,
  ].join('\n')
}

/**
 * Build a <div> + <script> snippet that creates the iframe at runtime.
 * The injected script:
 *   - sizes the iframe to the container width
 *   - listens for window.postMessage({ type: 'rpi-embed-height', height })
 *     so the embed page can ask the host to resize
 *
 * IMPORTANT: this snippet must execute in the host page. Some CMSes strip
 * <script> tags from rich-text editors — recruiters using such CMSes should
 * fall back to the plain iframe variant.
 */
export function buildScriptSnippet(opts: SnippetOptions): string {
  const url = buildEmbedUrl(opts)
  // Use a slug-suffixed container id so multiple embeds on one page coexist.
  const containerId = `rpi-embed-${opts.slug}`
  // Single-quoted strings inside the script avoid clashing with the outer
  // double-quoted attributes that recruiters might wrap this in.
  const script = [
    `(function(){`,
    `  var c = document.getElementById('${containerId}');`,
    `  if (!c) return;`,
    `  var f = document.createElement('iframe');`,
    `  f.src = '${url}';`,
    `  f.title = 'Lowongan kerja';`,
    `  f.loading = 'lazy';`,
    `  f.referrerPolicy = 'no-referrer-when-downgrade';`,
    `  f.setAttribute('frameborder', '0');`,
    `  f.style.cssText = 'border:0;width:100%;display:block;min-height:600px';`,
    `  c.innerHTML = '';`,
    `  c.appendChild(f);`,
    `  window.addEventListener('message', function(e){`,
    `    if (!e || !e.data || e.data.type !== 'rpi-embed-height') return;`,
    `    if (e.source !== f.contentWindow) return;`,
    `    var h = parseInt(e.data.height, 10);`,
    `    if (h > 0) f.style.height = h + 'px';`,
    `  });`,
    `})();`,
  ].join('')
  return `<div id="${containerId}"></div>\n<script>${script}</script>`
}
