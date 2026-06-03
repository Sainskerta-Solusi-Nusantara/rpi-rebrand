'use client'

// Root error boundary — catches failures in the root layout itself, where the
// normal app/error.tsx and the app's global CSS are unavailable. It must render
// its own <html>/<body>, so styling is inline and minimal.

import { useEffect } from 'react'
import { captureException } from '@/lib/observability/report'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    captureException(error, { boundary: 'global', digest: error.digest })
  }, [error])

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '6rem 1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#0b1220',
          color: '#e6e9f0',
        }}
      >
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: 0 }}>
          Maaf, terjadi gangguan
        </h1>
        <p style={{ maxWidth: '28rem', color: '#9aa4b2', margin: 0 }}>
          Sistem mengalami kendala. Silakan coba lagi atau hubungi dukungan jika
          masalah berlanjut.
        </p>
        {error.digest ? (
          <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
            Ref: {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: '0.5rem',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.375rem',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: '#3b82f6',
            color: '#ffffff',
          }}
        >
          Coba lagi
        </button>
      </body>
    </html>
  )
}
