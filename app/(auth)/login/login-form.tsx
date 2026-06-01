'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/i18n-provider'

const hasGoogle =
  typeof process !== 'undefined' &&
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true')

const inputClass =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30'

const submitBtnClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-md bg-[hsl(220,50%,14%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[hsl(220,50%,18%)] focus:outline-none focus:ring-2 focus:ring-[hsl(43,74%,55%)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl?: string
  initialError?: string
}) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.auth.login

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(tl.errors.emailInvalid),
        password: z.string().min(1, tl.errors.passwordRequired),
      }),
    [tl.errors.emailInvalid, tl.errors.passwordRequired],
  )
  type FormValues = z.infer<typeof schema>

  const [submitError, setSubmitError] = useState<string | null>(initialError ?? null)
  const [stage, setStage] = useState<'credentials' | 'totp'>('credentials')
  const [pendingCreds, setPendingCreds] = useState<FormValues | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [useRecovery, setUseRecovery] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function attemptSignIn(
    values: FormValues,
    code?: string,
  ): Promise<'ok' | 'totp_required' | 'totp_invalid' | 'invalid_creds' | 'no_server'> {
    const res = await signIn('credentials', {
      redirect: false,
      email: values.email,
      password: values.password,
      totpCode: code ?? '',
      callbackUrl: callbackUrl ?? '/dashboard',
    })
    if (!res) return 'no_server'
    if (res.error === 'TOTP_REQUIRED') return 'totp_required'
    if (res.error === 'TOTP_INVALID') return 'totp_invalid'
    if (res.error) return 'invalid_creds'
    const target = res.url ?? callbackUrl ?? '/dashboard'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(target as any)
    router.refresh()
    return 'ok'
  }

  async function onSubmitCredentials(values: FormValues) {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const r = await attemptSignIn(values)
      if (r === 'totp_required') {
        setPendingCreds(values)
        setStage('totp')
        return
      }
      if (r === 'no_server') setSubmitError(tl.errors.noServer)
      else if (r === 'invalid_creds') setSubmitError(tl.errors.invalidCreds)
    } finally {
      setSubmitting(false)
    }
  }

  async function onSubmitTotp(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingCreds) return
    setSubmitError(null)
    setSubmitting(true)
    try {
      const code = totpCode.trim()
      if (!code) {
        setSubmitError(
          useRecovery
            ? tl.totp.errors.recoveryRequired
            : tl.totp.errors.codeRequired,
        )
        return
      }
      const r = await attemptSignIn(pendingCreds, code)
      if (r === 'totp_invalid') {
        setSubmitError(tl.totp.errors.invalid)
      } else if (r === 'invalid_creds') {
        setSubmitError(tl.errors.sessionExpired)
        setStage('credentials')
        setPendingCreds(null)
        setTotpCode('')
      } else if (r === 'no_server') {
        setSubmitError(tl.errors.noServer)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'totp') {
    return (
      <form noValidate onSubmit={onSubmitTotp} className="space-y-5">
        <header className="space-y-1">
          <h3 className="font-heading text-base font-semibold text-foreground">
            {tl.totp.title}
          </h3>
          <p className="text-muted-foreground text-sm">
            {useRecovery ? tl.totp.promptRecovery : tl.totp.promptCode}
          </p>
        </header>

        <div className="space-y-2">
          <label htmlFor="totp" className="block text-sm font-medium text-foreground">
            {useRecovery ? tl.totp.recoveryLabel : tl.totp.codeLabel}
          </label>
          <input
            id="totp"
            type="text"
            inputMode={useRecovery ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            autoFocus
            placeholder={
              useRecovery ? tl.totp.recoveryPlaceholder : tl.totp.codePlaceholder
            }
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            className={`${inputClass} ${useRecovery ? 'font-mono tracking-widest' : 'font-mono text-center tracking-[0.4em]'}`}
            maxLength={useRecovery ? 16 : 6}
          />
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </div>
        )}

        <button type="submit" disabled={submitting} className={submitBtnClass}>
          {submitting ? tl.totp.submitting : tl.totp.submit}
          <span aria-hidden className="text-[hsl(43,74%,55%)]">
            →
          </span>
        </button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setUseRecovery((v) => !v)
              setTotpCode('')
              setSubmitError(null)
            }}
          >
            {useRecovery ? tl.totp.useAuthenticator : tl.totp.useRecovery}
          </button>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              setStage('credentials')
              setPendingCreds(null)
              setTotpCode('')
              setSubmitError(null)
              setUseRecovery(false)
            }}
          >
            {tl.totp.cancel}
          </button>
        </div>
      </form>
    )
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmitCredentials)} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          {tl.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={tl.emailPlaceholder}
          aria-invalid={Boolean(errors.email)}
          className={inputClass}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          {tl.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder={tl.passwordPlaceholder}
          aria-invalid={Boolean(errors.password)}
          className={inputClass}
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
        disabled={isSubmitting || submitting}
        className={submitBtnClass}
      >
        {isSubmitting || submitting ? tl.submitting : tl.submit}
        <span aria-hidden className="text-[hsl(43,74%,55%)]">
          →
        </span>
      </button>

      {hasGoogle && (
        <>
          <div className="relative py-2 text-center">
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-border" />
            <span className="relative bg-card px-3 text-xs uppercase tracking-wider text-muted-foreground">
              {tl.orDivider}
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
            {tl.googleCta}
          </button>
        </>
      )}
    </form>
  )
}
