'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createTenant } from '@/lib/tenants/actions'

const schema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug minimal 3 karakter')
    .max(40, 'Slug maksimal 40 karakter')
    .regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/, 'Gunakan huruf kecil, angka, dan tanda hubung.'),
})

type FormValues = z.infer<typeof schema>

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
}

export function OnboardingForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  })

  const name = watch('name')
  const slug = watch('slug')

  // Auto-derive slug while the field hasn't been edited manually.
  const [slugTouched, setSlugTouched] = useState(false)
  useEffect(() => {
    if (!slugTouched) {
      const derived = slugify(name)
      if (derived !== slug) setValue('slug', derived, { shouldValidate: true })
    }
  }, [name, slug, slugTouched, setValue])

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    const fd = new FormData()
    fd.set('name', values.name)
    fd.set('slug', values.slug)
    startTransition(async () => {
      const r = await createTenant(fd)
      if (!r.ok) {
        if (r.field && r.field in values) {
          setError(r.field as keyof FormValues, { message: r.error })
        } else {
          setSubmitError(r.error)
        }
        return
      }
      router.push(`/dashboard/tenants/${r.data?.slug ?? values.slug}` as never)
      router.refresh()
    })
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          Nama tenant
        </label>
        <input
          id="name"
          type="text"
          autoComplete="organization"
          placeholder="Contoh: Akademi RPI"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-foreground">
          Slug
        </label>
        <div className="flex items-center gap-1">
          <input
            id="slug"
            type="text"
            placeholder="akademi-rpi"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(errors.slug)}
            className={`${inputClass} font-mono`}
            {...register('slug', {
              onChange: () => setSlugTouched(true),
            })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Slug menjadi sub-domain dan URL tenant Anda. Hanya huruf kecil, angka, dan tanda hubung.
        </p>
        {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Membuat…' : 'Buat tenant'}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>
    </form>
  )
}
