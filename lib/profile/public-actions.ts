'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/session'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; field?: string }

// ---------------------------------------------------------------------------
// Validation: username
// ---------------------------------------------------------------------------

/**
 * Username constraints:
 *   - 3..20 chars
 *   - must start with [a-z]
 *   - subsequent chars: [a-z0-9_-]
 *   - lowercase, no spaces
 */
const usernameRegex = /^[a-z][a-z0-9_-]{2,19}$/

const usernameSchema = z
  .string({ required_error: 'Username wajib diisi' })
  .trim()
  .toLowerCase()
  .min(3, 'Username minimal 3 karakter')
  .max(20, 'Username maksimal 20 karakter')
  .regex(
    usernameRegex,
    'Username hanya boleh huruf kecil, angka, tanda hubung (-), dan garis bawah (_), serta diawali huruf',
  )

/**
 * Reserved usernames that conflict with public routes, brand, or sensitive
 * keywords. Kept intentionally small — extend as new routes ship.
 */
const RESERVED_USERNAMES = new Set<string>([
  'admin',
  'administrator',
  'root',
  'superadmin',
  'support',
  'help',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'auth',
  'dashboard',
  'profil',
  'profile',
  'profiles',
  'mitra',
  'jobs',
  'job',
  'careers',
  'career',
  'courses',
  'course',
  'blog',
  'press',
  'tentang',
  'about',
  'contact',
  'pricing',
  'enterprise',
  'api',
  'app',
  'rpi',
  'system',
  'settings',
  'keamanan',
  'cv',
  'resume',
  'null',
  'undefined',
  'me',
  'you',
  'we',
  'static',
  'public',
  'assets',
])

// ---------------------------------------------------------------------------
// Audit helper
// ---------------------------------------------------------------------------

function getRequestMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        h.get('x-real-ip') ??
        null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

async function audit(
  userId: string,
  action: AuditAction,
  resource: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const meta = getRequestMeta()
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    })
  } catch (err) {
    console.error('[public-profile audit] failed', err)
  }
}

// ---------------------------------------------------------------------------
// setUsername
// ---------------------------------------------------------------------------

const setUsernameSchema = z.object({ username: usernameSchema })

/**
 * Set or change the authenticated user's public username.
 * - Validates regex + length
 * - Rejects reserved names
 * - Rejects taken usernames (case-insensitive via lowercase normalization)
 */
export async function setUsername(input: {
  username: string
}): Promise<ActionResult<{ username: string }>> {
  const session = await requireAuth()
  const userId = session.user.id

  const parsed = setUsernameSchema.safeParse(input)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Username tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }

  const next = parsed.data.username

  if (RESERVED_USERNAMES.has(next)) {
    return {
      ok: false,
      error: 'Username tersebut tidak tersedia',
      field: 'username',
    }
  }

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    })
    if (current?.username === next) {
      // No-op idempotent success
      return { ok: true, data: { username: next } }
    }

    // Case-insensitive uniqueness — schema column is unique but we already
    // normalize to lowercase, so an exact lookup is sufficient.
    const taken = await prisma.user.findFirst({
      where: { username: next, NOT: { id: userId } },
      select: { id: true },
    })
    if (taken) {
      return {
        ok: false,
        error: 'Username sudah dipakai',
        field: 'username',
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { username: next },
    })

    await audit(userId, AuditAction.UPDATE, 'user.username', userId, {
      from: current?.username ?? null,
      to: next,
    })

    revalidatePath('/profil')
    revalidatePath(`/profil/${next}`)
    if (current?.username) {
      revalidatePath(`/profil/${current.username}`)
    }

    return { ok: true, data: { username: next } }
  } catch (err) {
    console.error('[setUsername] failed', err)
    return { ok: false, error: 'Gagal menyimpan username. Coba lagi.' }
  }
}

// ---------------------------------------------------------------------------
// setProfileVisibility
// ---------------------------------------------------------------------------

const setVisibilitySchema = z.object({ profilePublic: z.boolean() })

/**
 * Toggle whether the authenticated user's profile is publicly viewable
 * at /profil/<username|id>.
 */
export async function setProfileVisibility(input: {
  profilePublic: boolean
}): Promise<ActionResult<{ profilePublic: boolean }>> {
  const session = await requireAuth()
  const userId = session.user.id

  const parsed = setVisibilitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Permintaan tidak valid' }
  }

  const next = parsed.data.profilePublic

  try {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePublic: true, username: true },
    })

    if (current?.profilePublic === next) {
      return { ok: true, data: { profilePublic: next } }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePublic: next },
    })

    await audit(userId, AuditAction.UPDATE, 'user.profile.visibility', userId, {
      from: current?.profilePublic ?? false,
      to: next,
    })

    revalidatePath('/profil')
    if (current?.username) {
      revalidatePath(`/profil/${current.username}`)
    }
    revalidatePath(`/profil/${userId}`)

    return { ok: true, data: { profilePublic: next } }
  } catch (err) {
    console.error('[setProfileVisibility] failed', err)
    return { ok: false, error: 'Gagal memperbarui visibilitas. Coba lagi.' }
  }
}
