'use client'

/**
 * EmbedWidgetConfig — recruiter-facing configurator UI for the job-board
 * embed widget.
 *
 * Recruiters tweak limit + theme, see a live preview, and copy the iframe
 * (or script) snippet to paste into their own external website.
 */

import { inputClass } from '@/lib/ui/form-styles'
import { useMemo, useState } from 'react'
import { Copy, ExternalLink, Check, Info } from 'lucide-react'
import {
  buildIframeSnippet,
  buildScriptSnippet,
} from '@/lib/embed/snippet-builder'


const textareaClass =
  'block w-full rounded-md border border-input bg-muted/40 px-3 py-2 font-mono text-xs text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

export type EmbedWidgetConfigProps = {
  /** Tenant slug used in the embed URL. */
  tenantSlug: string
  /** Public base URL of the app (NEXT_PUBLIC_APP_URL). */
  baseUrl: string
}

export function EmbedWidgetConfig({
  tenantSlug,
  baseUrl,
}: EmbedWidgetConfigProps) {
  const [limit, setLimit] = useState<number>(10)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  const previewUrl = useMemo(() => {
    const base = baseUrl.replace(/\/+$/, '')
    const params: string[] = []
    if (limit > 0) params.push(`limit=${Math.min(50, Math.floor(limit))}`)
    if (theme === 'dark') params.push('theme=dark')
    const qs = params.length ? `?${params.join('&')}` : ''
    return `${base}/embed/${encodeURIComponent(tenantSlug)}/jobs${qs}`
  }, [tenantSlug, baseUrl, limit, theme])

  const iframeSnippet = useMemo(
    () => buildIframeSnippet({ slug: tenantSlug, baseUrl, limit, theme }),
    [tenantSlug, baseUrl, limit, theme],
  )
  const scriptSnippet = useMemo(
    () => buildScriptSnippet({ slug: tenantSlug, baseUrl, limit, theme }),
    [tenantSlug, baseUrl, limit, theme],
  )

  function copy(text: string, which: 'iframe' | 'script') {
    if (!navigator?.clipboard) return
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (which === 'iframe') {
          setCopiedIframe(true)
          setTimeout(() => setCopiedIframe(false), 2000)
        } else {
          setCopiedScript(true)
          setTimeout(() => setCopiedScript(false), 2000)
        }
      })
      .catch(() => {})
  }

  return (
    <div className="space-y-6">
      {/* Configurator */}
      <section
        aria-label="Konfigurasi widget"
        className="border-border bg-card rounded-2xl border p-6 space-y-4"
      >
        <h2 className="font-heading text-lg">Konfigurasi</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Jumlah lowongan
            </span>
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              value={limit}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (Number.isFinite(v)) {
                  setLimit(Math.max(1, Math.min(50, v)))
                }
              }}
              className={inputClass}
              aria-describedby="limit-help"
            />
            <span
              id="limit-help"
              className="text-muted-foreground mt-1 block text-xs"
            >
              Maksimum 50. Default 10.
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">Tema</span>
            <select
              value={theme}
              onChange={(e) =>
                setTheme(e.target.value === 'dark' ? 'dark' : 'light')
              }
              className={inputClass}
            >
              <option value="light">Terang</option>
              <option value="dark">Gelap</option>
            </select>
            <span className="text-muted-foreground mt-1 block text-xs">
              Warna utama tetap mengikuti branding tenant.
            </span>
          </label>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground inline-flex items-center gap-1 font-medium hover:underline"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            Buka preview di tab baru
          </a>
          <span className="font-mono text-[11px] break-all">{previewUrl}</span>
        </div>
      </section>

      {/* Live preview */}
      <section
        aria-label="Pratinjau langsung"
        className="border-border bg-card rounded-2xl border p-6 space-y-3"
      >
        <h2 className="font-heading text-lg">Pratinjau langsung</h2>
        <p className="text-muted-foreground text-sm">
          Tampilan ini sama persis dengan yang akan muncul di situs eksternal
          recruiter setelah snippet dipasang.
        </p>
        <div className="border-border overflow-hidden rounded-xl border bg-background">
          <iframe
            key={previewUrl}
            src={previewUrl}
            title="Pratinjau widget"
            width="100%"
            height={520}
            style={{ border: 0, display: 'block' }}
          />
        </div>
      </section>

      {/* Snippet — iframe */}
      <section
        aria-label="Snippet iframe"
        className="border-border bg-card rounded-2xl border p-6 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Snippet iframe (sederhana)</h2>
          <button
            type="button"
            onClick={() => copy(iframeSnippet, 'iframe')}
            className="border-border hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition"
          >
            {copiedIframe ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Salin
              </>
            )}
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          Tempel kode ini di mana saja di situs eksternal Anda (HTML, WordPress,
          Webflow, Wix, dll).
        </p>
        <textarea
          readOnly
          rows={8}
          value={iframeSnippet}
          className={textareaClass}
          onFocus={(e) => e.currentTarget.select()}
        />
      </section>

      {/* Snippet — script (responsive) */}
      <section
        aria-label="Snippet script"
        className="border-border bg-card rounded-2xl border p-6 space-y-3"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg">Snippet script (responsif)</h2>
          <button
            type="button"
            onClick={() => copy(scriptSnippet, 'script')}
            className="border-border hover:bg-muted inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition"
          >
            {copiedScript ? (
              <>
                <Check className="h-3 w-3" aria-hidden="true" />
                Tersalin
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" aria-hidden="true" />
                Salin
              </>
            )}
          </button>
        </div>
        <p className="text-muted-foreground text-sm">
          Gunakan versi ini jika situs Anda mengizinkan JavaScript inline.
          Iframe akan menyesuaikan ukuran kontainer secara otomatis.
        </p>
        <textarea
          readOnly
          rows={8}
          value={scriptSnippet}
          className={textareaClass}
          onFocus={(e) => e.currentTarget.select()}
        />
      </section>

      {/* CORS / frame-ancestors note */}
      <section
        aria-label="Catatan integrasi"
        className="border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700/40 rounded-2xl border p-4"
      >
        <div className="flex items-start gap-2 text-sm">
          <Info
            className="text-amber-600 dark:text-amber-400 mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1.5">
            <p className="font-medium text-foreground">
              Catatan untuk embed lintas domain
            </p>
            <p className="text-muted-foreground text-xs">
              Saat ini halaman embed dilindungi oleh kebijakan default
              browser. Embed di domain yang sama (same-origin) akan bekerja
              tanpa konfigurasi tambahan. Untuk embed di domain pihak ketiga
              (cross-origin), tim platform perlu mengaktifkan{' '}
              <code className="font-mono">
                Content-Security-Policy: frame-ancestors *
              </code>{' '}
              pada path <code className="font-mono">/embed/*</code> melalui
              middleware. Hubungi admin platform jika integrasi recruiter
              memerlukan ini.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
