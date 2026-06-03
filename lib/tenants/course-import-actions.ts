'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  AuditAction,
  CourseLevel,
  CourseStatus,
  Prisma,
} from '@prisma/client'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth/session'
import { hasTenantPermission, type Permission } from '@/lib/auth/rbac'
import { parseCsv } from '@/lib/csv'
import { getServerT } from '@/lib/i18n/server-dictionary'

// =============================================================================
// Types
// =============================================================================

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export type CsvRowParsed = {
  title: string
  description: string
  level: CourseLevel
  durationHours: number
  instructorEmail?: string
  thumbnail?: string
  status: CourseStatus
}

export type CsvPreviewRow = {
  lineNum: number
  raw: Record<string, string>
  parsed: CsvRowParsed | null
  errors: string[]
}

export type PreviewResult = {
  headers: string[]
  rows: CsvPreviewRow[]
  totalRows: number
  validCount: number
  invalidCount: number
}

export type ImportResult = {
  total: number
  created: number
  skipped: number
  errors: { lineNum: number; error: string }[]
}

// =============================================================================
// Constants
// =============================================================================

const MAX_ROWS = 100

const REQUIRED_HEADERS = ['title', 'description'] as const

const OPTIONAL_HEADERS = [
  'level',
  'durationHours',
  'instructorEmail',
  'thumbnail',
  'status',
] as const

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

/**
 * Mirror buildCourseSlug from lib/tenants/course-actions.ts — kebab + nanoid
 * suffix. Course has @@unique([tenantId, slug]); the suffix prevents collisions.
 */
function buildCourseSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `course-${suffix}`
}

// =============================================================================
// Validation
// =============================================================================

const optionalShortText = z
  .string()
  .trim()
  .max(2_048, 'Teks terlalu panjang')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v.toLowerCase() : undefined))
  .refine(
    (v) => v === undefined || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Email instruktur tidak valid',
  )

const durationHoursNumber = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return 8
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d]/g, '')
      if (cleaned === '') return 8
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : 8
    }
    return v
  },
  z
    .number({ invalid_type_error: 'Durasi harus berupa angka' })
    .int('Durasi harus bilangan bulat')
    .min(1, 'Durasi minimal 1 jam')
    .max(1000, 'Durasi maksimal 1000 jam'),
)

const enumOrDefault = <T extends string>(
  enumObj: Record<string, T>,
  fallback: T,
) =>
  z.preprocess((v) => {
    if (v === undefined || v === null || v === '') return fallback
    if (typeof v === 'string') {
      const upper = v.trim().toUpperCase().replace(/[-\s]+/g, '_')
      return upper in enumObj ? enumObj[upper] : v
    }
    return v
  }, z.nativeEnum(enumObj))

const rowSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Judul minimal 5 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  description: z
    .string()
    .trim()
    .min(50, 'Deskripsi minimal 50 karakter'),
  level: enumOrDefault(CourseLevel, CourseLevel.BEGINNER),
  durationHours: durationHoursNumber,
  instructorEmail: optionalEmail,
  thumbnail: optionalShortText,
  status: enumOrDefault(CourseStatus, CourseStatus.DRAFT),
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

async function loadTenantForCourseImport(
  tenantSlug: string,
  permission: Permission,
  t: Awaited<ReturnType<typeof getServerT>>,
): Promise<TenantLoadCtx> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant2.courseImport.mustSignIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant2.courseImport.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvTenant2.courseImport.noPermission }
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

function parseCsvToRows(
  csvText: string,
  t: Awaited<ReturnType<typeof getServerT>>,
): ParseOutcome {
  if (!csvText || csvText.trim().length === 0) {
    return { kind: 'fatal', error: t.srvTenant2.courseImport.csvEmpty }
  }

  const rows = parseCsv(csvText)
  const headerRow = rows[0]
  if (!headerRow) {
    return { kind: 'fatal', error: t.srvTenant2.courseImport.csvEmpty }
  }

  const headerMap = headerRow.map(normalizeHeaderKey)
  const headerKeys = new Set(
    headerMap.filter((h): h is string => h !== null),
  )

  for (const req of REQUIRED_HEADERS) {
    if (!headerKeys.has(req)) {
      return {
        kind: 'fatal',
        error: t.srvTenant2.courseImport.missingHeader.replace('{col}', req),
      }
    }
  }

  const dataRows = rows.slice(1).map((r, idx) => ({
    lineNum: idx + 2, // 1-based, accounting for header row
    raw: r,
  }))

  if (dataRows.length === 0) {
    return { kind: 'fatal', error: t.srvTenant2.courseImport.csvNoData }
  }
  if (dataRows.length > MAX_ROWS) {
    return {
      kind: 'fatal',
      error: t.srvTenant2.courseImport.csvTooManyRows
        .replace('{max}', String(MAX_ROWS))
        .replace('{count}', String(dataRows.length)),
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
// Instructor resolution helpers
// =============================================================================

/**
 * Given a set of emails referenced in the CSV, return a map email → userId for
 * users that exist AND are members of the target tenant (UserTenant row).
 */
async function resolveInstructorEmails(
  emails: string[],
  tenantId: string,
): Promise<Map<string, string>> {
  if (emails.length === 0) return new Map()
  const users = await prisma.user.findMany({
    where: {
      email: { in: emails },
      tenants: { some: { tenantId } },
    },
    select: { id: true, email: true },
  })
  const map = new Map<string, string>()
  for (const u of users) {
    if (u.email) map.set(u.email.toLowerCase(), u.id)
  }
  return map
}

// =============================================================================
// parseAndValidateCoursesCsv — preview-only
// =============================================================================

export async function parseAndValidateCoursesCsv(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<PreviewResult>> {
  const t = await getServerT()
  const ctx = await loadTenantForCourseImport(input.tenantSlug, 'course.create', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText, t)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // Pre-fetch any referenced instructorEmails to validate membership.
  const referencedEmails = new Set<string>()
  for (const dr of parsed.dataRows) {
    const obj = buildRawObject(parsed.headerMap, dr.raw)
    const em = obj.instructorEmail?.trim().toLowerCase()
    if (em) referencedEmails.add(em)
  }
  const emailToUserId = await resolveInstructorEmails(
    Array.from(referencedEmails),
    ctx.tenant.id,
  )

  const previewRows: CsvPreviewRow[] = []
  let validCount = 0
  let invalidCount = 0

  for (const dr of parsed.dataRows) {
    const raw = buildRawObject(parsed.headerMap, dr.raw)
    const { parsed: pr, errors } = validateRow(raw)

    if (pr && pr.instructorEmail && !emailToUserId.has(pr.instructorEmail)) {
      errors.push(`instructorEmail: ${t.srvTenant2.courseImport.instructorNotFound}`)
    }

    const hasErrors = errors.length > 0
    if (hasErrors) {
      invalidCount += 1
    } else {
      validCount += 1
    }

    previewRows.push({
      lineNum: dr.lineNum,
      raw,
      parsed: hasErrors ? null : pr,
      errors,
    })
  }

  return {
    ok: true,
    data: {
      headers: parsed.headers,
      rows: previewRows,
      totalRows: parsed.dataRows.length,
      validCount,
      invalidCount,
    },
  }
}

// =============================================================================
// bulkImportCourses — actually creates courses
// =============================================================================

export async function bulkImportCourses(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<ImportResult>> {
  const t = await getServerT()
  const ctx = await loadTenantForCourseImport(input.tenantSlug, 'course.create', t)
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText, t)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // Pre-resolve instructorEmail → userId (members of this tenant only)
  const referencedEmails = new Set<string>()
  for (const dr of parsed.dataRows) {
    const obj = buildRawObject(parsed.headerMap, dr.raw)
    const em = obj.instructorEmail?.trim().toLowerCase()
    if (em) referencedEmails.add(em)
  }
  const emailToUserId = await resolveInstructorEmails(
    Array.from(referencedEmails),
    ctx.tenant.id,
  )

  const meta = getRequestMeta()

  type Outcome =
    | { kind: 'created' }
    | { kind: 'skipped'; lineNum: number; error: string }

  const settled = await Promise.allSettled(
    parsed.dataRows.map(async (dr): Promise<Outcome> => {
      try {
        const raw = buildRawObject(parsed.headerMap, dr.raw)
        const { parsed: pr, errors } = validateRow(raw)
        if (!pr) {
          return {
            kind: 'skipped',
            lineNum: dr.lineNum,
            error: errors[0] ?? t.srvTenant2.courseImport.dataInvalid,
          }
        }

        // Resolve instructor
        let instructorId: string | undefined
        if (pr.instructorEmail) {
          const resolved = emailToUserId.get(pr.instructorEmail)
          if (!resolved) {
            return {
              kind: 'skipped',
              lineNum: dr.lineNum,
              error: t.srvTenant2.courseImport.instructorNotFound,
            }
          }
          instructorId = resolved
        }

        const slug = buildCourseSlug(pr.title)

        const created = await prisma.course.create({
          data: {
            tenantId: ctx.tenant.id,
            title: pr.title,
            slug,
            description: pr.description,
            thumbnail: pr.thumbnail,
            level: pr.level,
            durationHours: pr.durationHours,
            instructorId,
            status: pr.status,
            publishedAt:
              pr.status === CourseStatus.PUBLISHED ? new Date() : null,
          },
          select: { id: true, slug: true },
        })

        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenant.id,
            userId: ctx.actorId,
            action: AuditAction.CREATE,
            resource: 'tenant.course',
            resourceId: created.id,
            metadata: {
              title: pr.title,
              slug: created.slug,
              level: pr.level,
              durationHours: pr.durationHours,
              status: pr.status,
              source: 'csv_import',
              lineNum: dr.lineNum,
            } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        })

        return { kind: 'created' }
      } catch (err) {
        console.error('[bulkImportCourses] row failed', dr.lineNum, err)
        return {
          kind: 'skipped',
          lineNum: dr.lineNum,
          error: t.srvTenant2.courseImport.rowSaveFailed,
        }
      }
    }),
  )

  let created = 0
  let skipped = 0
  const errors: { lineNum: number; error: string }[] = []
  settled.forEach((s, i) => {
    if (s.status === 'fulfilled') {
      const r = s.value
      if (r.kind === 'created') {
        created += 1
      } else {
        skipped += 1
        errors.push({ lineNum: r.lineNum, error: r.error })
      }
    } else {
      skipped += 1
      const lineNum = parsed.dataRows[i]?.lineNum ?? 0
      errors.push({
        lineNum,
        error: t.srvTenant2.courseImport.rowProcessFailed,
      })
    }
  })

  // Summary audit log
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenant.id,
      userId: ctx.actorId,
      action: AuditAction.UPDATE,
      resource: 'tenant.course.import',
      metadata: {
        total: parsed.dataRows.length,
        created,
        skipped,
        errors: errors.slice(0, 50),
      } as Prisma.InputJsonValue,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  })

  revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/kursus`)

  return {
    ok: true,
    data: {
      total: parsed.dataRows.length,
      created,
      skipped,
      errors,
    },
  }
}
