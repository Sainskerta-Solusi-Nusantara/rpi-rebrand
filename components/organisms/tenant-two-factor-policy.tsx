'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, BellRing } from 'lucide-react'
import {
  setTenantTwoFactorRequirement,
  bulkNudgeTwoFactor,
} from '@/lib/tenants/tenant-2fa-actions'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnSecondary =
  'border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition disabled:cursor-not-allowed disabled:opacity-60'

export function TenantTwoFactorPolicy({
  tenantSlug,
  initialRequired,
  pendingCount,
}: {
  tenantSlug: string
  initialRequired: boolean
  pendingCount: number
}) {
  const router = useRouter()
  const [required, setRequired] = useState(initialRequired)
  const [pending, startTransition] = useTransition()
  const [nudging, startNudge] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  function onToggle(next: boolean) {
    if (!window.confirm(
      next
        ? 'Wajibkan 2FA untuk semua anggota tenant ini? Anggota yang belum mengaktifkan 2FA tidak dapat mengakses dasbor sampai mereka mendaftar.'
        : 'Nonaktifkan kewajiban 2FA untuk tenant ini?',
    )) {
      return
    }
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const r = await setTenantTwoFactorRequirement(tenantSlug, next)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setRequired(next)
      setInfo(
        next
          ? 'Kebijakan diaktifkan. Anggota yang belum 2FA akan diarahkan ke halaman pengaktifan.'
          : 'Kebijakan dinonaktifkan.',
      )
      router.refresh()
    })
  }

  function onBulkNudge() {
    if (pendingCount === 0) return
    if (!window.confirm(`Kirim pengingat ke ${pendingCount} anggota yang belum mengaktifkan 2FA?`)) return
    setError(null)
    setInfo(null)
    startNudge(async () => {
      const r = await bulkNudgeTwoFactor(tenantSlug)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setInfo(`${r.data?.nudged ?? 0} pengingat terkirim.`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-md bg-[hsl(220,50%,14%)] text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={required}
              disabled={pending}
              onChange={(e) => onToggle(e.target.checked)}
              className="size-4 rounded border-border accent-[hsl(220,50%,14%)]"
            />
            <span className="text-sm font-medium text-foreground">
              Wajibkan 2FA untuk semua anggota
            </span>
          </label>
          <p className="text-muted-foreground mt-1 text-xs">
            Setelah diaktifkan, anggota yang belum mengaktifkan 2FA tidak dapat
            mengakses dasbor sampai mereka mendaftar.
          </p>
        </div>
      </div>

      {required && pendingCount > 0 && (
        <div className="border-amber-300/40 bg-amber-50 dark:bg-amber-950/30 rounded-md border p-3 text-sm">
          <p className="font-medium text-amber-900 dark:text-amber-200">
            {pendingCount} anggota belum mengaktifkan 2FA.
          </p>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
            Mereka akan diarahkan ke halaman pengaktifan saat mencoba masuk
            dasbor. Anda dapat mengirim pengingat sekaligus.
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={onBulkNudge}
              disabled={nudging}
              className={btnPrimary}
            >
              <BellRing className="h-4 w-4" aria-hidden="true" />
              {nudging ? 'Mengirim…' : `Ingatkan semua (${pendingCount})`}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="text-success text-xs">
          {info}
        </p>
      )}
    </div>
  )
}

export function NudgeMemberButton({
  tenantSlug,
  userId,
  disabled,
  alreadyEnrolled,
}: {
  tenantSlug: string
  userId: string
  disabled?: boolean
  alreadyEnrolled?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (alreadyEnrolled) return null

  function onClick() {
    setError(null)
    startTransition(async () => {
      const { nudgeUserToEnrollTwoFactor } = await import('@/lib/tenants/tenant-2fa-actions')
      const r = await nudgeUserToEnrollTwoFactor(tenantSlug, userId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setDone(true)
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || pending || done}
        className={btnSecondary}
      >
        <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
        {pending ? 'Mengirim…' : done ? 'Terkirim' : 'Ingatkan anggota'}
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  )
}
