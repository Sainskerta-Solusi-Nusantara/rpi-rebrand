// Lightweight, DB-agnostic relevance scoring shared across search surfaces
// (jobs, courses, talent, blog, …).
//
// Two pieces:
//   - parseQueryTerms: turn a free-text query into normalized terms. Callers
//     build a multi-term AND filter (each term must match somewhere) instead of
//     treating the whole query as one substring.
//   - scoreRelevance: rank an already-filtered candidate row by how well its
//     weighted fields match the terms (title > tags > … > body), with a small
//     exact-phrase bonus. Pair with recencyBoost for a freshness tiebreaker.
//
// This is intentionally not Postgres full-text search: it needs no migration,
// is fully type-safe, and is verifiable at build time. A tsvector/GIN upgrade
// can layer on later as a pure performance optimization.

/** Max terms considered — guards against pathological queries. */
const MAX_TERMS = 8

/**
 * Normalize a free-text query into lowercase, de-duplicated terms.
 * Returns [] for empty/whitespace queries.
 */
export function parseQueryTerms(q: string | null | undefined): string[] {
  if (!q) return []
  const seen = new Set<string>()
  for (const raw of q.toLowerCase().split(/\s+/)) {
    const term = raw.trim()
    if (term.length === 0) continue
    seen.add(term)
    if (seen.size >= MAX_TERMS) break
  }
  return [...seen]
}

export interface WeightedField {
  /** Field text (single string, or array of strings e.g. tags). */
  text: string | string[] | null | undefined
  /** Contribution per matching term. Higher = more important. */
  weight: number
}

function fieldHaystack(text: WeightedField['text']): string {
  if (text == null) return ''
  return (Array.isArray(text) ? text.join(' ') : text).toLowerCase()
}

/**
 * Score a candidate by weighted field matches against the parsed terms.
 *  - Each term that appears in a field adds that field's weight (once per
 *    field per term).
 *  - A small bonus when the full multi-word query appears verbatim in the
 *    highest-weighted field (phrase match).
 * Returns 0 when there are no terms (callers should keep their default sort).
 */
export function scoreRelevance(
  fields: WeightedField[],
  terms: string[],
  fullQuery?: string | null,
): number {
  if (terms.length === 0) return 0
  const haystacks = fields.map((f) => ({ h: fieldHaystack(f.text), w: f.weight }))
  let score = 0
  for (const term of terms) {
    for (const { h, w } of haystacks) {
      if (h && h.includes(term)) score += w
    }
  }
  // Phrase bonus: full query verbatim in the top-weighted field.
  const phrase = fullQuery?.trim().toLowerCase()
  if (phrase && phrase.includes(' ')) {
    const top = haystacks.reduce(
      (a, b) => (b.w > a.w ? b : a),
      haystacks[0] ?? { h: '', w: 0 },
    )
    if (top.h.includes(phrase)) score += top.w
  }
  return score
}

/**
 * Small recency contribution for use as a tiebreaker on top of relevance.
 * Linearly decays from `maxBoost` (today) to 0 at `halfLifeDays * 2`.
 */
export function recencyBoost(
  date: Date | null | undefined,
  maxBoost = 1,
  windowDays = 60,
): number {
  if (!date) return 0
  const ageDays = (Date.now() - date.getTime()) / 86_400_000
  if (ageDays <= 0) return maxBoost
  if (ageDays >= windowDays) return 0
  return maxBoost * (1 - ageDays / windowDays)
}
