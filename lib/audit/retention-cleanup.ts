import { promises as fs } from 'fs'
import path from 'path'
import type { AuditLog, AuditRetentionPolicy } from '@prisma/client'
import { prisma } from '@/lib/db'

/**
 * Audit-log retention cleanup.
 *
 * For each effective policy:
 *   - select AuditLog rows where
 *       (resource matches the policy's resourceType, "*" matches all)
 *       AND tenantId matches the policy scope
 *       AND createdAt < (now - retentionDays)
 *   - if `archiveEnabled`, append the rows to a JSONL file under
 *       uploads/audit-archive/{tenantId|global}/{YYYY-MM-DD}.jsonl
 *     BEFORE deletion. File-write failures are logged in the summary but
 *     do NOT block deletion (the policy is the source of truth).
 *   - delete the matched rows (unless dryRun).
 *
 * `retentionDays === 0` is treated as "forever" — skip entirely.
 */

export type RetentionImpact = {
  resourceType: string
  scope: 'global' | 'tenant'
  tenantId: string | null
  archived: number
  deleted: number
  retentionDays: number
  archiveError?: string
}

export type CleanupSummary = {
  deleted: number
  archived: number
  byResourceType: Record<string, { deleted: number; archived: number }>
  policies: RetentionImpact[]
  errors: string[]
}

const ARCHIVE_ROOT = path.resolve(process.cwd(), 'uploads', 'audit-archive')

function yyyymmdd(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptySummary(): CleanupSummary {
  return { deleted: 0, archived: 0, byResourceType: {}, policies: [], errors: [] }
}

function recordByResource(
  summary: CleanupSummary,
  resourceType: string,
  deleted: number,
  archived: number,
) {
  const entry = summary.byResourceType[resourceType] ?? { deleted: 0, archived: 0 }
  entry.deleted += deleted
  entry.archived += archived
  summary.byResourceType[resourceType] = entry
}

async function archiveRows(
  rows: AuditLog[],
  scopeKey: string,
): Promise<{ ok: boolean; error?: string }> {
  if (rows.length === 0) return { ok: true }
  try {
    const dir = path.join(ARCHIVE_ROOT, scopeKey)
    await fs.mkdir(dir, { recursive: true })
    const file = path.join(dir, `${yyyymmdd(new Date())}.jsonl`)
    const payload = rows.map((r) => JSON.stringify(r)).join('\n') + '\n'
    await fs.appendFile(file, payload, 'utf8')
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'archive_failed' }
  }
}

/**
 * Build a `where` clause matching AuditLog rows targeted by a policy.
 * Wildcard "*" resource means "any resource".
 */
function buildPolicyWhere(policy: AuditRetentionPolicy, cutoff: Date) {
  const where: Record<string, unknown> = { createdAt: { lt: cutoff } }
  if (policy.resourceType !== '*') where.resource = policy.resourceType
  if (policy.scope === 'tenant') {
    where.tenantId = policy.tenantId
  } else {
    // Global scope policies operate over ALL tenants + global rows.
    // (tenantId is left unconstrained.)
  }
  return where
}

/**
 * Run cleanup for the policies applicable to a single tenant (or global
 * scope when tenantId is undefined).
 *
 * - tenantId provided → only tenant-scoped policies for that tenant.
 * - tenantId undefined → only global-scoped policies.
 *
 * The cron orchestrator calls this once per tenant and once for global.
 */
export async function applyRetentionCleanup({
  tenantId,
  dryRun,
}: {
  tenantId?: string
  dryRun: boolean
}): Promise<CleanupSummary> {
  const summary = emptySummary()

  let policies: AuditRetentionPolicy[] = []
  try {
    policies = await prisma.auditRetentionPolicy.findMany({
      where: tenantId ? { scope: 'tenant', tenantId } : { scope: 'global' },
    })
  } catch (err) {
    summary.errors.push(
      `policy_load_failed: ${err instanceof Error ? err.message : String(err)}`,
    )
    return summary
  }

  const now = Date.now()
  const scopeKey = tenantId ?? 'global'

  for (const policy of policies) {
    // 0 = forever; skip
    if (!policy.retentionDays || policy.retentionDays <= 0) continue
    // Defensive: tenant-scoped policy with no tenantId is malformed, skip
    if (policy.scope === 'tenant' && !policy.tenantId) {
      summary.errors.push(`policy_${policy.id}_missing_tenantId`)
      continue
    }

    const cutoff = new Date(now - policy.retentionDays * 24 * 60 * 60 * 1000)
    const where = buildPolicyWhere(policy, cutoff)

    let matchCount = 0
    try {
      matchCount = await prisma.auditLog.count({ where })
    } catch (err) {
      summary.errors.push(
        `count_failed_${policy.id}: ${err instanceof Error ? err.message : String(err)}`,
      )
      continue
    }

    const impact: RetentionImpact = {
      resourceType: policy.resourceType,
      scope: policy.scope === 'tenant' ? 'tenant' : 'global',
      tenantId: policy.tenantId,
      archived: 0,
      deleted: 0,
      retentionDays: policy.retentionDays,
    }

    if (matchCount === 0) {
      summary.policies.push(impact)
      continue
    }

    // Archive first (if enabled, not dry-run)
    if (policy.archiveEnabled && !dryRun) {
      try {
        const rows = await prisma.auditLog.findMany({ where })
        const result = await archiveRows(rows, scopeKey)
        if (result.ok) {
          impact.archived = rows.length
          summary.archived += rows.length
        } else {
          impact.archiveError = result.error
          summary.errors.push(
            `archive_failed_${policy.id}: ${result.error ?? 'unknown'}`,
          )
        }
      } catch (err) {
        impact.archiveError = err instanceof Error ? err.message : 'archive_failed'
        summary.errors.push(`archive_failed_${policy.id}: ${impact.archiveError}`)
      }
    } else if (policy.archiveEnabled && dryRun) {
      // dry-run: report what WOULD be archived
      impact.archived = matchCount
    }

    if (dryRun) {
      impact.deleted = matchCount
    } else {
      try {
        const result = await prisma.auditLog.deleteMany({ where })
        impact.deleted = result.count
        summary.deleted += result.count
      } catch (err) {
        summary.errors.push(
          `delete_failed_${policy.id}: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    }

    recordByResource(summary, policy.resourceType, impact.deleted, impact.archived)
    summary.policies.push(impact)
  }

  return summary
}

/**
 * Orchestrator: run cleanup for global scope plus every tenant that has
 * at least one retention policy defined. Called by the cron route.
 */
export async function runGlobalRetentionCleanup(
  options: { dryRun?: boolean } = {},
): Promise<CleanupSummary> {
  const dryRun = options.dryRun ?? false
  const combined = emptySummary()

  // 1. global scope
  try {
    const globalSummary = await applyRetentionCleanup({ dryRun })
    mergeSummary(combined, globalSummary)
  } catch (err) {
    combined.errors.push(
      `global_cleanup_failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  // 2. each tenant that has at least one tenant-scoped policy
  let tenantIds: string[] = []
  try {
    const tenantPolicies = await prisma.auditRetentionPolicy.findMany({
      where: { scope: 'tenant', tenantId: { not: null } },
      select: { tenantId: true },
      distinct: ['tenantId'],
    })
    tenantIds = tenantPolicies
      .map((p) => p.tenantId)
      .filter((id): id is string => Boolean(id))
  } catch (err) {
    combined.errors.push(
      `tenant_list_failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  for (const tenantId of tenantIds) {
    try {
      const tenantSummary = await applyRetentionCleanup({ tenantId, dryRun })
      mergeSummary(combined, tenantSummary)
    } catch (err) {
      combined.errors.push(
        `tenant_${tenantId}_cleanup_failed: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  return combined
}

function mergeSummary(dst: CleanupSummary, src: CleanupSummary) {
  dst.deleted += src.deleted
  dst.archived += src.archived
  for (const [k, v] of Object.entries(src.byResourceType)) {
    const entry = dst.byResourceType[k] ?? { deleted: 0, archived: 0 }
    entry.deleted += v.deleted
    entry.archived += v.archived
    dst.byResourceType[k] = entry
  }
  dst.policies.push(...src.policies)
  dst.errors.push(...src.errors)
}
