'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuditAction, Prisma, TenantRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'
import { parseCsv } from '@/lib/csv'
import { createTenantInvite } from '@/lib/tenants/actions'

// =============================================================================
// Types
// =============================================================================

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export type CsvRowParsed = {
  email: string
  role: TenantRole
  name?: string
}

export type PreviewRowStatus =
  | 'valid'
  | 'skip:member'
  | 'skip:invited'
  | 'skip:duplicate'
  | 'error'

export type CsvPreviewRow = {
  lineNum: number
  raw: Record<string, string>
  parsed: CsvRowParsed | null
  status: PreviewRowStatus
  note?: string
  errors: string[]
}

export type PreviewResult = {
  headers: string[]
  rows: CsvPreviewRow[]
  totalRows: number
  validCount: number
  skipCount: number
  errorCount: number
}

export type ImportResult = {
  total: number
  invited: number
  skipped: number
  errors: { lineNum: number; error: string }[]
}

// =============================================================================
// Constants
// =============================================================================

const MAX_ROWS = 50

const INVITABLE_ROLES = ['ADMIN', 'RECRUITER', 'MEMBER'] as const

const REQUIRED_HEADERS = ['email', 'role'] as const

const OPTIONAL_HEADERS = ['name'] as const

const KNOWN_HEADERS = new Set<string>([
  ...REQUIRED_HEADERS,
  ...OPTIONAL_HEADERS,
])

// =============================================================================
// Helpers
// =============================================================================

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

// =============================================================================
// Validation
// =============================================================================

const emailField = z
  .string()
  .trim()
  .min(1, 'Email wajib diisi')
  .transform((v) => v.toLowerCase())
  .refine(
    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Email tidak valid',
  )

const roleField = z.preprocess((v) => {
  if (v === undefined || v === null) return v
  if (typeof v === 'string') {
    return v.trim().toUpperCase().replace(/[-\s]+/g, '_')
  }
  return v
}, z.enum(INVITABLE_ROLES, {
  errorMap: () => ({ message: 'Peran harus ADMIN, RECRUITER, atau MEMBER' }),
}))

const optionalName = z
  .string()
  .trim()
  .max(200, 'Nama maksimal 200 karakter')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const rowSchema = z.object({
  email: emailField,
  role: roleField,
  name: optionalName,
})

// =============================================================================
// Tenant context
// =============================================================================

type TenantLoadCtx =
  | { error: string }
  | {
      tenant: { id: string; slug: string }
      actorId: string
    }

async function loadTenantForMemberImport(
  tenantSlug: string,
  permission: Permission,
): Promise<TenantLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Anda harus masuk.' }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: 'Tenant tidak ditemukan.' }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: 'Anda tidak memiliki izin.' }
  }
  return { tenant, actorId }
}

// =============================================================================
// Parsing + header normalization
// =============================================================================

function normalizeHeaderKey(h: string): string | null {
  const trimmed = h.trim()
  if (!trimmed) return null
  const lower = trimmed.toLowerCase()
  for (const known of KNOWN_HEADERS) {
    if (known.toLowerCase() === lower) return known
  }
  return null
}

type ParseOutcome =
  | { kind: 'fatal'; error: string }
  | {
      kind: 'ok'
      headers: string[]
      headerMap: (string | null)[]
      dataRows: { lineNum: number; raw: string[] }[]
    }

function parseCsvToRows(csvText: string): ParseOutcome {
  if (!csvText || csvText.trim().length === 0) {
    return { kind: 'fatal', error: 'CSV kosong.' }
  }

  const rows = parseCsv(csvText)
  const headerRow = rows[0]
  if (!headerRow) {
    return { kind: 'fatal', error: 'CSV kosong.' }
  }

  const headerMap = headerRow.map(normalizeHeaderKey)
  const headerKeys = new Set(
    headerMap.filter((h): h is string => h !== null),
  )

  for (const req of REQUIRED_HEADERS) {
    if (!headerKeys.has(req)) {
      return {
        kind: 'fatal',
        error: `Kolom wajib "${req}" tidak ditemukan di baris header.`,
      }
    }
  }

  const dataRows = rows.slice(1).map((r, idx) => ({
    lineNum: idx + 2, // 1-based, accounting for header row
    raw: r,
  }))

  if (dataRows.length === 0) {
    return { kind: 'fatal', error: 'CSV tidak memiliki baris data.' }
  }
  if (dataRows.length > MAX_ROWS) {
    return {
      kind: 'fatal',
      error: `Maksimum ${MAX_ROWS} baris per impor. Saat ini: ${dataRows.length}.`,
    }
  }

  return {
    kind: 'ok',
    headers: headerRow,
    headerMap,
    dataRows,
  }
}

function buildRawObject(
  headerMap: (string | null)[],
  cells: string[],
): Record<string, string> {
  const obj: Record<string, string> = {}
  for (let i = 0; i < headerMap.length; i++) {
    const key = headerMap[i]
    if (!key) continue
    obj[key] = (cells[i] ?? '').trim()
  }
  return obj
}

function validateRow(raw: Record<string, string>): {
  parsed: CsvRowParsed | null
  errors: string[]
} {
  const result = rowSchema.safeParse(raw)
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const path = issue.path.join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
    return { parsed: null, errors }
  }
  return { parsed: result.data as CsvRowParsed, errors: [] }
}

// =============================================================================
// Side-effect lookups: existing members + pending invitations
// =============================================================================

async function loadExistingMemberEmails(
  emails: string[],
  tenantId: string,
): Promise<Set<string>> {
  if (emails.length === 0) return new Set()
  const members = await prisma.userTenant.findMany({
    where: {
      tenantId,
      user: { email: { in: emails } },
    },
    select: { user: { select: { email: true } } },
  })
  const out = new Set<string>()
  for (const m of members) {
    if (m.user.email) out.add(m.user.email.toLowerCase())
  }
  return out
}

async function loadPendingInviteEmails(
  emails: string[],
  tenantId: string,
): Promise<Set<string>> {
  if (emails.length === 0) return new Set()
  const invites = await prisma.invitation.findMany({
    where: {
      tenantId,
      email: { in: emails },
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { email: true },
  })
  const out = new Set<string>()
  for (const inv of invites) {
    if (inv.email) out.add(inv.email.toLowerCase())
  }
  return out
}

// =============================================================================
// parseAndValidateMembersCsv — preview-only
// =============================================================================

export async function parseAndValidateMembersCsv(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<PreviewResult>> {
  const ctx = await loadTenantForMemberImport(input.tenantSlug, 'team.invite')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // First pass: schema-validate each row + collect emails for batch lookup
  type Intermediate = {
    lineNum: number
    raw: Record<string, string>
    parsed: CsvRowParsed | null
    errors: string[]
  }
  const intermediates: Intermediate[] = parsed.dataRows.map((dr) => {
    const raw = buildRawObject(parsed.headerMap, dr.raw)
    const { parsed: pr, errors } = validateRow(raw)
    return { lineNum: dr.lineNum, raw, parsed: pr, errors }
  })

  const validEmails = Array.from(
    new Set(
      intermediates
        .map((i) => i.parsed?.email)
        .filter((e): e is string => Boolean(e)),
    ),
  )

  const [existingMembers, pendingInvites] = await Promise.all([
    loadExistingMemberEmails(validEmails, ctx.tenant.id),
    loadPendingInviteEmails(validEmails, ctx.tenant.id),
  ])

  // Second pass: assign final status with cross-row duplicate tracking
  const previewRows: CsvPreviewRow[] = []
  const seenEmails = new Set<string>()
  let validCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const it of intermediates) {
    if (!it.parsed) {
      errorCount += 1
      previewRows.push({
        lineNum: it.lineNum,
        raw: it.raw,
        parsed: null,
        status: 'error',
        errors: it.errors,
      })
      continue
    }

    const email = it.parsed.email

    if (seenEmails.has(email)) {
      skipCount += 1
      previewRows.push({
        lineNum: it.lineNum,
        raw: it.raw,
        parsed: it.parsed,
        status: 'skip:duplicate',
        note: 'Email duplikat di CSV — baris pertama akan diproses',
        errors: [],
      })
      continue
    }
    seenEmails.add(email)

    if (existingMembers.has(email)) {
      skipCount += 1
      previewRows.push({
        lineNum: it.lineNum,
        raw: it.raw,
        parsed: it.parsed,
        status: 'skip:member',
        note: 'Sudah menjadi anggota tenant',
        errors: [],
      })
      continue
    }

    if (pendingInvites.has(email)) {
      skipCount += 1
      previewRows.push({
        lineNum: it.lineNum,
        raw: it.raw,
        parsed: it.parsed,
        status: 'skip:invited',
        note: 'Undangan aktif sudah ada',
        errors: [],
      })
      continue
    }

    validCount += 1
    previewRows.push({
      lineNum: it.lineNum,
      raw: it.raw,
      parsed: it.parsed,
      status: 'valid',
      errors: [],
    })
  }

  return {
    ok: true,
    data: {
      headers: parsed.headers,
      rows: previewRows,
      totalRows: parsed.dataRows.length,
      validCount,
      skipCount,
      errorCount,
    },
  }
}

// =============================================================================
// bulkImportMembers — actually sends invitations
// =============================================================================

export async function bulkImportMembers(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<ImportResult>> {
  const ctx = await loadTenantForMemberImport(input.tenantSlug, 'team.invite')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // Re-validate each row + classify
  type Intermediate = {
    lineNum: number
    parsed: CsvRowParsed | null
    errors: string[]
  }
  const intermediates: Intermediate[] = parsed.dataRows.map((dr) => {
    const raw = buildRawObject(parsed.headerMap, dr.raw)
    const { parsed: pr, errors } = validateRow(raw)
    return { lineNum: dr.lineNum, parsed: pr, errors }
  })

  const validEmails = Array.from(
    new Set(
      intermediates
        .map((i) => i.parsed?.email)
        .filter((e): e is string => Boolean(e)),
    ),
  )

  const [existingMembers, pendingInvites] = await Promise.all([
    loadExistingMemberEmails(validEmails, ctx.tenant.id),
    loadPendingInviteEmails(validEmails, ctx.tenant.id),
  ])

  type Outcome =
    | { kind: 'invited' }
    | { kind: 'skipped'; lineNum: number; error: string }

  const seenEmails = new Set<string>()

  // Build per-row "what to do" list synchronously so duplicate logic is
  // deterministic; then dispatch invites in parallel.
  type Task =
    | { kind: 'skip'; lineNum: number; error: string }
    | { kind: 'invite'; lineNum: number; email: string; role: TenantRole }

  const tasks: Task[] = intermediates.map((it) => {
    if (!it.parsed) {
      return {
        kind: 'skip',
        lineNum: it.lineNum,
        error: it.errors[0] ?? 'Data tidak valid',
      }
    }
    const email = it.parsed.email
    if (seenEmails.has(email)) {
      return {
        kind: 'skip',
        lineNum: it.lineNum,
        error: 'Email duplikat di CSV',
      }
    }
    seenEmails.add(email)
    if (existingMembers.has(email)) {
      return {
        kind: 'skip',
        lineNum: it.lineNum,
        error: 'Sudah menjadi anggota tenant',
      }
    }
    if (pendingInvites.has(email)) {
      return {
        kind: 'skip',
        lineNum: it.lineNum,
        error: 'Undangan aktif sudah ada',
      }
    }
    return {
      kind: 'invite',
      lineNum: it.lineNum,
      email,
      role: it.parsed.role,
    }
  })

  const settled = await Promise.allSettled(
    tasks.map(async (t): Promise<Outcome> => {
      if (t.kind === 'skip') {
        return { kind: 'skipped', lineNum: t.lineNum, error: t.error }
      }
      try {
        const res = await createTenantInvite({
          tenantSlug: ctx.tenant.slug,
          email: t.email,
          role: t.role,
        })
        if (!res.ok) {
          return {
            kind: 'skipped',
            lineNum: t.lineNum,
            error: res.error,
          }
        }
        return { kind: 'invited' }
      } catch (err) {
        console.error('[bulkImportMembers] invite failed', t.lineNum, err)
        return {
          kind: 'skipped',
          lineNum: t.lineNum,
          error: 'Kesalahan internal saat mengirim undangan',
        }
      }
    }),
  )

  let invited = 0
  let skipped = 0
  const errors: { lineNum: number; error: string }[] = []
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') {
      const r = s.value
      if (r.kind === 'invited') {
        invited += 1
      } else {
        skipped += 1
        errors.push({ lineNum: r.lineNum, error: r.error })
      }
    } else {
      skipped += 1
      const lineNum = tasks[i]?.lineNum ?? 0
      errors.push({
        lineNum,
        error: 'Kesalahan internal saat memproses baris',
      })
    }
  })

  // Summary audit log (per-invite audit is handled inside createTenantInvite)
  const meta = getRequestMeta()
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenant.id,
      userId: ctx.actorId,
      action: AuditAction.UPDATE,
      resource: 'tenant.member.import',
      metadata: {
        total: parsed.dataRows.length,
        invited,
        skipped,
        errors: errors.slice(0, 50),
      } as Prisma.InputJsonValue,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  })

  revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}`)

  return {
    ok: true,
    data: {
      total: parsed.dataRows.length,
      invited,
      skipped,
      errors,
    },
  }
}
