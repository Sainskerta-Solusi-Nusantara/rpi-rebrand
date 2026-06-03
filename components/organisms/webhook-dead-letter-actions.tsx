'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { bulkRetryDeadLetterAction } from '@/lib/webhooks/delivery-actions'

/**
 * Bulk re-queue every dead-letter delivery currently visible in the inbox.
 * Used by the "Coba kirim ulang semua" button on the dead-letter page.
 */
export function BulkRetryButton({
  tenantSlug,
  deliveryIds,
}: {
  tenantSlug: string
  deliveryIds: string[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function onClick() {
    if (deliveryIds.length === 0) return
    if (
      !window.confirm(
        `Kirim ulang ${deliveryIds.length} pengiriman surat mati? Setiap pengiriman akan dimasukkan kembali ke antrian retry.`,
      )
    ) {
      return
    }
    setMsg(null)
    setErr(null)
    startTransition(async () => {
      const r = await bulkRetryDeadLetterAction({
        tenantSlug,
        deliveryIds,
      })
      if (!r.ok) {
        setErr(r.error)
        return
      }
      setMsg(`Dimasukkan kembali ke antrian: ${r.data?.retried ?? 0}`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || deliveryIds.length === 0}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {pending ? 'Memproses…' : `Coba kirim ulang semua (${deliveryIds.length})`}
      </button>
      {msg && <span className="text-success text-xs">{msg}</span>}
      {err && <span className="text-destructive text-xs">{err}</span>}
    </div>
  )
}
