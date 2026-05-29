'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { requestEmailChange } from '@/lib/auth/email-change-actions'

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

export function EmailChangeForm({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [field, setField] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setField(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await requestEmailChange(fd)
      if (!r.ok) {
        setError(r.error)
        setField(r.field ?? null)
        return
      }
      setSuccess(true)
      router.refresh()
    })
  }

  if (!hasPassword) {
    return (
      <p className="text-muted-foreground text-sm">
        Atur password terlebih dulu sebelum mengganti email.
      </p>
    )
  }

  if (success) {
    return (
      <div className="space-y-3">
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Tautan konfirmasi telah dikirim ke email baru, dan email saat ini
          menerima pemberitahuan keamanan. Email akan berubah setelah Anda
          mengonfirmasi dari tautan tersebut.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false)
            setOpen(false)
          }}
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          Tutup
        </button>
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
        <Mail className="h-4 w-4" aria-hidden="true" />
        Ganti email
      </button>
    )
  }

  return (
    <form onSubmit={onSubmit} className="border-border space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="space-y-1">
        <label htmlFor="new-email" className="block text-sm font-medium text-foreground">
          Email baru
        </label>
        <input
          id="new-email"
          name="newEmail"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
          disabled={pending}
          aria-invalid={field === 'newEmail'}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="ec-password" className="block text-sm font-medium text-foreground">
          Password saat ini
        </label>
        <input
          id="ec-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          aria-invalid={field === 'password'}
          className={inputClass}
        />
        <p className="text-muted-foreground text-xs">
          Email saat ini akan menerima pemberitahuan keamanan, dan email baru
          akan menerima tautan konfirmasi (berlaku 1 jam).
        </p>
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
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'Mengirim…' : 'Kirim tautan konfirmasi'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
            setField(null)
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
