'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from '@/lib/auth/profile-actions'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export type OnboardingProfileInitial = {
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
}

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

export interface OnboardingStepProfileProps {
  initial: OnboardingProfileInitial
  nextStep: number
  nextRoute: string
}

/**
 * Step 2 (profile) — collects name + headline + location + bio. Uses the
 * existing `updateProfile` server action then advances the wizard step on
 * success.
 */
export function OnboardingStepProfile({
  initial,
  nextStep,
  nextRoute,
}: OnboardingStepProfileProps) {
  const router = useRouter()
  const { t } = useI18n()
  const tp = t.auth.onboarding.profile
  const [isPending, startTransition] = React.useTransition()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const schema = React.useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, tp.errors.nameMin)
          .max(120, tp.errors.nameMax),
        headline: z
          .string()
          .max(200, tp.errors.headlineMax)
          .optional()
          .or(z.literal('')),
        location: z
          .string()
          .max(120, tp.errors.locationMax)
          .optional()
          .or(z.literal('')),
        bio: z
          .string()
          .max(1000, tp.errors.bioMax)
          .optional()
          .or(z.literal('')),
      }),
    [
      tp.errors.nameMin,
      tp.errors.nameMax,
      tp.errors.headlineMax,
      tp.errors.locationMax,
      tp.errors.bioMax,
    ],
  )

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial.name ?? '',
      headline: initial.headline ?? '',
      location: initial.location ?? '',
      bio: initial.bio ?? '',
    },
  })

  const bioCount = (watch('bio') ?? '').length

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    const fd = new FormData()
    fd.set('name', values.name)
    fd.set('headline', values.headline ?? '')
    fd.set('location', values.location ?? '')
    fd.set('bio', values.bio ?? '')
    fd.set('phone', '')
    fd.set('image', '')

    startTransition(async () => {
      const result = await updateProfile(fd)
      if (!result.ok) {
        const knownFields = ['name', 'headline', 'location', 'bio'] as const
        type KnownField = (typeof knownFields)[number]
        if (
          result.field &&
          (knownFields as readonly string[]).includes(result.field)
        ) {
          setError(result.field as KnownField, {
            type: 'server',
            message: result.error,
          })
        } else {
          setSubmitError(result.error)
        }
        return
      }
      const advance = await advanceOnboardingStep({ step: nextStep })
      if (!advance.ok) {
        setSubmitError(advance.error)
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push(nextRoute as any)
      router.refresh()
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {submitError && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm"
        >
          {submitError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-foreground block text-sm font-medium">
          {tp.nameLabel} <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={tp.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-destructive text-xs">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="headline"
          className="text-foreground block text-sm font-medium"
        >
          {tp.headlineLabel}
        </label>
        <input
          id="headline"
          type="text"
          placeholder={tp.headlinePlaceholder}
          aria-invalid={Boolean(errors.headline)}
          className={inputClass}
          {...register('headline')}
        />
        {errors.headline && (
          <p className="text-destructive text-xs">{errors.headline.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="location"
          className="text-foreground block text-sm font-medium"
        >
          {tp.locationLabel}
        </label>
        <input
          id="location"
          type="text"
          placeholder={tp.locationPlaceholder}
          aria-invalid={Boolean(errors.location)}
          className={inputClass}
          {...register('location')}
        />
        {errors.location && (
          <p className="text-destructive text-xs">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="text-foreground block text-sm font-medium">
            {tp.bioLabel}
          </label>
          <span className="text-muted-foreground text-xs">{bioCount}/1000</span>
        </div>
        <textarea
          id="bio"
          rows={4}
          maxLength={1000}
          placeholder={tp.bioPlaceholder}
          aria-invalid={Boolean(errors.bio)}
          className={inputClass}
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-destructive text-xs">{errors.bio.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? tp.submitting : tp.submit}
        </button>
      </div>
    </form>
  )
}
