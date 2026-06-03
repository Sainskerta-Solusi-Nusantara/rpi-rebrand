'use client'

import { useState, useTransition, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/auth/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

export function ResetForm({ token }: { token: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tr = t.auth.reset

  const schema = useMemo(
    () =>
      z
        .object({
          password: z
            .string()
            .min(8, tr.errors.passwordMin)
            .regex(/[A-Za-z]/, tr.errors.passwordLetter)
            .regex(/[0-9]/, tr.errors.passwordNumber),
          confirm: z.string(),
        })
        .refine((d) => d.password === d.confirm, {
          path: ['confirm'],
          message: tr.errors.confirmMismatch,
        }),
    [
      tr.errors.passwordMin,
      tr.errors.passwordLetter,
      tr.errors.passwordNumber,
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
    defaultValues: { password: '', confirm: '' },
  })

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    const fd = new FormData()
    fd.set('token', token)
    fd.set('password', values.password)
    fd.set('confirm', values.confirm)

    startTransition(async () => {
      const result = await resetPassword(fd)
      if (!result.ok) {
        if (result.field && result.field in values) {
          setError(result.field as keyof FormValues, { message: result.error })
        } else {
          setSubmitError(result.error)
        }
        return
      }
      router.push('/login?reset=1')
      router.refresh()
    })
  }

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          {tr.newPasswordLabel}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={tr.newPasswordPlaceholder}
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
          {tr.confirmNewLabel}
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder={tr.confirmNewPlaceholder}
          aria-invalid={Boolean(errors.confirm)}
          className={inputClass}
          {...register('confirm')}
        />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
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
