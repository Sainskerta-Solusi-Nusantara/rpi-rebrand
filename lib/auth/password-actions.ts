'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { getServerT } from '@/lib/i18n/server-dictionary'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const passwordPolicy = z
  .string()
  .min(8)
  .refine((v) => /[A-Za-z]/.test(v), { params: { i18n: 'passwordLetter' } })
  .refine((v) => /[0-9]/.test(v), { params: { i18n: 'passwordNumber' } })

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordPolicy,
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, {
    path: ['confirm'],
    params: { i18n: 'passwordConfirmMismatch' },
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    params: { i18n: 'passwordDifferent' },
  })

/**
 * Change the password of the currently authenticated user.
 * Verifies the current password before persisting the new bcrypt hash.
 */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  const t = await getServerT()
  const session = await requireAuth()

  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirm: formData.get('confirm'),
  }
  const parsed = await localizedParse(schema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAuth2.password.dataInvalid,
      field: issue?.path[0] as string | undefined,
    }
  }
  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  })

  if (!user?.passwordHash) {
    return {
      ok: false,
      error: t.srvAuth2.password.oauthAccount,
    }
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) {
    return { ok: false, error: t.srvAuth2.password.currentPasswordWrong, field: 'currentPassword' }
  }

  try {
    const newHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })
    return { ok: true }
  } catch (err) {
    console.error('[changePassword] failed', err)
    return { ok: false, error: t.srvAuth2.password.changeFailed }
  }
}
