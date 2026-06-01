'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Mail } from 'lucide-react'
import { requestEmailVerification } from '@/lib/auth/actions'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface OnboardingStepVerifyEmailProps {
  email: string
  alreadyVerified: boolean
  nextStep: number
  nextRoute: string
}

export function OnboardingStepVerifyEmail({
  email,
  alreadyVerified,
  nextStep,
  nextRoute,
}: OnboardingStepVerifyEmailProps) {
  const router = useRouter()
  const { t } = useI18n()
  const tv = t.auth.onboarding.verifyEmail
  const [isPending, startTransition] = React.useTransition()
  const [message, setMessage] = React.useState<string | null>(
    alreadyVerified ? tv.alreadyVerified : null,
  )
  const [error, setError] = React.useState<string | null>(null)

  function handleResend() {
    setError(null)
    setMessage(null)
    startTransition(async () => {
      const result = await requestEmailVerification()
      if (!result.ok) {
        setError(result.error)
        return
      }
      setMessage(tv.sentNotice)
    })
  }

  function handleContinue() {
    setError(null)
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
      <div className="bg-primary/10 text-primary mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full">
        <Mail className="h-7 w-7" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-foreground text-base">
          {tv.bodyPrefix}{' '}
          <span className="font-semibold">{email}</span>{tv.bodySuffix}
        </p>
        <p className="text-muted-foreground text-sm">
          {tv.helper}
        </p>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {message}
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

      <div className="flex flex-col-reverse items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {!alreadyVerified && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isPending}
            className="border-border text-foreground hover:bg-muted inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? tv.resending : tv.resendCta}
          </button>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {alreadyVerified ? tv.continueVerifiedCta : tv.continueCta}
        </button>
      </div>
    </div>
  )
}
