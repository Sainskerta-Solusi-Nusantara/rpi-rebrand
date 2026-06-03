'use client'

/**
 * Stripe Checkout CTA. Posts to the `startStripeCheckout` server action;
 * on success redirects the browser to the Stripe-hosted Checkout URL.
 *
 * Uses `window.location.assign` (not router.push) because the destination
 * is on `checkout.stripe.com`, not within the Next.js route tree.
 */
import { useState, useTransition } from 'react'
import type { PlanTier } from '@prisma/client'
import { startStripeCheckout } from '@/lib/billing/stripe-actions'

export function StripeCheckoutButton({
  tenantSlug,
  plan,
  label,
  disabled,
  variant = 'primary',
}: {
  tenantSlug: string
  plan: PlanTier
  label?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.append('tenantSlug', tenantSlug)
      fd.append('plan', plan)
      const result = await startStripeCheckout(fd)
      if (!result.ok) {
        setError(result.error)
        return
      }
      if (result.data?.url) {
        window.location.assign(result.data.url)
      } else {
        setError('Tidak dapat membuka halaman pembayaran.')
      }
    })
  }

  const baseClass =
    variant === 'primary'
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'border-border hover:bg-muted border'

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending}
        className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${baseClass}`}
      >
        {pending ? 'Mengarahkan ke Stripe…' : (label ?? `Pilih plan ${plan}`)}
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
