'use client'

import { inputClassNoDisabled as inputClass } from '@/lib/ui/form-styles'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import type { TenantRole } from '@prisma/client'
import { createTenantInvite, revokeTenantInvite } from '@/lib/tenants/actions'
import { useI18n } from '@/lib/i18n/i18n-provider'

const INVITABLE_ROLES = ['ADMIN', 'RECRUITER', 'MEMBER'] as const

export function TenantInviteForm({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsTenantMisc.inviteForm

  const schema = z.object({
    email: z.string().email(tl.errors.emailInvalid),
    role: z.enum(INVITABLE_ROLES),
  })

  type FormValues = z.infer<typeof schema>

  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'MEMBER' },
  })

  function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSuccess(null)
    startTransition(async () => {
      const r = await createTenantInvite({
        tenantSlug,
        email: values.email,
        role: values.role as TenantRole,
      })
      if (!r.ok) {
        if (r.field && r.field in values) {
          setError(r.field as keyof FormValues, { message: r.error })
        } else {
          setSubmitError(r.error)
        }
        return
      }
      setSuccess(tl.successMsg.replace('{email}', values.email))
      reset({ email: '', role: values.role })
      router.refresh()
    })
  }


  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 space-y-1">
          <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
            {tl.emailLabel}
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder={tl.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            className={inputClass}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1 sm:w-44">
          <label htmlFor="invite-role" className="block text-sm font-medium text-foreground">
            {tl.roleLabel}
          </label>
          <select id="invite-role" className={inputClass} {...register('role')}>
            <option value="ADMIN">{tl.optionAdmin}</option>
            <option value="RECRUITER">{tl.optionRecruiter}</option>
            <option value="MEMBER">{tl.optionMember}</option>
          </select>
        </div>
      </div>

      {submitError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {submitError}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? tl.btnPending : tl.btnSubmit}
      </button>
    </form>
  )
}

export function RevokeInviteButton({ invitationId }: { invitationId: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const tl = t.formsTenantMisc.inviteForm
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onClick() {
    setError(null)
    startTransition(async () => {
      const r = await revokeTenantInvite(invitationId)
      if (!r.ok) {
        setError(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="text-destructive text-xs font-medium hover:underline disabled:opacity-60"
      >
        {pending ? tl.revokePending : tl.revokeBtn}
      </button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
