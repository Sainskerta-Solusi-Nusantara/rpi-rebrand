'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const MAX_PER_USER = 20

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
  '',
] as const

const emptyToUndefined = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v

const createSchema = z.object({
  name: z
    .string({ required_error: 'Nama pencarian wajib diisi' })
    .trim()
    .min(2, 'Nama minimal 2 karakter')
    .max(80, 'Nama maksimal 80 karakter'),
  query: z.preprocess(
    emptyToUndefined,
    z.string().max(120, 'Kata kunci maksimal 120 karakter').optional(),
  ),
  categorySlug: z.preprocess(
    emptyToUndefined,
    z.string().max(120, 'Slug kategori maksimal 120 karakter').optional(),
  ),
  location: z.preprocess(
    emptyToUndefined,
    z.string().max(120, 'Lokasi maksimal 120 karakter').optional(),
  ),
  employmentType: z.preprocess(
    (v) => (typeof v === 'string' ? v : ''),
    z.enum(EMPLOYMENT_TYPES, {
      errorMap: () => ({ message: 'Tipe pekerjaan tidak valid' }),
    }),
  ),
  emailAlerts: z.preprocess((v) => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'string') return v === 'true' || v === 'on' || v === '1'
    return true
  }, z.boolean()),
})

const updateSchema = createSchema.partial().extend({
  id: z.string().min(1, 'ID wajib diisi'),
})

export type SavedSearchInput = {
  name: string
  query?: string
  categorySlug?: string
  location?: string
  employmentType?: string
  emailAlerts?: boolean
}

export type SavedSearchUpdateInput = Partial<SavedSearchInput> & { id: string }

/**
 * Create a new SavedSearch for the authenticated user. Enforces a 20-row
 * cap per user. Returns ActionResult; revalidates the management page.
 */
export async function createSavedSearch(input: SavedSearchInput): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const parsed = createSchema.safeParse({
    name: input.name,
    query: input.query,
    categorySlug: input.categorySlug,
    location: input.location,
    employmentType: input.employmentType ?? '',
    emailAlerts: input.emailAlerts ?? true,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }

  try {
    const count = await prisma.savedSearch.count({
      where: { userId: session.user.id },
    })
    if (count >= MAX_PER_USER) {
      return {
        ok: false,
        error: `Maksimal ${MAX_PER_USER} pencarian tersimpan per akun. Hapus yang lama dulu.`,
      }
    }

    const { name, query, categorySlug, location, employmentType, emailAlerts } = parsed.data
    await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name,
        query: query ?? null,
        categorySlug: categorySlug ?? null,
        location: location ?? null,
        employmentType: employmentType === '' ? null : employmentType,
        emailAlerts,
      },
    })

    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[createSavedSearch] failed', err)
    return { ok: false, error: 'Gagal menyimpan pencarian. Coba lagi.' }
  }
}

/**
 * Partially update a SavedSearch the caller owns. Any unset field is left
 * untouched. Returns ActionResult; revalidates the management page.
 */
export async function updateSavedSearch(input: SavedSearchUpdateInput): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const parsed = updateSchema.safeParse({
    id: input.id,
    name: input.name,
    query: input.query,
    categorySlug: input.categorySlug,
    location: input.location,
    employmentType: input.employmentType,
    emailAlerts: input.emailAlerts,
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return {
      ok: false,
      error: issue?.message ?? 'Data tidak valid',
      field: issue?.path[0] as string | undefined,
    }
  }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id: parsed.data.id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.query !== undefined) data.query = parsed.data.query ?? null
    if (parsed.data.categorySlug !== undefined) data.categorySlug = parsed.data.categorySlug ?? null
    if (parsed.data.location !== undefined) data.location = parsed.data.location ?? null
    if (parsed.data.employmentType !== undefined) {
      data.employmentType =
        parsed.data.employmentType === '' ? null : parsed.data.employmentType
    }
    if (parsed.data.emailAlerts !== undefined) data.emailAlerts = parsed.data.emailAlerts

    await prisma.savedSearch.update({
      where: { id: parsed.data.id },
      data,
    })

    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[updateSavedSearch] failed', err)
    return { ok: false, error: 'Gagal memperbarui pencarian. Coba lagi.' }
  }
}

/**
 * Delete a SavedSearch the caller owns. Ownership is enforced server-side.
 */
export async function deleteSavedSearch(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!id || typeof id !== 'string') return { ok: false, error: 'ID tidak valid.' }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }
    await prisma.savedSearch.delete({ where: { id } })
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[deleteSavedSearch] failed', err)
    return { ok: false, error: 'Gagal menghapus pencarian. Coba lagi.' }
  }
}

/**
 * Flip `emailAlerts` on the owned SavedSearch row. Useful for a quick toggle
 * UI without re-submitting the whole form.
 */
export async function toggleSavedSearchAlerts(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!id || typeof id !== 'string') return { ok: false, error: 'ID tidak valid.' }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true, emailAlerts: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }
    await prisma.savedSearch.update({
      where: { id },
      data: { emailAlerts: !existing.emailAlerts },
    })
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[toggleSavedSearchAlerts] failed', err)
    return { ok: false, error: 'Gagal mengubah alert. Coba lagi.' }
  }
}
