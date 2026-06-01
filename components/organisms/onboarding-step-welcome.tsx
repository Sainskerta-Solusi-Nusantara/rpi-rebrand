'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface OnboardingStepWelcomeProps {
  userName?: string | null
}

/**
 * First wizard screen. Hero message + "Mari mulai" CTA that advances the
 * server-side step counter to 1 and navigates the user forward.
 */
export function OnboardingStepWelcome({ userName }: OnboardingStepWelcomeProps) {
  const router = useRouter()
  const { t } = useI18n()
  const tw = t.auth.onboarding.welcome
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleStart() {
    setError(null)
    startTransition(async () => {
      const result = await advanceOnboardingStep({ step: 1 })
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/welcome/1' as any)
      router.refresh()
    })
  }

  const title = userName
    ? tw.titleWithName.replace('{name}', userName)
    : tw.titleNoName

  return (
    <div className="space-y-6 text-center">
      <div className="bg-primary/10 text-primary mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full">
        <Sparkles className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <h1 className="font-heading text-3xl md:text-4xl">{title}</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-base">
          {tw.body}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive mx-auto max-w-md rounded-md border px-3 py-2 text-sm"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? tw.starting : tw.startCta}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="text-muted-foreground text-xs">{tw.timeNote}</p>
      </div>
    </div>
  )
}
