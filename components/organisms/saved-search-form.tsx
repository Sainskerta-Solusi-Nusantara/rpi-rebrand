'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  createSavedSearch,
  updateSavedSearch,
  type SavedSearchInput,
} from '@/lib/saved-searches/actions'

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
  '',
] as const

const EMPLOYMENT_LABELS: Record<(typeof EMPLOYMENT_TYPES)[number], string> = {
  FULL_TIME: 'Penuh waktu',
  PART_TIME: 'Paruh waktu',
  CONTRACT: 'Kontrak',
  INTERNSHIP: 'Magang',
  FREELANCE: 'Lepas',
  '': 'Semua tipe',
}

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(80, 'Nama maksimal 80 karakter'),
  query: z
    .string()
    .max(120, 'Kata kunci maksimal 120 karakter')
    .optional()
    .or(z.literal('')),
  categorySlug: z
    .string()
    .max(120, 'Slug kategori maksimal 120 karakter')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(120, 'Lokasi maksimal 120 karakter')
    .optional()
    .or(z.literal('')),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  emailAlerts: z.boolean(),
})

type FormValues = z.infer<typeof schema>

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
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

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
        setSubmitSuccess(
          mode === 'create' ? 'Pencarian disimpan' : 'Pencarian diperbarui',
        )
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
          Nama pencarian <span className="text-destructive">*</span>
        </label>
        <input
          id="ss-name"
          type="text"
          placeholder="Backend dev di Jakarta"
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
          Kata kunci
        </label>
        <input
          id="ss-query"
          type="text"
          placeholder="contoh: backend node"
          aria-invalid={Boolean(errors.query)}
          className={inputClass}
          {...register('query')}
        />
        <p className="text-xs text-muted-foreground">Dicocokkan ke judul & deskripsi lowongan.</p>
        {errors.query && (
          <p className="text-xs text-destructive">{errors.query.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-category" className="block text-sm font-medium text-foreground">
          Slug kategori
        </label>
        <input
          id="ss-category"
          type="text"
          placeholder="teknologi-it"
          aria-invalid={Boolean(errors.categorySlug)}
          className={inputClass}
          {...register('categorySlug')}
        />
        <p className="text-xs text-muted-foreground">
          Slug kategori (contoh: <code>teknologi-it</code>). Kosongkan untuk semua kategori.
        </p>
        {errors.categorySlug && (
          <p className="text-xs text-destructive">{errors.categorySlug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="ss-location" className="block text-sm font-medium text-foreground">
          Lokasi
        </label>
        <input
          id="ss-location"
          type="text"
          placeholder="Jakarta"
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
          Tipe pekerjaan
        </label>
        <select
          id="ss-emp-type"
          aria-invalid={Boolean(errors.employmentType)}
          className={inputClass}
          {...register('employmentType')}
        >
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t || 'any'} value={t}>
              {EMPLOYMENT_LABELS[t]}
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
          Kirim alert email saat ada lowongan baru cocok
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isPending
            ? 'Menyimpan…'
            : mode === 'create'
              ? 'Simpan pencarian'
              : 'Perbarui pencarian'}
        </button>
      </div>
    </form>
  )
}
