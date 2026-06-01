'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { ChevronDown, Cookie } from 'lucide-react'
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

type Props = {
  initialPrefs?: StoredConsent | null
}

/**
 * Sticky bottom banner. Mounts only when the server-side wrapper decides
 * `needsBanner=true`. Self-dismisses after a save without waiting on
 * `router.refresh()` so the UX feels instant on slow networks.
 *
 * Buttons fall back to plain `<form>` posts to the server actions when JS
 * is disabled (the `<form action={...}>` is a Next 14 RSC convention).
 */
export function CookieConsentBanner({ initialPrefs }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const tcc = t.public.cookieConsent
  const [pending, startTransition] = useTransition()
  const [dismissed, setDismissed] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [prefs, setPrefs] = useState<ConsentPrefs>({
    necessary: true,
    analytics: initialPrefs?.analytics ?? false,
    marketing: initialPrefs?.marketing ?? false,
    functional: initialPrefs?.functional ?? false,
  })

  if (dismissed) return null

  function runAndDismiss(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn()
      setDismissed(true)
      router.refresh()
    })
  }

  function onAcceptAll() {
    runAndDismiss(() => acceptAllCookies())
  }
  function onRejectAll() {
    runAndDismiss(() => rejectAllNonEssentialCookies())
  }
  function onSaveCustom() {
    runAndDismiss(() =>
      saveCustomConsent({
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        functional: prefs.functional,
      }),
    )
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={tcc.dialogLabel}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background shadow-2xl"
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Cookie className="h-5 w-5 text-foreground" aria-hidden="true" />
            </div>
            <div className="text-sm text-foreground">
              <p className="font-medium">{tcc.heading}</p>
              <p className="mt-1 text-muted-foreground">
                {tcc.body}{' '}
                <Link
                  href={'/privacy-policy' as Route}
                  className="underline underline-offset-2"
                >
                  {tcc.privacyPolicyLink}
                </Link>{' '}
                {tcc.orVia}{' '}
                <Link
                  href={'/privacy-center' as Route}
                  className="underline underline-offset-2"
                >
                  {tcc.privacyCenterLink}
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
            <button
              type="button"
              onClick={onRejectAll}
              disabled={pending}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tcc.rejectAll}
            </button>
            <button
              type="button"
              onClick={() => setShowCustom((v) => !v)}
              aria-expanded={showCustom}
              aria-controls="cookie-consent-custom"
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tcc.managePreferences}
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 transition-transform ${showCustom ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              disabled={pending}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {tcc.acceptAll}
            </button>
          </div>
        </div>

        {showCustom ? (
          <div
            id="cookie-consent-custom"
            className="mt-4 border-t border-border pt-4"
          >
            <ul className="space-y-3">
              {COOKIE_CATEGORIES.map((cat) => {
                const checked = cat.locked ? true : prefs[cat.key]
                return (
                  <li
                    key={cat.key}
                    className="flex items-start justify-between gap-4 rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{cat.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cat.description}
                      </p>
                      {cat.examples.length ? (
                        <p className="mt-1 text-[11px] text-muted-foreground/80">
                          {tcc.example} {cat.examples.join(', ')}
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
                        aria-label={`${tcc.enableCategory} ${cat.label}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {cat.locked ? tcc.required : checked ? tcc.active : tcc.inactive}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onSaveCustom}
                disabled={pending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? tcc.saving : tcc.savePreferences}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
