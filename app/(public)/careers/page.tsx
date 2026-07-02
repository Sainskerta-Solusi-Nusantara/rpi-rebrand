import type { Metadata } from 'next'
import { CTABanner } from '@/components/organisms/cta-banner'
import {
  CareersHero,
  CareersWhy,
  CareersLife,
  CareersTeams,
  CareersOpenings,
  CareersProcess,
} from '@/components/organisms/careers-sections'
import {
  CAREER_OPENINGS,
  type CareerOpening,
  filterOpenings,
  getCareerLevels,
  getCareerTeams,
  getCareerTypes,
} from '@/lib/careers-data'
import {
  getCareerLocations,
  type CareerSort,
  sanitizeCareerSort,
  sortOpenings,
} from '@/lib/careers-facets'

export const metadata: Metadata = {
  title: 'Karier di SSN',
  description:
    'Bergabung dengan tim SSN Pekerja. Bangun produk yang mempertemukan jutaan pencari kerja dengan perusahaan terverifikasi di seluruh Indonesia.',
}

const VALID_TYPES: CareerOpening['type'][] = ['Full-time', 'Part-time', 'Contract', 'Internship']
const VALID_LEVELS: CareerOpening['level'][] = ['Junior', 'Mid', 'Senior', 'Staff', 'Lead']

const SORT_LABEL: Record<CareerSort, string> = {
  newest: 'Terbaru',
  'salary-high': 'Gaji ↓',
  'salary-low': 'Gaji ↑',
  alpha: 'A–Z',
}

function parseMulti(v: string | string[] | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.flatMap((x) => x.split(',')).filter(Boolean)
  return v.split(',').filter(Boolean)
}

type CareersState = {
  team?: string
  types: CareerOpening['type'][]
  levels: CareerOpening['level'][]
  location?: string
  q?: string
  sort: CareerSort
}

function buildCareersUrl(
  current: CareersState,
  patch: Partial<{
    team: string | null
    types: CareerOpening['type'][]
    levels: CareerOpening['level'][]
    location: string | null
    q: string | null
    sort: CareerSort
  }>,
): string {
  const next = {
    team: 'team' in patch ? patch.team ?? undefined : current.team,
    types: patch.types ?? current.types,
    levels: patch.levels ?? current.levels,
    location:
      'location' in patch ? patch.location ?? undefined : current.location,
    q: 'q' in patch ? patch.q ?? undefined : current.q,
    sort: patch.sort ?? current.sort,
  }
  const params: string[] = []
  if (next.q) params.push(`q=${encodeURIComponent(next.q)}`)
  if (next.team) params.push(`team=${encodeURIComponent(next.team)}`)
  if (next.types.length) params.push(`type=${next.types.join(',')}`)
  if (next.levels.length) params.push(`level=${next.levels.join(',')}`)
  if (next.location)
    params.push(`location=${encodeURIComponent(next.location)}`)
  if (next.sort !== 'newest') params.push(`sort=${next.sort}`)
  const tail = params.length ? `/careers?${params.join('&')}` : '/careers'
  return `${tail}#openings`
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

export default function CareersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const activeTeam =
    typeof searchParams.team === 'string' ? searchParams.team : undefined
  const activeTypes = parseMulti(searchParams.type).filter(
    (t): t is CareerOpening['type'] => (VALID_TYPES as string[]).includes(t),
  )
  const activeLevels = parseMulti(searchParams.level).filter(
    (l): l is CareerOpening['level'] => (VALID_LEVELS as string[]).includes(l),
  )
  const activeQuery =
    typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const activeSort = sanitizeCareerSort(
    typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
  )

  const locationFacets = getCareerLocations()
  const rawLocation =
    typeof searchParams.location === 'string'
      ? searchParams.location
      : undefined
  const activeLocation = locationFacets.find(
    (l) => l.name.toLowerCase() === rawLocation?.toLowerCase(),
  )?.name

  const current: CareersState = {
    team: activeTeam,
    types: activeTypes,
    levels: activeLevels,
    location: activeLocation,
    q: activeQuery || undefined,
    sort: activeSort,
  }
  const hasAnyFilter =
    !!activeTeam ||
    activeTypes.length > 0 ||
    activeLevels.length > 0 ||
    !!activeLocation ||
    !!activeQuery

  const filtered = filterOpenings({
    team: activeTeam,
    types: activeTypes,
    levels: activeLevels,
    location: activeLocation,
    q: activeQuery || undefined,
  })
  const openings = sortOpenings(filtered, activeSort)

  // Pre-build all hrefs server-side so the (client) CareersOpenings
  // component receives plain serializable props only.
  const teams = getCareerTeams().map((t) => ({
    ...t,
    href: buildCareersUrl(current, {
      team: activeTeam === t.name ? null : t.name,
    }),
  }))

  // Map for CareersTeams cards — keyed by team name with count + a filter href
  // that lands on /careers?team=<name>#openings.
  const teamOpenings: Record<string, { count: number; href: string }> = {}
  for (const t of getCareerTeams()) {
    teamOpenings[t.name] = {
      count: t.count,
      href: buildCareersUrl(
        {
          team: undefined,
          types: [],
          levels: [],
          location: undefined,
          q: undefined,
          sort: 'newest',
        },
        { team: t.name },
      ),
    }
  }
  const types = getCareerTypes().map((t) => ({
    ...t,
    href: buildCareersUrl(current, { types: toggle(activeTypes, t.value) }),
  }))
  const levels = getCareerLevels().map((l) => ({
    ...l,
    href: buildCareersUrl(current, { levels: toggle(activeLevels, l.value) }),
  }))
  const locations = locationFacets.map((l) => ({
    name: l.name,
    slug: l.slug,
    count: l.count,
    href: buildCareersUrl(current, {
      location: activeLocation === l.name ? null : l.name,
    }),
  }))
  const allTeamsHref = buildCareersUrl(current, { team: null })
  const allLocationsHref = buildCareersUrl(current, { location: null })

  // Sort pill options
  const sortOptions = (Object.keys(SORT_LABEL) as CareerSort[]).map((s) => ({
    value: s,
    label: SORT_LABEL[s],
    href: buildCareersUrl(current, { sort: s }),
    active: activeSort === s,
  }))

  // Header chip strip — surface all active filters as removable chips
  const headerChips: { label: string; clearHref: string }[] = []
  if (activeQuery) {
    headerChips.push({
      label: `"${activeQuery}"`,
      clearHref: buildCareersUrl(current, { q: null }),
    })
  }
  if (activeTeam) {
    headerChips.push({
      label: activeTeam,
      clearHref: buildCareersUrl(current, { team: null }),
    })
  }
  if (activeLocation) {
    headerChips.push({
      label: activeLocation,
      clearHref: buildCareersUrl(current, { location: null }),
    })
  }
  for (const t of activeTypes) {
    headerChips.push({
      label: t,
      clearHref: buildCareersUrl(current, { types: toggle(activeTypes, t) }),
    })
  }
  for (const l of activeLevels) {
    headerChips.push({
      label: l,
      clearHref: buildCareersUrl(current, { levels: toggle(activeLevels, l) }),
    })
  }

  return (
    <>
      <CareersHero openingCount={CAREER_OPENINGS.length} />
      <CareersWhy />
      <CareersLife />
      <CareersTeams openings={teamOpenings} />
      <CareersOpenings
        openings={openings}
        totalCount={CAREER_OPENINGS.length}
        activeTeam={activeTeam}
        activeTypes={activeTypes}
        activeLevels={activeLevels}
        activeLocation={activeLocation}
        activeQuery={activeQuery || undefined}
        activeSort={activeSort}
        teams={teams}
        types={types}
        levels={levels}
        locations={locations}
        sortOptions={sortOptions}
        headerChips={headerChips}
        allTeamsHref={allTeamsHref}
        allLocationsHref={allLocationsHref}
        clearAllHref="/careers#openings"
        hasAnyFilter={hasAnyFilter}
      />
      <CareersProcess />
      <CTABanner />
    </>
  )
}
