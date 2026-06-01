'use client'

/**
 * Stripe Customer Portal CTA. Posts to `openBillingPortal`; on success
 * redirects the browser to the Stripe-hosted portal URL where the user can
 * update payment methods, cancel, view invoices, etc.
 */
import { useState, useTransition } from 'react'
import { openBillingPortal } from '@/lib/billing/stripe-actions'

export function StripePortalButton({
  tenantSlug,
  label = 'Kelola pembayaran',
  disabled,
}: {
  tenantSlug: string
  label?: string
  disabled?: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('tenantSlug', tenantSlug)
      const result = await openBillingPortal(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.data?.url) {
        window.location.assign(result.data.url)
      } else {
        setError('Tidak dapat membuka portal pelanggan.')
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className="border-border hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Membuka portal…' : label}
      </button>
      {error && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs"
        >
          {error}
        </p>
      )}
    </div>
  )
}
