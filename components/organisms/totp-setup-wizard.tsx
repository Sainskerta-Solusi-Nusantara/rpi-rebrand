'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import {
  beginTotpSetup,
  confirmTotpSetup,
} from '@/lib/auth/totp-actions'

type Stage =
  | { kind: 'start' }
  | { kind: 'qr'; qrDataUrl: string; secret: string }
  | { kind: 'done'; codes: string[] }

export function TotpSetupWizard() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [stage, setStage] = useState<Stage>({ kind: 'start' })
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  function onBegin() {
    setError(null)
    startTransition(async () => {
      const r = await beginTotpSetup()
      if (!r.ok) {
        setError(r.error)
        return
      }
      if (!r.data) return
      setStage({ kind: 'qr', qrDataUrl: r.data.qrDataUrl, secret: r.data.secret })
    })
  }

  function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const r = await confirmTotpSetup({ code })
      if (!r.ok) {
        setError(r.error)
        return
      }
      setStage({ kind: 'done', codes: r.data?.recoveryCodes ?? [] })
      router.refresh()
    })
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60'
  const btnPrimary =
    'inline-flex items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] disabled:cursor-not-allowed disabled:opacity-60'

  if (stage.kind === 'start') {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Aktifkan two-factor authentication (2FA) untuk menambah lapisan
          keamanan saat masuk. Anda akan butuh aplikasi authenticator seperti
          Google Authenticator, 1Password, atau Authy.
        </p>
        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <button type="button" onClick={onBegin} disabled={pending} className={btnPrimary}>
          {pending ? 'Menyiapkan…' : 'Mulai setup 2FA'}
        </button>
      </div>
    )
  }

  if (stage.kind === 'qr') {
    return (
      <form onSubmit={onConfirm} className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium">1. Pindai QR di authenticator app</p>
          <p className="text-muted-foreground text-xs">
            Jika tidak bisa scan, masukkan secret berikut secara manual.
          </p>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="border-border rounded-md border bg-white p-2">
              <Image
                src={stage.qrDataUrl}
                alt="QR code 2FA"
                width={160}
                height={160}
                unoptimized
              />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs uppercase">Secret manual</p>
              <code className="bg-muted block break-all rounded px-2 py-1 font-mono text-xs">
                {stage.secret}
              </code>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="setup-code" className="block text-sm font-medium text-foreground">
            2. Masukkan kode 6 digit dari aplikasi
          </label>
          <input
            id="setup-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
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
            {pending ? 'Memverifikasi…' : 'Aktifkan 2FA'}
          </button>
          <Link
            href="/dashboard/keamanan"
            className="text-muted-foreground hover:text-foreground text-sm font-medium"
          >
            Batal
          </Link>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <span>2FA berhasil diaktifkan.</span>
      </div>

      <div className="space-y-2">
        <h3 className="font-heading text-base">Recovery codes</h3>
        <p className="text-muted-foreground text-sm">
          Simpan kode ini di tempat aman (password manager). Setiap kode hanya
          dapat dipakai sekali, dan ini satu-satunya kesempatan menampilkannya.
          Jika kehilangan akses ke authenticator, kode ini cara terakhir untuk
          masuk dan menonaktifkan 2FA.
        </p>
        <ul className="bg-muted grid grid-cols-1 gap-1 rounded-md p-3 sm:grid-cols-2">
          {stage.codes.map((c) => (
            <li key={c} className="font-mono text-sm">
              {c}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard
              ?.writeText(stage.codes.join('\n'))
              .catch(() => {})
          }}
          className="text-primary text-xs hover:underline"
        >
          Salin semua ke clipboard
        </button>
      </div>

      <Link
        href="/dashboard/keamanan"
        className="border-border bg-background hover:bg-muted inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium text-foreground transition"
      >
        Selesai
      </Link>
    </div>
  )
}
