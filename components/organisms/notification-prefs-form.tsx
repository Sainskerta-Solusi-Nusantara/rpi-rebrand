'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateNotificationPrefs } from '@/lib/auth/notification-actions'
import type { NotificationPrefs } from '@/lib/auth/notification-prefs'

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

const items: {
  key: keyof NotificationPrefs
  label: string
  description: string
}[] = [
  {
    key: 'emailLoginAlert',
    label: 'Login dari perangkat baru',
    description:
      'Email pemberitahuan saat akun Anda dipakai login dari perangkat atau lokasi yang belum pernah terdeteksi.',
  },
  {
    key: 'emailSecurityEvent',
    label: 'Peristiwa keamanan',
    description:
      'Notifikasi untuk perubahan password, 2FA, pembaruan email, dan tindakan keamanan lainnya.',
  },
  {
    key: 'emailInvitation',
    label: 'Undangan tenant',
    description:
      'Email saat Anda diundang bergabung ke tenant atau organisasi lain di SSN.',
  },
  {
    key: 'emailMarketing',
    label: 'Pengumuman & promosi',
    description:
      'Berita produk, pengumuman fitur, dan promosi sesekali. Tidak terkait keamanan.',
  },
]

export function NotificationPrefsForm({ initial }: { initial: NotificationPrefs }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [state, setState] = useState<NotificationPrefs>(initial)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBanner({ kind: 'idle' })
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await updateNotificationPrefs(fd)
      if (!r.ok) {
        setBanner({ kind: 'error', message: r.error })
        return
      }
      setBanner({ kind: 'success' })
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ul className="divide-border space-y-0 divide-y">
        {items.map((it) => {
          const checked = state[it.key]
          return (
            <li key={it.key} className="flex items-start gap-3 py-4">
              <input
                id={`pref-${it.key}`}
                name={it.key}
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  setState((s) => ({ ...s, [it.key]: e.target.checked }))
                }
                disabled={pending}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <label htmlFor={`pref-${it.key}`} className="flex-1 cursor-pointer">
                <div className="text-sm font-medium text-foreground">{it.label}</div>
                <div className="text-muted-foreground mt-0.5 text-xs">
                  {it.description}
                </div>
              </label>
            </li>
          )
        })}
      </ul>

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
