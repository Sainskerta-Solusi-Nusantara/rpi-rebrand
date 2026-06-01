'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'
import {
  INTEREST_CHIPS,
  INTERESTS_STORAGE_KEY,
} from '@/lib/onboarding/wizard-config'

const MIN_PICK = 3
const MAX_PICK = 5

export interface OnboardingStepInterestsProps {
  nextStep: number
  nextRoute: string
}

/**
 * Step 4 (interests) — multi-select chips for 3-5 topics. There is no
 * `User.interestTags` column in the schema (per Feature 3 brief), so we
 * persist selections client-side via `localStorage` under
 * `INTERESTS_STORAGE_KEY`. The explore step + future personalization can read
 * the same key. We still advance the wizard step on the server.
 */
export function OnboardingStepInterests({
  nextStep,
  nextRoute,
}: OnboardingStepInterestsProps) {
  const router = useRouter()
  const [selected, setSelected] = React.useState<string[]>([])
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  // Hydrate from localStorage so revisiting the step preserves choices.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INTERESTS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setSelected(parsed.filter((s) => typeof s === 'string'))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  function toggle(slug: string) {
    setSelected((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug)
      if (prev.length >= MAX_PICK) return prev
      return [...prev, slug]
    })
  }

  function handleContinue() {
    setError(null)
    if (selected.length < MIN_PICK) {
      setError(`Pilih minimal ${MIN_PICK} minat.`)
      return
    }
    try {
      window.localStorage.setItem(
        INTERESTS_STORAGE_KEY,
        JSON.stringify(selected),
      )
    } catch {
      // ignore localStorage write errors (private mode, etc.)
    }
    startTransition(async () => {
      const result = await advanceOnboardingStep({ step: nextStep })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(nextRoute as any)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          Pilih {MIN_PICK}-{MAX_PICK} topik agar kami bisa menyarankan lowongan
          dan kursus yang relevan.
        </p>
        <p className="text-muted-foreground text-xs">
          Terpilih: {selected.length}/{MAX_PICK}
        </p>
      </div>

      <ul className="flex flex-wrap gap-2" role="list">
        {INTEREST_CHIPS.map((chip) => {
          const isSelected = selected.includes(chip.slug)
          const disabled = !isSelected && selected.length >= MAX_PICK
          return (
            <li key={chip.slug}>
              <button
                type="button"
                onClick={() => toggle(chip.slug)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition'
                    : disabled
                    ? 'border-border text-muted-foreground bg-muted inline-flex cursor-not-allowed items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm opacity-60'
                    : 'border-border text-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition'
                }
              >
                {isSelected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                {chip.label}
              </button>
            </li>
          )
        })}
      </ul>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isPending || selected.length < MIN_PICK}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Menyimpan…' : 'Simpan & Lanjut'}
        </button>
      </div>
    </div>
  )
}
