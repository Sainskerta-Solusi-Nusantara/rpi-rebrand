'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { acceptTenantInvite } from '@/lib/tenants/actions'

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await acceptTenantInvite(token)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.push(`/dashboard/tenants/${r.data?.tenantSlug ?? ''}` as never)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Memproses…' : 'Terima undangan'}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
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
