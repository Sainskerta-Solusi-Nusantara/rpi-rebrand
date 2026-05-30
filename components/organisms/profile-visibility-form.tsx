'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Copy, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { setUsername, setProfileVisibility } from '@/lib/profile/public-actions'

type Initial = {
  userId: string
  username: string | null
  profilePublic: boolean
}

const usernameClientRe = /^[a-z][a-z0-9_-]{2,19}$/

export function ProfileVisibilityForm({ initial }: { initial: Initial }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [username, setUsernameState] = useState(initial.username ?? '')
  const [savedUsername, setSavedUsername] = useState(initial.username)
  const [profilePublic, setProfilePublicState] = useState(initial.profilePublic)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handle = savedUsername || initial.userId
  const profilePath = `/profil/${handle}`
  const absoluteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${profilePath}`
      : profilePath

  function onSaveUsername(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const next = username.trim().toLowerCase()
    if (!usernameClientRe.test(next)) {
      setError(
        'Username 3-20 karakter, hanya huruf kecil/angka/-/_ dan diawali huruf.',
      )
      return
    }
    startTransition(async () => {
      const res = await setUsername({ username: next })
      if (res.ok) {
        setSavedUsername(next)
        setUsernameState(next)
        setSuccess('Username tersimpan')
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  function onToggleVisibility() {
    setError(null)
    setSuccess(null)
    const next = !profilePublic
    // Optimistic update
    setProfilePublicState(next)
    startTransition(async () => {
      const res = await setProfileVisibility({ profilePublic: next })
      if (res.ok) {
        setSuccess(next ? 'Profil sekarang publik' : 'Profil disetel privat')
        router.refresh()
      } else {
        // Revert on failure
        setProfilePublicState(!next)
        setError(res.error)
      }
    })
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(absoluteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

  return (
    <div className="space-y-6">
      {success && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {success}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </div>
      )}

      {/* Username */}
      <form onSubmit={onSaveUsername} className="space-y-2" noValidate>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground"
        >
          Username
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-1">
            <span className="text-muted-foreground select-none text-sm">
              /profil/
            </span>
            <input
              id="username"
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="nama-anda"
              value={username}
              onChange={(e) =>
                setUsernameState(e.target.value.toLowerCase())
              }
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isPending || username.trim() === (savedUsername ?? '')}
            className="inline-flex items-center justify-center rounded-md bg-[hsl(220,50%,14%)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          3-20 karakter. Huruf kecil, angka, tanda hubung, dan garis bawah.
          Diawali huruf.
        </p>
      </form>

      {/* Visibility toggle */}
      <div className="border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Visibilitas profil
          </p>
          <p className="text-muted-foreground text-xs">
            {profilePublic
              ? 'Profil Anda dapat diakses publik di /profil.'
              : 'Profil Anda saat ini tersembunyi.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={isPending}
          role="switch"
          aria-checked={profilePublic}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
            profilePublic
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {profilePublic ? (
            <>
              <Eye className="h-3.5 w-3.5" aria-hidden /> Publik
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" aria-hidden /> Privat
            </>
          )}
        </button>
      </div>

      {/* Share URL — visible when public */}
      {profilePublic && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Tautan profil</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              readOnly
              value={absoluteUrl}
              aria-label="Tautan profil publik"
              onFocus={(e) => e.currentTarget.select()}
              className={`${inputClass} font-mono text-xs`}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCopy}
                className="border-border bg-card text-foreground hover:bg-muted inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden /> Salin
                  </>
                )}
              </button>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={profilePath as any}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[hsl(220,50%,14%)] px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)]"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Lihat profil publik
              </Link>
            </div>
          </div>
          {!savedUsername && (
            <p className="text-muted-foreground text-xs">
              Belum menyetel username — tautan menggunakan ID. Setel username di
              atas untuk URL yang lebih bersih.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
