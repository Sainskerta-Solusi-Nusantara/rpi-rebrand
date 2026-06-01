'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateProfile } from '@/lib/auth/profile-actions'
import { advanceOnboardingStep } from '@/lib/onboarding/wizard-actions'

export type OnboardingProfileInitial = {
  name: string | null
  headline: string | null
  bio: string | null
  location: string | null
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(120, 'Nama maksimal 120 karakter'),
  headline: z
    .string()
    .max(200, 'Headline maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(120, 'Lokasi maksimal 120 karakter')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .max(1000, 'Bio maksimal 1000 karakter')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

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
  const [isPending, startTransition] = React.useTransition()
  const [submitError, setSubmitError] = React.useState<string | null>(null)

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
          Nama lengkap <span className="text-destructive">*</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap"
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
          Headline
        </label>
        <input
          id="headline"
          type="text"
          placeholder="Senior Engineer di Tokopedia"
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
          Lokasi
        </label>
        <input
          id="location"
          type="text"
          placeholder="Jakarta"
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
            Bio singkat
          </label>
          <span className="text-muted-foreground text-xs">{bioCount}/1000</span>
        </div>
        <textarea
          id="bio"
          rows={4}
          maxLength={1000}
          placeholder="Ceritakan singkat tentang diri Anda…"
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
          {isPending ? 'Menyimpan…' : 'Simpan & Lanjut'}
        </button>
      </div>
    </form>
  )
}
