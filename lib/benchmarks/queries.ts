/**
 * Tenant Performance Benchmarks — cached aggregate queries over existing models.
 *
 * No schema changes. We compute seven metrics per tenant and a platform median
 * (excluding the tenant itself) for each metric so the UI can show a
 * tenant-vs-peers comparison. Pure read-only.
 *
 * Algorithm summary:
 *   1. Pull the tenant's raw rows (applications, jobs, interviews) capped at
 *      SAMPLE_CAP per query.
 *   2. Compute metric value in JS via the helpers below.
 *   3. For platform medians: pull the same per-tenant metric value across ALL
 *      tenants (excluding the current one) by grouping; compute median of the
 *      per-tenant values.
 *   4. Compare tenant value to platform median with a ±20% threshold. The
 *      "direction" field flips polarity for "lower is better" metrics
 *      (time-to-hire, time-to-first-application).
 *   5. If tenant has < MIN_SAMPLE (5) qualifying rows, return tenantValue=null
 *      with status='unknown' to avoid noise.
 *
 * Errors are caught at the top level — UI never crashes on a benchmarks fetch.
 */

import { cache } from 'react'
import { prisma } from '@/lib/db'
import { ApplicationStatus, JobStatus } from '@prisma/client'

/** Hard cap on rows pulled per tenant per metric. */
const SAMPLE_CAP = 5000
/** Below this, tenant value is suppressed (status='unknown'). */
const MIN_SAMPLE = 5
/** ±this fraction of platform median = "at" (gray) zone. */
const AT_BAND = 0.2

export type BenchmarkMetric = {
  label: string
  tenantValue: number | null
  platformMedian: number | null
  direction: 'higher_better' | 'lower_better'
  status: 'above' | 'at' | 'below' | 'unknown'
  sampleSize: number
  unit: 'days' | 'percent' | 'count' | 'idr_diff'
}

export type BenchmarkResult = {
  tenantId: string
  computedAt: Date
  metrics: {
    timeToHire: BenchmarkMetric
    applicationToInterview: BenchmarkMetric
    interviewToOffer: BenchmarkMetric
    offerToHire: BenchmarkMetric
    avgInterviewsPerHire: BenchmarkMetric
    salaryVsMarket: BenchmarkMetric
    timeToFirstApplication: BenchmarkMetric
  }
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    const a = sorted[mid - 1]
    const b = sorted[mid]
    if (a === undefined || b === undefined) return null
    return (a + b) / 2
  }
  return sorted[mid] ?? null
}

function daysBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24)
}

/**
 * Compute status by comparing tenant vs platform median with a ±AT_BAND band.
 * For 'higher_better' metrics: above band = 'above' (good), below = 'below'.
 * For 'lower_better' metrics: below band = 'above' (good), above = 'below'.
 */
function computeStatus(
  tenantValue: number | null,
  platformMedian: number | null,
  direction: 'higher_better' | 'lower_better',
  sampleSize: number,
): BenchmarkMetric['status'] {
  if (
    tenantValue == null ||
    platformMedian == null ||
    sampleSize < MIN_SAMPLE
  ) {
    return 'unknown'
  }
  if (platformMedian === 0) {
    if (tenantValue === 0) return 'at'
    return direction === 'higher_better' ? 'above' : 'below'
  }
  const ratio = (tenantValue - platformMedian) / Math.abs(platformMedian)
  if (Math.abs(ratio) <= AT_BAND) return 'at'
  const tenantHigher = ratio > 0
  if (direction === 'higher_better') {
    return tenantHigher ? 'above' : 'below'
  }
  return tenantHigher ? 'below' : 'above'
}

// ---------------------------------------------------------------------------
// Per-tenant metric computations
// ---------------------------------------------------------------------------

type AppRow = {
  status: ApplicationStatus
  appliedAt: Date
  updatedAt: Date
}

/**
 * Median days from appliedAt to updatedAt for HIRED applications.
 * updatedAt is used as a proxy for the hire date.
 */
function computeTimeToHire(rows: AppRow[]): number | null {
  const days = rows
    .filter((r) => r.status === ApplicationStatus.HIRED)
    .map((r) => daysBetween(r.updatedAt, r.appliedAt))
    .filter((d) => d >= 0 && Number.isFinite(d))
  return median(days)
}

/** % of applications that reached INTERVIEW or beyond. */
function computeApplicationToInterview(rows: AppRow[]): number | null {
  if (rows.length === 0) return null
  const advanced = rows.filter((r) =>
    (
      [
        ApplicationStatus.INTERVIEW,
        ApplicationStatus.OFFERED,
        ApplicationStatus.HIRED,
      ] as ApplicationStatus[]
    ).includes(r.status),
  ).length
  return (advanced / rows.length) * 100
}

/** % of applications that reached OFFERED or beyond. */
function computeInterviewToOffer(rows: AppRow[]): number | null {
  if (rows.length === 0) return null
  const advanced = rows.filter((r) =>
    (
      [ApplicationStatus.OFFERED, ApplicationStatus.HIRED] as ApplicationStatus[]
    ).includes(r.status),
  ).length
  return (advanced / rows.length) * 100
}

/** % of applications that reached HIRED. */
function computeOfferToHire(rows: AppRow[]): number | null {
  if (rows.length === 0) return null
  const hired = rows.filter((r) => r.status === ApplicationStatus.HIRED).length
  return (hired / rows.length) * 100
}

/** Average interview rows per HIRED application (0 if no hires). */
function computeAvgInterviewsPerHire(
  hiredCount: number,
  interviewCount: number,
): number | null {
  if (hiredCount === 0) return null
  return interviewCount / hiredCount
}

// ---------------------------------------------------------------------------
// Per-tenant aggregation entrypoint
// ---------------------------------------------------------------------------

type TenantMetricSet = {
  timeToHire: number | null
  applicationToInterview: number | null
  interviewToOffer: number | null
  offerToHire: number | null
  avgInterviewsPerHire: number | null
  salaryMidpoint: number | null
  timeToFirstApplication: number | null
  applicationSample: number
  jobSample: number
}

async function computeTenantMetrics(
  tenantId: string,
): Promise<TenantMetricSet> {
  const [apps, interviewCount, jobs] = await Promise.all([
    prisma.application.findMany({
      where: { tenantId },
      orderBy: { appliedAt: 'desc' },
      take: SAMPLE_CAP,
      select: { status: true, appliedAt: true, updatedAt: true },
    }),
    prisma.interviewSchedule.count({
      where: { application: { tenantId } },
    }),
    prisma.job.findMany({
      where: {
        tenantId,
        status: JobStatus.PUBLISHED,
        salaryMin: { gt: 0 },
        salaryMax: { gt: 0 },
        publishedAt: { not: null },
      },
      orderBy: { publishedAt: 'desc' },
      take: SAMPLE_CAP,
      select: {
        id: true,
        salaryMin: true,
        salaryMax: true,
        publishedAt: true,
      },
    }),
  ])

  const hiredCount = apps.filter(
    (a) => a.status === ApplicationStatus.HIRED,
  ).length

  // Salary midpoint median
  const midpoints: number[] = []
  for (const j of jobs) {
    if (j.salaryMin == null || j.salaryMax == null) continue
    midpoints.push((j.salaryMin + j.salaryMax) / 2)
  }
  const salaryMidpoint = median(midpoints)

  // Time-to-first-application: median days from publishedAt to first
  // application per job. We fetch the earliest applied row per job in one go.
  let timeToFirstApplication: number | null = null
  if (jobs.length > 0) {
    const jobIds = jobs.map((j) => j.id)
    const firstApps = await prisma.application.groupBy({
      by: ['jobId'],
      where: { jobId: { in: jobIds } },
      _min: { appliedAt: true },
    })
    const byJob = new Map<string, Date>()
    for (const row of firstApps) {
      if (row._min.appliedAt) byJob.set(row.jobId, row._min.appliedAt)
    }
    const ttfaDays: number[] = []
    for (const j of jobs) {
      const first = byJob.get(j.id)
      if (!first || !j.publishedAt) continue
      const d = daysBetween(first, j.publishedAt)
      if (d >= 0 && Number.isFinite(d)) ttfaDays.push(d)
    }
    timeToFirstApplication = median(ttfaDays)
  }

  return {
    timeToHire: computeTimeToHire(apps),
    applicationToInterview: computeApplicationToInterview(apps),
    interviewToOffer: computeInterviewToOffer(apps),
    offerToHire: computeOfferToHire(apps),
    avgInterviewsPerHire: computeAvgInterviewsPerHire(
      hiredCount,
      interviewCount,
    ),
    salaryMidpoint,
    timeToFirstApplication,
    applicationSample: apps.length,
    jobSample: jobs.length,
  }
}

// ---------------------------------------------------------------------------
// Platform medians (excluding the target tenant)
// ---------------------------------------------------------------------------

type PlatformMedians = {
  timeToHire: number | null
  applicationToInterview: number | null
  interviewToOffer: number | null
  offerToHire: number | null
  avgInterviewsPerHire: number | null
  salaryMidpoint: number | null
  timeToFirstApplication: number | null
}

/**
 * Compute platform medians by iterating peer tenants. We cap the peer set so
 * this stays predictable; tenants with < MIN_SAMPLE applications/jobs are
 * skipped per-metric.
 */
async function computePlatformMedians(
  excludeTenantId: string,
): Promise<PlatformMedians> {
  const peerTenants = await prisma.tenant.findMany({
    where: { id: { not: excludeTenantId } },
    select: { id: true },
    take: 200,
  })

  const buckets: {
    timeToHire: number[]
    applicationToInterview: number[]
    interviewToOffer: number[]
    offerToHire: number[]
    avgInterviewsPerHire: number[]
    salaryMidpoint: number[]
    timeToFirstApplication: number[]
  } = {
    timeToHire: [],
    applicationToInterview: [],
    interviewToOffer: [],
    offerToHire: [],
    avgInterviewsPerHire: [],
    salaryMidpoint: [],
    timeToFirstApplication: [],
  }

  // Fan out per-tenant computations. cache() dedupes within a request.
  const peerMetrics = await Promise.all(
    peerTenants.map(async (t) => {
      try {
        return await computeTenantMetrics(t.id)
      } catch {
        return null
      }
    }),
  )

  for (const m of peerMetrics) {
    if (!m) continue
    const enoughApps = m.applicationSample >= MIN_SAMPLE
    const enoughJobs = m.jobSample >= MIN_SAMPLE
    if (enoughApps) {
      if (m.timeToHire != null) buckets.timeToHire.push(m.timeToHire)
      if (m.applicationToInterview != null)
        buckets.applicationToInterview.push(m.applicationToInterview)
      if (m.interviewToOffer != null)
        buckets.interviewToOffer.push(m.interviewToOffer)
      if (m.offerToHire != null) buckets.offerToHire.push(m.offerToHire)
      if (m.avgInterviewsPerHire != null)
        buckets.avgInterviewsPerHire.push(m.avgInterviewsPerHire)
    }
    if (enoughJobs) {
      if (m.salaryMidpoint != null)
        buckets.salaryMidpoint.push(m.salaryMidpoint)
      if (m.timeToFirstApplication != null)
        buckets.timeToFirstApplication.push(m.timeToFirstApplication)
    }
  }

  return {
    timeToHire: median(buckets.timeToHire),
    applicationToInterview: median(buckets.applicationToInterview),
    interviewToOffer: median(buckets.interviewToOffer),
    offerToHire: median(buckets.offerToHire),
    avgInterviewsPerHire: median(buckets.avgInterviewsPerHire),
    salaryMidpoint: median(buckets.salaryMidpoint),
    timeToFirstApplication: median(buckets.timeToFirstApplication),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const EMPTY_METRIC = (
  label: string,
  unit: BenchmarkMetric['unit'],
  direction: BenchmarkMetric['direction'],
): BenchmarkMetric => ({
  label,
  tenantValue: null,
  platformMedian: null,
  direction,
  status: 'unknown',
  sampleSize: 0,
  unit,
})

function emptyResult(tenantId: string): BenchmarkResult {
  return {
    tenantId,
    computedAt: new Date(),
    metrics: {
      timeToHire: EMPTY_METRIC('Waktu rata-rata rekrutmen', 'days', 'lower_better'),
      applicationToInterview: EMPTY_METRIC(
        'Lamaran → wawancara',
        'percent',
        'higher_better',
      ),
      interviewToOffer: EMPTY_METRIC(
        'Wawancara → tawaran',
        'percent',
        'higher_better',
      ),
      offerToHire: EMPTY_METRIC(
        'Tawaran → diterima',
        'percent',
        'higher_better',
      ),
      avgInterviewsPerHire: EMPTY_METRIC(
        'Rata-rata wawancara per hire',
        'count',
        'lower_better',
      ),
      salaryVsMarket: EMPTY_METRIC(
        'Gaji vs pasar',
        'idr_diff',
        'higher_better',
      ),
      timeToFirstApplication: EMPTY_METRIC(
        'Waktu ke lamaran pertama',
        'days',
        'lower_better',
      ),
    },
  }
}

export const getTenantBenchmarks = cache(
  async (tenantId: string): Promise<BenchmarkResult> => {
    try {
      const [tenant, platform] = await Promise.all([
        computeTenantMetrics(tenantId),
        computePlatformMedians(tenantId),
      ])

      const enoughApps = tenant.applicationSample >= MIN_SAMPLE
      const enoughJobs = tenant.jobSample >= MIN_SAMPLE

      // Salary spread: tenant midpoint median minus platform midpoint median.
      // We express the diff as a percentage relative to the platform median
      // for comparable status semantics (higher tenant salary = "above market").
      let salaryDiffPct: number | null = null
      if (
        tenant.salaryMidpoint != null &&
        platform.salaryMidpoint != null &&
        platform.salaryMidpoint > 0
      ) {
        salaryDiffPct =
          ((tenant.salaryMidpoint - platform.salaryMidpoint) /
            platform.salaryMidpoint) *
          100
      }

      const result: BenchmarkResult = {
        tenantId,
        computedAt: new Date(),
        metrics: {
          timeToHire: {
            label: 'Waktu rata-rata rekrutmen',
            tenantValue: enoughApps ? tenant.timeToHire : null,
            platformMedian: platform.timeToHire,
            direction: 'lower_better',
            status: computeStatus(
              enoughApps ? tenant.timeToHire : null,
              platform.timeToHire,
              'lower_better',
              tenant.applicationSample,
            ),
            sampleSize: tenant.applicationSample,
            unit: 'days',
          },
          applicationToInterview: {
            label: 'Lamaran → wawancara',
            tenantValue: enoughApps ? tenant.applicationToInterview : null,
            platformMedian: platform.applicationToInterview,
            direction: 'higher_better',
            status: computeStatus(
              enoughApps ? tenant.applicationToInterview : null,
              platform.applicationToInterview,
              'higher_better',
              tenant.applicationSample,
            ),
            sampleSize: tenant.applicationSample,
            unit: 'percent',
          },
          interviewToOffer: {
            label: 'Wawancara → tawaran',
            tenantValue: enoughApps ? tenant.interviewToOffer : null,
            platformMedian: platform.interviewToOffer,
            direction: 'higher_better',
            status: computeStatus(
              enoughApps ? tenant.interviewToOffer : null,
              platform.interviewToOffer,
              'higher_better',
              tenant.applicationSample,
            ),
            sampleSize: tenant.applicationSample,
            unit: 'percent',
          },
          offerToHire: {
            label: 'Tawaran → diterima',
            tenantValue: enoughApps ? tenant.offerToHire : null,
            platformMedian: platform.offerToHire,
            direction: 'higher_better',
            status: computeStatus(
              enoughApps ? tenant.offerToHire : null,
              platform.offerToHire,
              'higher_better',
              tenant.applicationSample,
            ),
            sampleSize: tenant.applicationSample,
            unit: 'percent',
          },
          avgInterviewsPerHire: {
            label: 'Rata-rata wawancara per hire',
            tenantValue: enoughApps ? tenant.avgInterviewsPerHire : null,
            platformMedian: platform.avgInterviewsPerHire,
            direction: 'lower_better',
            status: computeStatus(
              enoughApps ? tenant.avgInterviewsPerHire : null,
              platform.avgInterviewsPerHire,
              'lower_better',
              tenant.applicationSample,
            ),
            sampleSize: tenant.applicationSample,
            unit: 'count',
          },
          salaryVsMarket: {
            label: 'Gaji vs pasar',
            tenantValue: enoughJobs ? salaryDiffPct : null,
            platformMedian: 0, // baseline is the market itself
            direction: 'higher_better',
            status: (() => {
              if (!enoughJobs || salaryDiffPct == null) return 'unknown'
              if (Math.abs(salaryDiffPct) <= AT_BAND * 100) return 'at'
              return salaryDiffPct > 0 ? 'above' : 'below'
            })(),
            sampleSize: tenant.jobSample,
            unit: 'idr_diff',
          },
          timeToFirstApplication: {
            label: 'Waktu ke lamaran pertama',
            tenantValue: enoughJobs ? tenant.timeToFirstApplication : null,
            platformMedian: platform.timeToFirstApplication,
            direction: 'lower_better',
            status: computeStatus(
              enoughJobs ? tenant.timeToFirstApplication : null,
              platform.timeToFirstApplication,
              'lower_better',
              tenant.jobSample,
            ),
            sampleSize: tenant.jobSample,
            unit: 'days',
          },
        },
      }

      return result
    } catch {
      return emptyResult(tenantId)
    }
  },
)

// ---------------------------------------------------------------------------
// Industry medians (no tenant filter) — exposed for future industry-level UI.
// ---------------------------------------------------------------------------

export type IndustryBenchmark = {
  category: string
  jobCount: number
  applicationCount: number
  medianSalaryMidpoint: number | null
  medianTimeToHire: number | null
  medianTimeToFirstApplication: number | null
}

export type IndustryBenchmarks = {
  computedAt: Date
  industries: IndustryBenchmark[]
}

/**
 * Platform-wide medians grouped by JobCategory (industry). No tenant scope.
 * Categories with fewer than MIN_SAMPLE jobs are dropped.
 */
export const getIndustryBenchmarks = cache(
  async (): Promise<IndustryBenchmarks> => {
    try {
      const categories = await prisma.jobCategory.findMany({
        select: { id: true, name: true },
      })

      const out: IndustryBenchmark[] = []
      for (const cat of categories) {
        const jobs = await prisma.job.findMany({
          where: {
            categoryId: cat.id,
            status: JobStatus.PUBLISHED,
            salaryMin: { gt: 0 },
            salaryMax: { gt: 0 },
          },
          orderBy: { publishedAt: 'desc' },
          take: SAMPLE_CAP,
          select: {
            id: true,
            salaryMin: true,
            salaryMax: true,
            publishedAt: true,
          },
        })
        if (jobs.length < MIN_SAMPLE) continue

        const midpoints = jobs
          .filter((j) => j.salaryMin != null && j.salaryMax != null)
          .map((j) => ((j.salaryMin as number) + (j.salaryMax as number)) / 2)

        const jobIds = jobs.map((j) => j.id)
        const apps = await prisma.application.findMany({
          where: { jobId: { in: jobIds } },
          select: {
            jobId: true,
            status: true,
            appliedAt: true,
            updatedAt: true,
          },
          take: SAMPLE_CAP,
        })

        const hiredDays = apps
          .filter((a) => a.status === ApplicationStatus.HIRED)
          .map((a) => daysBetween(a.updatedAt, a.appliedAt))
          .filter((d) => d >= 0 && Number.isFinite(d))

        const firstByJob = new Map<string, Date>()
        for (const a of apps) {
          const prev = firstByJob.get(a.jobId)
          if (!prev || a.appliedAt < prev) firstByJob.set(a.jobId, a.appliedAt)
        }
        const ttfa: number[] = []
        for (const j of jobs) {
          const first = firstByJob.get(j.id)
          if (!first || !j.publishedAt) continue
          const d = daysBetween(first, j.publishedAt)
          if (d >= 0 && Number.isFinite(d)) ttfa.push(d)
        }

        out.push({
          category: cat.name,
          jobCount: jobs.length,
          applicationCount: apps.length,
          medianSalaryMidpoint: median(midpoints),
          medianTimeToHire: median(hiredDays),
          medianTimeToFirstApplication: median(ttfa),
        })
      }

      out.sort((a, b) => b.jobCount - a.jobCount)

      return { computedAt: new Date(), industries: out }
    } catch {
      return { computedAt: new Date(), industries: [] }
    }
  },
)
