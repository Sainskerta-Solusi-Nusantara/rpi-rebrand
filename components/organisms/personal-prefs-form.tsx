'use client'

import { inputClassNoPlaceholder as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePersonalPrefs } from '@/lib/auth/personal-prefs-actions'


const TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB · UTC+7)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA · UTC+8)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT · UTC+9)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+8)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala Lumpur (UTC+8)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (UTC+7)' },
  { value: 'Asia/Manila', label: 'Asia/Manila (UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (UTC+9)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (UTC+8)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (UTC+8)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (UTC+10/+11)' },
  { value: 'Europe/London', label: 'Europe/London (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1/+2)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (UTC+1/+2)' },
  { value: 'America/New_York', label: 'America/New York (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (UTC-8/-7)' },
  { value: 'UTC', label: 'UTC' },
]

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

export function PersonalPrefsForm({
  initial,
}: {
  initial: { locale: string; timezone: string }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [locale, setLocale] = useState(initial.locale)
  const [timezone, setTimezone] = useState(initial.timezone)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await updatePersonalPrefs(fd)
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({ kind: 'success' })
      router.refresh()
    })
  }

  // Live preview of the chosen format.
  let preview = ''
  try {
    preview = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(new Date())
  } catch {
    preview = '(format tidak valid)'
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="pref-locale" className="block text-sm font-medium text-foreground">
            Bahasa
          </label>
          <select
            id="pref-locale"
            name="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            disabled={pending}
            className={inputClass}
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="pref-tz" className="block text-sm font-medium text-foreground">
            Zona waktu
          </label>
          <select
            id="pref-tz"
            name="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            disabled={pending}
            className={inputClass}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-border bg-muted/40 rounded-md border px-3 py-2 text-sm">
        <span className="text-muted-foreground text-xs uppercase">Pratinjau · </span>
        <span className="font-medium">{preview}</span>
      </div>

      {banner.kind === 'success' && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          Preferensi disimpan.
        </p>
      )}
      {banner.kind === 'error' && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {banner.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Menyimpan…' : 'Simpan preferensi'}
      </button>
    </form>
  )
}
