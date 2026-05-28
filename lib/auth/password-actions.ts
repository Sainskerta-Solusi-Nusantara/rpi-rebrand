'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const passwordPolicy = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Password harus berisi huruf')
  .regex(/[0-9]/, 'Password harus berisi angka')

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Password saat ini wajib diisi'),
    newPassword: passwordPolicy,
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

/**
 * Change the password of the currently authenticated user.
 * Verifies the current password before persisting the new bcrypt hash.
 */
export async function changePassword(formData: FormData): Promise<ActionResult> {
  const session = await requireAuth()

  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirm: formData.get('confirm'),
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
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
      error: 'Akun Anda menggunakan Google. Hubungi support untuk mengatur password.',
    }
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) {
    return { ok: false, error: 'Password saat ini salah', field: 'currentPassword' }
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
    return { ok: false, error: 'Gagal mengganti password. Coba lagi.' }
  }
}
