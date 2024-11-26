'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/auth/actions'

// TODO: swap inline inputs/button for @/components/atoms/* once available.

const schema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
    email: z.string().email('Email tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Za-z]/, 'Password harus berisi huruf')
      .regex(/[0-9]/, 'Password harus berisi angka'),
    confirm: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Anda harus menyetujui syarat & ketentuan' }),
    }),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Konfirmasi password tidak cocok',
  })

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
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
          Nama lengkap
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Nama Anda"
          aria-invalid={Boolean(errors.name)}
          className={inputClass}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter, huruf & angka"
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
          Konfirmasi password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi password"
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
          className="mt-0.5 h-4 w-4 rounded border-input text-[hsl(220,50%,14%)] focus:ring-[hsl(43,74%,55%)]"
          {...register('acceptTerms')}
        />
        <span className="leading-snug text-muted-foreground">
          Saya menyetujui Syarat &amp; Ketentuan dan Kebijakan Privasi RPI.
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Memproses…' : 'Daftar'}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>
    </form>
  )
}
