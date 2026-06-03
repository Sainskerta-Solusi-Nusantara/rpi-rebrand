'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'
import { getServerLocale } from '@/lib/i18n/server-dictionary'
import { srvAuth3 } from '@/lib/i18n/dictionaries/srv-auth3'
import { localizedParse } from '@/lib/i18n/zod-error-map'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

// Coerce empty strings (the default for unfilled <input> fields in FormData) to undefined
// so optional fields don't trip the URL/regex/min validators.
const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

const phoneRegex = /^[+\d\s\-()]*$/

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(120),
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .max(30)
      .refine((v) => phoneRegex.test(v), { params: { i18n: 'phoneFormat' } })
      .optional(),
  ),
  bio: z.preprocess(
    emptyToUndefined,
    z.string().max(1000).optional(),
  ),
  headline: z.preprocess(
    emptyToUndefined,
    z.string().max(200).optional(),
  ),
  location: z.preprocess(
    emptyToUndefined,
    z.string().max(120).optional(),
  ),
  image: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
})

/**
 * Update the authenticated user's profile fields (name, phone, bio, headline,
 * location, image). Email + globalRole are intentionally immutable here.
 */
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const t = { srvAuth3: srvAuth3[await getServerLocale()] }
  const session = await requireAuth()

  const raw = {
    name: formData.get('name'),
    phone: formData.get('phone'),
    bio: formData.get('bio'),
    headline: formData.get('headline'),
    location: formData.get('location'),
    image: formData.get('image'),
  }

  const parsed = await localizedParse(profileSchema, raw)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? t.srvAuth3.profile.invalidData,
      field: issue?.path[0] as string | undefined,
    }
  }

  const { name, phone, bio, headline, location, image } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone ?? null,
        bio: bio ?? null,
        headline: headline ?? null,
        location: location ?? null,
        image: image ?? null,
      },
    })
    return { ok: true }
  } catch (err) {
    console.error('[updateProfile] failed', err)
    return { ok: false, error: t.srvAuth3.profile.saveFailed }
  }
}
