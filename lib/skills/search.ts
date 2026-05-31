/**
 * Pure helpers for skill autocomplete + normalization.
 *
 * No side effects — safe for client and server. Operates over the static
 * SKILLS taxonomy. Matching is case-insensitive substring with prefix-rank
 * boost; nothing fancy — predictable for small lists.
 */

import { SKILLS } from './taxonomy'

/** Lowercase, kebab-case, strip everything but [a-z0-9-]. */
export function normalizeSkill(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!slug) return ''

  // Canonicalize to taxonomy form if it matches a known slug (case-insensitive).
  const canonical = SKILLS.find((s) => s === slug)
  return canonical ?? slug
}

/**
 * Search the taxonomy for matches. Case-insensitive contains; entries whose
 * slug *starts with* the query rank first, then alphabetically. Results are
 * deduplicated and capped to `limit`.
 */
export function searchSkills(query: string, limit = 10): string[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const prefix: string[] = []
  const contains: string[] = []

  for (const skill of SKILLS) {
    if (skill === q) {
      // Exact matches go first.
      prefix.unshift(skill)
      continue
    }
    if (skill.startsWith(q)) prefix.push(skill)
    else if (skill.includes(q)) contains.push(skill)
  }

  // Both lists already sorted (SKILLS is sorted). Concat + dedupe + cap.
  const out: string[] = []
  const seen = new Set<string>()
  for (const s of [...prefix, ...contains]) {
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
    if (out.length >= limit) break
  }
  return out
}
