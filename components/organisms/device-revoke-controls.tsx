'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { revokeDevice, signOutAllDevices } from '@/lib/auth/session-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnDestructive =
  'border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'

export function RevokeDeviceButton({
  deviceId,
  deviceLabel,
  alreadyRevoked,
}: {
  deviceId: string
  deviceLabel: string
  alreadyRevoked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    if (!window.confirm(`Cabut perangkat "${deviceLabel}"?`)) return
    setError(null)
    startTransition(async () => {
      const r = await revokeDevice(deviceId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  if (alreadyRevoked) {
    return (
      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
        Dicabut
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-destructive text-xs font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Mencabut…' : 'Cabut'}
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}

export function SignOutAllDevicesForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await signOutAllDevices(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      // Also sign out the current session client-side immediately.
      await signOut({ redirect: false })
      router.push('/login?signedOut=1')
      router.refresh()
    })
  }

  if (!hasPassword) {
    return (
      <p className="text-muted-foreground text-sm">
        Atur password terlebih dulu untuk menggunakan aksi ini.
      </p>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnDestructive}>
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Logout dari semua perangkat
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium text-foreground">
        Konfirmasi logout dari semua perangkat
      </p>
      <p className="text-muted-foreground text-xs">
        Semua sesi aktif akan dibatalkan dalam waktu kurang dari 5 menit. Anda
        akan diminta masuk lagi di setiap perangkat.
      </p>
      <div className="space-y-1">
        <label htmlFor="so-password" className="block text-sm font-medium text-foreground">
          Password saat ini
        </label>
        <input
          id="so-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className={inputClass}
        />
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className={btnDestructive}>
          {pending ? 'Memproses…' : 'Logout dari semua perangkat'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-sm font-medium disabled:opacity-60"
        >
          Batal
        </button>
      </div>
    </form>
  )
}
