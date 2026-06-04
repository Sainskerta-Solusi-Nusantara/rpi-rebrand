'use client'

import { useState, useTransition } from 'react'
import { Download, Loader2, AlertTriangle } from 'lucide-react'
import { requestTenantExport } from '@/lib/tenants/data-export-actions'

type Props = {
  tenantSlug: string
}

/**
 * "Unduh data tenant (JSON)" button. Calls the OWNER-only server action,
 * then navigates to the download URL. Shows a "Mempersiapkan..." state
 * while the action is in flight, and a privacy warning.
 */
export function TenantExportButton({ tenantSlug }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await requestTenantExport({ tenantSlug })
      if (!r.ok) {
        setError(r.error)
        return
      }
      // Trigger download by navigating to the route.
      if (r.data?.downloadHref) {
        window.location.href = r.data.downloadHref
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 rounded-md border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Berkas dapat berukuran besar dan berisi data pribadi (email anggota,
          PII kandidat, riwayat lamaran). Simpan di tempat aman dan hapus jika
          tidak lagi diperlukan.
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="border-input bg-background text-foreground hover:bg-muted inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Mempersiapkan...
          </>
        ) : (
          <>
            <Download className="size-4" aria-hidden="true" />
            Unduh data tenant (JSON)
          </>
        )}
      </button>

      {error ? <p className="text-xs text-red-600 dark:text-red-300">{error}</p> : null}
    </div>
  )
}

export default TenantExportButton
