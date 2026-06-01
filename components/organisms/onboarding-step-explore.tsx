'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Briefcase, GraduationCap, LayoutDashboard, PartyPopper } from 'lucide-react'
import { completeOnboarding } from '@/lib/onboarding/wizard-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export interface OnboardingStepExploreProps {
  userName?: string | null
}

export function OnboardingStepExplore({ userName }: OnboardingStepExploreProps) {
  const router = useRouter()
  const { t } = useI18n()
  const te = t.auth.onboarding.explore
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState<string | null>(null)

  function handleFinish(destination: string) {
    setError(null)
    startTransition(async () => {
      const result = await completeOnboarding()
      if (!result.ok) {
        setError(result.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(destination as any)
      router.refresh()
    })
  }

  const title = userName
    ? te.titleWithName.replace('{name}', userName)
    : te.title

  return (
    <div className="space-y-6 text-center">
      <div className="bg-primary/10 text-primary mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full">
        <PartyPopper className="h-8 w-8" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-2xl md:text-3xl">{title}</h2>
        <p className="text-muted-foreground mx-auto max-w-xl text-base">
          {te.body}
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

      <div className="grid gap-3 text-left sm:grid-cols-3">
        <button
          type="button"
          onClick={() => handleFinish('/jobs')}
          disabled={isPending}
          className="border-border bg-card hover:bg-muted block rounded-2xl border p-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="bg-primary/10 text-primary mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full">
            <Briefcase className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="font-heading text-base">{te.jobsTitle}</div>
          <p className="text-muted-foreground text-sm">
            {te.jobsBody}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleFinish('/courses')}
          disabled={isPending}
          className="border-border bg-card hover:bg-muted block rounded-2xl border p-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="bg-primary/10 text-primary mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="font-heading text-base">{te.coursesTitle}</div>
          <p className="text-muted-foreground text-sm">
            {te.coursesBody}
          </p>
        </button>

        <button
          type="button"
          onClick={() => handleFinish('/dashboard')}
          disabled={isPending}
          className="border-border bg-card hover:bg-muted block rounded-2xl border p-5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="bg-primary/10 text-primary mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="font-heading text-base">{te.dashboardTitle}</div>
          <p className="text-muted-foreground text-sm">
            {te.dashboardBody}
          </p>
        </button>
      </div>

      <div className="pt-2">
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={'/dashboard' as any}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          {te.fallbackLink}
        </Link>
      </div>
    </div>
  )
}
