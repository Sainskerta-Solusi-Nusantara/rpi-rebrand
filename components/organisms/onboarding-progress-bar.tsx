import * as React from 'react'
import { Check } from 'lucide-react'
import { getServerT } from '@/lib/i18n/server-dictionary'

export interface OnboardingProgressBarProps {
  currentStep: number
  totalSteps: number
  labels?: ReadonlyArray<string>
}

/**
 * Horizontal progress bar for the onboarding wizard. Renders a numbered circle
 * for each step with a checkmark for completed ones and a filled connector
 * between them. Server component — no client interactivity.
 */
export async function OnboardingProgressBar({
  currentStep,
  totalSteps,
  labels,
}: OnboardingProgressBarProps) {
  const safeTotal = Math.max(1, totalSteps)
  const safeCurrent = Math.max(0, Math.min(currentStep, safeTotal - 1))
  const percent = Math.round(((safeCurrent + 1) / safeTotal) * 100)

  const t = await getServerT()
  const tp = t.auth.onboarding.progress

  const groupLabel = tp.groupLabel
    .replace('{current}', String(safeCurrent + 1))
    .replace('{total}', String(safeTotal))

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="w-full"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {Array.from({ length: safeTotal }).map((_, i) => {
          const done = i < safeCurrent
          const active = i === safeCurrent
          const label = labels?.[i]
          const baseLabel = label
            ? tp.stepLabelWithName
                .replace('{n}', String(i + 1))
                .replace('{label}', label)
            : tp.stepLabel.replace('{n}', String(i + 1))
          const ariaLabel = `${baseLabel}${done ? tp.completed : ''}`
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1">
                <span
                  aria-current={active ? 'step' : undefined}
                  aria-label={ariaLabel}
                  className={
                    done
                      ? 'bg-primary text-primary-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8'
                      : active
                      ? 'bg-primary text-primary-foreground ring-primary/20 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-4 sm:h-8 sm:w-8'
                      : 'bg-muted text-muted-foreground border-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold sm:h-8 sm:w-8'
                  }
                >
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                </span>
                {label && (
                  <span
                    className={
                      active
                        ? 'text-foreground hidden text-[11px] font-medium sm:block'
                        : 'text-muted-foreground hidden text-[11px] sm:block'
                    }
                  >
                    {label}
                  </span>
                )}
              </div>
              {i < safeTotal - 1 && (
                <div
                  aria-hidden="true"
                  className={
                    i < safeCurrent
                      ? 'bg-primary h-0.5 flex-1 rounded-full'
                      : 'bg-muted h-0.5 flex-1 rounded-full'
                  }
                />
              )}
            </React.Fragment>
          )
        })}
      </div>
      <div
        className="bg-muted mt-4 h-1.5 w-full overflow-hidden rounded-full sm:hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
