'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'

export type ActionResult = { ok: true } | { ok: false; error: string; field?: string }

const EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
] as const

const emptyToNull = (v: unknown): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t === '' ? null : t
}

const nameSchema = z
  .string({ required_error: 'Nama pencarian wajib diisi' })
  .trim()
  .min(1, 'Nama pencarian wajib diisi')
  .max(80, 'Nama maksimal 80 karakter')

function parseEmploymentType(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (t === '') return null
  return (EMPLOYMENT_TYPES as readonly string[]).includes(t) ? t : null
}

function parseBoolish(raw: FormDataEntryValue | null, fallback: boolean): boolean {
  if (raw === null) return fallback
  if (typeof raw === 'string') {
    const v = raw.toLowerCase()
    if (v === 'true' || v === 'on' || v === '1' || v === 'yes') return true
    if (v === 'false' || v === 'off' || v === '0' || v === 'no' || v === '') return false
  }
  return fallback
}

function getReqMeta() {
  try {
    const h = headers()
    return {
      ip:
        h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip') ?? null,
      userAgent: h.get('user-agent') ?? null,
    }
  } catch {
    return { ip: null, userAgent: null }
  }
}

async function writeAudit(
  userId: string,
  action: AuditAction,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown> | null,
) {
  const { ip, userAgent } = getReqMeta()
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        ...(metadata ? { metadata: metadata as Record<string, never> } : {}),
        ip,
        userAgent,
      },
    })
  } catch (err) {
    // Audit is best-effort; never fail the user action because of it.
    console.error('[saved-search audit] failed', { resource, err })
  }
}

type ParsedFields = {
  name: string
  query: string | null
  categorySlug: string | null
  location: string | null
  employmentType: string | null
  emailAlerts: boolean
}

function parseFormFields(formData: FormData, opts: { defaultEmailAlerts: boolean }):
  | { ok: true; data: ParsedFields }
  | { ok: false; error: string; field?: string } {
  const nameRaw = formData.get('name')
  const nameParsed = nameSchema.safeParse(nameRaw)
  if (!nameParsed.success) {
    const issue = nameParsed.error.issues[0]
    return { ok: false, error: issue?.message ?? 'Nama tidak valid', field: 'name' }
  }

  const query = emptyToNull(formData.get('query'))
  if (query && query.length > 120) {
    return { ok: false, error: 'Kata kunci maksimal 120 karakter', field: 'query' }
  }
  const categorySlug = emptyToNull(formData.get('categorySlug'))
  if (categorySlug && categorySlug.length > 120) {
    return {
      ok: false,
      error: 'Slug kategori maksimal 120 karakter',
      field: 'categorySlug',
    }
  }
  const location = emptyToNull(formData.get('location'))
  if (location && location.length > 120) {
    return { ok: false, error: 'Lokasi maksimal 120 karakter', field: 'location' }
  }

  const employmentType = parseEmploymentType(formData.get('employmentType'))
  const emailAlerts = parseBoolish(formData.get('emailAlerts'), opts.defaultEmailAlerts)

  return {
    ok: true,
    data: {
      name: nameParsed.data,
      query,
      categorySlug,
      location,
      employmentType,
      emailAlerts,
    },
  }
}

/**
 * Create a new SavedSearch for the authenticated user. Audits as
 * `saved_search.created`. Revalidates the management page on success.
 */
export async function createSavedSearch(formData: FormData): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }

  const parsed = parseFormFields(formData, { defaultEmailAlerts: true })
  if (!parsed.ok) return parsed

  try {
    const created = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        query: parsed.data.query,
        categorySlug: parsed.data.categorySlug,
        location: parsed.data.location,
        employmentType: parsed.data.employmentType,
        emailAlerts: parsed.data.emailAlerts,
      },
      select: { id: true },
    })

    await writeAudit(
      session.user.id,
      AuditAction.CREATE,
      'saved_search.created',
      created.id,
      { name: parsed.data.name, alerts: parsed.data.emailAlerts },
    )

    revalidatePath('/dashboard/pencarian-tersimpan')
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[createSavedSearch] failed', err)
    return { ok: false, error: 'Gagal menyimpan pencarian. Coba lagi.' }
  }
}

/**
 * Update an existing SavedSearch the caller owns. Audits as
 * `saved_search.updated`. Returns ActionResult.
 */
export async function updateSavedSearch(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!id) return { ok: false, error: 'ID tidak valid.' }

  const parsed = parseFormFields(formData, { defaultEmailAlerts: true })
  if (!parsed.ok) return parsed

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }

    await prisma.savedSearch.update({
      where: { id },
      data: {
        name: parsed.data.name,
        query: parsed.data.query,
        categorySlug: parsed.data.categorySlug,
        location: parsed.data.location,
        employmentType: parsed.data.employmentType,
        emailAlerts: parsed.data.emailAlerts,
      },
    })

    await writeAudit(
      session.user.id,
      AuditAction.UPDATE,
      'saved_search.updated',
      id,
      { name: parsed.data.name, alerts: parsed.data.emailAlerts },
    )

    revalidatePath('/dashboard/pencarian-tersimpan')
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[updateSavedSearch] failed', err)
    return { ok: false, error: 'Gagal memperbarui pencarian. Coba lagi.' }
  }
}

/**
 * Delete a SavedSearch the caller owns. Audits as `saved_search.deleted`.
 */
export async function deleteSavedSearch(id: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!id) return { ok: false, error: 'ID tidak valid.' }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true, name: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }

    await prisma.savedSearch.delete({ where: { id } })

    await writeAudit(
      session.user.id,
      AuditAction.DELETE,
      'saved_search.deleted',
      id,
      { name: existing.name },
    )

    revalidatePath('/dashboard/pencarian-tersimpan')
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[deleteSavedSearch] failed', err)
    return { ok: false, error: 'Gagal menghapus pencarian. Coba lagi.' }
  }
}

/**
 * Flip the `emailAlerts` flag on a SavedSearch the caller owns. Audits as
 * `saved_search.alerts.toggled`.
 */
export async function toggleSavedSearchAlerts(
  id: string,
  enabled: boolean,
): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Anda harus masuk.' }
  if (!id) return { ok: false, error: 'ID tidak valid.' }

  try {
    const existing = await prisma.savedSearch.findUnique({
      where: { id },
      select: { userId: true, emailAlerts: true },
    })
    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: 'Pencarian tidak ditemukan.' }
    }

    if (existing.emailAlerts !== enabled) {
      await prisma.savedSearch.update({
        where: { id },
        data: { emailAlerts: enabled },
      })
    }

    await writeAudit(
      session.user.id,
      AuditAction.UPDATE,
      'saved_search.alerts.toggled',
      id,
      { enabled },
    )

    revalidatePath('/dashboard/pencarian-tersimpan')
    revalidatePath('/dashboard/lowongan-disimpan')
    return { ok: true }
  } catch (err) {
    console.error('[toggleSavedSearchAlerts] failed', err)
    return { ok: false, error: 'Gagal mengubah alert. Coba lagi.' }
  }
}
