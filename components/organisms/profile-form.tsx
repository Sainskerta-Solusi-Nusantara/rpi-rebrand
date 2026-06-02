'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateProfile } from '@/lib/auth/profile-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

type ProfileInitial = {
  id: string
  email: string
  name: string | null
  image: string | null
  phone: string | null
  bio: string | null
  headline: string | null
  location: string | null
  globalRole: string
}

// Mirror of the server schema. Kept lenient (optional strings can be empty)
// because the server preprocesses empty -> undefined before validation.
const phoneRegex = /^[+\d\s\-()]*$/

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter()
  const { t } = useI18n()
  const tp = t.formsProfile.profileForm

  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, tp.errors.nameMin.replace('{n}', '2'))
          .max(120, tp.errors.nameMax.replace('{n}', '120')),
        phone: z
          .string()
          .max(30, tp.errors.phoneMax.replace('{n}', '30'))
          .regex(phoneRegex, tp.errors.phoneFormat)
          .optional()
          .or(z.literal('')),
        bio: z
          .string()
          .max(1000, tp.errors.bioMax.replace('{n}', '1000'))
          .optional()
          .or(z.literal('')),
        headline: z
          .string()
          .max(200, tp.errors.headlineMax.replace('{n}', '200'))
          .optional()
          .or(z.literal('')),
        location: z
          .string()
          .max(120, tp.errors.locationMax.replace('{n}', '120'))
          .optional()
          .or(z.literal('')),
        image: z
          .string()
          .url(tp.errors.imageUrl)
          .optional()
          .or(z.literal('')),
      }),
    [tp.errors],
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
      phone: initial.phone ?? '',
      bio: initial.bio ?? '',
      headline: initial.headline ?? '',
      location: initial.location ?? '',
      image: initial.image ?? '',
    },
  })

  const bioValue = watch('bio') ?? ''
  const bioCount = bioValue.length

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSubmitSuccess(null)

    const fd = new FormData()
    fd.set('name', values.name)
    fd.set('phone', values.phone ?? '')
    fd.set('bio', values.bio ?? '')
    fd.set('headline', values.headline ?? '')
    fd.set('location', values.location ?? '')
    fd.set('image', values.image ?? '')

    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result.ok) {
        setSubmitSuccess(tp.successMsg)
        router.refresh()
        return
      }
      const knownFields = ['name', 'phone', 'bio', 'headline', 'location', 'image'] as const
      type KnownField = (typeof knownFields)[number]
      if (result.field && (knownFields as readonly string[]).includes(result.field)) {
        setError(result.field as KnownField, { type: 'server', message: result.error })
      } else {
        setSubmitError(result.error)
      }
    })
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitSuccess && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {tp.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          value={initial.email}
          readOnly
          aria-readonly="true"
          className={`${inputClass} cursor-not-allowed bg-muted text-muted-foreground`}
        />
        <p className="text-xs text-muted-foreground">
          {tp.emailReadonlyHint}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
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
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="headline" className="block text-sm font-medium text-foreground">
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
          <p className="text-xs text-destructive">{errors.headline.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground">
            {tp.bioLabel}
          </label>
          <span className="text-xs text-muted-foreground">{bioCount}/1000</span>
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
          <p className="text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="block text-sm font-medium text-foreground">
          {tp.phoneLabel}
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder={tp.phonePlaceholder}
          aria-invalid={Boolean(errors.phone)}
          className={inputClass}
          {...register('phone')}
        />
        <p className="text-xs text-muted-foreground">{tp.phoneHint}</p>
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="block text-sm font-medium text-foreground">
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
          <p className="text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="block text-sm font-medium text-foreground">
          {tp.imageLabel}
        </label>
        <input
          id="image"
          type="url"
          placeholder={tp.imagePlaceholder}
          aria-invalid={Boolean(errors.image)}
          className={inputClass}
          {...register('image')}
        />
        <p className="text-xs text-muted-foreground">{tp.imageHint}</p>
        {errors.image && (
          <p className="text-xs text-destructive">{errors.image.message}</p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {tp.btnCancel}
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending ? tp.btnPending : tp.btnSave}
        </button>
      </div>
    </form>
  )
}
