'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import type { OpenApiSpec } from '@/lib/openapi/spec'

const SWAGGER_VERSION = '5.17.14'
const SWAGGER_CSS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`
const SWAGGER_JS = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`

type SwaggerBundleArgs = {
  spec: OpenApiSpec
  domNode: HTMLElement
  deepLinking?: boolean
  presets?: unknown[]
  layout?: string
  tryItOutEnabled?: boolean
  defaultModelsExpandDepth?: number
}

type SwaggerWindow = Window & {
  SwaggerUIBundle?: ((args: SwaggerBundleArgs) => unknown) & {
    presets?: { apis?: unknown }
  }
}

export function OpenApiViewer({ spec }: { spec: OpenApiSpec }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [renderFailed, setRenderFailed] = useState(false)
  const [showRawSpec, setShowRawSpec] = useState(false)

  useEffect(() => {
    if (!scriptReady) return
    if (!containerRef.current) return
    const w = window as SwaggerWindow
    const SwaggerUIBundle = w.SwaggerUIBundle
    if (typeof SwaggerUIBundle !== 'function') {
      setRenderFailed(true)
      return
    }
    try {
      SwaggerUIBundle({
        spec,
        domNode: containerRef.current,
        deepLinking: false,
        presets: SwaggerUIBundle.presets?.apis
          ? [SwaggerUIBundle.presets.apis]
          : [],
        layout: 'BaseLayout',
        tryItOutEnabled: true,
        defaultModelsExpandDepth: 1,
      })
    } catch (err) {
      console.error('[OpenApiViewer] swagger init failed', err)
      setRenderFailed(true)
    }
  }, [scriptReady, spec])

  return (
    <div className="space-y-3">
      {/* Stylesheet loaded once via plain <link> so it applies on first render */}
      <link rel="stylesheet" href={SWAGGER_CSS} />
      <Script
        src={SWAGGER_JS}
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setRenderFailed(true)}
      />

      {!scriptReady && !renderFailed && (
        <p className="text-muted-foreground text-sm">
          Memuat Swagger UI dari CDN…
        </p>
      )}

      {renderFailed && (
        <div className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 rounded-md border p-4 text-sm">
          <p className="font-medium">
            Swagger UI tidak dapat dimuat (mungkin koneksi ke CDN diblokir).
          </p>
          <p className="text-muted-foreground mt-1">
            Anda tetap dapat melihat spesifikasi mentah di bawah.
          </p>
          <button
            type="button"
            onClick={() => setShowRawSpec((v) => !v)}
            className="mt-3 inline-flex items-center rounded-md border border-amber-500/40 bg-background px-3 py-1 text-xs font-medium hover:bg-muted"
          >
            {showRawSpec ? 'Sembunyikan JSON spec' : 'Lihat JSON spec'}
          </button>
          {showRawSpec && (
            <pre className="bg-background border-border mt-3 max-h-96 overflow-auto rounded-md border p-3 text-xs">
              <code>{JSON.stringify(spec, null, 2)}</code>
            </pre>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        // Hide the empty container while Swagger hasn't injected yet to avoid
        // flashing an empty white box.
        className={renderFailed ? 'hidden' : 'border-border rounded-md border bg-background'}
        aria-label="Dokumentasi API interaktif"
      />
    </div>
  )
}
