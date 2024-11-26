'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// TODO: replace inline inputs/button with @/components/atoms/* once available.

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type FormValues = z.infer<typeof schema>

const hasGoogle =
  typeof process !== 'undefined' &&
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true')

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl?: string
  initialError?: string
}) {
  const router = useRouter()
  const [submitError, setSubmitError] = useState<string | null>(initialError ?? null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    const res = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
      callbackUrl: callbackUrl ?? '/dashboard',
    })
    if (!res) {
      setSubmitError('Tidak dapat menghubungi server. Coba lagi.')
      return
    }
    if (res.error) {
      setSubmitError('Email atau password salah.')
      return
    }
    router.push(res.url ?? callbackUrl ?? '/dashboard')
    router.refresh()
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
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
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Memproses…' : 'Masuk'}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>

      {hasGoogle && (
        <>
          <div className="relative py-2 text-center">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
              atau
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              signIn('google', { callbackUrl: callbackUrl ?? '/dashboard' })
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
          >
            <span aria-hidden>G</span>
            Lanjutkan dengan Google
          </button>
        </>
      )}
    </form>
  )
}
