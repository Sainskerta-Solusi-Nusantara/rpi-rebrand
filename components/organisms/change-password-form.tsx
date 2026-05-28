'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { changePassword } from '@/lib/auth/password-actions'

// TODO: swap inline inputs/button for @/components/atoms/* once available.

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Za-z]/, 'Password harus berisi huruf')
      .regex(/[0-9]/, 'Password harus berisi angka'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi password tidak cocok',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'Password baru harus berbeda dari password saat ini',
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordForm() {
  const router = useRouter()
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

  const inputClass =
    'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground">
            Password saat ini
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Password saat ini"
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
            Password baru
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter, huruf & angka"
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
            Konfirmasi password baru
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Ulangi password baru"
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
            Password berhasil diubah
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Memproses…' : 'Simpan password baru'}
          <span aria-hidden className="text-[hsl(43,74%,55%)]">
            →
          </span>
        </button>
      </form>

      <aside className="rounded-md border border-input bg-muted/40 px-4 py-3 text-sm">
        <h2 className="font-medium text-foreground">Tip keamanan</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Gunakan minimal 8 karakter.</li>
          <li>Wajib berisi huruf dan angka.</li>
          <li>Jangan gunakan password yang sama dengan situs lain.</li>
        </ul>
      </aside>
    </div>
  )
}
