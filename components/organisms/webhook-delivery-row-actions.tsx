'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Skull } from 'lucide-react'
import {
  deadLetterDeliveryAction,
  retryDeliveryAction,
} from '@/lib/webhooks/delivery-actions'

/**
 * Client island: per-row admin controls inside the delivery table.
 * "Coba kirim ulang" re-queues the row for an immediate retry.
 * "Tandai sebagai surat mati" forces the row into dead-letter.
 */
export function DeliveryRowActions({
  deliveryId,
  status,
}: {
  deliveryId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const canRetry = status === 'pending' || status === 'failed' || status === 'dead_letter'
  const canKill = status !== 'dead_letter' && status !== 'success'

  function onRetry() {
    setError(null)
    startTransition(async () => {
      const r = await retryDeliveryAction(deliveryId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  function onKill() {
    if (
      !window.confirm(
        'Tandai pengiriman ini sebagai surat mati? Setelah ditandai, retry otomatis tidak akan berjalan.',
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const r = await deadLetterDeliveryAction(deliveryId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex flex-wrap gap-2">
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={pending}
            className="text-foreground inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Coba kirim ulang
          </button>
        )}
        {canKill && (
          <button
            type="button"
            onClick={onKill}
            disabled={pending}
            className="text-destructive inline-flex items-center gap-1 text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Skull className="h-3 w-3" aria-hidden="true" />
            Tandai surat mati
          </button>
        )}
      </div>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
