'use client'

import { inputClassNoDisabled as inputClass } from '@/lib/ui/form-styles'
import { useState, useMemo, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { changePassword } from '@/lib/auth/password-actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

// TODO: swap inline inputs/button for @/components/atoms/* once available.

type FormValues = {
  currentPassword: string
  newPassword: string
  confirm: string
}

export function ChangePasswordForm() {
  const router = useRouter()
  const { t } = useI18n()
  const tc = t.formsAccount.changePassword

  const schema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, tc.errors.currentRequired),
          newPassword: z
            .string()
            .min(8, tc.errors.newMin)
            .regex(/[A-Za-z]/, tc.errors.newNeedsLetter)
            .regex(/[0-9]/, tc.errors.newNeedsDigit),
          confirm: z.string(),
        })
        .refine((d) => d.newPassword === d.confirm, {
          path: ['confirm'],
          message: tc.errors.confirmMismatch,
        })
        .refine((d) => d.newPassword !== d.currentPassword, {
          path: ['newPassword'],
          message: tc.errors.newSameAsCurrent,
        }),
    [
      tc.errors.currentRequired,
      tc.errors.newMin,
      tc.errors.newNeedsLetter,
      tc.errors.newNeedsDigit,
      tc.errors.confirmMismatch,
      tc.errors.newSameAsCurrent,
    ],
  )

  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirm: '',
    },
  })

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSuccess(false)
    const fd = new FormData()
    fd.set('currentPassword', values.currentPassword)
    fd.set('newPassword', values.newPassword)
    fd.set('confirm', values.confirm)

    startTransition(async () => {
      const result = await changePassword(fd)
      if (!result.ok) {
        if (result.field && result.field in values) {
          setError(result.field as keyof FormValues, { message: result.error })
        } else {
          setSubmitError(result.error)
        }
        return
      }
      setSuccess(true)
      reset({ currentPassword: '', newPassword: '', confirm: '' })
      router.refresh()
    })
  }


  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            {tc.currentPasswordLabel}
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder={tc.currentPasswordPlaceholder}
            aria-invalid={Boolean(errors.currentPassword)}
            className={inputClass}
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
            {tc.newPasswordLabel}
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder={tc.newPasswordPlaceholder}
            aria-invalid={Boolean(errors.newPassword)}
            className={inputClass}
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-medium text-foreground">
            {tc.confirmLabel}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder={tc.confirmPlaceholder}
            aria-invalid={Boolean(errors.confirm)}
            className={inputClass}
            {...register('confirm')}
          />
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </div>

        {success && (
          <div
            role="status"
            className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400"
          >
            {tc.successMsg}
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

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? tc.btnPending : tc.btnSubmit}
          <span aria-hidden className="text-[hsl(43,74%,55%)]">
            →
          </span>
        </button>
      </form>

      <aside className="rounded-md border border-input bg-muted/40 px-4 py-3 text-sm">
        <h2 className="font-medium text-foreground">{tc.tipTitle}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>{tc.tipMinChars}</li>
          <li>{tc.tipMustContain}</li>
          <li>{tc.tipNoReuse}</li>
        </ul>
      </aside>
    </div>
  )
}
