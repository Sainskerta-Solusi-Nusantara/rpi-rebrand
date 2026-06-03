'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/auth/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

// TODO: swap inline inputs/button for @/components/atoms/* once available.

export function RegisterForm() {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.auth.register

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, tr.errors.nameMin).max(120),
          email: z.string().email(tr.errors.emailInvalid),
          password: z
            .string()
            .min(8, tr.errors.passwordMin)
            .regex(/[A-Za-z]/, tr.errors.passwordLetter)
            .regex(/[0-9]/, tr.errors.passwordNumber),
          confirm: z.string(),
          acceptTerms: z.literal(true, {
            errorMap: () => ({ message: tr.errors.termsRequired }),
          }),
        })
        .refine((d) => d.password === d.confirm, {
          path: ['confirm'],
          message: tr.errors.confirmMismatch,
        }),
    [
      tr.errors.nameMin,
      tr.errors.emailInvalid,
      tr.errors.passwordMin,
      tr.errors.passwordLetter,
      tr.errors.passwordNumber,
      tr.errors.termsRequired,
      tr.errors.confirmMismatch,
    ],
  )

  type FormValues = z.infer<typeof schema>

  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm: '',
      acceptTerms: undefined as unknown as true,
    },
  })

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    const fd = new FormData()
    fd.set('name', values.name)
    fd.set('email', values.email)
    fd.set('password', values.password)
    fd.set('acceptTerms', values.acceptTerms ? 'on' : '')

    startTransition(async () => {
      const result = await registerUser(fd)
      if (!result.ok) {
        if (result.field && result.field in values) {
          setError(result.field as keyof FormValues, { message: result.error })
        } else {
          setSubmitError(result.error)
        }
        return
      }
      router.push('/login?registered=1')
      router.refresh()
    })
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-foreground">
          {tr.nameLabel}
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder={tr.namePlaceholder}
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {tr.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={tr.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          {tr.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={tr.passwordPlaceholder}
          aria-invalid={Boolean(errors.password)}
          className={inputClass}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm" className="block text-sm font-medium text-foreground">
          {tr.confirmLabel}
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder={tr.confirmPlaceholder}
          aria-invalid={Boolean(errors.confirm)}
          className={inputClass}
          {...register('confirm')}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-[hsl(43,74%,55%)]"
          {...register('acceptTerms')}
        />
        <span className="leading-snug text-muted-foreground">
          {tr.termsAgreement}
        </span>
      </label>
      {errors.acceptTerms && (
        <p className="-mt-3 text-xs text-destructive">{errors.acceptTerms.message}</p>
      )}

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
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? tr.submitting : tr.submit}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>
    </form>
  )
}
