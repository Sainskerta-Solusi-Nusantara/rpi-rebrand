import { PRESS_RELEASES, type PressRelease, type PressCategory } from '@/lib/press-data'

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type PressTagFacet = { name: string; slug: string; count: number }

export function getPressTags(): PressTagFacet[] {
  const map = new Map<string, { name: string; count: number }>()
  for (const release of PRESS_RELEASES) {
    for (const tag of release.tags) {
      const slug = toSlug(tag)
      if (!slug) continue
      const existing = map.get(slug)
      if (existing) {
        existing.count += 1
      } else {
        map.set(slug, { name: tag, count: 1 })
      }
    }
  }
  const facets: PressTagFacet[] = Array.from(map.entries()).map(([slug, value]) => ({
    name: value.name,
    slug,
    count: value.count,
  }))
  facets.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.name.localeCompare(b.name, 'id')
  })
  return facets
}

export function findPressTag(slug: string): PressTagFacet | undefined {
  return getPressTags().find((tag) => tag.slug === slug)
}

export function releasesByTag(slug: string): PressRelease[] {
  return PRESS_RELEASES
    .filter((release) => release.tags.some((tag) => toSlug(tag) === slug))
    .slice()
    .sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

export function categorySlug(category: string): string {
  return toSlug(category)
}

const KNOWN_CATEGORIES: PressCategory[] = [
  'Pendanaan',
  'Produk',
  'Kemitraan',
  'Riset',
  'Penghargaan',
]

export function findCategoryBySlug(slug: string): PressCategory | undefined {
  return KNOWN_CATEGORIES.find((category) => categorySlug(category) === slug)
}

export function releasesByCategory(category: string): PressRelease[] {
  return PRESS_RELEASES
    .filter((release) => release.category === category)
    .slice()
    .sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1))
}

export type PressSort = 'newest' | 'oldest' | 'alpha'

export function sanitizePressSort(value: string | undefined): PressSort {
  if (value === 'oldest' || value === 'alpha' || value === 'newest') return value
  return 'newest'
}

export function sortReleases(releases: PressRelease[], sort: PressSort): PressRelease[] {
  const copy = releases.slice()
  switch (sort) {
    case 'oldest':
      copy.sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0))
      break
    case 'alpha':
      copy.sort((a, b) => a.title.localeCompare(b.title, 'id'))
      break
    case 'newest':
    default:
      copy.sort((a, b) => (a.dateIso < b.dateIso ? 1 : a.dateIso > b.dateIso ? -1 : 0))
      break
  }
  return copy
}

export function getPressCategoryFacets(): { name: PressCategory; slug: string; count: number }[] {
  const facets = KNOWN_CATEGORIES.map((name) => ({
    name,
    slug: categorySlug(name),
    count: PRESS_RELEASES.filter((release) => release.category === name).length,
  }))
  facets.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.name.localeCompare(b.name, 'id')
  })
  return facets
}
