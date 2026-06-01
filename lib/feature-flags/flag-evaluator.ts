import { cache } from 'react'
import { prisma } from '@/lib/db'

export type EvaluationEnvironment = 'dev' | 'staging' | 'prod'

export type EvaluationContext = {
  userId?: string
  tenantId?: string
  environment?: EvaluationEnvironment
  attributes?: Record<string, string | number | boolean>
}

export type EvaluationReason =
  | 'not-found'
  | 'kill-switch'
  | 'environment-disabled'
  | 'override'
  | 'boolean'
  | 'percentage'
  | 'segment'
  | 'disabled'

export type EvaluationResult = {
  key: string
  value: boolean
  reason: EvaluationReason
}

type SegmentRule = {
  attr: string
  op: 'in' | 'equals' | 'starts_with'
  values: string[]
}

type EnvironmentsConfig = Partial<Record<EvaluationEnvironment, boolean>>

type LoadedFlag = {
  id: string
  key: string
  type: string
  enabled: boolean
  percentage: number
  segmentRules: SegmentRule[] | null
  environments: EnvironmentsConfig | null
}

type LoadedOverride = {
  flagId: string
  userId: string | null
  tenantId: string | null
  value: boolean
}

/* -------------------------------------------------------------------------- */
/*  Cached loaders                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Load every flag + override exactly once per request and index them.
 * Using a single trip per request keeps per-key lookups O(1) and avoids
 * a separate query per `evaluateFlag` call.
 */
export const loadAllFlags = cache(
  async (): Promise<{
    flagsByKey: Map<string, LoadedFlag>
    overridesByFlag: Map<string, LoadedOverride[]>
  }> => {
    try {
      const [flags, overrides] = await Promise.all([
        prisma.featureFlag.findMany(),
        prisma.featureFlagOverride.findMany(),
      ])

      const flagsByKey = new Map<string, LoadedFlag>()
      for (const f of flags) {
        flagsByKey.set(f.key, {
          id: f.id,
          key: f.key,
          type: f.type,
          enabled: f.enabled,
          percentage: f.percentage,
          segmentRules: normalizeSegmentRules(f.segmentRules),
          environments: normalizeEnvironments(f.environments),
        })
      }

      const overridesByFlag = new Map<string, LoadedOverride[]>()
      for (const o of overrides) {
        const list = overridesByFlag.get(o.flagId) ?? []
        list.push({
          flagId: o.flagId,
          userId: o.userId,
          tenantId: o.tenantId,
          value: o.value,
        })
        overridesByFlag.set(o.flagId, list)
      }

      return { flagsByKey, overridesByFlag }
    } catch (err) {
      console.error('[loadAllFlags] failed', err)
      return { flagsByKey: new Map(), overridesByFlag: new Map() }
    }
  },
)

/* -------------------------------------------------------------------------- */
/*  Hash + bucket                                                              */
/* -------------------------------------------------------------------------- */

/**
 * FNV-1a 32-bit non-cryptographic hash. Deterministic across processes,
 * which is the key requirement for stable percentage rollouts.
 */
export function fnv1a(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** Map an arbitrary key to a stable bucket in [0, 99]. */
export function rolloutBucket(key: string): number {
  return fnv1a(key) % 100
}

/* -------------------------------------------------------------------------- */
/*  Normalizers                                                                */
/* -------------------------------------------------------------------------- */

function normalizeSegmentRules(raw: unknown): SegmentRule[] | null {
  if (!Array.isArray(raw)) return null
  const out: SegmentRule[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const rec = r as Record<string, unknown>
    const attr = typeof rec.attr === 'string' ? rec.attr : null
    const op = rec.op
    const values = rec.values
    if (!attr) continue
    if (op !== 'in' && op !== 'equals' && op !== 'starts_with') continue
    if (!Array.isArray(values)) continue
    out.push({
      attr,
      op,
      values: values.map((v) => String(v)),
    })
  }
  return out
}

function normalizeEnvironments(raw: unknown): EnvironmentsConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const rec = raw as Record<string, unknown>
  const out: EnvironmentsConfig = {}
  for (const env of ['dev', 'staging', 'prod'] as const) {
    if (env in rec) out[env] = Boolean(rec[env])
  }
  return Object.keys(out).length ? out : null
}

/* -------------------------------------------------------------------------- */
/*  Segment matching                                                           */
/* -------------------------------------------------------------------------- */

function resolveAttr(rule: SegmentRule, ctx: EvaluationContext): string | null {
  if (rule.attr === 'userId') return ctx.userId ?? null
  if (rule.attr === 'tenantId') return ctx.tenantId ?? null
  const v = ctx.attributes?.[rule.attr]
  if (v === undefined || v === null) return null
  return String(v)
}

function ruleMatches(rule: SegmentRule, ctx: EvaluationContext): boolean {
  const actual = resolveAttr(rule, ctx)
  if (actual === null) return false
  switch (rule.op) {
    case 'in':
      return rule.values.includes(actual)
    case 'equals':
      return rule.values.length > 0 && actual === rule.values[0]
    case 'starts_with':
      return rule.values.some((v) => actual.startsWith(v))
    default:
      return false
  }
}

/* -------------------------------------------------------------------------- */
/*  Override matching                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Pick the most specific override that matches the context.
 * Precedence: (user+tenant) > tenant-only > user-only.
 */
function pickMatchingOverride(
  overrides: LoadedOverride[],
  ctx: EvaluationContext,
): LoadedOverride | null {
  let userTenant: LoadedOverride | null = null
  let tenantOnly: LoadedOverride | null = null
  let userOnly: LoadedOverride | null = null

  for (const o of overrides) {
    if (o.userId && o.tenantId) {
      if (ctx.userId && ctx.tenantId && o.userId === ctx.userId && o.tenantId === ctx.tenantId) {
        userTenant = o
      }
    } else if (o.tenantId && !o.userId) {
      if (ctx.tenantId && o.tenantId === ctx.tenantId) {
        tenantOnly = o
      }
    } else if (o.userId && !o.tenantId) {
      if (ctx.userId && o.userId === ctx.userId) {
        userOnly = o
      }
    }
  }

  return userTenant ?? tenantOnly ?? userOnly
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

function currentEnvironment(ctx: EvaluationContext): EvaluationEnvironment {
  if (ctx.environment) return ctx.environment
  const env = process.env.NODE_ENV
  if (env === 'production') return 'prod'
  if (env === 'test') return 'dev'
  return 'dev'
}

/**
 * Evaluate a feature flag against a context.
 *
 * Resolution order:
 *   1. Flag not in registry → false (default deny).
 *   2. `enabled === false` → false (kill switch beats everything else).
 *   3. `environments[currentEnv] === false` → false. Missing env config = allow.
 *   4. Most-specific override match wins (user+tenant, then tenant, then user).
 *   5. `type='boolean'` → true.
 *   6. `type='percentage'` → stable FNV-1a hash bucket vs `percentage`.
 *   7. `type='segment'` → ALL segment rules must match (AND).
 */
export async function evaluateFlag(
  key: string,
  ctx: EvaluationContext = {},
): Promise<EvaluationResult> {
  const { flagsByKey, overridesByFlag } = await loadAllFlags()
  const flag = flagsByKey.get(key)
  if (!flag) {
    return { key, value: false, reason: 'not-found' }
  }

  // 2. Kill switch wins even over overrides.
  if (!flag.enabled) {
    return { key, value: false, reason: 'kill-switch' }
  }

  // 3. Environment disable.
  const env = currentEnvironment(ctx)
  if (flag.environments && flag.environments[env] === false) {
    return { key, value: false, reason: 'environment-disabled' }
  }

  // 4. Override match.
  const overrides = overridesByFlag.get(flag.id) ?? []
  const match = pickMatchingOverride(overrides, ctx)
  if (match) {
    return { key, value: match.value, reason: 'override' }
  }

  // 5-7. Type-specific resolution.
  if (flag.type === 'boolean') {
    return { key, value: true, reason: 'boolean' }
  }

  if (flag.type === 'percentage') {
    const pct = Math.max(0, Math.min(100, flag.percentage))
    if (pct <= 0) return { key, value: false, reason: 'percentage' }
    if (pct >= 100) return { key, value: true, reason: 'percentage' }
    const subject = ctx.userId ?? ctx.tenantId ?? 'anon'
    const bucket = rolloutBucket(`${key}:${subject}`)
    return { key, value: bucket < pct, reason: 'percentage' }
  }

  if (flag.type === 'segment') {
    const rules = flag.segmentRules ?? []
    if (rules.length === 0) {
      return { key, value: false, reason: 'segment' }
    }
    const allMatch = rules.every((r) => ruleMatches(r, ctx))
    return { key, value: allMatch, reason: 'segment' }
  }

  return { key, value: false, reason: 'disabled' }
}

/**
 * Convenience wrapper that returns just the boolean — used by server
 * components and the React hook on the client.
 */
export async function isFeatureEnabled(
  key: string,
  ctx: EvaluationContext = {},
): Promise<boolean> {
  const r = await evaluateFlag(key, ctx)
  return r.value
}
