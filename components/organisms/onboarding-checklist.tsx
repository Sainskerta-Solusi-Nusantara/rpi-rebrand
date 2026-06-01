'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Circle, PartyPopper, Wand2, X } from 'lucide-react'
import type { ChecklistStep } from '@/lib/onboarding/checklist'
import { skipOnboarding } from '@/lib/onboarding/wizard-actions'
import { MAX_WIZARD_STEP_INDEX } from '@/lib/onboarding/wizard-config'

const DISMISS_KEY = 'rpi_onboarding_dismissed'

export interface OnboardingChecklistProps {
  steps: ChecklistStep[]
  /** Current saved wizard step (0..N). Used to deep-link "Buka wizard". */
  wizardStep?: number
  /** Whether the user has marked the wizard as completed. */
  wizardCompleted?: boolean
}

export function OnboardingChecklist({
  steps,
  wizardStep,
  wizardCompleted,
}: OnboardingChecklistProps) {
  const router = useRouter()
  const [closing, setClosing] = React.useState(false)
  const [closeError, setCloseError] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    try {
      if (typeof window !== 'undefined' && window.localStorage.getItem(DISMISS_KEY) === '1') {
        setDismissed(true)
      }
    } catch {
      // ignore localStorage errors (private mode, etc.)
    }
  }, [])

  const total = steps.length
  const doneCount = steps.filter((s) => s.done).length
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const allDone = total > 0 && doneCount === total

  if (!mounted) return null
  if (dismissed) return null
  if (allDone) return null

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  function handleCloseWizard() {
    setCloseError(null)
    setClosing(true)
    void (async () => {
      try {
        const result = await skipOnboarding()
        if (!result.ok) {
          setCloseError(result.error)
          setClosing(false)
          return
        }
        router.refresh()
      } catch {
        setCloseError('Terjadi kesalahan. Coba lagi.')
        setClosing(false)
      }
    })()
  }

  const safeWizardStep =
    typeof wizardStep === 'number' && wizardStep >= 0
      ? Math.min(wizardStep, MAX_WIZARD_STEP_INDEX)
      : 0
  const wizardHref = `/welcome/${safeWizardStep}`

  return (
    <section
      aria-label="Daftar onboarding"
      className="border-border bg-card mb-6 rounded-2xl border p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg">Selesaikan pengaturan akun</h2>
            <span className="text-muted-foreground text-sm font-medium">
              {doneCount} dari {total} selesai
            </span>
          </div>
          <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${percent}%` }}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup daftar onboarding"
          className="text-muted-foreground hover:bg-muted hover:text-foreground -mt-1 -mr-1 rounded-full p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="divide-border divide-y">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3 py-3">
            <span
              aria-hidden="true"
              className={
                step.done
                  ? 'text-primary flex h-6 w-6 shrink-0 items-center justify-center'
                  : 'text-muted-foreground flex h-6 w-6 shrink-0 items-center justify-center'
              }
            >
              {step.done ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={
                  step.done
                    ? 'text-muted-foreground line-through font-medium'
                    : 'font-medium'
                }
              >
                {step.label}
              </div>
              <div className="text-muted-foreground text-sm">{step.description}</div>
            </div>
            {!step.done && (
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={step.href as any}
                aria-label={`Buka ${step.label}`}
                className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 rounded-full p-2 transition-colors"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      {percent > 0 && percent < 100 && (
        <div className="text-muted-foreground mt-4 flex items-center gap-2 text-xs">
          <PartyPopper className="h-3.5 w-3.5" />
          <span>Bagus! Lanjutkan untuk menyelesaikan semua langkah.</span>
        </div>
      )}

      <div className="border-border mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        {!wizardCompleted ? (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={wizardHref as any}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Buka wizard onboarding
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleCloseWizard}
            disabled={closing}
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {closing ? 'Memuat…' : 'Tutup wizard'}
          </button>
        )}
        {closeError && (
          <span role="alert" className="text-destructive text-xs">
            {closeError}
          </span>
        )}
      </div>
    </section>
  )
}
