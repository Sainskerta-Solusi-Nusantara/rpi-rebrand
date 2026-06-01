'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  COOKIE_CATEGORIES,
  type ConsentPrefs,
  type StoredConsent,
} from '@/lib/consent/cookie-categories'
import {
  acceptAllCookies,
  rejectAllNonEssentialCookies,
  saveCustomConsent,
} from '@/lib/consent/consent-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type Banner = { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }

export function PrivacyCenterPrefsForm({
  initial,
}: {
  initial: StoredConsent | null
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tp = t.public.privacyCenter
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<Banner>({ kind: 'idle' })
  const [prefs, setPrefs] = useState<ConsentPrefs>({
    necessary: true,
    analytics: initial?.analytics ?? false,
    marketing: initial?.marketing ?? false,
    functional: initial?.functional ?? false,
  })

  function flash(kind: 'success' | 'error', message?: string) {
    setBanner(kind === 'success' ? { kind: 'success' } : { kind: 'error', message: message ?? '' })
    if (kind === 'success') {
      window.setTimeout(() => setBanner({ kind: 'idle' }), 2500)
    }
  }

  function run(fn: () => Promise<unknown>) {
    setBanner({ kind: 'idle' })
    startTransition(async () => {
      try {
        await fn()
        flash('success')
        router.refresh()
      } catch (err) {
        flash('error', err instanceof Error ? err.message : tp.saveError)
      }
    })
  }

  function onSave() {
    run(() =>
      saveCustomConsent({
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        functional: prefs.functional,
      }),
    )
  }
  function onAcceptAll() {
    setPrefs({ necessary: true, analytics: true, marketing: true, functional: true })
    run(() => acceptAllCookies())
  }
  function onRejectAll() {
    setPrefs({ necessary: true, analytics: false, marketing: false, functional: false })
    run(() => rejectAllNonEssentialCookies())
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {COOKIE_CATEGORIES.map((cat) => {
          const checked = cat.locked ? true : prefs[cat.key]
          return (
            <li
              key={cat.key}
              className="flex items-start justify-between gap-4 rounded-md border border-border p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{cat.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{cat.description}</p>
                {cat.examples.length ? (
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    {tp.example} {cat.examples.join(', ')}
                  </p>
                ) : null}
              </div>
              <label className="mt-1 inline-flex shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={cat.locked || pending}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [cat.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`${tp.enableCategory} ${cat.label}`}
                />
                <span className="text-xs text-muted-foreground">
                  {cat.locked ? tp.required : checked ? tp.active : tp.inactive}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {banner.kind === 'success' ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {tp.saved}
        </p>
      ) : null}
      {banner.kind === 'error' ? (
        <p className="text-xs text-destructive">
          {banner.message || tp.saveFailed}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRejectAll}
            disabled={pending}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tp.rejectAll}
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            disabled={pending}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tp.acceptAll}
          </button>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? tp.saving : tp.savePreferences}
        </button>
      </div>
    </div>
  )
}
