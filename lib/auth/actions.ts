'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

// Password policy: min 8 chars, at least one letter and one number.
const passwordPolicy = z
  .string()
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Password harus berisi huruf')
  .regex(/[0-9]/, 'Password harus berisi angka')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(120),
  email: z.string().email('Email tidak valid').transform((v) => v.toLowerCase().trim()),
  password: passwordPolicy,
  acceptTerms: z
    .union([z.literal('on'), z.literal('true'), z.boolean()])
    .transform((v) => v === true || v === 'on' || v === 'true')
    .refine((v) => v === true, 'Anda harus menyetujui syarat & ketentuan'),
})

/**
 * Register a new end-user (job seeker) with USER global role.
 * Returns a discriminated result; caller decides redirect.
 */
export async function registerUser(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms'),
  }
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Data tidak valid', field: issue?.path[0] as string | undefined }
  }
  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (existing) {
      return { ok: false, error: 'Email sudah terdaftar', field: 'email' }
    }

    const passwordHash = await hashPassword(password)
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        globalRole: 'USER',
        status: 'ACTIVE',
      },
    })
    return { ok: true }
  } catch (err) {
    console.error('[registerUser] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

const forgotSchema = z.object({
  email: z.string().email('Email tidak valid').transform((v) => v.toLowerCase().trim()),
})

/**
 * Request a password reset email. MVP stub — always returns success to avoid
 * user enumeration. TODO: wire to mailer + token store.
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const parsed = forgotSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Email tidak valid', field: 'email' }
  }
  // Intentionally do not reveal whether user exists.
  console.info('[requestPasswordReset] requested for', parsed.data.email)
  return { ok: true }
}
