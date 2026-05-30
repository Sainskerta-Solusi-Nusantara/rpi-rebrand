'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Lock } from 'lucide-react'
import type { PlanTier } from '@prisma/client'
import { updateTenantPlan } from '@/lib/tenants/billing-actions'

/**
 * MOCK feature lists used only for UI display. These are NOT enforced anywhere
 * yet — they exist so OWNER can preview what each tier "promises" in the
 * subscription picker. Replace with real entitlements when billing ships.
 */
const PLANS: {
  key: PlanTier
  name: string
  price: string
  description: string
  features: string[]
}[] = [
  {
    key: 'FREE',
    name: 'Free',
    price: 'Rp 0 / bulan',
    description: 'Untuk memulai dan menjajaki RPI.',
    features: [
      'Hingga 5 lowongan aktif',
      '1 admin tenant',
      'Branding terbatas',
      'Komunitas / email support',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 'Rp 499.000 / bulan',
    description: 'Untuk tim rekrutmen kecil yang aktif memasarkan lowongan.',
    features: [
      'Hingga 50 lowongan aktif',
      '5 admin tenant',
      'Custom domain',
      'Branding penuh (logo, warna, tipografi)',
    ],
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    price: 'Rp 2.499.000 / bulan',
    description: 'Untuk organisasi rekrutmen menengah dengan integrasi.',
    features: [
      'Hingga 500 lowongan aktif',
      'Admin tanpa batas',
      'Audit log lengkap',
      'Webhook & integrasi API',
    ],
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Hubungi tim sales',
    description: 'Untuk korporasi dengan kebutuhan khusus dan SLA.',
    features: [
      'Lowongan tanpa batas',
      'SSO (SAML / OIDC)',
      'SLA & dukungan prioritas',
      'Dedicated account manager',
    ],
  },
]

type Banner =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string }

const PLAN_LABEL: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  BUSINESS: 'Business',
  ENTERPRISE: 'Enterprise',
}

export function PlanSelectionForm({
  tenantSlug,
  currentPlan,
  canEdit,
}: {
  tenantSlug: string
  currentPlan: PlanTier
  canEdit: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [confirming, setConfirming] = useState<PlanTier | null>(null)

  function requestChange(plan: PlanTier) {
    setBanner({ kind: 'idle' })
    setConfirming(plan)
  }

  function dismissConfirm() {
    if (pending) return
    setConfirming(null)
  }

  function submitChange(plan: PlanTier) {
    startTransition(async () => {
      const r = await updateTenantPlan({ tenantSlug, plan })
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        setConfirming(null)
        return
      }
      setBanner({
        kind: 'success',
        message: `Plan berhasil diubah ke ${PLAN_LABEL[plan]}.`,
      })
      setConfirming(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {!canEdit && (
        <p
          role="note"
          className="border-border bg-muted/50 text-muted-foreground inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Hanya OWNER yang dapat mengubah plan. Anda hanya dapat melihat
          informasi langganan.
        </p>
      )}

      {banner.kind === 'success' && (
        <p
          role="status"
          className="border-success/30 bg-success/10 text-success rounded-md border px-3 py-2 text-sm"
        >
          {banner.message}
        </p>
      )}
      {banner.kind === 'error' && (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {banner.message}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrent = p.key === currentPlan
          const disabled = !canEdit || pending || isCurrent
          return (
            <article
              key={p.key}
              aria-current={isCurrent ? 'true' : undefined}
              className={`flex flex-col rounded-2xl border p-5 transition ${
                isCurrent
                  ? 'border-foreground bg-foreground/[0.03] shadow-sm'
                  : 'border-border bg-card'
              }`}
            >
              <header className="mb-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-heading text-lg">{p.name}</h3>
                  {isCurrent && (
                    <span className="bg-foreground rounded-full px-2 py-0.5 text-xs font-medium text-background">
                      Saat ini
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-1 text-sm font-medium">
                  {p.price}
                </p>
              </header>

              <p className="text-muted-foreground mb-4 text-sm">
                {p.description}
              </p>

              <ul className="mb-5 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="text-success mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => requestChange(p.key)}
                disabled={disabled}
                className="mt-auto inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCurrent ? 'Plan aktif' : `Pilih ${p.name}`}
              </button>
            </article>
          )
        })}
      </div>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-confirm-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={dismissConfirm}
        >
          <div
            className="border-border bg-background w-full max-w-md rounded-2xl border p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="plan-confirm-title"
              className="font-heading text-lg"
            >
              Konfirmasi perubahan plan
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Anda akan mengubah plan dari{' '}
              <span className="text-foreground font-medium">
                {PLAN_LABEL[currentPlan]}
              </span>{' '}
              ke{' '}
              <span className="text-foreground font-medium">
                {PLAN_LABEL[confirming]}
              </span>
              . Perubahan berlaku segera dan periode billing 30 hari yang baru
              akan dimulai sekarang. Langganan aktif sebelumnya akan ditandai
              sebagai dibatalkan.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={dismissConfirm}
                disabled={pending}
                className="border-border hover:bg-muted inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => submitChange(confirming)}
                disabled={pending}
                className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? 'Memproses…' : 'Ya, ubah plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
