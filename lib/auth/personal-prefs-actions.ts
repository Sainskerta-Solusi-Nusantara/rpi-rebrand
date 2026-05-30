'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { locales } from '@/lib/i18n/dictionary'
import { SUPPORTED_TIMEZONES } from '@/lib/auth/personal-prefs'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

// Accept any IANA-style timezone string the runtime knows about, but bias
// validation toward our curated allowlist so the dropdown matches reality.
const TZ_RE = /^[A-Za-z][A-Za-z0-9_+\-/]{1,63}$/

const schema = z.object({
  locale: z.enum(locales as unknown as [string, ...string[]]),
  timezone: z
    .string()
    .min(2)
    .max(64)
    .regex(TZ_RE, 'Format zona waktu tidak valid')
    .refine((tz) => {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date())
        return true
      } catch {
        return false
      }
    }, 'Zona waktu tidak dikenali'),
})

export async function updatePersonalPrefs(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const parsed = schema.safeParse({
    locale: String(formData.get('locale') ?? ''),
    timezone: String(formData.get('timezone') ?? ''),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }
  const { locale, timezone } = parsed.data

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale, timezone },
    })

    // Sync the i18n cookie so the next render picks up the new language
    // without depending on the I18nProvider client effect.
    try {
      cookies().set('rpi_locale', locale, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      })
    } catch {
      // ignore if not in a request context
    }

    revalidatePath('/dashboard/profil')
    return { ok: true }
  } catch (err) {
    console.error('[updatePersonalPrefs] failed', err)
    return { ok: false, error: 'Terjadi kesalahan. Coba lagi sebentar.' }
  }
}

export const SUPPORTED_TIMEZONES_LIST = SUPPORTED_TIMEZONES