/**
 * Defaults + UI metadata shared across the interview scorecard surfaces.
 *
 * Importing these from a single module keeps the form, summary and pipeline
 * components visually consistent and makes Indonesian copy edits cheap.
 */

/**
 * Default criterion list used when a recruiter opens a brand-new scorecard.
 * Ordered from "most concrete / job-relevant" to "softer attributes" so the
 * highest-signal rows are visible without scrolling on small viewports.
 */
export const DEFAULT_CRITERIA: string[] = [
  'Komunikasi',
  'Technical skill',
  'Problem solving',
  'Culture fit',
  'Motivasi',
  'Pengalaman relevan',
]

/**
 * The four recommendation enum values are persisted as plain strings in
 * `InterviewScorecard.recommendation` (see schema.prisma). Keep this tuple
 * the single source of truth so the action validator and the UI cannot drift.
 */
export const RECOMMENDATION_VALUES = [
  'strong_hire',
  'hire',
  'no_hire',
  'strong_no_hire',
] as const

export type RecommendationValue = (typeof RECOMMENDATION_VALUES)[number]

export type RecommendationMeta = {
  label: string
  /**
   * Tailwind color name slot used by the chip variants in the UI. Components
   * map this to specific bg/text classes — we don't bake full class strings
   * here because Tailwind needs literal classes to extract.
   */
  tone: 'green' | 'emerald' | 'red' | 'rose'
}

/**
 * Indonesian recommendation labels + the chip tone each badge uses across
 * the form, summary card and pipeline view.
 */
export const RECOMMENDATION_LABELS: Record<RecommendationValue, RecommendationMeta> = {
  strong_hire: { label: 'Rekomendasi kuat', tone: 'green' },
  hire: { label: 'Rekomendasi', tone: 'emerald' },
  no_hire: { label: 'Tidak direkomendasikan', tone: 'red' },
  strong_no_hire: { label: 'Tegas tidak', tone: 'rose' },
}

/**
 * Type-guard helper used by both the action validator and the client form.
 * Cheap and side-effect free — safe to call on hot paths.
 */
export function isRecommendationValue(value: unknown): value is RecommendationValue {
  return (
    typeof value === 'string' &&
    (RECOMMENDATION_VALUES as readonly string[]).includes(value)
  )
}
