'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  AuditAction,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
  LocationType,
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
  responsibilities?: string
  requirements?: string
  benefits?: string
  salaryMin?: number
  salaryMax?: number
  employmentType: EmploymentType
  experienceLevel: ExperienceLevel
  location: string
  locationType: LocationType
  categorySlug?: string
  tags: string[]
  status: JobStatus
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

const MAX_ROWS = 200

const REQUIRED_HEADERS = ['title', 'location', 'description'] as const

const OPTIONAL_HEADERS = [
  'employmentType',
  'experienceLevel',
  'locationType',
  'salaryMin',
  'salaryMax',
  'status',
  'tags',
  'responsibilities',
  'requirements',
  'benefits',
  'categorySlug',
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

function buildJobSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  const suffix = nanoid(7).toLowerCase().replace(/[^a-z0-9]/g, '')
  return base ? `${base}-${suffix}` : `job-${suffix}`
}

// =============================================================================
// Validation
// =============================================================================

const optionalText = z
  .string()
  .trim()
  .max(20_000, 'Teks terlalu panjang')
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const tagsSchema = z
  .string()
  .trim()
  .optional()
  .transform((raw) => {
    if (!raw) return [] as string[]
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.length <= 50)
      .slice(0, 20)
  })

const optionalSlug = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const salaryNumber = z.preprocess(
  (v) => {
    if (v === '' || v === null || v === undefined) return undefined
    if (typeof v === 'string') {
      const cleaned = v.replace(/[^\d]/g, '')
      if (cleaned === '') return undefined
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : undefined
    }
    return v
  },
  z.number().int().min(0).max(1_000_000_000).optional(),
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

const rowSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Judul minimal 5 karakter')
      .max(200, 'Judul maksimal 200 karakter'),
    description: z
      .string()
      .trim()
      .min(50, 'Deskripsi minimal 50 karakter'),
    responsibilities: optionalText,
    requirements: optionalText,
    benefits: optionalText,
    salaryMin: salaryNumber,
    salaryMax: salaryNumber,
    employmentType: enumOrDefault(EmploymentType, EmploymentType.FULL_TIME),
    experienceLevel: enumOrDefault(ExperienceLevel, ExperienceLevel.MID),
    location: z
      .string()
      .trim()
      .min(2, 'Lokasi minimal 2 karakter')
      .max(120, 'Lokasi maksimal 120 karakter'),
    locationType: enumOrDefault(LocationType, LocationType.ONSITE),
    categorySlug: optionalSlug,
    tags: tagsSchema,
    status: enumOrDefault(JobStatus, JobStatus.DRAFT),
  })
  .refine(
    (v) =>
      v.salaryMin === undefined ||
      v.salaryMax === undefined ||
      v.salaryMin <= v.salaryMax,
    {
      message: 'Gaji minimum tidak boleh melebihi gaji maksimum',
      path: ['salaryMin'],
    },
  )

// =============================================================================
// Tenant context
// =============================================================================

type TenantLoadCtx =
  | { error: string }
  | {
      tenant: { id: string; slug: string }
      actorId: string
      canPublish: boolean
    }

async function loadTenantForJobImport(
  tenantSlug: string,
  permission: Permission,
): Promise<TenantLoadCtx> {
  const t = await getServerT()
  const session = await auth()
  if (!session?.user?.id) {
    return { error: t.srvTenant3.jobImport.mustBeLoggedIn }
  }
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true },
  })
  if (!tenant) return { error: t.srvTenant3.jobImport.tenantNotFound }
  const { globalRole, tenants, id: actorId } = session.user
  if (!hasTenantPermission(globalRole, tenants, tenant.id, permission)) {
    return { error: t.srvTenant3.jobImport.noPermission }
  }
  const canPublish = hasTenantPermission(
    globalRole,
    tenants,
    tenant.id,
    'job.publish',
  )
  return { tenant, actorId, canPublish }
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

type CsvMessages = {
  csvEmpty: string
  requiredColumnMissing: string
  csvNoDataRows: string
  maxRowsExceeded: string
}

function parseCsvToRows(csvText: string, msgs: CsvMessages): ParseOutcome {
  if (!csvText || csvText.trim().length === 0) {
    return { kind: 'fatal', error: msgs.csvEmpty }
  }

  const rows = parseCsv(csvText)
  const headerRow = rows[0]
  if (!headerRow) {
    return { kind: 'fatal', error: msgs.csvEmpty }
  }

  const headerMap = headerRow.map(normalizeHeaderKey)
  const headerKeys = new Set(
    headerMap.filter((h): h is string => h !== null),
  )

  for (const req of REQUIRED_HEADERS) {
    if (!headerKeys.has(req)) {
      return {
        kind: 'fatal',
        error: msgs.requiredColumnMissing.replace('{col}', req),
      }
    }
  }

  const dataRows = rows.slice(1).map((r, idx) => ({
    lineNum: idx + 2, // 1-based, accounting for header row
    raw: r,
  }))

  if (dataRows.length === 0) {
    return { kind: 'fatal', error: msgs.csvNoDataRows }
  }
  if (dataRows.length > MAX_ROWS) {
    return {
      kind: 'fatal',
      error: msgs.maxRowsExceeded
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
// parseAndValidateJobsCsv — preview-only
// =============================================================================

export async function parseAndValidateJobsCsv(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<PreviewResult>> {
  const t = await getServerT()
  const ctx = await loadTenantForJobImport(input.tenantSlug, 'job.create')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText, t.srvTenant3.jobImport)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // Pre-fetch any referenced categorySlugs so we can validate them too.
  const referencedSlugs = new Set<string>()
  for (const dr of parsed.dataRows) {
    const obj = buildRawObject(parsed.headerMap, dr.raw)
    const cs = obj.categorySlug?.trim()
    if (cs) referencedSlugs.add(cs)
  }
  let knownCategorySlugs = new Set<string>()
  if (referencedSlugs.size > 0) {
    const found = await prisma.jobCategory.findMany({
      where: { slug: { in: Array.from(referencedSlugs) } },
      select: { slug: true },
    })
    knownCategorySlugs = new Set(found.map((c) => c.slug))
  }

  const previewRows: CsvPreviewRow[] = []
  let validCount = 0
  let invalidCount = 0

  for (const dr of parsed.dataRows) {
    const raw = buildRawObject(parsed.headerMap, dr.raw)
    const { parsed: pr, errors } = validateRow(raw)

    if (pr && pr.categorySlug && !knownCategorySlugs.has(pr.categorySlug)) {
      errors.push(
        `categorySlug: ${t.srvTenant3.jobImport.categoryNotFoundInRow.replace('{slug}', pr.categorySlug)}`,
      )
    }

    if (pr && pr.status === JobStatus.PUBLISHED && !ctx.canPublish) {
      errors.push(t.srvTenant3.jobImport.noPublishPermissionPreview)
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
// bulkImportJobs — actually creates jobs
// =============================================================================

export async function bulkImportJobs(input: {
  tenantSlug: string
  csvText: string
}): Promise<ActionResult<ImportResult>> {
  const t = await getServerT()
  const ctx = await loadTenantForJobImport(input.tenantSlug, 'job.create')
  if ('error' in ctx) return { ok: false, error: ctx.error }

  const parsed = parseCsvToRows(input.csvText, t.srvTenant3.jobImport)
  if (parsed.kind === 'fatal') {
    return { ok: false, error: parsed.error }
  }

  // Pre-resolve categorySlug → id
  const referencedSlugs = new Set<string>()
  for (const dr of parsed.dataRows) {
    const obj = buildRawObject(parsed.headerMap, dr.raw)
    const cs = obj.categorySlug?.trim()
    if (cs) referencedSlugs.add(cs)
  }
  let categorySlugToId = new Map<string, string>()
  if (referencedSlugs.size > 0) {
    const found = await prisma.jobCategory.findMany({
      where: { slug: { in: Array.from(referencedSlugs) } },
      select: { id: true, slug: true },
    })
    categorySlugToId = new Map(found.map((c) => [c.slug, c.id]))
  }

  const meta = getRequestMeta()

  type Outcome =
    | { kind: 'created' }
    | { kind: 'skipped'; lineNum: number; error: string }

  const results = await Promise.all(
    parsed.dataRows.map(async (dr): Promise<Outcome> => {
      try {
        const raw = buildRawObject(parsed.headerMap, dr.raw)
        const { parsed: pr, errors } = validateRow(raw)
        if (!pr) {
          return {
            kind: 'skipped',
            lineNum: dr.lineNum,
            error: errors[0] ?? t.srvTenant3.jobImport.invalidData,
          }
        }

        // Resolve category
        let categoryId: string | undefined
        if (pr.categorySlug) {
          const resolvedId = categorySlugToId.get(pr.categorySlug)
          if (!resolvedId) {
            return {
              kind: 'skipped',
              lineNum: dr.lineNum,
              error: t.srvTenant3.jobImport.categoryNotFoundImport.replace('{slug}', pr.categorySlug),
            }
          }
          categoryId = resolvedId
        }

        if (pr.status === JobStatus.PUBLISHED && !ctx.canPublish) {
          return {
            kind: 'skipped',
            lineNum: dr.lineNum,
            error: t.srvTenant3.jobImport.noPublishPermissionImport,
          }
        }

        const slug = buildJobSlug(pr.title)

        const created = await prisma.job.create({
          data: {
            tenantId: ctx.tenant.id,
            postedById: ctx.actorId,
            title: pr.title,
            slug,
            description: pr.description,
            responsibilities: pr.responsibilities,
            requirements: pr.requirements,
            benefits: pr.benefits,
            salaryMin: pr.salaryMin,
            salaryMax: pr.salaryMax,
            employmentType: pr.employmentType,
            experienceLevel: pr.experienceLevel,
            location: pr.location,
            locationType: pr.locationType,
            categoryId,
            tags: pr.tags,
            status: pr.status,
            publishedAt:
              pr.status === JobStatus.PUBLISHED ? new Date() : null,
          },
          select: { id: true, slug: true },
        })

        await prisma.auditLog.create({
          data: {
            tenantId: ctx.tenant.id,
            userId: ctx.actorId,
            action: AuditAction.CREATE,
            resource: 'tenant.job',
            resourceId: created.id,
            metadata: {
              title: pr.title,
              slug: created.slug,
              status: pr.status,
              employmentType: pr.employmentType,
              experienceLevel: pr.experienceLevel,
              locationType: pr.locationType,
              source: 'csv_import',
              lineNum: dr.lineNum,
            } as Prisma.InputJsonValue,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
        })

        return { kind: 'created' }
      } catch (err) {
        console.error('[bulkImportJobs] row failed', dr.lineNum, err)
        return {
          kind: 'skipped',
          lineNum: dr.lineNum,
          error: t.srvTenant3.jobImport.rowSaveError,
        }
      }
    }),
  )

  let created = 0
  let skipped = 0
  const errors: { lineNum: number; error: string }[] = []
  for (const r of results) {
    if (r.kind === 'created') {
      created += 1
    } else {
      skipped += 1
      errors.push({ lineNum: r.lineNum, error: r.error })
    }
  }

  // Summary audit log
  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenant.id,
      userId: ctx.actorId,
      action: AuditAction.UPDATE,
      resource: 'tenant.job.import',
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

  revalidatePath(`/dashboard/tenants/${ctx.tenant.slug}/jobs`)

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
