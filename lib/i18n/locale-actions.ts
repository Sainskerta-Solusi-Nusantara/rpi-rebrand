'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { AuditAction, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { locales, type Locale } from './dictionary'

const COOKIE_NAME = 'rpi_locale'
const ONE_YEAR = 60 * 60 * 24 * 365

export type SetLocaleResult =
  | { ok: true; locale: Locale }
  | { ok: false; error: string }

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (locales as string[]).includes(v)
}

/**
 * Persist the user's locale choice.
 *
 * Two writes:
 *  1. `rpi_locale` cookie (1 year, sameSite=lax) — picked up by middleware,
 *     server components, and the client provider on next render.
 *  2. If a session exists, `User.locale` is updated and an audit record with
 *     resource `user.locale` + action UPDATE is written for traceability.
 */
export async function setUserLocale(locale: Locale): Promise<SetLocaleResult> {
  if (!isLocale(locale)) {
    return { ok: false, error: 'Bahasa tidak didukung.' }
  }

  // (1) Cookie — always safe to set even for unauthenticated visitors.
  let previousLocale: Locale | null = null
  try {
    const jar = cookies()
    const existing = jar.get(COOKIE_NAME)?.value
    if (isLocale(existing)) previousLocale = existing
    jar.set(COOKIE_NAME, locale, {
      path: '/',
      sameSite: 'lax',
      maxAge: ONE_YEAR,
    })
  } catch {
    // outside a request context — ignore.
  }

  // (2) DB + audit, only if authenticated.
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (userId) {
      const current = await prisma.user
        .findUnique({ where: { id: userId }, select: { locale: true } })
        .catch(() => null)
      const dbPrev = isLocale(current?.locale) ? (current?.locale as Locale) : null
      const effectivePrev = previousLocale ?? dbPrev

      if (current?.locale !== locale) {
        await prisma.user
          .update({ where: { id: userId }, data: { locale } })
          .catch((err) => {
            console.error('[setUserLocale] db update failed', err)
          })

        // Audit. Resource string encodes the semantic event; action stays in the
        // existing enum (UPDATE) since `user.locale.updated` is not an enum
        // value.
        try {
          await prisma.auditLog.create({
            data: {
              userId,
              action: AuditAction.UPDATE,
              resource: 'user.locale',
              resourceId: userId,
              metadata: {
                event: 'user.locale.updated',
                locale,
                previousLocale: effectivePrev,
              } as Prisma.InputJsonValue,
            },
          })
        } catch (err) {
          // Never block on audit failures.
          console.error('[setUserLocale] audit write failed', err)
        }
      }
    }
  } catch (err) {
    console.error('[setUserLocale] session lookup failed', err)
  }

  // Refresh any RSC tree that depends on the locale. Cheap because the
  // server components re-render from cache.
  try {
    revalidatePath('/', 'layout')
  } catch {
    /* outside request scope */
  }

  return { ok: true, locale }
}
