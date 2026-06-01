'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { skipOnboarding } from '@/lib/onboarding/wizard-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

/**
 * "Skip onboarding" affordance shown in the wizard header. Calls the
 * `skipOnboarding` server action and redirects to /dashboard on success.
 */
export function OnboardingSkipButton() {
  const router = useRouter()
  const { t } = useI18n()
  const to = t.auth.onboarding
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleSkip() {
    setError(null)
    startTransition(async () => {
      const result = await skipOnboarding()
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push('/dashboard' as any)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSkip}
        disabled={isPending}
        className="text-muted-foreground hover:text-foreground text-sm font-medium underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? to.skipping : to.skip}
      </button>
      {error && (
        <span role="alert" className="text-destructive text-xs">
          {error}
        </span>
      )}
    </div>
  )
}
