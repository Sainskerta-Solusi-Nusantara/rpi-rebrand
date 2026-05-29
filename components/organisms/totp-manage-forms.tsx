'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import {
  disableTotp,
  regenerateRecoveryCodes,
} from '@/lib/auth/totp-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

const btnDestructive =
  'border-destructive/40 text-destructive hover:bg-destructive/5 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'

export function DisableTotpForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await disableTotp(fd)
      if (!r.ok) {
        setError(r.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btnDestructive}>
        Nonaktifkan 2FA
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-medium text-foreground">Konfirmasi nonaktifkan 2FA</p>
      <div className="space-y-1">
        <label htmlFor="disable-pw" className="block text-sm font-medium text-foreground">
          Password saat ini
        </label>
        <input
          id="disable-pw"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="disable-code" className="block text-sm font-medium text-foreground">
          Kode 2FA atau recovery code
        </label>
        <input
          id="disable-code"
          name="code"
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          placeholder="123456 atau XXXX-XXXX-XXXX"
          required
          disabled={pending}
          className={`${inputClass} font-mono`}
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
          {pending ? 'Menonaktifkan…' : 'Nonaktifkan 2FA'}
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

export function RegenerateRecoveryCodesForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [newCodes, setNewCodes] = useState<string[] | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await regenerateRecoveryCodes({ code })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setNewCodes(r.data?.recoveryCodes ?? [])
      router.refresh()
    })
  }

  if (newCodes) {
    return (
      <div className="space-y-4 rounded-md border border-success/30 bg-success/10 p-4">
        <div className="flex items-center gap-2 text-success">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm font-medium">Recovery codes baru</span>
        </div>
        <p className="text-muted-foreground text-xs">
          Kode lama sudah tidak berlaku. Simpan kode berikut di tempat aman —
          ini satu-satunya kesempatan menampilkannya.
        </p>
        <ul className="bg-background grid grid-cols-1 gap-1 rounded-md p-3 sm:grid-cols-2">
          {newCodes.map((c) => (
            <li key={c} className="font-mono text-sm">
              {c}
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(newCodes.join('\n')).catch(() => {})
            }}
            className="text-primary text-xs hover:underline"
          >
            Salin semua ke clipboard
          </button>
          <button
            type="button"
            onClick={() => {
              setNewCodes(null)
              setOpen(false)
              setCode('')
            }}
            className="text-muted-foreground hover:text-foreground ml-auto text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium text-foreground transition"
      >
        Generate ulang recovery codes
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border-border rounded-md border bg-muted/30 p-4">
      <p className="text-muted-foreground text-sm">
        Masukkan kode authenticator saat ini untuk membuat 10 recovery codes
        baru. Kode lama akan langsung dibatalkan.
      </p>
      <div className="space-y-1">
        <label htmlFor="regen-code" className="block text-sm font-medium text-foreground">
          Kode 6 digit
        </label>
        <input
          id="regen-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={pending}
          className={`${inputClass} font-mono text-center tracking-[0.4em]`}
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
        <button type="submit" disabled={pending || code.length !== 6} className={btnPrimary}>
          {pending ? 'Memproses…' : 'Generate ulang'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
            setCode('')
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
