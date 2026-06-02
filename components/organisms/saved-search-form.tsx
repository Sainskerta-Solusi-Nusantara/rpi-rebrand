'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  createSavedSearch,
  updateSavedSearch,
  type SavedSearchInput,
} from '@/lib/saved-searches/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
  '',
] as const

type FormValues = {
  name: string
  query?: string | ''
  categorySlug?: string | ''
  location?: string | ''
  employmentType: (typeof EMPLOYMENT_TYPES)[number]
  emailAlerts: boolean
}

export type SavedSearchInitial = {
  id?: string
  name?: string | null
  query?: string | null
  categorySlug?: string | null
  location?: string | null
  employmentType?: string | null
  emailAlerts?: boolean
}

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

function isEmploymentType(v: string | null | undefined): v is (typeof EMPLOYMENT_TYPES)[number] {
  return (EMPLOYMENT_TYPES as readonly string[]).includes(v ?? '')
}

export function SavedSearchForm({
  mode,
  initial,
  onSuccess,
  onCancel,
}: {
  mode: 'create' | 'edit'
  initial?: SavedSearchInitial
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsSavedSearch.savedSearchForm
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const schema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(2, tl.errors.nameMin.replace('{n}', '2'))
          .max(80, tl.errors.nameMax.replace('{n}', '80')),
        query: z
          .string()
          .max(120, tl.errors.queryMax.replace('{n}', '120'))
          .optional()
          .or(z.literal('')),
        categorySlug: z
          .string()
          .max(120, tl.errors.categorySlugMax.replace('{n}', '120'))
          .optional()
          .or(z.literal('')),
        location: z
          .string()
          .max(120, tl.errors.locationMax.replace('{n}', '120'))
          .optional()
          .or(z.literal('')),
        employmentType: z.enum(EMPLOYMENT_TYPES),
        emailAlerts: z.boolean(),
      }),
    [tl.errors],
  )

  const initialEmploymentType: (typeof EMPLOYMENT_TYPES)[number] = isEmploymentType(
    initial?.employmentType,
  )
    ? (initial?.employmentType as (typeof EMPLOYMENT_TYPES)[number])
    : ''

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      query: initial?.query ?? '',
      categorySlug: initial?.categorySlug ?? '',
      location: initial?.location ?? '',
      employmentType: initialEmploymentType,
      emailAlerts: initial?.emailAlerts ?? true,
    },
  })

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSubmitSuccess(null)

    const payload: SavedSearchInput = {
      name: values.name,
      query: values.query ?? '',
      categorySlug: values.categorySlug ?? '',
      location: values.location ?? '',
      employmentType: values.employmentType,
      emailAlerts: values.emailAlerts,
    }

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSavedSearch(payload)
          : await updateSavedSearch({ id: initial?.id ?? '', ...payload })

      if (result.ok) {
        setSubmitSuccess(mode === 'create' ? tl.successCreate : tl.successUpdate)
        router.refresh()
        onSuccess?.()
        return
      }

      const knownFields = [
        'name',
        'query',
        'categorySlug',
        'location',
        'employmentType',
        'emailAlerts',
      ] as const
      type KnownField = (typeof knownFields)[number]
      if (
        result.field &&
        (knownFields as readonly string[]).includes(result.field)
      ) {
        setError(result.field as KnownField, { type: 'server', message: result.error })
      } else {
        setSubmitError(result.error)
      }
    })
  }

  const employmentLabels: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
    FULL_TIME: tl.employmentLabels.FULL_TIME,
    PART_TIME: tl.employmentLabels.PART_TIME,
    CONTRACT: tl.employmentLabels.CONTRACT,
    INTERNSHIP: tl.employmentLabels.INTERNSHIP,
    FREELANCE: tl.employmentLabels.FREELANCE,
    '': tl.employmentLabels.ALL,
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <label htmlFor="ss-name" className="block text-sm font-medium text-foreground">
          {tl.nameLabel} <span className="text-destructive">{tl.nameRequired}</span>
        </label>
        <input
          id="ss-name"
          type="text"
          placeholder={tl.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-query" className="block text-sm font-medium text-foreground">
          {tl.queryLabel}
        </label>
        <input
          id="ss-query"
          type="text"
          placeholder={tl.queryPlaceholder}
          aria-invalid={Boolean(errors.query)}
          className={inputClass}
          {...register('query')}
        />
        <p className="text-xs text-muted-foreground">{tl.queryHint}</p>
        {errors.query && (
          <p className="text-xs text-destructive">{errors.query.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-category" className="block text-sm font-medium text-foreground">
          {tl.categorySlugLabel}
        </label>
        <input
          id="ss-category"
          type="text"
          placeholder={tl.categorySlugPlaceholder}
          aria-invalid={Boolean(errors.categorySlug)}
          className={inputClass}
          {...register('categorySlug')}
        />
        <p className="text-xs text-muted-foreground">
          {tl.categorySlugHint.replace('{example}', tl.categorySlugPlaceholder)}{' '}
          <code>{tl.categorySlugPlaceholder}</code>
        </p>
        {errors.categorySlug && (
          <p className="text-xs text-destructive">{errors.categorySlug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-location" className="block text-sm font-medium text-foreground">
          {tl.locationLabel}
        </label>
        <input
          id="ss-location"
          type="text"
          placeholder={tl.locationPlaceholder}
          aria-invalid={Boolean(errors.location)}
          className={inputClass}
          {...register('location')}
        />
        {errors.location && (
          <p className="text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-emp-type" className="block text-sm font-medium text-foreground">
          {tl.employmentTypeLabel}
        </label>
        <select
          id="ss-emp-type"
          aria-invalid={Boolean(errors.employmentType)}
          className={inputClass}
          {...register('employmentType')}
        >
          {EMPLOYMENT_TYPES.map((et) => (
            <option key={et || 'any'} value={et}>
              {employmentLabels[et]}
            </option>
          ))}
        </select>
        {errors.employmentType && (
          <p className="text-xs text-destructive">{errors.employmentType.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="ss-alerts"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          {...register('emailAlerts')}
        />
        <label htmlFor="ss-alerts" className="text-sm text-foreground">
          {tl.emailAlertsLabel}
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {tl.btnCancel}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending
            ? tl.btnPending
            : mode === 'create'
              ? tl.btnCreate
              : tl.btnUpdate}
        </button>
      </div>
    </form>
  )
}
