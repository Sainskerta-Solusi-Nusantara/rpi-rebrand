'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, KeyRound } from 'lucide-react'
import { createTenantApiKey } from '@/lib/tenants/api-key-actions'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Single-click create of a `read`-scope tenant API key, shown inline on the
 * docs page so developers can grab a working key without leaving the screen.
 */
export function ApiKeyQuickCreate({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [plain, setPlain] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function onCreate() {
    setError(null)
    setPlain(null)
    setCopied(false)
    const fd = new FormData()
    const stamp = new Date().toISOString().slice(0, 10)
    fd.set('name', `Docs quick key ${stamp}`)
    fd.set('expiry', '90d')
    fd.append('scopes', 'read')

    startTransition(async () => {
      const r = await createTenantApiKey({ tenantSlug, values: fd })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setPlain(r.data?.plain ?? null)
      router.refresh()
    })
  }

  if (plain) {
    return (
      <div className="space-y-3 rounded-md border border-success/30 bg-success/10 p-4">
        <p className="text-sm font-medium text-foreground">
          Kunci read siap dipakai
        </p>
        <p className="text-muted-foreground text-xs">
          Ini satu-satunya kesempatan menampilkan kunci. Salin sekarang lalu
          tempel di kolom Authorize Swagger UI di atas.
        </p>
        <div className="bg-background border-border rounded-md border p-3">
          <code className="block break-all font-mono text-xs">{plain}</code>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard
                ?.writeText(plain)
                .then(() => setCopied(true))
                .catch(() => {})
            }}
            className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
          >
            <Copy className="h-3 w-3" aria-hidden="true" />
            {copied ? 'Tersalin' : 'Salin ke clipboard'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlain(null)
              setCopied(false)
            }}
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Buat kunci API <code className="bg-muted rounded px-1">read</code> dengan
        sekali klik (berlaku 90 hari, otomatis tercatat di audit log tenant).
      </p>
      <button
        type="button"
        onClick={onCreate}
        disabled={pending}
        className={btnPrimary}
      >
        <KeyRound className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Membuat kunci…' : 'Buat kunci read sekarang'}
      </button>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
