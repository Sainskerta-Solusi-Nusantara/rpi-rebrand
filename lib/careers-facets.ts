import { CAREER_OPENINGS, type CareerOpening } from '@/lib/careers-data'

export type CareerLocation = {
  name: string
  slug: string
  count: number
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function splitLocationTokens(location: string): string[] {
  return location
    .split(' / ')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

/** All distinct location tokens with opening counts, sorted desc by count then name asc. */
export function getCareerLocations(): CareerLocation[] {
  const counts = new Map<string, { name: string; count: number }>()
  for (const opening of CAREER_OPENINGS) {
    const seenInOpening = new Set<string>()
    for (const token of splitLocationTokens(opening.location)) {
      const key = token.toLowerCase()
      if (seenInOpening.has(key)) continue
      seenInOpening.add(key)
      const existing = counts.get(key)
      if (existing) {
        existing.count += 1
      } else {
        counts.set(key, { name: token, count: 1 })
      }
    }
  }
  return Array.from(counts.values())
    .map(({ name, count }) => ({ name, slug: toSlug(name), count }))
    .sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, 'id'),
    )
}

/** Find a location facet entry by its slug. */
export function findCareerLocation(slug: string): CareerLocation | undefined {
  return getCareerLocations().find((loc) => loc.slug === slug)
}

/** Whether opening.location contains locationName as a token (case-insensitive). */
export function openingMatchesLocation(
  opening: CareerOpening,
  locationName: string,
): boolean {
  const needle = locationName.trim().toLowerCase()
  if (!needle) return false
  return splitLocationTokens(opening.location).some(
    (token) => token.toLowerCase() === needle,
  )
}

export type CareerSort = 'newest' | 'salary-high' | 'salary-low' | 'alpha'

const VALID_SORTS: readonly CareerSort[] = [
  'newest',
  'salary-high',
  'salary-low',
  'alpha',
]

/** Coerce an unknown string into a valid CareerSort (defaults to 'newest'). */
export function sanitizeCareerSort(value: string | undefined): CareerSort {
  if (value && (VALID_SORTS as readonly string[]).includes(value)) {
    return value as CareerSort
  }
  return 'newest'
}

/**
 * Parse Indonesian relative-time strings into a day count.
 * Examples: "3 hari lalu" -> 3, "1 minggu lalu" -> 7, "2 bulan lalu" -> 60.
 * Unknown formats default to 365 so they sort last under 'newest'.
 */
export function parsePostedDays(postedAt: string): number {
  const match = postedAt.trim().toLowerCase().match(/^(\d+)\s+(hari|minggu|bulan)\s+lalu$/)
  if (!match) return 365
  const rawNum = match[1]
  const unit = match[2]
  if (!rawNum || !unit) return 365
  const n = Number.parseInt(rawNum, 10)
  if (!Number.isFinite(n)) return 365
  switch (unit) {
    case 'hari':
      return n
    case 'minggu':
      return n * 7
    case 'bulan':
      return n * 30
    default:
      return 365
  }
}

/** Return a new sorted array of openings according to the given sort key. */
export function sortOpenings(
  openings: CareerOpening[],
  sort: CareerSort,
): CareerOpening[] {
  const copy = openings.slice()
  switch (sort) {
    case 'salary-high':
      return copy.sort((a, b) => b.salaryMax - a.salaryMax)
    case 'salary-low':
      return copy.sort((a, b) => a.salaryMin - b.salaryMin)
    case 'alpha':
      return copy.sort((a, b) => a.title.localeCompare(b.title, 'id'))
    case 'newest':
    default:
      return copy.sort(
        (a, b) => parsePostedDays(a.postedAt) - parsePostedDays(b.postedAt),
      )
  }
}
